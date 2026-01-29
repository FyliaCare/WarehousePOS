-- Production Database Setup for WarehousePOS
-- Run this in Supabase SQL Editor to ensure all tables exist

-- 1. Ensure phone_otps table exists for OTP storage
CREATE TABLE IF NOT EXISTS phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration', 'pin_reset')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

-- 2. Ensure users table has correct structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'cashier', 'admin')),
    country VARCHAR(2) NOT NULL DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure tenants table exists
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure stores table exists
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    currency VARCHAR(3) DEFAULT 'GHS',
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on phone_otps with service role bypass
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to phone_otps (Edge Functions use service role)
DROP POLICY IF EXISTS service_role_phone_otps ON phone_otps;
CREATE POLICY service_role_phone_otps ON phone_otps FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Enable RLS on other tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 7. Create permissive policies for authenticated users
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS users_insert_self ON users;
CREATE POLICY users_insert_self ON users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS tenants_select ON tenants;
CREATE POLICY tenants_select ON tenants FOR SELECT TO authenticated USING (
    id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS stores_select ON stores;
CREATE POLICY stores_select ON stores FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- 8. Service role bypass for all tables
DROP POLICY IF EXISTS service_role_users ON users;
CREATE POLICY service_role_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_tenants ON tenants;
CREATE POLICY service_role_tenants ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_stores ON stores;
CREATE POLICY service_role_stores ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. Cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Production database setup complete!' as status;
