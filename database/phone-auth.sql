-- Add phone_otps table and pin_hash to users
-- Run this in Supabase SQL Editor

-- Add pin_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);

-- Create phone_otps table for OTP verification
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(20) NOT NULL DEFAULT 'registration', -- 'registration', 'login', 'pin_reset'
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

-- Enable RLS
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTPs (via Edge Functions)
CREATE POLICY phone_otps_service ON phone_otps FOR ALL USING (true);

-- Update users table to make email optional and phone required
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint on phone
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);

SELECT 'Phone auth tables created!' as result;
