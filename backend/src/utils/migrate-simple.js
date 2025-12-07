const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting Simple Notepad SaaS migration...');

    // Drop old tables if exists (one by one for safety)
    await client.query('DROP TABLE IF EXISTS tasks CASCADE');
    await client.query('DROP TABLE IF EXISTS workspaces CASCADE');
    await client.query('DROP TABLE IF EXISTS notes CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP TABLE IF EXISTS organizations CASCADE');
    console.log('✓ Old tables dropped');

    // Create Users table (very simple)
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create Notes table (very simple)
    await client.query(`
      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled Note',
        content TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Notes table created');

    // Create indexes
    await client.query(`
      CREATE INDEX idx_notes_user ON notes(user_id);
      CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
    `);
    console.log('✓ Indexes created');

    console.log('\n✅ Simple Notepad SaaS migration completed successfully!');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    client.release();
    await pool.end();
    process.exit(1);
  }
};

createTables();
