// Database setup script for WarehousePOS
// Run with: node scripts/setup-database.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azbheakmjwtslgmeuioj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YmhlYWttand0c2xnbWV1aW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNzM2MiwiZXhwIjoyMDg1MDkzMzYyfQ.n3x2EcJ5fVrmTZB3BXApxrfThcpXz_OpmoSKkc82bpM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up WarehousePOS database...\n');

  // We'll create tables using Supabase's SQL editor API
  // For now, let's verify connection and check existing tables
  
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Tables do not exist yet. Please run the SQL schema in Supabase Dashboard.');
    console.log('\n📋 Go to: https://supabase.com/dashboard/project/azbheakmjwtslgmeuioj/sql/new');
    console.log('Then paste and run the SQL from: scripts/schema.sql\n');
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Database tables already exist!');
    console.log('Data:', data);
  }
}

setupDatabase();
