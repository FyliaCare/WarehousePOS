-- ============================================
-- Phone Users Optimization Table
-- ============================================
-- This table provides O(1) lookup for phone -> user mapping
-- Instead of scanning all auth.users (O(n)), we maintain a separate index

-- Create the phone_users mapping table
CREATE TABLE IF NOT EXISTS phone_users (
    phone VARCHAR(20) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_phone_users_user_id ON phone_users(user_id);

-- Enable RLS
ALTER TABLE phone_users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to phone_users"
    ON phone_users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON phone_users TO service_role;

-- ============================================
-- Also add unique constraint on phone_otps for upsert
-- ============================================
-- This allows us to use UPSERT instead of DELETE + INSERT

-- First check if constraint exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'phone_otps_phone_purpose_key'
    ) THEN
        ALTER TABLE phone_otps ADD CONSTRAINT phone_otps_phone_purpose_key UNIQUE (phone, purpose);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

-- Add index on phone_otps for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_verified ON phone_otps(phone, verified_at);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

-- ============================================
-- Migrate existing users to phone_users table
-- ============================================
-- This populates the mapping table with existing phone users

INSERT INTO phone_users (phone, user_id)
SELECT au.phone, au.id
FROM auth.users au
WHERE au.phone IS NOT NULL AND au.phone != ''
ON CONFLICT (phone) DO NOTHING;

-- ============================================
-- Auto-populate phone_users on new user creation
-- ============================================
CREATE OR REPLACE FUNCTION handle_phone_user_mapping()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        INSERT INTO phone_users (phone, user_id)
        VALUES (NEW.phone, NEW.id)
        ON CONFLICT (phone) DO UPDATE SET user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-populate on user creation
DROP TRIGGER IF EXISTS on_auth_user_phone_mapping ON auth.users;
CREATE TRIGGER on_auth_user_phone_mapping
    AFTER INSERT OR UPDATE OF phone ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_phone_user_mapping();
