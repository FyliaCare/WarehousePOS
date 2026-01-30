-- Fix RLS for tenant creation
-- Run this in Supabase SQL Editor

-- Option 1: Disable RLS on tenants (simplest for now)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant full access
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON stores TO authenticated;
GRANT ALL ON users TO authenticated;

SELECT 'RLS disabled for signup flow!' as status;
