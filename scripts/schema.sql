-- ============================================
-- WAREHOUSEPOS DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUMS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE country_code AS ENUM ('GH', 'NG');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'rider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'momo', 'transfer', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'voided', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rider_status AS ENUM ('online', 'offline', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('bicycle', 'motorcycle', 'car', 'van');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'return');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Tenants (Business accounts)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    country country_code NOT NULL DEFAULT 'GH',
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Accra',
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_status subscription_status DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    billing_period billing_period DEFAULT 'monthly',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores (Physical locations)
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Staff members)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    auth_user_id UUID UNIQUE, -- Links to Supabase auth.users
    email VARCHAR(255),
    phone VARCHAR(20),
    full_name VARCHAR(200) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'cashier',
    pin_code VARCHAR(6),
    avatar_url TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PRODUCT MANAGEMENT
-- ==========================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT '📦',
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50) NOT NULL,
    barcode VARCHAR(50),
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL,
    compare_price DECIMAL(12, 2),
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_inclusive BOOLEAN DEFAULT false,
    unit VARCHAR(20) DEFAULT 'piece',
    image_url TEXT,
    images JSONB DEFAULT '[]',
    track_stock BOOLEAN DEFAULT true,
    min_stock_level INTEGER DEFAULT 0,
    has_variants BOOLEAN DEFAULT false,
    variant_options JSONB DEFAULT '[]',
    show_online BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, sku)
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    barcode VARCHAR(50),
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL,
    options JSONB DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INVENTORY MANAGEMENT
-- ==========================================

-- Stock Levels
CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, product_id, variant_id)
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    cost_price DECIMAL(12, 2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CUSTOMER MANAGEMENT
-- ==========================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    default_latitude DECIMAL(10, 8),
    default_longitude DECIMAL(11, 8),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    credit_balance DECIMAL(12, 2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    last_order_at TIMESTAMPTZ,
    notes TEXT,
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    address TEXT NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    delivery_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SALES & ORDERS
-- ==========================================

-- Sales (POS transactions)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    discount_type VARCHAR(20),
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    change_given DECIMAL(12, 2) DEFAULT 0,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_status payment_status DEFAULT 'paid',
    payment_reference VARCHAR(100),
    status sale_status DEFAULT 'completed',
    notes TEXT,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2),
    discount DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (Delivery/Pickup orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL DEFAULT 'delivery',
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    delivery_address TEXT,
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    delivery_instructions TEXT,
    scheduled_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- DELIVERY MANAGEMENT
-- ==========================================

-- Riders
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    vehicle_type vehicle_type DEFAULT 'motorcycle',
    vehicle_number VARCHAR(20),
    license_number VARCHAR(50),
    status rider_status DEFAULT 'offline',
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_at TIMESTAMPTZ,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_deliveries INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Assignments
CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    status delivery_status DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    distance_km DECIMAL(6, 2),
    estimated_duration INTEGER,
    actual_duration INTEGER,
    delivery_fee DECIMAL(12, 2),
    rider_earnings DECIMAL(12, 2),
    rating INTEGER,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_levels_store ON stock_levels(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_riders_tenant ON riders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider ON delivery_assignments(rider_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Tenants policies
CREATE POLICY "Users can view their tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

-- Stores policies
CREATE POLICY "Users can view stores in their tenant" ON stores
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Owners can manage stores" ON stores
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() AND role = 'owner')
    );

-- Users policies
CREATE POLICY "Users can view users in their tenant" ON users
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Categories policies
CREATE POLICY "Users can view categories in their tenant" ON categories
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Managers can manage categories" ON categories
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('owner', 'manager'))
    );

-- Products policies
CREATE POLICY "Users can view products in their tenant" ON products
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Managers can manage products" ON products
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('owner', 'manager'))
    );

-- Stock levels policies
CREATE POLICY "Users can view stock in their stores" ON stock_levels
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

CREATE POLICY "Staff can manage stock" ON stock_levels
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

-- Customers policies
CREATE POLICY "Users can view customers in their tenant" ON customers
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Staff can manage customers" ON customers
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

-- Sales policies
CREATE POLICY "Users can view sales in their stores" ON sales
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

CREATE POLICY "Staff can create sales" ON sales
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

-- Sale items policies
CREATE POLICY "Users can view sale items" ON sale_items
    FOR SELECT USING (
        sale_id IN (SELECT id FROM sales WHERE store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())))
    );

CREATE POLICY "Staff can create sale items" ON sale_items
    FOR INSERT WITH CHECK (
        sale_id IN (SELECT id FROM sales WHERE store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())))
    );

-- Orders policies
CREATE POLICY "Users can view orders in their stores" ON orders
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

CREATE POLICY "Staff can manage orders" ON orders
    FOR ALL USING (
        store_id IN (SELECT id FROM stores WHERE tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()))
    );

-- Riders policies
CREATE POLICY "Users can view riders in their tenant" ON riders
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Managers can manage riders" ON riders
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('owner', 'manager'))
    );

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number(store_id UUID)
RETURNS TEXT AS $$
DECLARE
    store_code TEXT;
    today_date TEXT;
    seq_num INTEGER;
    receipt TEXT;
BEGIN
    SELECT COALESCE(code, LEFT(REPLACE(name, ' ', ''), 3)) INTO store_code
    FROM stores WHERE id = store_id;
    
    today_date := TO_CHAR(NOW(), 'YYMMDD');
    
    SELECT COUNT(*) + 1 INTO seq_num
    FROM sales 
    WHERE sales.store_id = generate_receipt_number.store_id
    AND DATE(created_at) = CURRENT_DATE;
    
    receipt := UPPER(store_code) || '-' || today_date || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN receipt;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number(store_id UUID)
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    seq_num INTEGER;
    order_num TEXT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYMMDD');
    
    SELECT COUNT(*) + 1 INTO seq_num
    FROM orders 
    WHERE orders.store_id = generate_order_number.store_id
    AND DATE(created_at) = CURRENT_DATE;
    
    order_num := 'ORD-' || today_date || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DONE!
-- ==========================================

SELECT 'WarehousePOS database schema created successfully!' AS status;
