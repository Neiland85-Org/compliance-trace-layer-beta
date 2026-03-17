/**
 * Trace Deploy Engine — API Server
 *
 * Port: 4010 (separated from backend on 4000)
 * Auth: API key via TRACE_ENGINE_API_KEY (mandatory in production)
 * State: SQLite (engine/data/state.db)
 * Reconciler: Background loop checking desired vs actual state
 *
 * This server has ZERO static imports from intelligence/.
 * Delivery routes use dynamic import() — if delivery/ is absent,
 * those endpoints return 501 (open-source edition behavior).
 */

import express from "express";
import rateLimit from "express-rate-limit";

import { authMiddleware } from "./middleware/auth.js";
import { correlationIdMiddleware } from "./middleware/correlation-id.js";
import { errorHandler } from "./middleware/error-handler.js";

import { deployRoutes } from "./routes/deploy.js";
import { servicesRoutes } from "./routes/services.js";
import { healthRoutes } from "./routes/health.js";
import { templateRoutes } from "./routes/templates.js";
import { deliveryRoutes } from "./routes/delivery.js";

import { startReconciliationLoop } from "../supervisor/reconciliation-loop.js";
import { getDb } from "../deployment/state-store.js";

// ─── Initialize ───────────────────────────────────────────────────

// Ensure DB is initialized before starting
getDb();

const app = express();
const PORT = parseInt(process.env.ENGINE_PORT || "4010", 10);

// ─── Middleware stack (applied ONCE, in order) ────────────────────

app.use(express.json());

app.use(correlationIdMiddleware);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.ENGINE_RATE_LIMIT || "100", 10),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(authMiddleware);

// ─── Routes ───────────────────────────────────────────────────────

app.use(healthRoutes);    // GET /health, GET /metrics
app.use(deployRoutes);    // POST /deploy, DELETE /service/:name
app.use(servicesRoutes);  // GET /services, GET /logs/:name, GET /health/:name
app.use(templateRoutes);  // GET /templates, GET /templates/:id, GET /templates/:id/presets
app.use(deliveryRoutes);  // POST /deliver, GET /registry, GET /registry/:id/:version

// ─── Error handler (must be last) ─────────────────────────────────

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[engine] Trace Deploy Engine running on :${PORT}`);
  console.log(`[engine] Auth: ${process.env.TRACE_ENGINE_API_KEY ? "enabled" : "disabled (dev)"}`);
  console.log(`[engine] State: SQLite`);
});

// Start reconciliation loop
startReconciliationLoop();
