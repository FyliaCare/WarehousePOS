-- =====================================================
-- PRODUCTION DATABASE SCHEMA - WarehousePOS
-- Complete schema with all tables, RLS, and functions
-- Run this FRESH in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: CLEAN SLATE
-- =====================================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS delivery_assignments CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_logs CASCADE;
DROP TABLE IF EXISTS phone_users CASCADE;
DROP TABLE IF EXISTS phone_otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- =====================================================
-- PART 2: CORE TABLES
-- =====================================================

-- Tenants (Multi-tenant root)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    owner_id UUID, -- Will reference auth.users after users table
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores (Each tenant can have multiple stores)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    currency VARCHAR(3) DEFAULT 'GHS',
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Links to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'cashier', 'admin')),
    country VARCHAR(2) NOT NULL DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    pin_hash VARCHAR(255),
    pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    pin_updated_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add owner_id FK after users table exists
ALTER TABLE tenants ADD CONSTRAINT fk_tenant_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    barcode VARCHAR(50),
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'piece',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    track_inventory BOOLEAN DEFAULT TRUE,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Levels
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    last_restock_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, store_id)
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'out_for_delivery', 'completed', 'cancelled', 'delivery_failed')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'credit')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    payment_reference VARCHAR(100),
    delivery_type VARCHAR(20) DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    vehicle_type VARCHAR(20) DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'van')),
    vehicle_number VARCHAR(20),
    country VARCHAR(2) DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Assignments
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- In smallest currency unit (pesewas/kobo)
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider VARCHAR(20) DEFAULT 'paystack',
    metadata JSONB DEFAULT '{}',
    provider_response JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE,
    customer_email VARCHAR(255),
    plan_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
    provider VARCHAR(20) DEFAULT 'paystack',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone OTPs (for authentication)
CREATE TABLE phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone mapping for faster lookup and PIN verification
CREATE TABLE phone_users (
    phone VARCHAR(20) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Logs
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    country VARCHAR(2),
    provider VARCHAR(20),
    status VARCHAR(20) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Logs
CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_params JSONB,
    country VARCHAR(2),
    message_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 3: INDEXES
-- =====================================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_store ON users(store_id);

CREATE INDEX idx_stores_tenant ON stores(tenant_id);
CREATE INDEX idx_stores_slug ON stores(slug);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);

CREATE INDEX idx_stock_product ON stock_levels(product_id);
CREATE INDEX idx_stock_store ON stock_levels(store_id);

CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_riders_phone ON riders(phone);
CREATE INDEX idx_riders_store ON riders(store_id);

CREATE INDEX idx_delivery_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_rider ON delivery_assignments(rider_id);
CREATE INDEX idx_delivery_status ON delivery_assignments(status);

CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_order ON payments(order_id);

CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON phone_otps(expires_at);
CREATE INDEX idx_phone_otps_lookup ON phone_otps(phone, otp_hash, purpose) WHERE verified_at IS NULL;
CREATE UNIQUE INDEX idx_phone_otps_phone_purpose ON phone_otps(phone, purpose);
CREATE INDEX idx_phone_users_user_id ON phone_users(user_id);

-- =====================================================
-- PART 4: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for Edge Functions)
CREATE POLICY service_tenants ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_stores ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_categories ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_products ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_stock ON stock_levels FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_customers ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_orders ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_order_items ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_riders ON riders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_deliveries ON delivery_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_payments ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_subscriptions ON subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_phone_otps ON phone_otps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_sms_logs ON sms_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_whatsapp_logs ON whatsapp_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User policies (authenticated users)
-- Users can read/update their own profile
CREATE POLICY users_select_own ON users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY users_insert_self ON users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Users can read their tenant
CREATE POLICY tenants_select_own ON tenants FOR SELECT TO authenticated 
    USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can read/write stores in their tenant
CREATE POLICY stores_select_tenant ON stores FOR SELECT TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY stores_insert_tenant ON stores FOR INSERT TO authenticated 
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY stores_update_tenant ON stores FOR UPDATE TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Store-scoped data policies
CREATE POLICY categories_store ON categories FOR ALL TO authenticated 
    USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));
CREATE POLICY products_store ON products FOR ALL TO authenticated 
    USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));
CREATE POLICY stock_store ON stock_levels FOR ALL TO authenticated 
    USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));
CREATE POLICY customers_store ON customers FOR ALL TO authenticated 
    USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));
CREATE POLICY orders_store ON orders FOR ALL TO authenticated 
    USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()));
CREATE POLICY order_items_store ON order_items FOR ALL TO authenticated 
    USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT store_id FROM users WHERE id = auth.uid())));

-- =====================================================
-- PART 5: FUNCTIONS
-- =====================================================

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS decrease_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS increase_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS cleanup_expired_otps();
DROP FUNCTION IF EXISTS update_customer_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Decrease stock function
CREATE OR REPLACE FUNCTION decrease_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = GREATEST(0, quantity - p_quantity),
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increase stock function
CREATE OR REPLACE FUNCTION increase_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = quantity + p_quantity,
        last_restock_at = NOW(),
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update customer stats after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.payment_status = 'paid' THEN
        UPDATE customers
        SET total_purchases = total_purchases + NEW.total,
            total_orders = total_orders + 1,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_customer_stats
    AFTER UPDATE OF payment_status ON orders
    FOR EACH ROW
    WHEN (OLD.payment_status != 'paid' AND NEW.payment_status = 'paid')
    EXECUTE FUNCTION update_customer_stats();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 6: GRANTS (Minimal - rely on RLS)
-- =====================================================

-- Authenticated users need SELECT/INSERT/UPDATE/DELETE but RLS controls what they can access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Service role has full access (for Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Schema created successfully!' as status;
