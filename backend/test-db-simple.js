const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function test() {
  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✓ Connected successfully!');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('✓ Query executed:', result.rows[0]);
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
