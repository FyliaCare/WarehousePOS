-- Migration: Add zone mapping features to delivery_zones
-- This migration creates the delivery_zones table if it doesn't exist
-- and adds support for polygon boundaries, colors, and free delivery thresholds

-- Create delivery_zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Zone definition (GeoJSON polygon)
    boundary JSONB,
    radius_km DECIMAL(10,2),
    
    -- Pricing
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    free_delivery_threshold DECIMAL(10,2),
    
    -- Timing
    estimated_time_minutes INTEGER NOT NULL DEFAULT 45,
    
    -- Display
    color TEXT DEFAULT '#10B981',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns if table already exists but columns are missing
DO $$
BEGIN
    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'description') THEN
        ALTER TABLE delivery_zones ADD COLUMN description TEXT;
    END IF;
    
    -- Add boundary if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'boundary') THEN
        ALTER TABLE delivery_zones ADD COLUMN boundary JSONB;
    END IF;
    
    -- Add color if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'color') THEN
        ALTER TABLE delivery_zones ADD COLUMN color TEXT DEFAULT '#10B981';
    END IF;
    
    -- Add free_delivery_threshold if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'free_delivery_threshold') THEN
        ALTER TABLE delivery_zones ADD COLUMN free_delivery_threshold DECIMAL(10,2);
    END IF;
    
    -- Add radius_km if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'radius_km') THEN
        ALTER TABLE delivery_zones ADD COLUMN radius_km DECIMAL(10,2);
    END IF;
    
    -- Handle estimated_minutes -> estimated_time_minutes rename
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'estimated_minutes') THEN
        ALTER TABLE delivery_zones RENAME COLUMN estimated_minutes TO estimated_time_minutes;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_zones' AND column_name = 'estimated_time_minutes') THEN
        ALTER TABLE delivery_zones ADD COLUMN estimated_time_minutes INTEGER DEFAULT 45;
    END IF;
END $$;

-- Create index for faster zone lookups by store
CREATE INDEX IF NOT EXISTS idx_delivery_zones_store_active 
    ON delivery_zones(store_id, is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_tenant
    ON delivery_zones(tenant_id);

-- Enable RLS
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exist first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their store zones" ON delivery_zones;
DROP POLICY IF EXISTS "Users can manage their store zones" ON delivery_zones;
DROP POLICY IF EXISTS "Public can view active zones" ON delivery_zones;
DROP POLICY IF EXISTS "Dev mode access" ON delivery_zones;
DROP POLICY IF EXISTS "Anon can access dev zones" ON delivery_zones;

-- Policy for authenticated users
CREATE POLICY "Users can view their store zones" ON delivery_zones
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage their store zones" ON delivery_zones
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
        OR tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Policy for dev mode (anon key with dev tenant/store)
-- This allows the anon key to access zones for the dev tenant
CREATE POLICY "Anon can access dev zones" ON delivery_zones
    FOR ALL USING (
        tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
        OR store_id = '00000000-0000-0000-0000-000000000002'::uuid
    )
    WITH CHECK (
        tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
        OR store_id = '00000000-0000-0000-0000-000000000002'::uuid
    );

-- Add comments
COMMENT ON TABLE delivery_zones IS 'Delivery zones with geographic boundaries and pricing';
COMMENT ON COLUMN delivery_zones.boundary IS 'GeoJSON Polygon format: { type: "Polygon", coordinates: [[[lng, lat], [lng, lat], ...]] }';
COMMENT ON COLUMN delivery_zones.color IS 'Hex color code for zone display on map (e.g., #10B981)';
COMMENT ON COLUMN delivery_zones.free_delivery_threshold IS 'Order amount above which delivery is free';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_delivery_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_delivery_zones_updated_at ON delivery_zones;
CREATE TRIGGER update_delivery_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_zones_updated_at();

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete: delivery_zones table ready with zone mapping columns';
END $$;
