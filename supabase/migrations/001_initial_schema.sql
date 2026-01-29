-- ============================================
-- WAREHOUSEPOS DATABASE SCHEMA V2.0
-- Ghana & Nigeria First
-- Single Source of Truth
-- ============================================
-- Run with: supabase db push
-- ============================================

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUMS
-- ==========================================

-- Country enum
CREATE TYPE country_code AS ENUM ('GH', 'NG');

-- User roles
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'rider');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');

-- Billing period
CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');

-- Order types
CREATE TYPE order_type AS ENUM ('delivery', 'pickup');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'momo', 'transfer', 'credit');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Sale status
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'voided', 'refunded');

-- Order status
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready', 
  'out_for_delivery', 'delivered', 'cancelled'
);

-- Delivery assignment status
CREATE TYPE delivery_status AS ENUM (
  'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'
);

-- Rider status
CREATE TYPE rider_status AS ENUM ('online', 'offline', 'busy');

-- Vehicle types
CREATE TYPE vehicle_type AS ENUM ('bicycle', 'motorcycle', 'car', 'van');

-- Stock movement types
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'return');

-- Notification channels
CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email', 'push');

-- Notification status
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ==========================================
-- PLATFORM TABLES (Admin Portal)
-- ==========================================

-- Platform configuration
CREATE TABLE platform_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_ghs DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_ngn DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_period billing_period NOT NULL DEFAULT 'monthly',
    features JSONB NOT NULL DEFAULT '[]',
    limits JSONB NOT NULL DEFAULT '{"products": 100, "staff": 5, "stores": 1}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- TENANT TABLES (Multi-tenant core)
-- ==========================================

-- Tenants (Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    
    -- Country & localization
    country country_code NOT NULL DEFAULT 'GH',
    currency TEXT NOT NULL DEFAULT 'GHS',
    timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
    phone_country_code TEXT NOT NULL DEFAULT '+233',
    default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Contact
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    
    -- Subscription
    plan_id UUID REFERENCES subscription_plans(id),
    subscription_status subscription_status NOT NULL DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    
    -- Features & limits
    features_enabled JSONB NOT NULL DEFAULT '{}',
    
    -- Country-specific config (SMS provider, payment methods, etc.)
    country_config JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores (Locations/branches)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    
    -- Location for delivery
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Settings
    is_main BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Operating hours (JSON: { "monday": { "open": "08:00", "close": "18:00" }, ... })
    operating_hours JSONB NOT NULL DEFAULT '{}',
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (Staff members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE, -- Supabase auth.users.id
    
    -- Basic info
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Authentication
    pin_hash TEXT, -- For quick POS login (4-6 digit PIN)
    
    -- Role & permissions
    role user_role NOT NULL DEFAULT 'cashier',
    permissions JSONB NOT NULL DEFAULT '[]',
    
    -- Assignment
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INVENTORY TABLES
-- ==========================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT,
    
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, name)
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT NOT NULL,
    barcode TEXT,
    
    -- Pricing
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL,
    compare_price DECIMAL(12,2), -- Original price for showing discounts
    
    -- Tax
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_inclusive BOOLEAN NOT NULL DEFAULT false,
    
    -- Inventory
    unit TEXT NOT NULL DEFAULT 'piece',
    track_stock BOOLEAN NOT NULL DEFAULT true,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    
    -- Media
    image_url TEXT,
    images JSONB NOT NULL DEFAULT '[]',
    
    -- Variants
    has_variants BOOLEAN NOT NULL DEFAULT false,
    variant_options JSONB NOT NULL DEFAULT '[]',
    
    -- Online store
    show_online BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, sku)
);

-- Product variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2) NOT NULL,
    
    options JSONB NOT NULL DEFAULT '{}',
    
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, sku)
);

-- Stock levels (per store)
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(store_id, product_id, variant_id)
);

-- Stock movements (audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    user_id UUID REFERENCES users(id),
    
    type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    
    reference_type TEXT,
    reference_id UUID,
    
    reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CUSTOMER TABLES
-- ==========================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    
    -- For delivery
    default_latitude DECIMAL(10,8),
    default_longitude DECIMAL(11,8),
    
    -- Financials
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Loyalty
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    
    -- Stats
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_order_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    tags JSONB NOT NULL DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer addresses (multiple delivery addresses)
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    label TEXT NOT NULL DEFAULT 'Home',
    address TEXT NOT NULL,
    city TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    is_default BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SALES TABLES (POS)
-- ==========================================

-- Sales (POS transactions)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    
    sale_number TEXT NOT NULL,
    
    -- Items stored as JSONB for performance
    -- Structure: [{ product_id, variant_id, name, quantity, unit_price, discount, tax, total }]
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_type discount_type,
    discount_code TEXT,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method payment_method NOT NULL,
    payment_reference TEXT,
    amount_paid DECIMAL(12,2) NOT NULL,
    change_given DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Status
    status sale_status NOT NULL DEFAULT 'completed',
    
    -- Void/refund info
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,
    
    notes TEXT,
    
    -- Sync tracking (for offline)
    synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, sale_number)
);

-- ==========================================
-- ONLINE ORDERS (Vendor Portal)
-- ==========================================

-- Online orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    customer_id UUID REFERENCES customers(id),
    
    order_number TEXT NOT NULL,
    
    -- Customer info (captured at order time)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Delivery info
    order_type order_type NOT NULL DEFAULT 'delivery',
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_latitude DECIMAL(10,8),
    delivery_longitude DECIMAL(11,8),
    delivery_notes TEXT,
    
    -- Items (same structure as sales)
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method payment_method,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_reference TEXT,
    
    -- Status
    status order_status NOT NULL DEFAULT 'pending',
    
    -- Timestamps for each status
    confirmed_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Cancellation
    cancelled_by TEXT,
    cancel_reason TEXT,
    
    -- Source
    source TEXT NOT NULL DEFAULT 'portal',
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, order_number)
);

-- ==========================================
-- DELIVERY TABLES
-- ==========================================

-- Riders (Delivery personnel)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Basic info
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    
    -- Vehicle
    vehicle_type vehicle_type NOT NULL DEFAULT 'motorcycle',
    vehicle_number TEXT,
    
    -- Current status
    status rider_status NOT NULL DEFAULT 'offline',
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_at TIMESTAMPTZ,
    
    -- Stats
    total_deliveries INTEGER NOT NULL DEFAULT 0,
    total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery assignments
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id),
    
    -- Status
    status delivery_status NOT NULL DEFAULT 'assigned',
    
    -- Timestamps
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Tracking
    distance_km DECIMAL(10,2),
    duration_minutes INTEGER,
    
    -- Payment
    delivery_fee DECIMAL(12,2),
    rider_earnings DECIMAL(12,2),
    
    -- Rating
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery zones
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),
    
    name TEXT NOT NULL,
    
    -- Zone definition (polygon coordinates)
    coordinates JSONB NOT NULL DEFAULT '[]',
    
    -- Pricing
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Timing
    estimated_minutes INTEGER NOT NULL DEFAULT 45,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- COMMUNICATION TABLES
-- ==========================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    
    -- Content by channel
    sms_content TEXT,
    whatsapp_template_name TEXT,
    email_subject TEXT,
    email_content TEXT,
    push_title TEXT,
    push_body TEXT,
    
    -- Variables available
    variables JSONB NOT NULL DEFAULT '[]',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications sent (audit log)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Recipient
    recipient_type TEXT NOT NULL,
    recipient_id UUID,
    recipient_phone TEXT,
    recipient_email TEXT,
    
    -- Content
    channel notification_channel NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    content TEXT NOT NULL,
    
    -- Reference
    reference_type TEXT,
    reference_id UUID,
    
    -- Status
    status notification_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SUPPORT TABLES (Admin Portal)
-- ==========================================

-- Support tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    ticket_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    
    assigned_to UUID,
    
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support ticket messages
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    sender_type TEXT NOT NULL,
    sender_id UUID,
    
    message TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SYNC QUEUE (for offline POS)
-- ==========================================

CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID NOT NULL,
    payload JSONB NOT NULL,
    
    retries INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Tenants
CREATE INDEX idx_tenants_country ON tenants(country);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE deleted_at IS NULL;

-- Stores
CREATE INDEX idx_stores_tenant ON stores(tenant_id);
CREATE INDEX idx_stores_active ON stores(tenant_id, is_active) WHERE deleted_at IS NULL;

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_active ON users(tenant_id, is_active) WHERE deleted_at IS NULL;

-- Categories
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(tenant_id, is_active) WHERE deleted_at IS NULL;

-- Products
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_active ON products(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Product Variants
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(tenant_id, sku);

-- Stock Levels
CREATE INDEX idx_stock_tenant ON stock_levels(tenant_id);
CREATE INDEX idx_stock_store_product ON stock_levels(store_id, product_id);
CREATE INDEX idx_stock_low ON stock_levels(tenant_id) WHERE quantity <= 0;

-- Stock Movements
CREATE INDEX idx_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_created ON stock_movements(created_at);

-- Customers
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name));

-- Sales
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_number ON sales(tenant_id, sale_number);

-- Orders
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(tenant_id, order_number);

-- Riders
CREATE INDEX idx_riders_tenant ON riders(tenant_id);
CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_riders_active ON riders(tenant_id, is_active) WHERE deleted_at IS NULL;

-- Delivery Assignments
CREATE INDEX idx_assignments_order ON delivery_assignments(order_id);
CREATE INDEX idx_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX idx_assignments_status ON delivery_assignments(status);

-- Notifications
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Sync Queue
CREATE INDEX idx_sync_tenant ON sync_queue(tenant_id);
CREATE INDEX idx_sync_status ON sync_queue(status);
CREATE INDEX idx_sync_pending ON sync_queue(tenant_id, status) WHERE status = 'pending';

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_date TEXT;
BEGIN
    v_date := to_char(now(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO v_count
    FROM sales
    WHERE tenant_id = p_tenant_id
    AND created_at::date = CURRENT_DATE;
    
    RETURN 'S-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_date TEXT;
BEGIN
    v_date := to_char(now(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO v_count
    FROM orders
    WHERE tenant_id = p_tenant_id
    AND created_at::date = CURRENT_DATE;
    
    RETURN 'O-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Update stock on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_quantity INTEGER;
BEGIN
    -- Only process completed sales
    IF NEW.status = 'completed' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            v_product_id := (item->>'product_id')::UUID;
            v_variant_id := (item->>'variant_id')::UUID;
            v_quantity := (item->>'quantity')::INTEGER;
            
            -- Update stock level
            UPDATE stock_levels
            SET quantity = quantity - v_quantity,
                updated_at = now()
            WHERE store_id = NEW.store_id
            AND product_id = v_product_id
            AND (variant_id = v_variant_id OR (variant_id IS NULL AND v_variant_id IS NULL));
            
            -- Record movement
            INSERT INTO stock_movements (
                tenant_id, store_id, product_id, variant_id, user_id,
                type, quantity, reference_type, reference_id
            ) VALUES (
                NEW.tenant_id, NEW.store_id, v_product_id, v_variant_id, NEW.user_id,
                'out', v_quantity, 'sale', NEW.id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Updated_at triggers
CREATE TRIGGER update_platform_config_updated_at
    BEFORE UPDATE ON platform_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stock_levels_updated_at
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_riders_updated_at
    BEFORE UPDATE ON riders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_delivery_assignments_updated_at
    BEFORE UPDATE ON delivery_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_delivery_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Stock update on sale
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_ghs, price_ngn, features, limits, sort_order) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0, 
 '["Basic POS", "Up to 50 products", "1 staff member", "Email support"]',
 '{"products": 50, "staff": 1, "stores": 1}', 1),
 
('Starter', 'starter', 'For growing businesses', 49.99, 4999, 
 '["Full POS features", "Up to 500 products", "3 staff members", "Inventory management", "Basic reports", "SMS notifications", "Priority support"]',
 '{"products": 500, "staff": 3, "stores": 1}', 2),
 
('Business', 'business', 'For established businesses', 99.99, 9999, 
 '["Everything in Starter", "Unlimited products", "10 staff members", "Multi-store support", "Advanced reports", "Online ordering", "WhatsApp notifications", "Delivery management", "Phone support"]',
 '{"products": -1, "staff": 10, "stores": 3}', 3),
 
('Enterprise', 'enterprise', 'For large operations', 249.99, 24999, 
 '["Everything in Business", "Unlimited staff", "Unlimited stores", "API access", "Custom integrations", "Dedicated account manager", "24/7 support"]',
 '{"products": -1, "staff": -1, "stores": -1}', 4);

-- Insert default platform config
INSERT INTO platform_config (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable maintenance mode'),
('allowed_countries', '["GH", "NG"]', 'Countries where the platform operates'),
('default_trial_days', '14', 'Default trial period in days'),
('sms_providers', '{"GH": "mnotify", "NG": "termii"}', 'SMS providers by country'),
('tax_rates', '{"GH": 15, "NG": 7.5}', 'Default tax rates by country');

-- ==========================================
-- RLS POLICIES (DISABLED FOR NOW)
-- Will enable after testing
-- ==========================================

-- Enable RLS on all tables (but no policies yet - will add simple ones later)
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- etc...

-- ==========================================
-- DONE!
-- ==========================================
