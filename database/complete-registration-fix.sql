-- ==========================================
-- COMPLETE REGISTRATION FIX
-- Run this ONCE in Supabase SQL Editor
-- ==========================================

-- 1. Disable RLS on all tables needed for registration
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Add any missing columns to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GHS';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'GH';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Accra';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add any missing columns to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS city TEXT;

-- 4. Add any missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Make sure slug allows nulls or has a default (for simpler inserts)
ALTER TABLE tenants ALTER COLUMN slug DROP NOT NULL;

-- 6. Grant permissions
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON tenants TO anon;
GRANT ALL ON stores TO authenticated;
GRANT ALL ON stores TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- 7. Verify the fix
SELECT 'REGISTRATION FIX COMPLETE!' as status;

-- Show tenants columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;
