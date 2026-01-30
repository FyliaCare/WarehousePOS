// Setup dev mode data in Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file manually
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch {
    return {};
  }
}

// Load env from pos app
const env = loadEnv(resolve(__dirname, '../apps/pos/.env'));

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEV_STORE_ID = '00000000-0000-0000-0000-000000000002';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000003';

async function setupDevData() {
  console.log('Setting up dev data...');
  console.log('Supabase URL:', supabaseUrl);

  // First, let's see what columns exist
  console.log('\n0. Checking table schemas...');
  
  const { data: tenantCols } = await supabase.from('tenants').select('*').limit(1);
  console.log('Tenant columns:', tenantCols ? Object.keys(tenantCols[0] || {}) : 'No data');
  
  const { data: storeCols } = await supabase.from('stores').select('*').limit(1);
  console.log('Store columns:', storeCols ? Object.keys(storeCols[0] || {}) : 'No data');
  
  const { data: userCols } = await supabase.from('users').select('*').limit(1);
  console.log('User columns:', userCols ? Object.keys(userCols[0] || {}) : 'No data');

  // Check delivery_zones
  const { data: zoneCols, error: zoneError } = await supabase.from('delivery_zones').select('*').limit(1);
  if (zoneError) {
    console.log('Delivery zones error:', zoneError);
    console.log('\nTrying to create a test zone...');
    
    // Try to insert a test zone
    const { data: testZone, error: insertError } = await supabase
      .from('delivery_zones')
      .insert({
        tenant_id: DEV_TENANT_ID,
        store_id: DEV_STORE_ID,
        name: 'Test Zone',
        delivery_fee: 5.00,
        min_order_amount: 20.00,
        estimated_time_minutes: 30,
        color: '#10B981',
        is_active: true,
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('Insert zone error:', insertError);
    } else {
      console.log('Test zone created:', testZone);
    }
  } else {
    console.log('Delivery zone columns:', zoneCols ? Object.keys(zoneCols[0] || {}) : 'Table empty/exists');
  }

  // Create delivery_zones table if not exists
  console.log('\n1. Creating delivery_zones table...');
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        store_id UUID,
        name TEXT NOT NULL,
        description TEXT,
        boundary JSONB,
        radius_km DECIMAL(10,2),
        delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
        min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        free_delivery_threshold DECIMAL(10,2),
        estimated_time_minutes INTEGER NOT NULL DEFAULT 45,
        color TEXT DEFAULT '#10B981',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
  });
  
  if (tableError) {
    console.log('RPC not available, trying direct inserts...');
  }

  // Insert dev tenant - try minimal columns
  console.log('\n2. Creating dev tenant...');
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .upsert({
      id: DEV_TENANT_ID,
      name: 'Dev Business',
      slug: 'dev-business',
    }, { onConflict: 'id' })
    .select();

  if (tenantError) {
    console.error('Tenant error:', tenantError);
  } else {
    console.log('Tenant created:', tenantData);
  }

  // Insert dev store - try minimal columns
  console.log('\n3. Creating dev store...');
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .upsert({
      id: DEV_STORE_ID,
      tenant_id: DEV_TENANT_ID,
      name: 'Dev Store',
    }, { onConflict: 'id' })
    .select();

  if (storeError) {
    console.error('Store error:', storeError);
  } else {
    console.log('Store created:', storeData);
  }

  // Insert dev user - try minimal columns
  console.log('\n4. Creating dev user...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert({
      id: DEV_USER_ID,
      tenant_id: DEV_TENANT_ID,
      store_id: DEV_STORE_ID,
      name: 'Dev Admin',
      phone: '+233000000000',
    }, { onConflict: 'id' })
    .select();

  if (userError) {
    console.error('User error:', userError);
  } else {
    console.log('User created:', userData);
  }

  // Verify the data
  console.log('\n5. Verifying...');
  const { data: stores, error: storeVerifyErr } = await supabase
    .from('stores')
    .select('id, name, settings')
    .eq('id', DEV_STORE_ID);
  console.log('Dev store:', stores, 'Error:', storeVerifyErr);
  
  // Update store settings with location
  console.log('\n6. Setting store location...');
  const { data: updatedStore, error: updateErr } = await supabase
    .from('stores')
    .update({
      settings: {
        location: { lat: 5.6037, lng: -0.1870 }
      }
    })
    .eq('id', DEV_STORE_ID)
    .select();
  console.log('Updated store:', updatedStore, 'Error:', updateErr);
  
  // Check zones
  console.log('\n7. Checking zones...');
  const { data: zones, error: zonesErr } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('store_id', DEV_STORE_ID);
  console.log('Zones:', zones, 'Error:', zonesErr);

  console.log('\nDev data setup complete!');
  console.log('\nDEV IDs to use:');
  console.log('  Tenant ID:', DEV_TENANT_ID);
  console.log('  Store ID:', DEV_STORE_ID);
  console.log('  User ID:', DEV_USER_ID);
}

setupDevData().catch(console.error);
