-- Add missing columns to tenants table
-- Run this in Supabase SQL Editor

-- Add currency column if missing
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GHS';

-- Add country column if missing  
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'GH';

-- Add subscription columns if missing
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;
