const pool = require('../config/database');

const migrate = async () => {
  try {
    console.log('Starting database migration for QuickClip with auth...');

    await pool.query('DROP TABLE IF EXISTS pastes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS short_urls CASCADE;');
    await pool.query('DROP TABLE IF EXISTS passkey_credentials CASCADE;');
    await pool.query('DROP TABLE IF EXISTS passkey_challenges CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        profile_photo VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ users table created');

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
    console.log('✓ passkey_credentials table created');

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
    console.log('✓ passkey_challenges table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pastes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug VARCHAR(16) UNIQUE NOT NULL,
        title VARCHAR(255) DEFAULT 'Untitled Paste',
        content TEXT DEFAULT '',
        is_public BOOLEAN DEFAULT TRUE,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ pastes table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        short_code VARCHAR(16) UNIQUE NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ short_urls table created');

    await pool.query(`
      CREATE OR REPLACE FUNCTION update_pastes_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_pastes_updated_at ON pastes;
      CREATE TRIGGER trg_pastes_updated_at
      BEFORE UPDATE ON pastes
      FOR EACH ROW
      EXECUTE FUNCTION update_pastes_updated_at();
    `);
    console.log('✓ trigger created on pastes');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pastes_user_id ON pastes(user_id);
      CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_pastes_slug ON pastes(slug);
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON passkey_credentials(credential_id);
      CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON passkey_challenges(expires_at);
      CREATE INDEX IF NOT EXISTS idx_short_urls_short_code ON short_urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_short_urls_user_id ON short_urls(user_id);
    `);
    console.log('✓ indexes created');

    console.log('\n✅ Migration completed. QuickClip schema with auth is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
