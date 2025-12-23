const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { uploadToS3, deleteFromS3, getObjectText } = require('../config/s3');

const generateSlug = () => crypto.randomBytes(6).toString('base64url').slice(0, 10);
const buildPasteKey = (slug) => `pastes/${slug}.txt`;
const S3_THRESHOLD = 50000;

const listPastes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT slug, title, content, created_at, updated_at, is_public, (password_hash IS NOT NULL) as has_password FROM pastes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List pastes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPaste = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      'SELECT p.slug, p.title, p.content, p.content_s3_key, p.created_at, p.updated_at, p.is_public, p.user_id, p.password_hash, u.name as owner_name FROM pastes p JOIN users u ON p.user_id = u.id WHERE p.slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }

    const paste = result.rows[0];
    const isOwner = req.user?.id === paste.user_id;

    if (!paste.is_public && !isOwner) {
      if (paste.password_hash) {
        return res.status(403).json({ success: false, message: 'Password required', requiresPassword: true });
      }
      return res.status(403).json({ success: false, message: 'Private paste' });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    let content = paste.content;
    if ((!content || content.length === 0) && paste.content_s3_key) {
      content = await getObjectText(paste.content_s3_key);
    }

    res.json({
      success: true,
      data: {
        slug: paste.slug,
        title: paste.title,
        content,
        is_public: paste.is_public,
        created_at: paste.created_at,
        updated_at: paste.updated_at,
        is_owner: isOwner,
        owner_name: paste.owner_name,
        has_password: !!paste.password_hash
      }
    });
  } catch (error) {
    console.error('Get paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyPastePassword = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    const result = await pool.query(
      'SELECT slug, title, content, content_s3_key, created_at, updated_at, is_public, user_id, password_hash FROM pastes WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }

    const paste = result.rows[0];

    if (!paste.password_hash) {
      return res.status(400).json({ success: false, message: 'This paste is not password protected' });
    }

    const isValid = await bcrypt.compare(password, paste.password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    let content = paste.content;
    if ((!content || content.length === 0) && paste.content_s3_key) {
      content = await getObjectText(paste.content_s3_key);
    }

    res.json({
      success: true,
      data: {
        slug: paste.slug,
        title: paste.title,
        content,
        is_public: paste.is_public,
        created_at: paste.created_at,
        updated_at: paste.updated_at,
        is_owner: req.user?.id === paste.user_id,
        has_password: true
      }
    });
  } catch (error) {
    console.error('Verify paste password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPaste = async (req, res) => {
  try {
    const { title, content, isPublic, password } = req.body;
    const slug = generateSlug();

    let passwordHash = null;
    if (!isPublic && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const contentValue = content || '';
    const useS3 = contentValue.length > S3_THRESHOLD;
    let contentKey = null;
    let contentToStore = contentValue;

    if (useS3) {
      contentKey = buildPasteKey(slug);
      await uploadToS3(contentKey, Buffer.from(contentValue, 'utf8'), 'text/plain; charset=utf-8');
      contentToStore = '';
    }

    const result = await pool.query(
      'INSERT INTO pastes (slug, title, content, content_s3_key, is_public, password_hash, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING slug, title, content, is_public, created_at, updated_at',
      [slug, title || 'Untitled Paste', contentToStore, contentKey, isPublic !== false, passwordHash, req.user.id]
    );

    const pasteData = { ...result.rows[0], has_password: !!passwordHash };
    res.status(201).json({ success: true, data: pasteData });
  } catch (error) {
    console.error('Create paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePaste = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, isPublic, password } = req.body;

    const existing = await pool.query('SELECT user_id, password_hash, content_s3_key FROM pastes WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this paste' });
    }

    let passwordHash = null;
    if (isPublic === false) {
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      } else {
        passwordHash = existing.rows[0].password_hash;
      }
    }

    const contentValue = content || '';
    const useS3 = contentValue.length > S3_THRESHOLD;
    let contentKey = existing.rows[0].content_s3_key || null;
    let contentToStore = contentValue;

    if (useS3) {
      contentKey = contentKey || buildPasteKey(slug);
      await uploadToS3(contentKey, Buffer.from(contentValue, 'utf8'), 'text/plain; charset=utf-8');
      contentToStore = '';
    } else if (contentKey) {
      try {
        await deleteFromS3(contentKey);
      } catch (deleteError) {
        console.error('Delete paste content error:', deleteError);
      }
      contentKey = null;
    }

    const result = await pool.query(
      'UPDATE pastes SET title = $1, content = $2, content_s3_key = $3, is_public = $4, password_hash = $5 WHERE slug = $6 RETURNING slug, title, content, is_public, created_at, updated_at',
      [title || 'Untitled Paste', contentToStore, contentKey, isPublic !== false, passwordHash, slug]
    );

    const pasteData = { ...result.rows[0], has_password: !!passwordHash };
    res.json({ success: true, data: pasteData });
  } catch (error) {
    console.error('Update paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deletePaste = async (req, res) => {
  try {
    const { slug } = req.params;
    const existing = await pool.query('SELECT user_id, content_s3_key FROM pastes WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this paste' });
    }

    const contentKey = existing.rows[0].content_s3_key;
    if (contentKey) {
      try {
        await deleteFromS3(contentKey);
      } catch (deleteError) {
        console.error('Delete paste content error:', deleteError);
      }
    }

    await pool.query('DELETE FROM pastes WHERE slug = $1', [slug]);
    res.json({ success: true, message: 'Paste deleted' });
  } catch (error) {
    console.error('Delete paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listPastes, getPaste, createPaste, updatePaste, verifyPastePassword, deletePaste };
