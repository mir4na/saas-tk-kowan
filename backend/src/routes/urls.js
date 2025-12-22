const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const pool = require('../config/database');
const { authenticate: auth } = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { originalUrl, name } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Original URL is required' });
    }

    if (name && name.trim().length > 30) {
      return res.status(400).json({ success: false, message: 'Name must be 30 characters or fewer.' });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM short_urls WHERE user_id = $1',
      [req.user.id]
    );

    if (countResult.rows[0].count >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum of 5 short URLs per account.' });
    }

    const shortCode = nanoid(8);
    
    const result = await pool.query(
      'INSERT INTO short_urls (user_id, original_url, short_code, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, originalUrl, shortCode, name ? name.trim() : null]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM short_urls WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching short URLs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, shortCode, name } = req.body;
    const trimmedShortCode = shortCode ? shortCode.trim() : '';
    const hasName = Object.prototype.hasOwnProperty.call(req.body, 'name');
    const trimmedName = name ? name.trim() : '';

    if (!originalUrl && !trimmedShortCode && !hasName) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }

    if (trimmedShortCode) {
      return res.status(400).json({ success: false, message: 'Short code cannot be edited.' });
    }

    if (trimmedName && trimmedName.length > 30) {
      return res.status(400).json({ success: false, message: 'Name must be 30 characters or fewer.' });
    }

    const updates = [];
    const values = [req.user.id, id];
    let paramIndex = 3;

    if (originalUrl) {
      updates.push(`original_url = $${paramIndex++}`);
      values.push(originalUrl);
    }

    if (hasName) {
      updates.push(`name = $${paramIndex++}`);
      values.push(trimmedName || null);
    }

    const result = await pool.query(
      `UPDATE short_urls SET ${updates.join(', ')} WHERE user_id = $1 AND id = $2 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating short URL:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM short_urls WHERE user_id = $1 AND id = $2 RETURNING id',
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting short URL:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM short_urls WHERE short_code = $1 AND user_id = $2',
      [code, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Short URL not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
