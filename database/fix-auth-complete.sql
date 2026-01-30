-- ==========================================
-- COMPLETE AUTH FIX - Run this in Supabase SQL Editor
-- This script fixes ALL auth-related issues
-- ==========================================

-- ==========================================
-- 1. PHONE_OTPS TABLE
-- ==========================================

-- Create phone_otps table if not exists
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(64) NOT NULL,
  purpose VARCHAR(20) DEFAULT 'login',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

-- DISABLE RLS for service role access
ALTER TABLE phone_otps DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON phone_otps TO service_role;
GRANT ALL ON phone_otps TO authenticated;
GRANT ALL ON phone_otps TO anon;

-- ==========================================
-- 2. PHONE_USERS TABLE
-- ==========================================

-- Create phone_users mapping table
CREATE TABLE IF NOT EXISTS phone_users (
  phone VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_phone_users_user_id ON phone_users(user_id);

-- DISABLE RLS for service role access
ALTER TABLE phone_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON phone_users TO service_role;
GRANT ALL ON phone_users TO authenticated;
GRANT ALL ON phone_users TO anon;

-- ==========================================
-- 3. SIMPLIFIED TRIGGER (Non-blocking)
-- ==========================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create simple, fast trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log for debugging
  RAISE NOTICE 'New auth user created: %, phone: %', NEW.id, NEW.phone;
  
  -- Only save phone_users mapping if phone exists
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    BEGIN
      INSERT INTO phone_users (phone, user_id)
      VALUES (NEW.phone, NEW.id)
      ON CONFLICT (phone) DO UPDATE SET user_id = NEW.id, updated_at = NOW();
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'phone_users insert error: %', SQLERRM;
    END;
  END IF;
  
  -- Always return NEW to allow user creation
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block user creation
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- ==========================================
-- 4. USERS TABLE RLS (Allow service role and owner)
-- ==========================================

-- Enable RLS on users but with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;

-- Create proper policies
CREATE POLICY "Service role full access"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 5. TENANTS TABLE RLS
-- ==========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view tenant" ON tenants;
DROP POLICY IF EXISTS "Service role full access tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can update tenant" ON tenants;

CREATE POLICY "Service role full access tenants"
  ON tenants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenant members can view tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT tenant_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can create tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can update tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'owner')
  );

-- ==========================================
-- 6. STORES TABLE RLS
-- ==========================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store members can view store" ON stores;
DROP POLICY IF EXISTS "Service role full access stores" ON stores;
DROP POLICY IF EXISTS "Owners can manage stores" ON stores;

CREATE POLICY "Service role full access stores"
  ON stores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Store members can view store"
  ON stores FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Owners can manage stores"
  ON stores FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'owner')
  );

-- ==========================================
-- 7. CLEANUP OLD OTPS
-- ==========================================

-- Delete expired OTPs older than 24 hours
DELETE FROM phone_otps WHERE expires_at < NOW() - INTERVAL '24 hours';

-- ==========================================
-- VERIFICATION
-- ==========================================

SELECT 'AUTH FIX COMPLETE!' as status;

-- Show current state (using proper schema qualification)
SELECT 
  'phone_otps' as table_name,
  (SELECT COUNT(*) FROM public.phone_otps) as row_count;

SELECT 
  'phone_users' as table_name,
  (SELECT COUNT(*) FROM public.phone_users) as row_count;

SELECT 
  'users' as table_name,
  (SELECT COUNT(*) FROM public.users) as row_count;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('phone_otps', 'phone_users', 'users')
  AND schemaname = 'public';
