const pool = require('../config/database');

exports.getNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    res.json({
      success: true,
      notes: result.rows
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const result = await pool.query(
      'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;

    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, title, content, created_at, updated_at',
      [userId, title || 'Untitled Note', content || '']
    );

    res.status(201).json({
      success: true,
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, content } = req.body;

    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id, title, content, created_at, updated_at',
      [title, content, noteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
