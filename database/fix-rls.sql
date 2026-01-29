-- Fix RLS policies to allow users to read their own data
-- Run this in Supabase SQL Editor

-- Drop the restrictive policies
DROP POLICY IF EXISTS user_tenant_isolation ON users;
DROP POLICY IF EXISTS tenant_isolation ON tenants;
DROP POLICY IF EXISTS store_tenant_isolation ON stores;

-- Users can read their own record (needed for login)
CREATE POLICY user_select_own ON users
  FOR SELECT USING (id = auth.uid());

-- Users can read users in their tenant (for team management)
CREATE POLICY user_select_tenant ON users
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can update their own record
CREATE POLICY user_update_own ON users
  FOR UPDATE USING (id = auth.uid());

-- Users can read their own tenant
CREATE POLICY tenant_select ON tenants
  FOR SELECT USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can update their own tenant (owners only would need additional check)
CREATE POLICY tenant_update ON tenants
  FOR UPDATE USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can read stores in their tenant
CREATE POLICY store_select ON stores
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can insert/update/delete stores in their tenant
CREATE POLICY store_insert ON stores
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY store_update ON stores
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY store_delete ON stores
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Fix other policies to use direct subquery instead of function
DROP POLICY IF EXISTS category_store_isolation ON categories;
DROP POLICY IF EXISTS product_store_isolation ON products;
DROP POLICY IF EXISTS stock_level_store_isolation ON stock_levels;
DROP POLICY IF EXISTS stock_movement_store_isolation ON stock_movements;
DROP POLICY IF EXISTS customer_tenant_isolation ON customers;
DROP POLICY IF EXISTS sale_store_isolation ON sales;
DROP POLICY IF EXISTS sale_item_store_isolation ON sale_items;
DROP POLICY IF EXISTS order_store_isolation ON orders;
DROP POLICY IF EXISTS order_item_store_isolation ON order_items;
DROP POLICY IF EXISTS rider_store_isolation ON riders;
DROP POLICY IF EXISTS delivery_assignment_store_isolation ON delivery_assignments;

-- Categories - users can manage categories in their store
CREATE POLICY category_all ON categories
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Products - users can manage products in their store
CREATE POLICY product_all ON products
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Stock levels - users can manage stock in their store
CREATE POLICY stock_level_all ON stock_levels
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Stock movements - users can manage movements in their store
CREATE POLICY stock_movement_all ON stock_movements
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Customers - users can manage customers in their tenant
CREATE POLICY customer_all ON customers
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Sales - users can manage sales in their store
CREATE POLICY sale_all ON sales
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Sale items - users can manage items for sales in their store
CREATE POLICY sale_item_all ON sale_items
  FOR ALL USING (sale_id IN (SELECT id FROM sales WHERE store_id IN (SELECT store_id FROM users WHERE id = auth.uid())));

-- Orders - users can manage orders in their store
CREATE POLICY order_all ON orders
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Order items - users can manage items for orders in their store
CREATE POLICY order_item_all ON order_items
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT store_id FROM users WHERE id = auth.uid())));

-- Riders - users can manage riders in their store
CREATE POLICY rider_all ON riders
  FOR ALL USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));

-- Delivery assignments - users can manage assignments for orders in their store
CREATE POLICY delivery_assignment_all ON delivery_assignments
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT store_id FROM users WHERE id = auth.uid())));

SELECT 'RLS policies fixed!' as result;
