import express from 'express';
import { body, param, validationResult } from 'express-validator';
import pg from 'pg';
import winston from 'winston';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from parent backend directory
dotenv.config({ path: '../.env' });

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT === 'json'
    ? winston.format.json()
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/trace-service.log' })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 4001;

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_MAX) || 20,
  idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: 2000,
});

// Handle database connection errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
});

// Middleware: Request logging
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;

  logger.info('Request received', {
    method: req.method,
    url: req.url,
    requestId
  });

  next();
});

// Middleware: Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      requestId: req.id
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message, requestId: req.id });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      requestId: req.id
    });
  }
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      requestId: req.id
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      requestId: req.id
    });
  }
  next();
};

// POST /create - Create new trace transaction
app.post('/create', [
  body('transaction_id')
    .isLength({ min: 1, max: 100 })
    .withMessage('transaction_id must be 1-100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('transaction_id must contain only alphanumeric characters, hyphens, and underscores'),
  handleValidationErrors
], async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { transaction_id } = req.body;

    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256')
      .update(transaction_id + Date.now().toString())
      .digest('hex');

    // Check if transaction_id already exists
    const existingQuery = 'SELECT id FROM traces WHERE transaction_id = $1';
    const existingResult = await client.query(existingQuery, [transaction_id]);

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      logger.warn('Transaction ID already exists', { transaction_id, requestId: req.id });
      return res.status(409).json({
        error: 'Transaction ID already exists',
        requestId: req.id
      });
    }

    // Insert new trace
    const insertQuery = `
      INSERT INTO traces (transaction_id, hash, status)
      VALUES ($1, $2, 'verified')
      RETURNING id, transaction_id, hash, status, timestamp
    `;
    const result = await client.query(insertQuery, [transaction_id, hash]);

    await client.query('COMMIT');

    const trace = result.rows[0];

    logger.info('Trace created successfully', {
      traceId: trace.id,
      transaction_id: trace.transaction_id,
      hash: trace.hash,
      requestId: req.id
    });

    res.status(201).json({
      ...trace,
      requestId: req.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating trace', {
      error: error.message,
      stack: error.stack,
      requestId: req.id
    });
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id
    });
  } finally {
    client.release();
  }
});

// GET /verify/:hash - Verify trace by hash
app.get('/verify/:hash', [
  param('hash')
    .isLength({ min: 64, max: 64 })
    .withMessage('Hash must be exactly 64 characters (SHA-256)')
    .matches(/^[a-f0-9]+$/)
    .withMessage('Hash must contain only lowercase hexadecimal characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { hash } = req.params;

    const query = 'SELECT id, transaction_id, hash, status, timestamp FROM traces WHERE hash = $1';
    const result = await pool.query(query, [hash]);

    if (result.rows.length === 0) {
      logger.warn('Trace not found', { hash, requestId: req.id });
      return res.status(404).json({
        verified: false,
        message: 'Trace not found',
        requestId: req.id
      });
    }

    const trace = result.rows[0];

    logger.info('Trace verified successfully', {
      traceId: trace.id,
      hash,
      requestId: req.id
    });

    res.json({
      verified: true,
      record: trace,
      requestId: req.id
    });

  } catch (error) {
    logger.error('Error verifying trace', {
      error: error.message,
      stack: error.stack,
      requestId: req.id
    });
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id
    });
  }
});

// GET /check - KYC/AML check (mock implementation)
app.get('/check', (req, res) => {
  logger.info('KYC/AML check requested', { requestId: req.id });

  // Mock response - in production this would integrate with real KYC/AML services
  res.json({
    kyc: 'passed',
    aml: 'clean',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    url: req.url,
    method: req.method
  });

  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    requestId: req.id
  });

  res.status(404).json({
    error: 'Route not found',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Trace Service started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    logger.info('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  pool.end(() => {
    logger.info('Database pool closed');
    process.exit(0);
  });
});