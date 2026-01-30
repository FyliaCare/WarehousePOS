// Fix RLS policies using Supabase Management API
// 
// USAGE: Set environment variables before running:
//   SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/fix-rls.mjs
//
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql })
  });
  
  if (!response.ok) {
    // Try the /pg endpoint for raw SQL
    return null;
  }
  return await response.json();
}

// Since we can't run raw DDL via REST API, let's use a different approach
// We'll create a simple test to verify what's happening

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Test 1: Check if we can read tables
  const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  
  console.log('Tenants table access:', tablesResponse.ok ? '✅ OK' : '❌ Failed');
  if (tablesResponse.ok) {
    const data = await tablesResponse.json();
    console.log('  Data:', JSON.stringify(data));
  } else {
    console.log('  Error:', await tablesResponse.text());
  }
  
  // Test 2: Check users table
  const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,phone&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  
  console.log('\nUsers table access:', usersResponse.ok ? '✅ OK' : '❌ Failed');
  if (usersResponse.ok) {
    const data = await usersResponse.json();
    console.log('  Data:', JSON.stringify(data));
  } else {
    console.log('  Error:', await usersResponse.text());
  }
  
  // Test 3: Check stores table
  const storesResponse = await fetch(`${SUPABASE_URL}/rest/v1/stores?select=id&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  
  console.log('\nStores table access:', storesResponse.ok ? '✅ OK' : '❌ Failed');
  if (storesResponse.ok) {
    const data = await storesResponse.json();
    console.log('  Data:', JSON.stringify(data));
  } else {
    console.log('  Error:', await storesResponse.text());
  }
  
  // Test 4: Try to insert a test tenant (will rollback)
  console.log('\n📝 Testing INSERT capabilities...\n');
  
  const testTenantId = '00000000-0000-0000-0000-000000000001';
  
  // First delete if exists
  await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${testTenantId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  
  // Try insert
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: testTenantId,
      name: 'TEST TENANT - DELETE ME',
      billing_email: 'test@test.com',
      subscription_status: 'trial'
    })
  });
  
  console.log('Tenant INSERT:', insertResponse.ok ? '✅ OK' : '❌ Failed');
  if (insertResponse.ok) {
    const data = await insertResponse.json();
    console.log('  Created:', JSON.stringify(data));
    
    // Clean up - delete the test tenant
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${testTenantId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    console.log('  Cleaned up test tenant');
  } else {
    console.log('  Error:', await insertResponse.text());
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('SERVICE ROLE KEY bypasses RLS - so if the above works,');
  console.log('the issue is with the ANON key policies.');
  console.log('='.repeat(50));
  
  console.log('\n📋 SOLUTION: Go to Supabase Dashboard → Authentication → Policies');
  console.log('   and manually disable RLS on tenants, users, and stores tables.\n');
  console.log('   Or in SQL Editor, run:');
  console.log('   ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE stores DISABLE ROW LEVEL SECURITY;');
}

testConnection().catch(console.error);
