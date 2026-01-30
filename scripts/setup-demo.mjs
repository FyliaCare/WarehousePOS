// Setup database using Supabase client with service role
// 
// USAGE: Set environment variables before running:
//   SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/setup-demo.mjs
//
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📋 Set these in your .env file or pass them as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createDemoData() {
  console.log('🚀 Creating demo tenant and store...\n');

  // Create a test tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Demo Business',
      slug: 'demo-business',
      country: 'GH',
      currency: 'GHS',
      timezone: 'Africa/Accra',
      subscription_status: 'trial',
      subscription_plan: 'starter'
    })
    .select()
    .single();

  if (tenantError) {
    console.log('Tenant error:', tenantError.message);
    
    // Try to get existing tenant
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select()
      .eq('slug', 'demo-business')
      .single();
    
    if (existingTenant) {
      console.log('✅ Using existing tenant:', existingTenant.name);
      return existingTenant;
    }
    return null;
  }

  console.log('✅ Created tenant:', tenant.name);

  // Create a store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      tenant_id: tenant.id,
      name: 'Main Store',
      code: 'MAIN',
      address: '123 Main Street',
      city: 'Accra'
    })
    .select()
    .single();

  if (storeError) {
    console.log('Store error:', storeError.message);
  } else {
    console.log('✅ Created store:', store.name);
  }

  return tenant;
}

async function main() {
  // First test connection
  const { data, error } = await supabase.from('tenants').select('count');
  
  if (error) {
    console.log('❌ Tables do not exist. You need to run the SQL schema first.');
    console.log('\n📋 Please go to Supabase Dashboard → SQL Editor and run the schema.sql');
    console.log('Error details:', error.message);
  } else {
    console.log('✅ Database tables exist!');
    await createDemoData();
  }
}

main();
