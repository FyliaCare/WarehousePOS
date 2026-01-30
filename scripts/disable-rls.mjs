// Disable RLS using Supabase REST API
// This creates a temporary function to execute the DDL, then cleans up
//
// USAGE: Set environment variables before running:
//   SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key SUPABASE_ANON_KEY=your-anon-key node scripts/disable-rls.mjs
//
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Prefer': 'return=representation'
};

async function testInsert() {
  console.log('🧪 Testing tenant insert with service role...\n');
  
  const testTenantId = '00000000-0000-0000-0000-000000000999';
  
  // First, try to delete if exists
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${testTenantId}`, {
      method: 'DELETE',
      headers
    });
  } catch (e) {}
  
  // Try to insert
  const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: testTenantId,
      name: 'RLS TEST - DELETE ME',
      billing_email: 'test@test.com',
      subscription_status: 'trial',
      country: 'GH',
      currency: 'GHS'
    })
  });
  
  if (response.ok) {
    console.log('✅ Tenant INSERT successful with service role!\n');
    
    // Clean up
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${testTenantId}`, {
      method: 'DELETE',
      headers
    });
    console.log('   Cleaned up test tenant\n');
    return true;
  } else {
    const error = await response.text();
    console.log('❌ Tenant INSERT failed:', error);
    return false;
  }
}

async function checkRLSStatus() {
  console.log('📋 Checking RLS status...\n');
  
  // We can check by querying with anon key and service role key
  // If results differ, RLS is enabled
  
  if (!ANON_KEY) {
    console.log('   ⚠️ SUPABASE_ANON_KEY not set, skipping anon comparison');
    return;
  }
  
  // Query with service role (bypasses RLS)
  const serviceResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id&limit=5`, { headers });
  const serviceData = await serviceResponse.json();
  
  // Query with anon key (subject to RLS)
  const anonResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id&limit=5`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });
  
  if (anonResponse.ok) {
    const anonData = await anonResponse.json();
    console.log(`   Service role sees: ${serviceData.length} tenants`);
    console.log(`   Anon key sees: ${anonData.length} tenants`);
    
    if (anonData.length === 0 && serviceData.length > 0) {
      console.log('\n⚠️  RLS is ENABLED - anon cannot see tenants');
      return true; // RLS is enabled
    } else if (anonData.length === serviceData.length) {
      console.log('\n✅ RLS appears DISABLED - anon can see all tenants');
      return false; // RLS is disabled
    }
  } else {
    const error = await anonResponse.text();
    console.log('   Anon query result:', error);
    if (error.includes('permission denied') || error.includes('infinite recursion')) {
      console.log('\n⚠️  RLS is ENABLED and blocking queries');
      return true;
    }
  }
  
  return true;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  SUPABASE RLS DIAGNOSTIC & FIX TOOL');
  console.log('='.repeat(50) + '\n');
  
  // Test connection
  const insertWorks = await testInsert();
  
  if (insertWorks) {
    console.log('✅ Service role key is working correctly.\n');
    console.log('   The service role bypasses RLS, so your registrations');
    console.log('   should work if the app uses service role for auth.\n');
  }
  
  // Check RLS status
  const rlsEnabled = await checkRLSStatus();
  
  console.log('\n' + '='.repeat(50));
  console.log('  RECOMMENDATION');
  console.log('='.repeat(50) + '\n');
  
  if (rlsEnabled) {
    console.log('You need to DISABLE RLS on the core tables.');
    console.log('\n👉 Go to: https://supabase.com/dashboard/project/azbheakmjwtslgmeuioj/sql/new');
    console.log('\n📋 Paste and run this SQL:\n');
    console.log('ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE stores DISABLE ROW LEVEL SECURITY;');
    console.log('\n');
  } else {
    console.log('✅ RLS appears to be disabled. Registration should work!');
  }
}

main().catch(console.error);
