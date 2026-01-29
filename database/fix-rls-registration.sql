-- ==========================================
-- SIMPLE FIX: DISABLE RLS ON CORE TABLES
-- Run this in Supabase SQL Editor
-- We'll add proper policies later once registration works
-- ==========================================

-- STEP 1: Remove the foreign key constraint on users.id
-- (We're using custom PIN auth, not Supabase Auth)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- STEP 2: Drop all existing policies that cause recursion
DROP POLICY IF EXISTS tenant_isolation ON tenants;
DROP POLICY IF EXISTS allow_tenant_insert ON tenants;
DROP POLICY IF EXISTS allow_tenant_select ON tenants;
DROP POLICY IF EXISTS allow_tenant_update ON tenants;

DROP POLICY IF EXISTS user_tenant_isolation ON users;
DROP POLICY IF EXISTS allow_user_insert ON users;
DROP POLICY IF EXISTS allow_user_select ON users;
DROP POLICY IF EXISTS allow_user_update ON users;

DROP POLICY IF EXISTS store_tenant_isolation ON stores;
DROP POLICY IF EXISTS allow_store_insert ON stores;
DROP POLICY IF EXISTS allow_store_select ON stores;
DROP POLICY IF EXISTS allow_store_update ON stores;

-- STEP 2: Disable RLS on core tables that exist
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables if they exist (ignore errors)
DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE products DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE categories DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE sales DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE customers DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE expenses DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- STEP 3: Grant full permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT ON announcements TO anon;

-- Allow anon to read users table for phone check during registration
GRANT SELECT ON users TO anon;
GRANT SELECT ON tenants TO anon;

-- ==========================================
-- DONE! RLS is now disabled.
-- Registration should work now.
-- We can add proper RLS policies later.
-- ==========================================
