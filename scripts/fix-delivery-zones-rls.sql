-- Fix RLS for delivery_zones to allow dev mode access
-- Run this in Supabase SQL Editor

-- Drop existing policies
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

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'delivery_zones';
