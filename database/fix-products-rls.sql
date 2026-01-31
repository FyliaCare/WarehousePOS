-- Fix RLS for products table
-- Run this in Supabase SQL Editor

-- First, check what store_id the current user has
SELECT id, email, store_id, tenant_id FROM users;

-- Check what stores exist
SELECT id, name, tenant_id FROM stores;

-- Option 1: Update the user's store_id to match the store
-- Replace USER_ID with your actual user ID and STORE_ID with your store ID
-- UPDATE users SET store_id = '00000000-0000-0000-0000-000000000002' WHERE id = 'YOUR_USER_ID';

-- Option 2: Create a more permissive policy that checks tenant_id instead of store_id
-- This is better for multi-store scenarios

-- Drop existing restrictive policy
DROP POLICY IF EXISTS products_store ON products;

-- Create new policy based on tenant_id (products belong to tenant, not just one store)
CREATE POLICY products_tenant ON products FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())))
    WITH CHECK (store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- Also fix categories
DROP POLICY IF EXISTS categories_store ON categories;
CREATE POLICY categories_tenant ON categories FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())))
    WITH CHECK (store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));
