const crypto = require('crypto');
const pool = require('../config/database');

const generateSlug = () => crypto.randomBytes(6).toString('base64url').slice(0, 10);

const listPastes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT slug, title, content, created_at, updated_at, is_public FROM pastes WHERE user_id = $1 ORDER BY updated_at DESC',
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
      'SELECT slug, title, content, created_at, updated_at, is_public, user_id FROM pastes WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }

    const paste = result.rows[0];
    const isOwner = req.user?.id === paste.user_id;

    if (!paste.is_public && !isOwner) {
      return res.status(403).json({ success: false, message: 'Private paste' });
    }

    res.json({
      success: true,
      data: {
        slug: paste.slug,
        title: paste.title,
        content: paste.content,
        is_public: paste.is_public,
        created_at: paste.created_at,
        updated_at: paste.updated_at,
        is_owner: isOwner
      }
    });
  } catch (error) {
    console.error('Get paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPaste = async (req, res) => {
  try {
    const { title, content, isPublic } = req.body;
    const slug = generateSlug();

    const result = await pool.query(
      'INSERT INTO pastes (slug, title, content, is_public, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING slug, title, content, is_public, created_at, updated_at',
      [slug, title || 'Untitled Paste', content || '', isPublic !== false, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePaste = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, isPublic } = req.body;

    const existing = await pool.query('SELECT user_id FROM pastes WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paste not found' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this paste' });
    }

    const result = await pool.query(
      'UPDATE pastes SET title = $1, content = $2, is_public = $3 WHERE slug = $4 RETURNING slug, title, content, is_public, created_at, updated_at',
      [title || 'Untitled Paste', content || '', isPublic !== false, slug]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update paste error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listPastes, getPaste, createPaste, updatePaste };
