-- ============================================
-- AUTH FIX MIGRATION
-- Properly link users table to Supabase Auth
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add auth_id column to users table if it doesn't exist
-- This links the users table to auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 2: Create index on auth_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 3: Make email column nullable if it isn't (we use auth.users for email)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Step 4: Make phone column nullable (not everyone has phone)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
    END IF;
END $$;

-- Step 5: Update RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view same tenant users" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Service role can do anything" ON users;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON users;
DROP POLICY IF EXISTS "Owners can insert users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile (by auth_id)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- Policy: Users can view other users in same tenant
CREATE POLICY "Users can view same tenant users" ON users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- Policy: Allow authenticated users to insert their own profile during registration
CREATE POLICY "Allow users to insert own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Policy: Owners/managers can insert new users in their tenant
CREATE POLICY "Owners can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND tenant_id = users.tenant_id 
            AND role IN ('owner', 'manager')
        )
    );

-- Step 6: Update existing users to have auth_id if they exist in auth.users
-- Match by email
UPDATE users u
SET auth_id = au.id
FROM auth.users au
WHERE u.email = au.email
AND u.auth_id IS NULL;

-- Step 7: Create a function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Only insert if not already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE auth_id = NEW.id) THEN
        INSERT INTO users (auth_id, full_name, email)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
            NEW.email
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Step 8: Create trigger for new auth users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 9: Ensure tenants table has proper RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON tenants;
DROP POLICY IF EXISTS "Anyone can insert tenant during registration" ON tenants;

-- Policy: Users can view their tenant
CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

-- Policy: Owners can update their tenant
CREATE POLICY "Users can update own tenant" ON tenants
    FOR UPDATE USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- Policy: Allow insert during registration (authenticated users with no tenant yet)
CREATE POLICY "Allow insert for authenticated" ON tenants
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Step 10: Ensure stores table has proper RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tenant stores" ON stores;
DROP POLICY IF EXISTS "Owners can manage stores" ON stores;
DROP POLICY IF EXISTS "Allow insert for tenant members" ON stores;

-- Policy: Users can view stores in their tenant
CREATE POLICY "Users can view tenant stores" ON stores
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

-- Policy: Owners can insert/update/delete stores
CREATE POLICY "Owners can manage stores" ON stores
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- Policy: Allow insert during registration
CREATE POLICY "Allow insert for tenant members" ON stores
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
        OR auth.uid() IS NOT NULL -- Allow during initial setup
    );

-- ============================================
-- STEP 11: PRODUCTION AUTH SETTINGS
-- ============================================
-- Note: These settings are configured via Supabase Dashboard for hosted projects
-- Go to: Authentication > URL Configuration

-- Required Redirect URLs to add in Supabase Dashboard:
-- Production:
--   https://your-production-domain.com/auth/callback
--   https://your-production-domain.com/reset-password
-- Development:
--   http://localhost:5173/auth/callback
--   http://localhost:5173/reset-password

-- ============================================
-- STEP 12: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to safely get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
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

-- Function to check if current user is owner
CREATE OR REPLACE FUNCTION is_tenant_owner()
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

-- Function to check if current user is owner or manager
CREATE OR REPLACE FUNCTION is_tenant_manager()
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

-- ============================================
-- STEP 13: GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_manager() TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (run these to verify)
-- ============================================
-- SELECT * FROM users WHERE auth_id IS NOT NULL LIMIT 5;
-- SELECT COUNT(*) FROM users WHERE auth_id IS NULL;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users';
-- SELECT get_current_tenant_id(); -- Should return your tenant_id when logged in

-- ============================================
-- POST-MIGRATION CHECKLIST
-- ============================================
-- 1. Run this SQL in Supabase Dashboard > SQL Editor
-- 2. Go to Authentication > URL Configuration and add redirect URLs
-- 3. Go to Authentication > Email Templates and customize (optional, see supabase/templates/)
-- 4. Enable "Confirm email" in Authentication > Settings if not enabled
-- 5. Test signup flow with a real email address
