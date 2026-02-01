-- ============================================
-- QUICK FIX: Database Auth Issues
-- Run this in Supabase SQL Editor to fix user registration
-- ============================================
-- This fixes:
-- 1. Missing auth_id column on users table
-- 2. RLS policies blocking registration
-- 3. Missing helper functions
-- ============================================

-- Step 1: Add auth_id column if missing
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

-- Step 2: Make tenant_id nullable (needed during registration)
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 3: Create index on auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 4: Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view same tenant users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Service role can do anything" ON users;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON users;
DROP POLICY IF EXISTS "Owners can insert users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON tenants;
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Owners can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON stores;
DROP POLICY IF EXISTS "Users can view tenant stores" ON stores;
DROP POLICY IF EXISTS "Owners can manage stores" ON stores;
DROP POLICY IF EXISTS "Allow insert for tenant members" ON stores;

-- Step 5: Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM users
    WHERE auth_id = auth.uid()
    LIMIT 1;
    RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role = 'owner'
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role IN ('owner', 'manager')
    );
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;

-- Step 7: Create TENANTS policies
CREATE POLICY "Allow insert for authenticated" ON tenants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Owners can update own tenant" ON tenants
    FOR UPDATE USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- Step 8: Create STORES policies
CREATE POLICY "Allow insert for authenticated" ON stores
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view tenant stores" ON stores
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Owners can manage stores" ON stores
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- Step 9: Create USERS policies
CREATE POLICY "Allow users to insert own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can view same tenant users" ON users
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Owners can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.auth_id = auth.uid() 
            AND u2.tenant_id = users.tenant_id 
            AND u2.role IN ('owner', 'manager')
        )
    );

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
