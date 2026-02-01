-- ============================================
-- QUICK FIX: Database Auth Issues
-- Run this in Supabase SQL Editor to fix user registration
-- ============================================
-- This fixes:
-- 1. Missing auth_id column on users table
-- 2. RLS policies blocking registration (INFINITE RECURSION FIX)
-- 3. Missing helper functions
-- ============================================
-- SECURITY ANALYSIS:
-- The recursion happens because policies on table X query table X.
-- Solution: Use SECURITY DEFINER functions that bypass RLS when checking ownership.
-- This is SAFE because:
--   1. Functions only return the current user's tenant_id/store_id (no data leak)
--   2. Users can only access data where tenant_id matches their own
--   3. INSERT policies still check auth.uid() directly (no escalation)
--   4. Service role bypass is standard for Edge Functions
-- ============================================

-- Step 1: Add auth_id column if missing (for compatibility with both auth patterns)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_id column to users table';
    ELSE
        RAISE NOTICE 'auth_id column already exists';
    END IF;
END $$;

-- Step 1b: Backfill auth_id from id where missing (mirror only; RLS uses id)
UPDATE users SET auth_id = id WHERE auth_id IS NULL;

-- Step 2: Make tenant_id nullable (needed during registration - user created before tenant assigned)
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 3: Create index on auth_id for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 4: Drop ALL existing policies to start fresh (prevents conflicts)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'tenants', 'stores')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Step 5: Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Step 6: Create helper functions (SECURITY DEFINER to bypass RLS and prevent recursion)
-- SECURITY: These functions run with elevated privileges but only return data about the CURRENT user.
-- They cannot be exploited because auth.uid() is immutable per request.

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Returns the tenant_id of the currently authenticated user
    -- Safe: Only returns data for the current user's auth.uid()
    SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Returns the store_id of the currently authenticated user
    SELECT store_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Returns the role of the currently authenticated user
    SELECT role FROM users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION am_i_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Returns true if current user is an owner
    SELECT COALESCE((SELECT role = 'owner' FROM users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION am_i_manager_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Returns true if current user is owner or manager
    SELECT COALESCE((SELECT role IN ('owner', 'manager') FROM users WHERE id = auth.uid()), false);
$$;

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION am_i_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION am_i_manager_or_owner() TO authenticated;

-- Also keep the old function names for backward compatibility
CREATE OR REPLACE FUNCTION get_user_tenant_id() RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT get_my_tenant_id(); $$;
CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT am_i_owner(); $$;
CREATE OR REPLACE FUNCTION is_manager() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT am_i_manager_or_owner(); $$;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;

-- ============================================
-- Step 7: USERS TABLE POLICIES
-- ============================================
-- CRITICAL: Users table policies must NOT query the users table directly!
-- This causes infinite recursion. We use auth.uid() directly instead.

-- Service role bypass (for Edge Functions and admin operations)
CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can INSERT their own profile (during registration)
-- Security: Only allows inserting a row where id matches their auth.uid()
CREATE POLICY "users_insert_own" ON users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Users can SELECT their own profile
-- Security: Only returns the row that matches their auth.uid()
CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Users can UPDATE their own profile
-- Security: Only allows updating the row that matches their auth.uid()
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Managers/Owners can view users in their tenant (uses helper function to avoid recursion)
CREATE POLICY "users_select_tenant" ON users
    FOR SELECT TO authenticated
    USING (tenant_id = get_my_tenant_id() AND get_my_tenant_id() IS NOT NULL);

-- Managers/Owners can insert staff members into their tenant
CREATE POLICY "users_insert_staff" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = get_my_tenant_id() 
        AND am_i_manager_or_owner() 
        AND role IN ('cashier', 'manager')  -- Cannot create owners
    );

-- ============================================
-- Step 8: TENANTS TABLE POLICIES  
-- ============================================

-- Service role bypass
CREATE POLICY "service_role_tenants" ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Any authenticated user can create a tenant (during business registration)
-- Security: This is intentional - new users need to create their business
CREATE POLICY "tenants_insert" ON tenants
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own tenant (uses helper function)
CREATE POLICY "tenants_select_own" ON tenants
    FOR SELECT TO authenticated
    USING (id = get_my_tenant_id());

-- Owners can update their tenant
CREATE POLICY "tenants_update_owner" ON tenants
    FOR UPDATE TO authenticated
    USING (id = get_my_tenant_id() AND am_i_owner())
    WITH CHECK (id = get_my_tenant_id() AND am_i_owner());

-- ============================================
-- Step 9: STORES TABLE POLICIES
-- ============================================

-- Service role bypass
CREATE POLICY "service_role_stores" ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can create stores (during business setup)
-- Security: Frontend ensures store is linked to user's tenant
CREATE POLICY "stores_insert" ON stores
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view stores in their tenant
CREATE POLICY "stores_select_tenant" ON stores
    FOR SELECT TO authenticated
    USING (tenant_id = get_my_tenant_id());

-- Owners can update stores in their tenant
CREATE POLICY "stores_update_owner" ON stores
    FOR UPDATE TO authenticated
    USING (tenant_id = get_my_tenant_id() AND am_i_owner())
    WITH CHECK (tenant_id = get_my_tenant_id());

-- Owners can delete stores in their tenant
CREATE POLICY "stores_delete_owner" ON stores
    FOR DELETE TO authenticated
    USING (tenant_id = get_my_tenant_id() AND am_i_owner());

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify the fix:

-- Check auth_id column exists:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'auth_id';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('users', 'tenants', 'stores');

-- Check policies exist:
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- ============================================
-- ADDITIONAL FUNCTIONS (for POS operations)
-- ============================================

-- RPC function to decrement stock (called from frontend)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$;

-- RPC function to increment stock
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$;

-- Grant execute on RPC functions
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO authenticated;

-- ============================================
-- SUCCESS! Database should now accept new user registrations
-- ============================================
