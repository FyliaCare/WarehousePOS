-- ==========================================
-- FIX PHONE AUTH TRIGGER
-- Run this in Supabase SQL Editor
-- ==========================================

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create phone_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS phone_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on phone_users for service role access
ALTER TABLE phone_users DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON phone_users TO authenticated;
GRANT ALL ON phone_users TO service_role;
GRANT ALL ON phone_users TO anon;

-- Make email nullable in users table
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add verified_at column to phone_otps if missing
ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Update the handle_new_user function to handle phone auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  new_store_id UUID;
  user_name TEXT;
  tenant_slug TEXT;
  user_phone TEXT;
  user_email TEXT;
BEGIN
  -- Get phone from metadata or from auth.users phone field
  user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');
  user_email := NEW.email;
  
  -- Extract name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE 
      WHEN user_phone IS NOT NULL THEN 'User ' || RIGHT(user_phone, 4)
      WHEN user_email IS NOT NULL AND user_email NOT LIKE '%@phone.warehousepos.app' THEN split_part(user_email, '@', 1)
      ELSE 'New User'
    END
  );
  
  -- Generate unique slug
  tenant_slug := lower(regexp_replace(user_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  
  -- Create tenant
  INSERT INTO tenants (name, slug, country, currency)
  VALUES (
    user_name || '''s Business', 
    tenant_slug, 
    COALESCE(NEW.raw_user_meta_data->>'country', 'GH'),
    CASE WHEN NEW.raw_user_meta_data->>'country' = 'NG' THEN 'NGN' ELSE 'GHS' END
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create default store
  INSERT INTO stores (tenant_id, name, city)
  VALUES (
    new_tenant_id, 
    'Main Store', 
    CASE WHEN NEW.raw_user_meta_data->>'country' = 'NG' THEN 'Lagos' ELSE 'Accra' END
  )
  RETURNING id INTO new_store_id;
  
  -- Create user profile (email can be null for phone auth)
  INSERT INTO users (id, tenant_id, store_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    new_store_id,
    CASE 
      WHEN user_email LIKE '%@phone.warehousepos.app' THEN NULL 
      ELSE user_email 
    END,
    user_name,
    user_phone,
    'owner'
  );
  
  -- Also save to phone_users mapping if phone auth
  IF user_phone IS NOT NULL THEN
    INSERT INTO phone_users (phone, user_id)
    VALUES (user_phone, NEW.id)
    ON CONFLICT (phone) DO UPDATE SET user_id = NEW.id, updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

SELECT 'Phone auth trigger fixed!' as result;
