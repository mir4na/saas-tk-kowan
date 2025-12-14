const pool = require('../config/database');

const createTables = async () => {
  try {
    console.log('Starting database migration for NOTTU...');

    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        profile_photo VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS passkey_credentials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        transports TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Passkey credentials table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS passkey_challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255),
        challenge TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);
    console.log('✓ Passkey challenges table created');

    // Create Notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Untitled Note',
        content TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Notes table created');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON passkey_credentials(credential_id);
      CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON passkey_challenges(expires_at);
    `);
    console.log('✓ Indexes created');

    // Create trigger to auto-update updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✓ Trigger function created');

    await pool.query(`
      DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
      CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Trigger attached to notes table');

    await pool.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
      RETURNS void AS $$
      BEGIN
        DELETE FROM passkey_challenges WHERE expires_at < CURRENT_TIMESTAMP;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✓ Cleanup function created');

    console.log('\n✅ Database migration completed successfully!');
    console.log('📝 Tables created: users, notes, passkey_credentials, passkey_challenges');
    console.log('🚀 Your NOTTU app is ready to use!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

createTables();
