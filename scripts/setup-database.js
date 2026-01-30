// Database setup script for WarehousePOS
// 
// USAGE: Set environment variables before running:
//   SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/setup-database.js
//
// Or create a .env file in the project root with these variables

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
