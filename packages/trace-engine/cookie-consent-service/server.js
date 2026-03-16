import express from 'express';
import { body, param, validationResult } from 'express-validator';
import pg from 'pg';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
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
    new winston.transports.File({ filename: 'logs/cookie-consent-service.log' })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 4002;

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

// Configuration
const CONSENT_VERSION = process.env.CONSENT_VERSION || '1.0.0';
const CONSENT_EXPIRY_MONTHS = parseInt(process.env.CONSENT_EXPIRY_MONTHS) || 12;

// Middleware: Request logging
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;

  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
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
      consentVersion: CONSENT_VERSION,
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

// POST /consent - Register cookie consent
app.post('/consent', [
  body('user_id')
    .isUUID()
    .withMessage('user_id must be a valid UUID'),
  body('preferences')
    .isObject()
    .withMessage('preferences must be an object'),
  body('preferences.necessary')
    .isBoolean()
    .withMessage('preferences.necessary must be a boolean'),
  body('preferences.analytics')
    .optional()
    .isBoolean()
    .withMessage('preferences.analytics must be a boolean'),
  body('preferences.advertising')
    .optional()
    .isBoolean()
    .withMessage('preferences.advertising must be a boolean'),
  body('preferences.personalization')
    .optional()
    .isBoolean()
    .withMessage('preferences.personalization must be a boolean'),
  body('third_party_vendors')
    .optional()
    .isArray()
    .withMessage('third_party_vendors must be an array'),
  body('consent_version')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('consent_version must be in format x.y.z'),
  body('session_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('session_id must be 1-255 characters'),
  body('user_agent')
    .isLength({ min: 1 })
    .withMessage('user_agent is required'),
  handleValidationErrors
], async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      user_id,
      preferences,
      third_party_vendors = [],
      consent_version = CONSENT_VERSION,
      session_id,
      user_agent
    } = req.body;

    // Get client IP
    const ip_address = req.ip || req.connection.remoteAddress;

    // Calculate expiry date (12 months from now)
    const expires_at = new Date();
    expires_at.setMonth(expires_at.getMonth() + CONSENT_EXPIRY_MONTHS);

    // Determine if consent was given (at least one non-necessary category accepted)
    const consent_given = preferences.analytics || preferences.advertising || preferences.personalization;

    // Insert consent record
    const insertQuery = `
      INSERT INTO cookie_consents (
        user_id, session_id, ip_address, user_agent, consent_version,
        timestamp, consent_given, preferences, third_party_vendors, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)
      RETURNING id, user_id, timestamp, expires_at, preferences
    `;

    const values = [
      user_id,
      session_id,
      ip_address,
      user_agent,
      consent_version,
      consent_given,
      JSON.stringify(preferences),
      JSON.stringify(third_party_vendors),
      expires_at
    ];

    const result = await client.query(insertQuery, values);
    const consent = result.rows[0];

    await client.query('COMMIT');

    logger.info('Consent registered successfully', {
      consentId: consent.id,
      userId: user_id,
      consentGiven: consent_given,
      preferences,
      thirdPartyVendors: third_party_vendors,
      requestId: req.id
    });

    res.status(201).json({
      ...consent,
      preferences: JSON.parse(consent.preferences),
      requestId: req.id
    });

  } catch (error) {
    await client.query('ROLLBACK');

    // Handle unique constraint violations
    if (error.code === '23505') {
      logger.warn('Consent already exists for user', {
        userId: req.body.user_id,
        requestId: req.id
      });
      return res.status(409).json({
        error: 'Consent already exists for this user and version',
        requestId: req.id
      });
    }

    logger.error('Error registering consent', {
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

// GET /consent/:user_id - Get user's current consent
app.get('/consent/:user_id', [
  param('user_id')
    .isUUID()
    .withMessage('user_id must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { user_id } = req.params;

    const query = `
      SELECT id, preferences, timestamp, expires_at
      FROM cookie_consents
      WHERE user_id = $1
        AND withdrawn_at IS NULL
        AND expires_at > NOW()
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0) {
      logger.info('No valid consent found for user', { userId: user_id, requestId: req.id });
      return res.status(404).json({
        error: 'No valid consent found',
        requestId: req.id
      });
    }

    const consent = result.rows[0];
    consent.preferences = JSON.parse(consent.preferences);

    logger.info('Consent retrieved successfully', {
      consentId: consent.id,
      userId: user_id,
      requestId: req.id
    });

    res.json({
      ...consent,
      requestId: req.id
    });

  } catch (error) {
    logger.error('Error retrieving consent', {
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

// DELETE /consent/:user_id - Withdraw consent
app.delete('/consent/:user_id', [
  param('user_id')
    .isUUID()
    .withMessage('user_id must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { user_id } = req.params;

    const updateQuery = `
      UPDATE cookie_consents
      SET withdrawn_at = NOW()
      WHERE user_id = $1 AND withdrawn_at IS NULL
      RETURNING id, withdrawn_at
    `;

    const result = await client.query(updateQuery, [user_id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn('No active consent found to withdraw', { userId: user_id, requestId: req.id });
      return res.status(404).json({
        error: 'No active consent found to withdraw',
        requestId: req.id
      });
    }

    await client.query('COMMIT');

    const withdrawal = result.rows[0];

    logger.info('Consent withdrawn successfully', {
      consentId: withdrawal.id,
      userId: user_id,
      withdrawnAt: withdrawal.withdrawn_at,
      requestId: req.id
    });

    res.json({
      success: true,
      withdrawn_at: withdrawal.withdrawn_at,
      requestId: req.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error withdrawing consent', {
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

// GET /categories - Get all cookie categories
app.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT id, category_key, name, description, is_necessary, default_enabled FROM cookie_categories ORDER BY id';
    const result = await pool.query(query);

    logger.info('Categories retrieved successfully', {
      count: result.rows.length,
      requestId: req.id
    });

    res.json(result.rows.map(row => ({
      ...row,
      requestId: req.id
    })));

  } catch (error) {
    logger.error('Error retrieving categories', {
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

// GET /vendors - Get all cookie vendors
app.get('/vendors', async (req, res) => {
  try {
    const query = `
      SELECT v.id, v.vendor_key, v.name, v.description, v.privacy_policy_url,
             v.cookies_set, v.retention_period, c.category_key
      FROM cookie_vendors v
      JOIN cookie_categories c ON v.category_id = c.id
      ORDER BY v.name
    `;
    const result = await pool.query(query);

    const vendors = result.rows.map(row => ({
      ...row,
      cookies_set: JSON.parse(row.cookies_set)
    }));

    logger.info('Vendors retrieved successfully', {
      count: vendors.length,
      requestId: req.id
    });

    res.json(vendors.map(vendor => ({
      ...vendor,
      requestId: req.id
    })));

  } catch (error) {
    logger.error('Error retrieving vendors', {
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

// GET /audit/:user_id - Get consent audit trail
app.get('/audit/:user_id', [
  param('user_id')
    .isUUID()
    .withMessage('user_id must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { user_id } = req.params;

    const query = `
      SELECT id, timestamp, consent_given, preferences, third_party_vendors,
             expires_at, withdrawn_at, ip_address, user_agent
      FROM cookie_consents
      WHERE user_id = $1
      ORDER BY timestamp DESC
    `;

    const result = await pool.query(query, [user_id]);

    const audit = result.rows.map(row => ({
      ...row,
      preferences: JSON.parse(row.preferences),
      third_party_vendors: JSON.parse(row.third_party_vendors)
    }));

    logger.info('Consent audit retrieved successfully', {
      userId: user_id,
      recordsCount: audit.length,
      requestId: req.id
    });

    res.json({
      user_id,
      records: audit,
      requestId: req.id
    });

  } catch (error) {
    logger.error('Error retrieving consent audit', {
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
  logger.info('Cookie Consent Service started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    consentVersion: CONSENT_VERSION,
    consentExpiryMonths: CONSENT_EXPIRY_MONTHS,
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