# Trace Deploy Engine — API Reference

**Base URL:** `http://localhost:4010` (configurable via `ENGINE_PORT`)
**Auth:** Bearer token via `TRACE_ENGINE_API_KEY` (mandatory in production, bypassed for `/health` and `/metrics`)
**Content-Type:** `application/json`

All responses include `correlationId` when the `X-Correlation-ID` header is provided.

---

## Health & Observability

### `GET /health`
Engine health status.

```json
{
  "status": "healthy",
  "timestamp": "2026-03-17T12:00:00.000Z",
  "uptime": 3600.5,
  "reconciler": "running",
  "services": { "total": 3, "running": 2, "degraded": 1 }
}
```

### `GET /metrics`
Runtime metrics (memory, service breakdown by status).

```json
{
  "uptime": 3600.5,
  "memory": { "rss": 52428800, "heapUsed": 20971520, "heapTotal": 33554432 },
  "services": { "total": 3, "byStatus": { "running": 2, "stopped": 0, "error": 1, "missing": 0 } }
}
```

---

## Deploy

### `POST /deploy`
Deploy a single container.

**Body:**
| Field      | Type   | Required | Description                     |
|------------|--------|----------|---------------------------------|
| name       | string | yes      | Container name (`/^[a-zA-Z0-9_-]+$/`) |
| image      | string | yes      | Docker image (allowlist enforced) |
| port       | number | no       | Container port (default: 80)    |
| env        | object | no       | Environment variables           |
| manifestId | uuid   | no       | Link to a DeploymentManifest    |

**Response:**
```json
{
  "status": "running",
  "container": "api-gateway-8000",
  "service": "http://localhost:8000",
  "port": 8000,
  "correlationId": "abc-123"
}
```

### `DELETE /service/:name`
Remove a deployed service and release its port.

**Response:** `{ "status": "removed", "correlationId": "..." }`

---

## Services

### `GET /services`
List all registered services.

**Response:** Array of service objects.
```json
[
  {
    "name": "api-gateway",
    "containerName": "api-gateway-8000",
    "image": "node:22",
    "hostPort": 8000,
    "containerPort": 4000,
    "url": "http://localhost:8000",
    "status": "running",
    "restartCount": 0,
    "createdAt": "2026-03-17T12:00:00.000Z"
  }
]
```

### `GET /services/:name`
Get single service details. Returns 404 if not found.

### `GET /logs/:name`
Get container logs (stdout/stderr).

**Response:** `{ "service": "api-gateway", "logs": "...", "correlationId": "..." }`

### `GET /health/:name`
Check if a specific container is running.

**Response:** `{ "service": "api-gateway", "running": true, "status": "running", "restartCount": 0 }`

---

## Templates

### `GET /templates`
List all architecture templates from catalog.

**Response:**
```json
{
  "count": 4,
  "templates": [
    {
      "templateId": "compliance-api",
      "version": "1.0.0",
      "name": "Trace Compliance API",
      "category": "compliance",
      "description": "GDPR cookie compliance backend..."
    }
  ]
}
```

### `GET /templates/:id`
Get full template definition (topology, parameters, contracts).

### `GET /templates/:id/presets`
List presets for a template.

**Response:**
```json
{
  "templateId": "compliance-api",
  "presets": [
    { "presetId": "starter", "name": "starter", "description": "Single-instance development setup", "values": { "NODE_ENV": "development" } },
    { "presetId": "production", "name": "production", "description": "Production-hardened with resource limits", "values": { "NODE_ENV": "production" } }
  ]
}
```

---

## Delivery (requires `delivery/` module)

These endpoints use dynamic imports. If `delivery/` is not present (open-source edition), they return `501 Not Implemented`.

### `POST /deliver`
Build, license, seal, and export a template package in one request.

**Body:**
| Field        | Type    | Required | Description                                  |
|--------------|---------|----------|----------------------------------------------|
| templateId   | string  | yes      | Template identifier (`/^[a-z][a-z0-9-]*$/`)  |
| tier         | enum    | no       | `free` / `starter` / `professional` / `enterprise` (default: `free`) |
| licensee     | string  | no       | Email or org identifier (default: `anonymous@local`) |
| durationDays | number  | no       | License duration in days                     |
| publish      | boolean | no       | Also publish to local registry (default: false) |

**Response:**
```json
{
  "envelopeId": "uuid",
  "templateId": "compliance-api",
  "version": "1.0.0",
  "tier": "professional",
  "licensee": "client@corp.com",
  "assetCount": 3,
  "totalSizeBytes": 4400,
  "sealValid": true,
  "sealHash": "da0458df...",
  "outputPath": ".trace-output/packages/compliance-api-professional.trace.json",
  "outputSizeBytes": 8900,
  "registryEntry": null,
  "warnings": [],
  "correlationId": "..."
}
```

**Errors:**
- `403` — License violations (e.g., too many services for tier)
- `404` — Template not found
- `501` — Delivery module not available

### `GET /registry`
List all published packages in local registry.

**Response:** `{ "count": 1, "entries": [{ "templateId": "...", "version": "...", "tier": "...", "publishedAt": "..." }] }`

### `GET /registry/:templateId/:version?tier=free`
Pull a specific package. Returns the full envelope with seal verification.

**Response:** `{ "envelope": { ... }, "sealValid": true }`

---

## Authentication

Set `TRACE_ENGINE_API_KEY` environment variable. All requests (except `/health` and `/metrics`) must include:

```
Authorization: Bearer <your-api-key>
```

In development (no key set), auth is bypassed.

## Rate Limiting

Default: 100 requests per minute per IP (configurable via `ENGINE_RATE_LIMIT`).

## Correlation ID

Include `X-Correlation-ID: <uuid>` header for distributed tracing. If omitted, a UUID is generated and returned in all responses.

## Port Allocation

The engine allocates host ports from range `8000-9000` for deployed containers. Ports are tracked in SQLite and released on service removal.
