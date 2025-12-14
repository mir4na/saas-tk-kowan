const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { initBucket } = require('./config/minio');

const app = express();

initBucket();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notepad SaaS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const pool = require('./config/database');
    const result = await pool.query('SELECT NOW() as timestamp, version() as version');
    res.json({
      success: true,
      message: 'Database connected successfully!',
      data: {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version,
        hasEnvVars: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          JWT_SECRET: !!process.env.JWT_SECRET,
          JWT_EXPIRE: !!process.env.JWT_EXPIRE
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      hasEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        JWT_EXPIRE: !!process.env.JWT_EXPIRE
      }
    });
  }
});

// Test environment variables endpoint
app.get('/test-env', (req, res) => {
  res.json({
    success: true,
    message: 'Environment variables check',
    data: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      hasVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        JWT_EXPIRE: !!process.env.JWT_EXPIRE,
        CORS_ORIGIN: !!process.env.CORS_ORIGIN,
        APP_NAME: !!process.env.APP_NAME,
        APP_URL: !!process.env.APP_URL
      },
      databaseUrl: process.env.DATABASE_URL ?
        `postgresql://${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'}` :
        'not set'
    }
  });
});

// Debug endpoint to inspect request body
app.post('/debug-request', (req, res) => {
  res.json({
    success: true,
    message: 'Request debug info',
    data: {
      headers: req.headers,
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      rawBody: req.rawBody,
      contentType: req.get('Content-Type'),
      method: req.method,
      path: req.path
    }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/profile', require('./routes/profile'));

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
