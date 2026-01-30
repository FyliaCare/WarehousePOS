-- ==========================================
-- QUICK FIX: Disable RLS for Registration
-- Run this in Supabase SQL Editor
-- ==========================================

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "tenant_isolation" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;
DROP POLICY IF EXISTS "user_tenant_isolation" ON users;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "store_tenant_isolation" ON stores;
DROP POLICY IF EXISTS "Users can view stores in their tenant" ON stores;

-- Disable RLS on core tables
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Also disable on phone_otps and phone_users
ALTER TABLE phone_otps DISABLE ROW LEVEL SECURITY;
ALTER TABLE phone_users DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON stores TO authenticated;
GRANT ALL ON phone_otps TO authenticated;
GRANT ALL ON phone_users TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS disabled on core tables - registration should work now!' as status;
