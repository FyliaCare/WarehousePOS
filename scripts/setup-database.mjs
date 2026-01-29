import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.azbheakmjwtslgmeuioj',
  password: 'iKwqsQOtiKkgAInV',
  ssl: { rejectUnauthorized: false }
});

const schema = `
-- ==========================================
-- WAREHOUSEPOS DATABASE SCHEMA
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TENANTS (Multi-tenant root)
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
  currency VARCHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency IN ('GHS', 'NGN')),
  subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  subscription_plan VARCHAR(50),
  trial_ends_at TIMESTAMPTZ,
  billing_email VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- STORES
-- ==========================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- USERS (linked to Supabase Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'manager', 'cashier', 'rider')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT '📦',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(store_id, sku)
);

-- ==========================================
-- STOCK LEVELS
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- ==========================================
-- STOCK MOVEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CUSTOMERS
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- SALES
-- ==========================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  sale_number VARCHAR(50) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  change_given DECIMAL(12, 2) DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'momo', 'transfer', 'credit')),
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'voided', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, sale_number)
);

-- ==========================================
-- SALE ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ORDERS (for delivery)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  order_number VARCHAR(50) NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  subtotal DECIMAL(12, 2) NOT NULL,
  delivery_fee DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'momo', 'transfer', 'credit')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_address TEXT,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  delivery_notes TEXT,
  scheduled_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, order_number)
);

-- ==========================================
-- ORDER ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- RIDERS
-- ==========================================
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'van')),
  vehicle_number VARCHAR(50),
  license_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==========================================
-- DELIVERY ASSIGNMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES riders(id),
  status VARCHAR(30) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(store_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_levels_store ON stock_levels(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_riders_store ON riders(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider ON delivery_assignments(rider_id);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get user's store_id
CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = get_user_tenant_id());

-- Stores: Users can only see stores in their tenant
CREATE POLICY store_tenant_isolation ON stores
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- Users: Users can only see users in their tenant
CREATE POLICY user_tenant_isolation ON users
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- Categories: Users can only see categories in their store
CREATE POLICY category_store_isolation ON categories
  FOR ALL USING (store_id = get_user_store_id());

-- Products: Users can only see products in their store
CREATE POLICY product_store_isolation ON products
  FOR ALL USING (store_id = get_user_store_id());

-- Stock Levels: Users can only see stock in their store
CREATE POLICY stock_level_store_isolation ON stock_levels
  FOR ALL USING (store_id = get_user_store_id());

-- Stock Movements: Users can only see movements in their store
CREATE POLICY stock_movement_store_isolation ON stock_movements
  FOR ALL USING (store_id = get_user_store_id());

-- Customers: Users can only see customers in their tenant
CREATE POLICY customer_tenant_isolation ON customers
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- Sales: Users can only see sales in their store
CREATE POLICY sale_store_isolation ON sales
  FOR ALL USING (store_id = get_user_store_id());

-- Sale Items: Users can only see sale items for sales in their store
CREATE POLICY sale_item_store_isolation ON sale_items
  FOR ALL USING (sale_id IN (SELECT id FROM sales WHERE store_id = get_user_store_id()));

-- Orders: Users can only see orders in their store
CREATE POLICY order_store_isolation ON orders
  FOR ALL USING (store_id = get_user_store_id());

-- Order Items: Users can only see order items for orders in their store
CREATE POLICY order_item_store_isolation ON order_items
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE store_id = get_user_store_id()));

-- Riders: Users can only see riders in their store
CREATE POLICY rider_store_isolation ON riders
  FOR ALL USING (store_id = get_user_store_id());

-- Delivery Assignments: Users can see assignments for orders in their store
CREATE POLICY delivery_assignment_store_isolation ON delivery_assignments
  FOR ALL USING (order_id IN (SELECT id FROM orders WHERE store_id = get_user_store_id()));

-- ==========================================
-- TRIGGERS for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Schema created successfully!' as result;
`;

async function setupDatabase() {
  console.log('Connecting to Supabase database...');
  
  try {
    await client.connect();
    console.log('Connected! Running schema...');
    
    const result = await client.query(schema);
    console.log('Schema executed successfully!');
    console.log(result);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('Some objects already exist, which is fine.');
    }
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

setupDatabase();
