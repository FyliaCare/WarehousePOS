// Execute database schema using direct PostgreSQL connection
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.azbheakmjwtslgmeuioj:iKwqsQOtiKkgAInV@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

async function executeSchema() {
  console.log('🚀 Connecting to Supabase PostgreSQL database...\n');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema...\n');
    
    // Split by semicolons but handle $$ blocks
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    
    for (const line of schema.split('\n')) {
      if (line.includes('$$')) {
        inDollarQuote = !inDollarQuote;
      }
      current += line + '\n';
      
      if (!inDollarQuote && line.trim().endsWith(';')) {
        const stmt = current.trim();
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        current = '';
      }
    }

    let successCount = 0;
    let errorCount = 0;

    for (const stmt of statements) {
      if (stmt.trim().length < 5) continue;
      
      try {
        await client.query(stmt);
        successCount++;
        // Show progress for CREATE statements
        if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE INDEX') || stmt.includes('CREATE POLICY')) {
          const match = stmt.match(/CREATE\s+(?:TABLE|INDEX|POLICY)\s+(?:IF NOT EXISTS\s+)?["\']?(\w+)/i);
          if (match) {
            console.log(`  ✓ Created: ${match[1]}`);
          }
        }
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.log(`  ⚠ Warning: ${err.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }

    console.log(`\n✅ Schema execution complete!`);
    console.log(`   ${successCount} statements executed successfully`);
    if (errorCount > 0) {
      console.log(`   ${errorCount} warnings (may be expected)`);
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.log('\nTrying alternative connection...');
    
    // Try direct connection
    const client2 = new Client({
      host: 'db.azbheakmjwtslgmeuioj.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'iKwqsQOtiKkgAInV',
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client2.connect();
      console.log('✅ Connected via direct connection!\n');
      
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await client2.query(schema);
      console.log('✅ Schema executed successfully!');
      await client2.end();
    } catch (err2) {
      console.error('❌ Error:', err2.message);
    }
  } finally {
    await client.end();
  }
}

executeSchema();
