const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const pool = require('../config/database');
const { authenticate: auth } = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Original URL is required' });
    }

    const shortCode = nanoid(8);
    
    const result = await pool.query(
      'INSERT INTO short_urls (user_id, original_url, short_code) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, originalUrl, shortCode]
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
