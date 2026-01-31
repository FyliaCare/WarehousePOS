-- Migration: Add business_type column to categories and tenants tables
-- Purpose: Support multi-industry shops where different categories can have different business types
-- This enables category-specific custom product fields based on business type

-- Add business_type column to categories table (for multi-industry product fields)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Add store_id column for compatibility (if using store-level categories)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Add business_type column to tenants table (default business type for new categories)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Comment for documentation
COMMENT ON COLUMN categories.business_type IS 'Business type for this category - determines which custom product fields to show. E.g., restaurant, electronics_store, pharmacy, etc.';
COMMENT ON COLUMN categories.store_id IS 'Store this category belongs to (optional, can use tenant_id for tenant-wide categories)';
COMMENT ON COLUMN tenants.business_type IS 'Default business type for this tenant - set during registration, used as fallback for categories without explicit business_type.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_business_type ON categories(business_type) WHERE business_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type) WHERE business_type IS NOT NULL;
