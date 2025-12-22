const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'QuickClip API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/pastes', require('./routes/pastes'));
app.use('/api/urls', require('./routes/urls'));

const pool = require('./config/database');
app.get('/u/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'UPDATE short_urls SET clicks = clicks + 1 WHERE short_code = $1 RETURNING original_url',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Short URL not found');
    }

    res.redirect(result.rows[0].original_url);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Server error');
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server started`);
});

module.exports = app;
