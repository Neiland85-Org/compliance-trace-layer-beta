/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import traceRoutes from "./routes/trace.js";

dotenv.config();
const rawOrigins = process.env.ALLOWED_ORIGINS;
const normalizedOrigins = rawOrigins 
  ? rawOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = normalizedOrigins.length > 0 
  ? [...new Set(normalizedOrigins)] 
  : ['http://localhost:5173'];

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});

const app = express();

// Trust proxy in production for proper HTTPS detection behind reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers with Helmet
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: false // Disable HSTS by default
}));

// Content Security Policy for API
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    scriptSrc: ["'none'"],
    styleSrc: ["'none'"],
    imgSrc: ["'none'"],
    connectSrc: ["'self'"],
    upgradeInsecureRequests: []
  }
}));

// HSTS only in production (requires HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true, preload: false }));
}

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use("/api/", limiter);

app.use("/api/trace", traceRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

