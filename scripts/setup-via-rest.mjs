// Setup script using Supabase REST API with service_role key
const SUPABASE_URL = 'https://azbheakmjwtslgmeuioj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YmhlYWttand0c2xnbWV1aW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNzM2MiwiZXhwIjoyMDg1MDkzMzYyfQ.n3x2EcJ5fVrmTZB3BXApxrfThcpXz_OpmoSKkc82bpM';

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL Error: ${response.status} - ${text}`);
  }
  
  return response.json();
}

// First, create the exec_sql function that allows us to run arbitrary SQL
const createExecSqlFunction = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  RETURN '{"success": true}'::JSONB;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
`;

// Schema SQL statements - split into individual statements
const schemaStatements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  
  // Tenants
  `CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'GH' CHECK (country IN ('GH', 'NG')),
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS' CHECK (currency IN ('GHS', 'NGN')),
    subscription_status VARCHAR(20) DEFAULT 'trial',
    subscription_plan VARCHAR(50),
    trial_ends_at TIMESTAMPTZ,
    billing_email VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  
  // Stores
  `CREATE TABLE IF NOT EXISTS stores (
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
  )`,
  
  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'cashier',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  
  // Categories
  `CREATE TABLE IF NOT EXISTS categories (
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
  )`,
  
  // Products
  `CREATE TABLE IF NOT EXISTS products (
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
  )`,
  
  // Stock Levels
  `CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, product_id)
  )`,
  
  // Stock Movements
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  // Customers
  `CREATE TABLE IF NOT EXISTS customers (
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
  )`,
  
  // Sales
  `CREATE TABLE IF NOT EXISTS sales (
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
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'paid',
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, sale_number)
  )`,
  
  // Sale Items
  `CREATE TABLE IF NOT EXISTS sale_items (
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
  )`,
  
  // Orders
  `CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    delivery_fee DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(30) DEFAULT 'pending',
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
  )`,
  
  // Order Items
  `CREATE TABLE IF NOT EXISTS order_items (
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
  )`,
  
  // Riders
  `CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    vehicle_type VARCHAR(20),
    vehicle_number VARCHAR(50),
    license_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'offline',
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  
  // Delivery Assignments
  `CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id),
    status VARCHAR(30) DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT
  )`,
];

async function setupDatabaseViaRest() {
  console.log('Setting up database via Supabase Management API...');
  
  for (let i = 0; i < schemaStatements.length; i++) {
    const stmt = schemaStatements[i];
    const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || `statement ${i + 1}`;
    
    console.log(`Creating ${tableName}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: stmt }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`  Note: ${text.substring(0, 100)}`);
      } else {
        console.log(`  ✓ Created ${tableName}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\\nDatabase setup complete!');
}

setupDatabaseViaRest();
