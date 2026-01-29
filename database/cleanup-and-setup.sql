-- ==========================================
-- CLEANUP: Remove unused tables and add missing ones
-- ==========================================
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Drop unused tables (not used by the app)
DROP TABLE IF EXISTS rider_locations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS support_ticket_messages CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS sms_usage_log CASCADE;
DROP TABLE IF EXISTS platform_analytics_daily CASCADE;
DROP TABLE IF EXISTS sms_credit_packages CASCADE;
DROP TABLE IF EXISTS order_events CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS portal_customers CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS announcement_dismissals CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS users_backup CASCADE;
DROP TABLE IF EXISTS admin_revenue_summary CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Step 2: Create phone_otps table for custom OTP handling (mNotify)
DROP TABLE IF EXISTS phone_otps CASCADE;
CREATE TABLE phone_otps (
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

-- Indexes for phone_otps
CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON phone_otps(expires_at);

-- No RLS on phone_otps - managed by Edge Functions with service role

-- Step 3: Cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Check and update users table structure if needed
-- Make sure phone is NOT NULL and primary identifier
DO $$
BEGIN
    -- Add phone column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Make phone unique if not already
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_phone_key') THEN
        BEGIN
            ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
        EXCEPTION WHEN duplicate_table THEN
            -- constraint already exists
        END;
    END IF;
END $$;

-- Step 5: Verify remaining tables
SELECT tablename as "Remaining Tables" 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Summary
SELECT 'Cleanup complete! Unused tables removed, phone_otps table created.' as status;
