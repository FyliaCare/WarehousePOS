-- ==========================================
-- MIGRATION: Supabase Auth with Custom OTP (mNotify)
-- ==========================================
-- This migration sets up Supabase Auth with custom OTP handling
-- Allows using mNotify/local SMS providers while keeping Supabase security
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Drop existing users table and recreate with proper structure
-- First, backup any existing data if needed
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 2: Drop existing constraints and table
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create users table properly linked to auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'cashier', 'viewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Step 4: Create indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Step 5: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for users
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert during registration (service role or authenticated)
CREATE POLICY "Allow insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 7: Create RLS policies for tenants
-- Users can read their own tenant
CREATE POLICY "Users can read own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Owners can update their tenant
CREATE POLICY "Owners can update tenant" ON tenants
    FOR UPDATE USING (
        id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'owner')
    );

-- Allow insert during registration
CREATE POLICY "Allow tenant creation" ON tenants
    FOR INSERT WITH CHECK (true);

-- Step 8: Create RLS policies for stores
-- Users can read stores in their tenant
CREATE POLICY "Users can read tenant stores" ON stores
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Owners/admins can manage stores
CREATE POLICY "Admins can manage stores" ON stores
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Allow insert during registration
CREATE POLICY "Allow store creation" ON stores
    FOR INSERT WITH CHECK (true);

-- Step 9: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is called when a new auth.user is created
    -- The actual user profile is created by the app during registration
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user (optional, for future use)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Create helper function to get current user's tenant
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 12: Create helper function to get current user's store
CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 13: Update RLS for other tables to use tenant isolation
-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant isolation for products" ON products
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id = get_my_tenant_id())
    );

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for categories" ON categories;
CREATE POLICY "Tenant isolation for categories" ON categories
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id = get_my_tenant_id())
    );

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for customers" ON customers;
CREATE POLICY "Tenant isolation for customers" ON customers
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id = get_my_tenant_id())
    );

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
CREATE POLICY "Tenant isolation for orders" ON orders
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id = get_my_tenant_id())
    );

-- Stock levels
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for stock" ON stock_levels;
CREATE POLICY "Tenant isolation for stock" ON stock_levels
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id = get_my_tenant_id())
    );

-- Step 14: Create phone_otps table for custom OTP handling (mNotify)
DROP TABLE IF EXISTS phone_otps;
CREATE TABLE phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,  -- Hashed OTP for security
    purpose VARCHAR(20) NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration', 'pin_reset')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast OTP lookup
CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON phone_otps(expires_at);

-- Clean up expired OTPs automatically (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 15: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify
SELECT 'Migration complete! Custom OTP with Supabase Auth is ready.' as status;
SELECT 'IMPORTANT: Deploy the send-otp and verify-otp Edge Functions!' as next_step;
