-- ============================================
-- WAREHOUSEPOS DATABASE SCHEMA
-- Focused on Current POS Features
-- Ghana & Nigeria First
-- ============================================
-- This schema supports:
-- 1. Multi-tenant architecture (tenants, stores, users)
-- 2. Product catalog (categories, products, variants)
-- 3. Inventory management (stock_levels, stock_movements)
-- 4. Customer management (customers)
-- 5. Point of Sale (sales, sale_items)
-- ============================================

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- DROP ALL EXISTING TABLES (clean slate)
-- ==========================================
-- Drop in reverse dependency order
DROP TABLE IF EXISTS phone_otps CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop unused tables from old schema
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS delivery_assignments CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS platform_config CASCADE;

-- ==========================================
-- DROP AND RECREATE ENUMS
-- ==========================================
DROP TYPE IF EXISTS country_code CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;
DROP TYPE IF EXISTS stock_movement_type CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;

CREATE TYPE country_code AS ENUM ('GH', 'NG');
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'momo', 'transfer', 'credit');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'voided', 'refunded');
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'return');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ==========================================
-- CORE TABLES
-- ==========================================

-- 1. TENANTS (Business accounts)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Business info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    
    -- Country & localization
    country country_code NOT NULL DEFAULT 'GH',
    currency TEXT NOT NULL DEFAULT 'GHS',
    timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
    phone_country_code TEXT NOT NULL DEFAULT '+233',
    default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Business type (for category suggestions)
    business_type TEXT,
    
    -- Contact
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    
    -- Subscription
    subscription_status subscription_status NOT NULL DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_ends_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STORES (Locations/branches within a tenant)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    
    -- Settings
    is_main BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USERS (Staff members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Nullable during registration
    
    -- Link to Supabase Auth
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Authentication
    pin_hash TEXT, -- For quick POS login (4-6 digit PIN)
    
    -- Role
    role user_role NOT NULL DEFAULT 'cashier',
    
    -- Assignment
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(store_id, name)
);

-- 5. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT NOT NULL,
    barcode TEXT,
    
    -- Pricing (using 'price' as primary column name to match queries)
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    price DECIMAL(12,2) NOT NULL,
    
    -- Tax
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Inventory
    unit TEXT NOT NULL DEFAULT 'piece',
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    
    -- Media
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(store_id, sku)
);

-- 6. PRODUCT VARIANTS
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    
    -- Pricing
    cost_price DECIMAL(12,2),
    price DECIMAL(12,2) NOT NULL,
    
    -- Options (e.g., {"size": "Large", "color": "Red"})
    options JSONB NOT NULL DEFAULT '{}',
    
    -- Media
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. STOCK LEVELS (per store per product)
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    
    -- Current quantity
    quantity INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(store_id, product_id, variant_id)
);

-- 8. STOCK MOVEMENTS (audit trail for inventory changes)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    
    -- Movement info
    type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL, -- Positive for in, negative for out
    
    -- Reference (e.g., sale_id, adjustment note)
    reference_type TEXT, -- 'sale', 'adjustment', 'transfer', etc.
    reference_id UUID,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    
    -- Financials
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Stats
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_order_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SALES (POS transactions)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Sale info
    sale_number TEXT,
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_type discount_type,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_status payment_status NOT NULL DEFAULT 'paid',
    payment_reference TEXT,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    change_given DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Item count (denormalized for quick display)
    items_count INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    status sale_status NOT NULL DEFAULT 'completed',
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SALE ITEMS (line items for each sale)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Item details
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_country ON tenants(country);

-- Stores
CREATE INDEX idx_stores_tenant ON stores(tenant_id);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- Categories
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_categories_active ON categories(store_id, is_active);

-- Products
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(store_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(store_id, is_active);

-- Product Variants
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- Stock Levels
CREATE INDEX idx_stock_store ON stock_levels(store_id);
CREATE INDEX idx_stock_product ON stock_levels(product_id);

-- Stock Movements
CREATE INDEX idx_movements_store ON stock_movements(store_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_created ON stock_movements(created_at);

-- Customers
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Sales
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);

-- Sale Items
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
    v_date TEXT;
BEGIN
    IF NEW.sale_number IS NULL THEN
        v_date := to_char(NOW(), 'YYYYMMDD');
        SELECT COUNT(*) + 1 INTO v_count
        FROM sales
        WHERE store_id = NEW.store_id
        AND created_at::date = CURRENT_DATE;
        
        NEW.sale_number := 'S-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update stock after sale
CREATE OR REPLACE FUNCTION update_stock_on_sale_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduce stock when sale item is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE stock_levels
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE store_id = (SELECT store_id FROM sales WHERE id = NEW.sale_id)
        AND product_id = NEW.product_id
        AND (variant_id = NEW.variant_id OR (variant_id IS NULL AND NEW.variant_id IS NULL));
        
        -- Record stock movement
        INSERT INTO stock_movements (
            tenant_id, store_id, product_id, variant_id,
            type, quantity, reference_type, reference_id
        )
        SELECT 
            s.tenant_id, s.store_id, NEW.product_id, NEW.variant_id,
            'out', -NEW.quantity, 'sale', NEW.sale_id
        FROM sales s WHERE s.id = NEW.sale_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update customer stats after sale
CREATE OR REPLACE FUNCTION update_customer_stats_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE customers
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total,
            last_order_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RPC function to decrement stock (called from frontend)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$;

-- RPC function to increment stock
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE stock_levels
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
END;
$$;

-- Grant execute on RPC functions
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO authenticated;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Updated_at triggers
CREATE TRIGGER tr_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_stock_levels_updated_at
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sale number generation
CREATE TRIGGER tr_generate_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION generate_sale_number();

-- Stock update on sale item
CREATE TRIGGER tr_update_stock_on_sale_item
    AFTER INSERT ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale_item();

-- Customer stats update on sale
CREATE TRIGGER tr_update_customer_stats
    AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_sale();

-- ==========================================
-- AUTHENTICATION: Phone OTPs table
-- ==========================================

-- Table for storing OTP codes (used by Edge Functions for mNotify/Termii)
CREATE TABLE phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration', 'pin_reset')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for phone_otps
CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON phone_otps(expires_at);

-- Cleanup function for expired OTPs
DROP FUNCTION IF EXISTS cleanup_expired_otps();
CREATE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTIONS FOR RLS
-- ==========================================

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM users
    WHERE auth_id = auth.uid()
    LIMIT 1;
    
    RETURN v_tenant_id;
END;
$$;

-- Function to check if current user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role = 'owner'
    );
END;
$$;

-- Function to check if current user is owner or manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role IN ('owner', 'manager')
    );
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;

-- ==========================================
-- TENANTS POLICIES
-- ==========================================

-- Authenticated users can create tenants during registration
CREATE POLICY "Allow insert for authenticated" ON tenants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own tenant
CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

-- Owners can update their tenant
CREATE POLICY "Owners can update own tenant" ON tenants
    FOR UPDATE USING (
        id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- ==========================================
-- STORES POLICIES
-- ==========================================

-- Authenticated users can create stores (during registration)
CREATE POLICY "Allow insert for authenticated" ON stores
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view stores in their tenant
CREATE POLICY "Users can view tenant stores" ON stores
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

-- Owners can manage stores
CREATE POLICY "Owners can manage stores" ON stores
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    );

-- ==========================================
-- USERS POLICIES
-- ==========================================

-- Authenticated users can create their own profile (during registration)
CREATE POLICY "Allow users to insert own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- Users can view other users in same tenant
CREATE POLICY "Users can view same tenant users" ON users
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- Owners can insert new users in their tenant
CREATE POLICY "Owners can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND tenant_id = users.tenant_id 
            AND role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- CATEGORIES POLICIES
-- ==========================================

-- Users can view categories in their tenant's stores
CREATE POLICY "Users can view tenant categories" ON categories
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Managers can manage categories
CREATE POLICY "Managers can manage categories" ON categories
    FOR ALL USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid() AND u.role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- PRODUCTS POLICIES
-- ==========================================

-- Users can view products in their tenant's stores
CREATE POLICY "Users can view tenant products" ON products
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Managers can manage products
CREATE POLICY "Managers can manage products" ON products
    FOR ALL USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid() AND u.role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- PRODUCT VARIANTS POLICIES
-- ==========================================

-- Users can view variants in their tenant's products
CREATE POLICY "Users can view tenant variants" ON product_variants
    FOR SELECT USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN stores s ON s.id = p.store_id
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Managers can manage variants
CREATE POLICY "Managers can manage variants" ON product_variants
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN stores s ON s.id = p.store_id
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid() AND u.role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- STOCK LEVELS POLICIES
-- ==========================================

-- Users can view stock in their stores
CREATE POLICY "Users can view stock" ON stock_levels
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Managers can manage stock
CREATE POLICY "Managers can manage stock" ON stock_levels
    FOR ALL USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid() AND u.role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- STOCK MOVEMENTS POLICIES
-- ==========================================

-- Users can view movements in their stores
CREATE POLICY "Users can view movements" ON stock_movements
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- All users can insert movements (sales, adjustments)
CREATE POLICY "Users can insert movements" ON stock_movements
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- ==========================================
-- CUSTOMERS POLICIES
-- ==========================================

-- Users can view customers in their stores
CREATE POLICY "Users can view customers" ON customers
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- All users can manage customers
CREATE POLICY "Users can manage customers" ON customers
    FOR ALL USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- ==========================================
-- SALES POLICIES
-- ==========================================

-- Users can view sales in their stores
CREATE POLICY "Users can view sales" ON sales
    FOR SELECT USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- All users can create sales
CREATE POLICY "Users can create sales" ON sales
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Managers can update sales
CREATE POLICY "Managers can update sales" ON sales
    FOR UPDATE USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON u.tenant_id = s.tenant_id
            WHERE u.auth_id = auth.uid() AND u.role IN ('owner', 'manager')
        )
    );

-- ==========================================
-- SALE ITEMS POLICIES
-- ==========================================

-- Users can view sale items for sales they can see
CREATE POLICY "Users can view sale items" ON sale_items
    FOR SELECT USING (
        sale_id IN (
            SELECT id FROM sales WHERE store_id IN (
                SELECT s.id FROM stores s
                JOIN users u ON u.tenant_id = s.tenant_id
                WHERE u.auth_id = auth.uid()
            )
        )
    );

-- All users can create sale items
CREATE POLICY "Users can create sale items" ON sale_items
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT id FROM sales WHERE store_id IN (
                SELECT s.id FROM stores s
                JOIN users u ON u.tenant_id = s.tenant_id
                WHERE u.auth_id = auth.uid()
            )
        )
    );

-- ==========================================
-- PHONE OTPS POLICIES (Service role only)
-- ==========================================

-- Only service_role can manage OTPs (Edge Functions)
CREATE POLICY "Service role can manage OTPs" ON phone_otps
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- DONE!
-- Schema is ready for current POS features.
-- ==========================================
