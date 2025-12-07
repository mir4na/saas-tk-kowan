const pool = require('../config/database');

const createTables = async () => {
  try {
    console.log('Starting NoteVault database migration...');

    // Drop old tables if exists
    await pool.query(`
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS workspaces CASCADE;
      DROP TABLE IF EXISTS ipfs_pins CASCADE;
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS folders CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS organizations CASCADE;
    `);
    console.log('✓ Old tables dropped');

    // Create Users table (simplified - no organizations)
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        theme VARCHAR(10) DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create Folders table
    await pool.query(`
      CREATE TABLE folders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Folders table created');

    // Create Notes table
    await pool.query(`
      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        ipfs_hash VARCHAR(100),
        is_encrypted BOOLEAN DEFAULT false,
        last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Notes table created');

    // Create IPFS Pins table (for versioning)
    await pool.query(`
      CREATE TABLE ipfs_pins (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        ipfs_hash VARCHAR(100) NOT NULL,
        size_bytes INTEGER,
        pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ IPFS Pins table created');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX idx_folders_user ON folders(user_id);
      CREATE INDEX idx_folders_parent ON folders(parent_id);
      CREATE INDEX idx_notes_user ON notes(user_id);
      CREATE INDEX idx_notes_folder ON notes(folder_id);
      CREATE INDEX idx_notes_ipfs ON notes(ipfs_hash);
      CREATE INDEX idx_ipfs_pins_note ON ipfs_pins(note_id);
    `);
    console.log('✓ Indexes created');

    console.log('\n✅ NoteVault database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

createTables();
