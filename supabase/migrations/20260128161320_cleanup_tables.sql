-- ==========================================
-- CLEANUP: Remove unused tables and add phone_otps
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

-- Step 3: Cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;