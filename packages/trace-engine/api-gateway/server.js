import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';
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
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// Middleware: Request logging
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Response sent', {
      statusCode: res.statusCode,
      requestId
    });
    originalSend.call(this, data);
  };

  next();
});

// Middleware: Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware: CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      requestId: req.id
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    });
  }
});
app.use(limiter);

// Middleware: Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check downstream services health
    const healthChecks = await Promise.allSettled([
      checkServiceHealth(process.env.TRACE_SERVICE_URL || 'http://trace-service:4001'),
      checkServiceHealth(process.env.COOKIE_CONSENT_SERVICE_URL || 'http://cookie-consent-service:4002')
    ]);

    const services = {
      trace: healthChecks[0].status === 'fulfilled' && healthChecks[0].value ? 'up' : 'down',
      cookies: healthChecks[1].status === 'fulfilled' && healthChecks[1].value ? 'up' : 'down'
    };

    const isHealthy = services.trace === 'up' && services.cookies === 'up';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message, requestId: req.id });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      requestId: req.id
    });
  }
});

// Proxy middleware for trace service
app.use('/api/trace', createProxyMiddleware({
  target: process.env.TRACE_SERVICE_URL || 'http://trace-service:4001',
  changeOrigin: true,
  pathRewrite: { '^/api/trace': '' },
  onProxyReq: (proxyReq, req) => {
    // Add correlation headers
    proxyReq.setHeader('X-Request-ID', req.id);
    proxyReq.setHeader('X-Forwarded-For', req.ip);
  },
  onProxyRes: (proxyRes, req) => {
    logger.info('Trace service response', {
      statusCode: proxyRes.statusCode,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Trace service proxy error', {
      error: err.message,
      requestId: req.id
    });
    res.status(502).json({
      error: 'Trace service unavailable',
      requestId: req.id
    });
  }
}));

// Proxy middleware for cookie consent service
app.use('/api/cookies', createProxyMiddleware({
  target: process.env.COOKIE_CONSENT_SERVICE_URL || 'http://cookie-consent-service:4002',
  changeOrigin: true,
  pathRewrite: { '^/api/cookies': '' },
  onProxyReq: (proxyReq, req) => {
    // Add correlation headers
    proxyReq.setHeader('X-Request-ID', req.id);
    proxyReq.setHeader('X-Forwarded-For', req.ip);
  },
  onProxyRes: (proxyRes, req) => {
    logger.info('Cookie consent service response', {
      statusCode: proxyRes.statusCode,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Cookie consent service proxy error', {
      error: err.message,
      requestId: req.id
    });
    res.status(502).json({
      error: 'Cookie consent service unavailable',
      requestId: req.id
    });
  }
}));

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

// Helper function to check service health
async function checkServiceHealth(serviceUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${serviceUrl}/health`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logger.warn('Service health check failed', { serviceUrl, error: error.message });
    return false;
  }
}

// Start server
app.listen(PORT, () => {
  logger.info('API Gateway started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    allowedOrigins,
    traceServiceUrl: process.env.TRACE_SERVICE_URL || 'http://trace-service:4001',
    cookieConsentServiceUrl: process.env.COOKIE_CONSENT_SERVICE_URL || 'http://cookie-consent-service:4002'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});