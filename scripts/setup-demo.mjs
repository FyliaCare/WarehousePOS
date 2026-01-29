// Setup database using Supabase client with service role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azbheakmjwtslgmeuioj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YmhlYWttand0c2xnbWV1aW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNzM2MiwiZXhwIjoyMDg1MDkzMzYyfQ.n3x2EcJ5fVrmTZB3BXApxrfThcpXz_OpmoSKkc82bpM';

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
    console.log('\n📋 Please go to: https://supabase.com/dashboard/project/azbheakmjwtslgmeuioj/sql/new');
    console.log('And paste the contents of scripts/schema.sql\n');
    console.log('Error details:', error.message);
  } else {
    console.log('✅ Database tables exist!');
    await createDemoData();
  }
}

main();
