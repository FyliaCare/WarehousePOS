-- =====================================================
-- SECURITY AUDIT FIX - WarehousePOS
-- Created: 2026-01-31
-- Purpose: Consolidated security migration from audit
-- =====================================================
-- This file addresses all security issues found in the audit:
-- 1. Creates missing tables (deliveries, phone_users, otp_codes)
-- 2. Re-enables RLS on all tables
-- 3. Creates consistent policies using store_id
-- 4. Adds service_role bypass for Edge Functions
-- =====================================================

-- =====================================================
-- PART 1: CREATE MISSING TABLES
-- =====================================================

-- 1.1 Deliveries Table (referenced by frontend but missing)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'accepted', 'picked_up', 
        'in_transit', 'delivered', 'failed', 'cancelled'
    )),
    
    -- Delivery details
    delivery_address TEXT,
    delivery_lat DECIMAL(10,8),
    delivery_lng DECIMAL(11,8),
    delivery_notes TEXT,
    
    -- Timestamps
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Tracking
    distance_km DECIMAL(10,2),
    duration_minutes INTEGER,
    
    -- Payment
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    rider_earnings DECIMAL(12,2) DEFAULT 0,
    
    -- Rating & feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Phone Users Mapping Table (for phone auth)
CREATE TABLE IF NOT EXISTS phone_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 OTP Codes Table (for rider authentication)
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'rider_login' CHECK (purpose IN (
        'rider_login', 'rider_verification', 'delivery_confirmation'
    )),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Sale Items Table (if not exists)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Sales Table (if not exists - referenced by sale_items)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    sale_number VARCHAR(50) NOT NULL,
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Payment
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'credit')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    payment_reference VARCHAR(100),
    amount_paid DECIMAL(12,2) DEFAULT 0,
    change_given DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'voided', 'refunded')),
    
    -- Void info
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT,
    
    notes TEXT,
    
    -- Sync tracking (offline)
    synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Stock Movements Table (if not exists)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    
    reference_type VARCHAR(50),
    reference_id UUID,
    
    reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 2: CREATE INDEXES FOR NEW TABLES
-- =====================================================

-- Deliveries indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_store ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON deliveries(created_at DESC);

-- Phone users indexes
CREATE INDEX IF NOT EXISTS idx_phone_users_phone ON phone_users(phone);
CREATE INDEX IF NOT EXISTS idx_phone_users_user ON phone_users(user_id);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes(phone, code_hash, purpose) WHERE verified_at IS NULL;

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- =====================================================
-- PART 3: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

-- Core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Inventory tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Customer & Sales tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Order tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Delivery tables
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Payment & subscription tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Communication tables
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: DROP EXISTING CONFLICTING POLICIES
-- =====================================================

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- PART 5: CREATE SERVICE ROLE BYPASS POLICIES
-- Service role needs full access for Edge Functions
-- =====================================================

-- Core tables
CREATE POLICY service_tenants ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_stores ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Inventory tables
CREATE POLICY service_categories ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_products ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_stock_levels ON stock_levels FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_stock_movements ON stock_movements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Customer & Sales tables
CREATE POLICY service_customers ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_sales ON sales FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_sale_items ON sale_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Order tables
CREATE POLICY service_orders ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_order_items ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Delivery tables
CREATE POLICY service_riders ON riders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_deliveries ON deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_delivery_assignments ON delivery_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_delivery_zones ON delivery_zones FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payment & subscription tables
CREATE POLICY service_payments ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_subscriptions ON subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Communication tables
CREATE POLICY service_phone_otps ON phone_otps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_phone_users ON phone_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_otp_codes ON otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_sms_logs ON sms_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_whatsapp_logs ON whatsapp_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- PART 6: CREATE USER POLICIES (AUTHENTICATED USERS)
-- Using store_id filtering to match frontend code
-- =====================================================

-- ==========================================
-- USERS TABLE POLICIES
-- ==========================================

-- Users can read their own record
CREATE POLICY users_select_own ON users 
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY users_update_own ON users 
    FOR UPDATE TO authenticated 
    USING (id = auth.uid());

-- Users can insert their own record (registration)
CREATE POLICY users_insert_self ON users 
    FOR INSERT TO authenticated 
    WITH CHECK (id = auth.uid());

-- Users can read other users in their tenant (team management)
CREATE POLICY users_select_tenant ON users 
    FOR SELECT TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ==========================================
-- TENANTS TABLE POLICIES
-- ==========================================

-- Users can read their own tenant
CREATE POLICY tenants_select_own ON tenants 
    FOR SELECT TO authenticated 
    USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can update their own tenant (owners/managers)
CREATE POLICY tenants_update_own ON tenants 
    FOR UPDATE TO authenticated 
    USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can insert tenants (registration)
CREATE POLICY tenants_insert ON tenants 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- ==========================================
-- STORES TABLE POLICIES
-- ==========================================

-- Users can read stores in their tenant
CREATE POLICY stores_select_tenant ON stores 
    FOR SELECT TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can insert stores in their tenant
CREATE POLICY stores_insert_tenant ON stores 
    FOR INSERT TO authenticated 
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can update stores in their tenant
CREATE POLICY stores_update_tenant ON stores 
    FOR UPDATE TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can delete stores in their tenant
CREATE POLICY stores_delete_tenant ON stores 
    FOR DELETE TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ==========================================
-- CATEGORIES TABLE POLICIES
-- ==========================================

-- Users can manage categories in stores belonging to their tenant
CREATE POLICY categories_all ON categories 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- PRODUCTS TABLE POLICIES
-- ==========================================

-- Users can manage products in stores belonging to their tenant
CREATE POLICY products_all ON products 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- STOCK LEVELS TABLE POLICIES
-- ==========================================

-- Users can manage stock levels in their tenant's stores
CREATE POLICY stock_levels_all ON stock_levels 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- STOCK MOVEMENTS TABLE POLICIES
-- ==========================================

-- Users can manage stock movements in their tenant's stores
CREATE POLICY stock_movements_all ON stock_movements 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- CUSTOMERS TABLE POLICIES
-- ==========================================

-- Users can manage customers in their tenant's stores
CREATE POLICY customers_all ON customers 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- SALES TABLE POLICIES
-- ==========================================

-- Users can manage sales in their tenant's stores
CREATE POLICY sales_all ON sales 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- SALE ITEMS TABLE POLICIES
-- ==========================================

-- Users can manage sale items for sales in their tenant's stores
CREATE POLICY sale_items_all ON sale_items 
    FOR ALL TO authenticated 
    USING (sale_id IN (
        SELECT id FROM sales WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ))
    WITH CHECK (sale_id IN (
        SELECT id FROM sales WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ));

-- ==========================================
-- ORDERS TABLE POLICIES
-- ==========================================

-- Users can manage orders in their tenant's stores
CREATE POLICY orders_all ON orders 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- ORDER ITEMS TABLE POLICIES
-- ==========================================

-- Users can manage order items for orders in their tenant's stores
CREATE POLICY order_items_all ON order_items 
    FOR ALL TO authenticated 
    USING (order_id IN (
        SELECT id FROM orders WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ))
    WITH CHECK (order_id IN (
        SELECT id FROM orders WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ));

-- ==========================================
-- RIDERS TABLE POLICIES
-- ==========================================

-- Users can manage riders in their tenant's stores
CREATE POLICY riders_all ON riders 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- DELIVERIES TABLE POLICIES
-- ==========================================

-- Users can manage deliveries in their tenant's stores
CREATE POLICY deliveries_all ON deliveries 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- DELIVERY ASSIGNMENTS TABLE POLICIES
-- ==========================================

-- Users can manage delivery assignments for orders in their tenant's stores
CREATE POLICY delivery_assignments_all ON delivery_assignments 
    FOR ALL TO authenticated 
    USING (order_id IN (
        SELECT id FROM orders WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ))
    WITH CHECK (order_id IN (
        SELECT id FROM orders WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ));

-- ==========================================
-- DELIVERY ZONES TABLE POLICIES
-- ==========================================

-- Users can manage delivery zones in their tenant's stores
CREATE POLICY delivery_zones_all ON delivery_zones 
    FOR ALL TO authenticated 
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- ==========================================
-- PAYMENTS TABLE POLICIES
-- ==========================================

-- Users can view payments for orders in their tenant's stores
CREATE POLICY payments_select ON payments 
    FOR SELECT TO authenticated 
    USING (order_id IN (
        SELECT id FROM orders WHERE store_id IN (
            SELECT id FROM stores WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    ));

-- ==========================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ==========================================

-- Users can view their tenant's subscriptions
CREATE POLICY subscriptions_select ON subscriptions 
    FOR SELECT TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- PART 7: HELPER FUNCTIONS
-- =====================================================

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get user's store_id
CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND tenant_id = p_tenant_id
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if store belongs to user's tenant
CREATE OR REPLACE FUNCTION store_in_user_tenant(p_store_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM stores s
        JOIN users u ON s.tenant_id = u.tenant_id
        WHERE u.id = auth.uid() AND s.id = p_store_id
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- PART 8: UPDATED_AT TRIGGERS FOR NEW TABLES
-- =====================================================

-- Auto-update updated_at function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON deliveries;
CREATE TRIGGER trg_deliveries_updated_at 
    BEFORE UPDATE ON deliveries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_phone_users_updated_at ON phone_users;
CREATE TRIGGER trg_phone_users_updated_at 
    BEFORE UPDATE ON phone_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sales_updated_at ON sales;
CREATE TRIGGER trg_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 9: GRANTS
-- =====================================================

-- Grant permissions to authenticated users (RLS controls actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- List all tables with RLS status
DO $$
BEGIN
    RAISE NOTICE 'Security audit fix applied successfully!';
    RAISE NOTICE 'Run the following to verify RLS is enabled:';
    RAISE NOTICE 'SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = ''public'';';
END $$;

SELECT 'Security audit fix completed!' as status;
