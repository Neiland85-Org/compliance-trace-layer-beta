# TRACE PLATFORM — Domain Architecture & Contract Specification
## From Prototype to Product: Architecture Intelligence Engine

**Version:** 1.0.0-draft
**Date:** 2026-03-17
**Author:** Claude Opus 4.6 (Senior Platform Architect role)
**Status:** Proposal — requires review and ADR formalization
**Scope:** Full platform redesign from current monolithic prototype to contract-driven, domain-separated product

---

## PART 1 — HECHOS OBSERVABLES (Current State Assessment)

### 1.1 What exists today

The current codebase contains **5 distinct concerns** collapsed into a single repository with no formal boundaries:

| Concern | Location | State |
|---------|----------|-------|
| Runtime engine (Docker orchestration) | `tools/deploy-engine/` | Functional, no auth, no contracts |
| Architecture catalog (manifests) | `apps/console/src/architectures/` | Static JSON, 2 incompatible schemas |
| Trace domain (compliance hashing) | `backend/routes/trace.js` | In-memory, no real verification |
| Console UI (React SPA) | `apps/console/` | Works, hardcoded URLs |
| CLI tooling (import/create) | `tools/trace-cli/trace.js` | Functional, hits GitHub API directly |

### 1.2 Critical structural problems preventing productization

1. **Two incompatible manifest schemas coexist** — `trace-compliance-api/manifest.json` has `{name, services[]}` (deploy-oriented), while `trace-consent-service/manifest.json` has `{id, name, description, category, stack, deploy}` (catalog-oriented). No versioning, no schema validation.

2. **Runtime and IP are merged** — The deploy engine (`tools/deploy-engine/`) and the architecture intelligence (manifests, catalog logic) live in the same process, same repo, same deployment unit. A customer running the engine gets access to all template IP.

3. **No intake pipeline** — `trace.js` CLI fetches GitHub repos and writes manifests directly to the frontend folder. No analysis step, no validation, no enrichment.

4. **No licensing or access control** — Templates are JSON files in a public folder. No mechanism to differentiate free vs paid, per-client customization, or version locking.

---

## PART 2 — DOMAIN ARCHITECTURE (Target State)

### 2.1 Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRACE PLATFORM                               │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐          │
│  │  INTAKE   │───>│  ANALYSIS    │───>│  ARCH PROPOSAL    │         │
│  │  Context  │    │  Context     │    │  Context          │         │
│  │           │    │              │    │                    │         │
│  │ Ingest    │    │ Stack detect │    │ Template match     │         │
│  │ Normalize │    │ Pattern scan │    │ Gap analysis       │         │
│  │ Validate  │    │ Risk assess  │    │ Recommendation gen │         │
│  └──────────┘    └──────────────┘    └──────────────────┘          │
│       │                                       │                     │
│       │              UPSTREAM                  │                     │
│  ═════╪═══════════════════════════════════════╪═════════════════    │
│       │              DOWNSTREAM                │                     │
│       │                                       ▼                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐          │
│  │ DELIVERY  │<───│  MANIFEST    │<───│  DEPLOYMENT       │         │
│  │ Context   │    │  Context     │    │  Context          │         │
│  │           │    │              │    │                    │         │
│  │ License   │    │ Compose gen  │    │ Docker runtime     │         │
│  │ Package   │    │ Desired state│    │ Supervisor         │         │
│  │ Distribute│    │ Versioning   │    │ Reconciliation     │         │
│  └──────────┘    └──────────────┘    └──────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Context relationships

| From | To | Relationship | Justification |
|------|----|-------------|---------------|
| Intake → Analysis | **Customer-Supplier** | Intake produces normalized data; Analysis consumes it. Intake adapts to Analysis's contract. |
| Analysis → Arch Proposal | **Partnership** | Both evolve together. Analysis produces findings; Proposal consumes them + template catalog. |
| Arch Proposal → Manifest | **Published Language** | Proposal emits a standardized ArchitectureSpec document that Manifest consumes without modification. |
| Manifest → Deployment | **Conformist** | Deployment must accept whatever Manifest produces (desired-state YAML). No negotiation. |
| Arch Proposal → Delivery | **ACL (Anti-Corruption Layer)** | Delivery has its own domain (licensing, packaging). It translates Proposal output into sellable artifacts. |
| Deployment → Manifest | **Event feedback** | Deployment emits state events (deployed, failed, degraded) that Manifest consumes to update actual-state. |

### 2.3 Ubiquitous Language

| Term | Definition | Bounded to |
|------|-----------|------------|
| **Codebase Snapshot** | Normalized representation of a user's repo at intake time (package.json, file tree, dependencies) | Intake |
| **Stack Fingerprint** | Detected technology profile (runtime, frameworks, infra, patterns) | Analysis |
| **Architecture Blueprint** | A recommended architecture with services, contracts, and deployment topology | Arch Proposal |
| **Template** | A reusable, versioned, sellable Architecture Blueprint with parameterized slots | Arch Proposal + Delivery |
| **Manifest** | A concrete, deployable desired-state document derived from a Blueprint + client params | Manifest |
| **Desired State** | What the system should look like (services, ports, images, configs) | Manifest |
| **Actual State** | What Docker runtime reports as running right now | Deployment |
| **Drift** | Difference between Desired State and Actual State | Deployment |
| **License Envelope** | Metadata wrapping a Template for access control (tier, expiry, client ID) | Delivery |
| **Reconciliation** | Process of converging Actual State toward Desired State | Deployment |

---

## PART 3 — CONTRACTS BETWEEN DOMAINS

### 3.1 Versioning strategy

All contracts follow **SchemaVer** (addition-model-revision): `1-0-0`

Rules:
- **Addition** (1.x.x): New required field → major bump, breaking
- **Model** (x.1.x): New optional field or enum value → compatible
- **Revision** (x.x.1): Description change, no structural change

Every contract includes `schemaVersion` as mandatory first field. Consumers MUST reject unknown major versions. Consumers MUST ignore unknown optional fields.

### 3.2 Contract: Intake → Analysis

**Name:** `CodebaseSnapshot`
**Version:** `1-0-0`
**Transport:** In-process function call (same Node process initially), migrable to HTTP/event

```typescript
// contracts/intake-analysis/v1/CodebaseSnapshot.ts

interface CodebaseSnapshot {
  schemaVersion: "1-0-0"
  snapshotId: string              // UUIDv4, generated at intake
  timestamp: string               // ISO 8601
  source: {
    type: "github" | "gitlab" | "local" | "upload"
    url?: string                  // Git URL if remote
    ref?: string                  // Branch/tag/commit
  }
  packageJson: {                  // Parsed, not raw
    name: string
    version?: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
    engines?: Record<string, string>
  }
  fileTree: string[]              // Relative paths, max depth 4
  selectedFiles: {                // Files explicitly selected for deep analysis
    path: string
    contentHash: string           // SHA-256 of content
    sizeBytes: number
    language: string              // Detected: "javascript" | "typescript" | "python" | ...
  }[]
  dockerPresence: {
    hasDockerfile: boolean
    hasCompose: boolean
    composeServices?: string[]    // Service names from compose
  }
  ciPresence: {
    provider?: "github-actions" | "gitlab-ci" | "circleci" | "none"
    hasWorkflows: boolean
  }
}
```

**Validation point:** Intake validates before emitting. Analysis rejects if `schemaVersion` major ≠ 1 or if `snapshotId` / `packageJson` are missing.

### 3.3 Contract: Analysis → Arch Proposal

**Name:** `AnalysisReport`
**Version:** `1-0-0`

```typescript
// contracts/analysis-proposal/v1/AnalysisReport.ts

interface AnalysisReport {
  schemaVersion: "1-0-0"
  snapshotId: string              // Traces back to CodebaseSnapshot
  analysisId: string              // UUIDv4
  timestamp: string

  stackFingerprint: {
    runtime: ("node" | "python" | "go" | "java" | "rust")[]
    frameworks: string[]          // e.g. ["express", "react", "next"]
    databases: string[]           // e.g. ["postgres", "redis"]
    messaging: string[]           // e.g. ["nats", "rabbitmq"]
    containerization: "docker" | "podman" | "none"
    orchestration: "compose" | "kubernetes" | "none"
  }

  patterns: {
    detected: PatternMatch[]
    antiPatterns: AntiPatternMatch[]
  }

  risks: {
    id: string
    category: "security" | "scalability" | "maintainability" | "observability"
    severity: "critical" | "high" | "medium" | "low"
    description: string
    evidence: { file: string; line?: number; snippet?: string }
  }[]

  qualityMetrics: {
    testCoverage: "none" | "minimal" | "moderate" | "comprehensive"
    ciMaturity: "none" | "basic" | "standard" | "advanced"
    observability: "none" | "logging" | "metrics" | "full"
    typeChecking: "none" | "partial" | "full"
    dependencyHealth: "outdated" | "current" | "pinned"
  }
}

interface PatternMatch {
  pattern: string                 // e.g. "monolith", "microservices", "modular-monolith"
  confidence: number              // 0.0 - 1.0
  evidence: string[]              // File paths supporting detection
}

interface AntiPatternMatch {
  pattern: string                 // e.g. "god-file", "shared-mutable-state", "stringly-typed"
  severity: "critical" | "high" | "medium"
  location: { file: string; description: string }[]
}
```

### 3.4 Contract: Arch Proposal → Manifest

**Name:** `ArchitectureSpec`
**Version:** `1-0-0`

```typescript
// contracts/proposal-manifest/v1/ArchitectureSpec.ts

interface ArchitectureSpec {
  schemaVersion: "1-0-0"
  specId: string                  // UUIDv4
  analysisId: string              // Traces back
  snapshotId: string              // Traces back to original intake
  timestamp: string

  metadata: {
    name: string
    description: string
    category: "compliance" | "observability" | "event-systems" | "api-platform" | "data-pipeline"
    targetStack: string[]
    estimatedComplexity: "low" | "medium" | "high"
    qualityScore: number          // 0.0 - 1.0
  }

  topology: {
    services: ServiceDefinition[]
    networks: NetworkDefinition[]
    volumes: VolumeDefinition[]
  }

  contracts: ServiceContract[]    // Inter-service contracts

  parameters: {                   // Slots for client customization
    key: string
    type: "string" | "number" | "boolean" | "enum"
    default: unknown
    description: string
    required: boolean
    enumValues?: string[]
  }[]

  templateRef?: {                 // If derived from a template
    templateId: string
    templateVersion: string
    overrides: Record<string, unknown>
  }
}

interface ServiceDefinition {
  name: string
  image: string
  port: number
  exposedPort?: number
  env: Record<string, string>     // With ${PARAM} references to parameters
  healthCheck?: {
    path: string
    interval: string
    timeout: string
  }
  dependsOn?: string[]
  resources?: {
    cpuLimit: string
    memoryLimit: string
  }
}

interface NetworkDefinition {
  name: string
  driver: "bridge" | "overlay"
  internal: boolean
}

interface VolumeDefinition {
  name: string
  driver: "local"
  mountPath: string
  service: string
}

interface ServiceContract {
  consumer: string                // Service name
  provider: string                // Service name
  protocol: "http" | "grpc" | "tcp" | "amqp"
  port: number
  healthEndpoint?: string
}
```

### 3.5 Contract: Manifest → Deployment

**Name:** `DeploymentManifest`
**Version:** `1-0-0`

```typescript
// contracts/manifest-deployment/v1/DeploymentManifest.ts

interface DeploymentManifest {
  schemaVersion: "1-0-0"
  manifestId: string
  specId: string                  // Traces back
  timestamp: string

  desiredState: {
    services: {
      name: string
      containerName: string       // Deterministic: {manifestId}-{name}-{port}
      image: string
      ports: { host: number; container: number }[]
      env: Record<string, string> // Fully resolved (no ${PARAM})
      restart: "always" | "on-failure" | "no"
      healthCheck?: {
        command: string[]
        interval: number          // seconds
        timeout: number
        retries: number
      }
    }[]
    networks: { name: string; driver: string }[]
    volumes: { name: string; source: string; target: string }[]
  }

  reconciliation: {
    strategy: "restart" | "recreate" | "rolling"
    maxRetries: number
    backoffSeconds: number
    deadlineSeconds: number
  }
}
```

**State feedback event (Deployment → Manifest):**

```typescript
interface DeploymentStateEvent {
  schemaVersion: "1-0-0"
  manifestId: string
  timestamp: string
  type: "deployed" | "degraded" | "failed" | "removed" | "drift-detected"
  services: {
    name: string
    status: "running" | "stopped" | "error" | "missing"
    containerName?: string
    port?: number
    error?: string
  }[]
}
```

### 3.6 Contract: Arch Proposal → Delivery

**Name:** `TemplatePackage`
**Version:** `1-0-0`

```typescript
// contracts/proposal-delivery/v1/TemplatePackage.ts

interface TemplatePackage {
  schemaVersion: "1-0-0"
  templateId: string
  version: string                 // SemVer
  metadata: {
    name: string
    description: string
    category: string
    tags: string[]
    author: string
    createdAt: string
    updatedAt: string
  }

  license: {
    type: "free" | "starter" | "professional" | "enterprise"
    restrictions: string[]        // e.g. ["no-resale", "single-org"]
    expiresAt?: string            // ISO 8601, null = perpetual
  }

  spec: ArchitectureSpec          // The full architecture spec

  assets: {                       // Bundled files
    path: string                  // Relative within package
    type: "dockerfile" | "compose" | "config" | "migration" | "readme"
    contentHash: string
  }[]

  customization: {
    parameters: ArchitectureSpec["parameters"]
    presets: {
      name: string                // e.g. "small", "production", "enterprise"
      values: Record<string, unknown>
    }[]
  }
}
```

---

## PART 4 — FOLDER STRUCTURE

### 4.1 Target monorepo layout

```
compliance-trace-layer-beta/
│
├── contracts/                          # PUBLISHED LANGUAGE (shared schemas)
│   ├── intake-analysis/
│   │   └── v1/
│   │       ├── CodebaseSnapshot.ts
│   │       ├── CodebaseSnapshot.schema.json   # JSON Schema for runtime validation
│   │       └── index.ts
│   ├── analysis-proposal/
│   │   └── v1/
│   │       ├── AnalysisReport.ts
│   │       ├── AnalysisReport.schema.json
│   │       └── index.ts
│   ├── proposal-manifest/
│   │   └── v1/
│   │       ├── ArchitectureSpec.ts
│   │       ├── ArchitectureSpec.schema.json
│   │       └── index.ts
│   ├── manifest-deployment/
│   │   └── v1/
│   │       ├── DeploymentManifest.ts
│   │       ├── DeploymentStateEvent.ts
│   │       └── index.ts
│   ├── proposal-delivery/
│   │   └── v1/
│   │       ├── TemplatePackage.ts
│   │       └── index.ts
│   └── package.json                    # @trace/contracts — publishable
│
├── engine/                             # RUNTIME ENGINE (open, operational)
│   ├── deployment/
│   │   ├── docker-adapter.ts           # Replaces deploy.js + control.js
│   │   ├── reconciler.ts              # Replaces supervisor.js
│   │   ├── port-allocator.ts          # Persistent port management
│   │   ├── state-store.ts             # Replaces services.json (SQLite)
│   │   └── index.ts
│   ├── manifest/
│   │   ├── manifest-compiler.ts       # ArchitectureSpec → DeploymentManifest
│   │   ├── parameter-resolver.ts      # Fills ${PARAM} slots
│   │   ├── validator.ts              # Zod validation against contract schemas
│   │   └── index.ts
│   ├── api/
│   │   ├── server.ts                  # Express HTTP layer (ONLY)
│   │   ├── middleware/
│   │   │   ├── auth.ts               # API key / JWT
│   │   │   ├── rate-limit.ts
│   │   │   ├── correlation-id.ts
│   │   │   └── error-handler.ts
│   │   ├── routes/
│   │   │   ├── deploy.ts
│   │   │   ├── services.ts
│   │   │   ├── health.ts
│   │   │   └── metrics.ts
│   │   └── index.ts
│   ├── supervisor/
│   │   ├── reconciliation-loop.ts     # Event-driven, not polling
│   │   ├── drift-detector.ts
│   │   └── index.ts
│   └── package.json                    # @trace/engine
│
├── intelligence/                       # ARCHITECTURE INTELLIGENCE (proprietary IP)
│   ├── intake/
│   │   ├── github-adapter.ts          # GitHub API → CodebaseSnapshot
│   │   ├── local-adapter.ts           # Local filesystem → CodebaseSnapshot
│   │   ├── normalizer.ts             # Unified normalization
│   │   └── index.ts
│   ├── analysis/
│   │   ├── stack-detector.ts          # Replaces inferStack()
│   │   ├── pattern-scanner.ts         # Architectural pattern detection
│   │   ├── risk-assessor.ts          # Security + quality risk analysis
│   │   ├── quality-scorer.ts         # Metrics computation
│   │   └── index.ts
│   ├── proposal/
│   │   ├── template-matcher.ts       # Matches analysis to templates
│   │   ├── gap-analyzer.ts           # What's missing vs template
│   │   ├── recommendation-engine.ts  # Generates ArchitectureSpec
│   │   └── index.ts
│   └── package.json                    # @trace/intelligence (PRIVATE, not published)
│
├── templates/                          # PRODUCT TEMPLATES (sellable IP)
│   ├── catalog.json                   # Template registry with versions
│   ├── compliance-api/
│   │   ├── template.json             # TemplatePackage (without license)
│   │   ├── assets/
│   │   │   ├── Dockerfile
│   │   │   ├── docker-compose.yml
│   │   │   ├── migrations/
│   │   │   └── README.md
│   │   └── presets/
│   │       ├── starter.json
│   │       ├── production.json
│   │       └── enterprise.json
│   ├── observability-core/
│   │   ├── template.json
│   │   ├── assets/
│   │   └── presets/
│   ├── audit-ledger/
│   │   ├── template.json
│   │   ├── assets/
│   │   └── presets/
│   ├── consent-service/
│   │   ├── template.json
│   │   ├── assets/
│   │   └── presets/
│   └── package.json                    # @trace/templates (PRIVATE, licensed distribution)
│
├── delivery/                           # LICENSING & DISTRIBUTION
│   ├── packager.ts                    # Template + License → sealed package
│   ├── license-manager.ts            # Validate, issue, revoke licenses
│   ├── distribution.ts               # Publish to registry / deliver to client
│   └── package.json                    # @trace/delivery
│
├── console/                            # UI (moved from apps/console)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── features/
│   │   │   ├── catalog/              # Reads from templates/catalog.json
│   │   │   ├── deploy/               # Calls engine API
│   │   │   └── analysis/             # Calls intelligence API
│   │   ├── services/
│   │   │   ├── api-client.ts         # Single HTTP client, configurable base URL
│   │   │   └── types.ts             # Generated from contracts/
│   │   └── ...
│   └── package.json
│
├── cli/                                # CLI (moved from tools/trace-cli)
│   ├── commands/
│   │   ├── intake.ts                 # trace intake <repo-url>
│   │   ├── analyze.ts                # trace analyze <snapshot-id>
│   │   ├── propose.ts                # trace propose <analysis-id>
│   │   ├── deploy.ts                 # trace deploy <manifest-id>
│   │   └── template.ts              # trace template list|create|publish
│   └── package.json                    # @trace/cli
│
├── docs/
│   ├── ADR/
│   │   ├── ADR-001-trace-layer-abstraction.md
│   │   ├── ADR-002-domain-separation.md          # NEW
│   │   ├── ADR-003-contract-versioning.md        # NEW
│   │   └── ADR-004-template-licensing-model.md   # NEW
│   └── architecture-diagrams/
│
├── docker-compose.yml                  # Dev environment
├── docker-compose.prod.yml            # Production
├── package.json                        # Workspace root
└── tsconfig.json                       # Shared TS config
```

### 4.2 Key separation principles

| Layer | Published? | Contains IP? | Deployable independently? |
|-------|-----------|-------------|--------------------------|
| `contracts/` | Yes (npm) | No | No (library) |
| `engine/` | Yes (open-core) | No | Yes |
| `intelligence/` | No (private) | **Yes** | Yes (API) |
| `templates/` | No (licensed) | **Yes** | No (data) |
| `delivery/` | No (private) | Partial | Yes |
| `console/` | Yes (SPA) | No | Yes |
| `cli/` | Yes (npm) | No | Yes |

---

## PART 5 — TEMPLATE STRUCTURE (Sellable, Reusable, Customizable)

### 5.1 Template anatomy

Each template is a self-contained directory with this structure:

```
templates/{template-name}/
├── template.json              # TemplatePackage (see contract 3.6)
├── assets/
│   ├── Dockerfile             # Production-ready, parameterized
│   ├── docker-compose.yml     # With ${PARAM} placeholders
│   ├── .env.template          # Environment variable template
│   ├── migrations/            # Database schemas
│   │   └── 001_initial.sql
│   ├── src/                   # Scaffold source code (if applicable)
│   └── README.md              # Customer-facing documentation
├── presets/
│   ├── starter.json           # { "DB_POOL_SIZE": 5, "REPLICAS": 1 }
│   ├── production.json        # { "DB_POOL_SIZE": 20, "REPLICAS": 3 }
│   └── enterprise.json        # { "DB_POOL_SIZE": 50, "REPLICAS": 5, "HA": true }
└── tests/
    ├── validate.ts            # Schema validation test
    └── deploy-smoke.ts        # Can it actually deploy?
```

### 5.2 Template lifecycle

```
CREATE → VALIDATE → VERSION → LICENSE → PACKAGE → DISTRIBUTE
  │          │          │          │          │          │
  │          │          │          │          │          └─ Registry/S3/direct
  │          │          │          │          └─ Seal with license envelope
  │          │          │          └─ Assign tier + restrictions
  │          │          └─ SemVer tag, immutable snapshot
  │          └─ Schema validation + deploy smoke test
  └─ Author writes template.json + assets
```

### 5.3 Customization model

Templates expose **parameters** that clients fill at deploy time:

```json
{
  "parameters": [
    {
      "key": "DB_HOST",
      "type": "string",
      "default": "localhost",
      "description": "PostgreSQL host",
      "required": true
    },
    {
      "key": "REPLICAS",
      "type": "number",
      "default": 1,
      "description": "Number of API replicas",
      "required": false
    },
    {
      "key": "LOG_FORMAT",
      "type": "enum",
      "enumValues": ["json", "text", "structured"],
      "default": "json",
      "description": "Log output format",
      "required": false
    }
  ]
}
```

**Resolution flow:** Client selects preset (e.g., "production") → preset fills defaults → client overrides specific values → parameter-resolver validates all required fields → outputs fully resolved `DeploymentManifest`.

### 5.4 Pricing model alignment

| Tier | Includes | Restrictions |
|------|----------|-------------|
| **Free** | 1-2 basic templates, starter preset only | No SLA, no customization, watermarked README |
| **Starter** | All templates, starter + production presets | Single org, no resale |
| **Professional** | All templates, all presets, priority support | Up to 5 orgs, modification allowed |
| **Enterprise** | All + custom templates + white-label | Unlimited orgs, source access for assets |

---

## PART 6 — RISKS OF MIXING RUNTIME LOGIC WITH BUSINESS IP

### 6.1 Current state: everything mixed

Today's repo has this problem map:

| What | Where | Risk |
|------|-------|------|
| Template manifests (IP) | `apps/console/src/architectures/` | Bundled into SPA build → exposed in browser |
| Analysis logic (IP) | `tools/trace-cli/trace.js` | Ships with CLI → reverse-engineerable |
| Deploy engine (runtime) | `tools/deploy-engine/` | Same repo as templates → cloning = IP theft |
| Template matching logic (IP) | `apps/console/src/services/architectureScanner.js` | Vite bundles it → visible in devtools |

### 6.2 Risk matrix

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | **Template IP leak via SPA bundle** | Certain (current) | High — all manifests visible in browser | Move templates to server-side API; serve only licensed templates per authenticated client |
| R2 | **Intelligence algorithm reverse-engineering** | High | Critical — core differentiation | Keep `intelligence/` in separate, non-published package; deploy as private API |
| R3 | **Engine used without paying for templates** | Medium | Revenue loss | Engine is open-core (free); intelligence + templates are commercial |
| R4 | **Template versioning divergence** | High (current) | Broken deployments | Contract-driven schema validation at every boundary |
| R5 | **Client runs engine fork with pirated templates** | Medium | Revenue loss | License envelope with signature verification; templates encrypted at rest |
| R6 | **Runtime vulnerability exposes template store** | Medium | IP compromise | Separate processes; engine has no filesystem access to templates/ |
| R7 | **Analysis writes directly to template folder** | Certain (current: trace.js) | Data corruption | Intake → Analysis pipeline with validation gates |

### 6.3 Architectural mitigation: Open-Core model

```
┌────────────────────────────────────────────────┐
│              OPEN (engine + contracts + cli)     │
│                                                  │
│  Anyone can run the deploy engine.               │
│  Anyone can use the contracts to build adapters. │
│  Anyone can use the CLI for intake.              │
│                                                  │
├────────────────────────────────────────────────┤
│              COMMERCIAL (intelligence + templates)│
│                                                  │
│  Analysis algorithms are proprietary.            │
│  Templates are licensed and versioned.           │
│  Delivery handles access control.                │
│                                                  │
└────────────────────────────────────────────────┘
```

**Process isolation:** The engine process NEVER loads `intelligence/` or `templates/` code. It only receives `DeploymentManifest` documents via API. If the engine is compromised, the attacker gets runtime access but zero IP.

---

## PART 7 — EXECUTION FLOWS (Traceable, Deterministic)

### 7.1 Full pipeline: Intake → Deploy

```
User provides repo URL
        │
        ▼
┌─ INTAKE ─────────────────────────────────────┐
│  1. Fetch package.json + file tree            │
│  2. Normalize to CodebaseSnapshot             │
│  3. Validate schema (Zod)                     │
│  4. Assign snapshotId (UUIDv4)                │
│  5. Persist snapshot                          │
│  6. Emit: CodebaseSnapshot                    │
└───────────────────────────┬───────────────────┘
                            │
                            ▼
┌─ ANALYSIS ───────────────────────────────────┐
│  7. Receive CodebaseSnapshot                  │
│  8. Detect stack fingerprint                  │
│  9. Scan architectural patterns               │
│ 10. Assess risks                              │
│ 11. Compute quality metrics                   │
│ 12. Assign analysisId                         │
│ 13. Emit: AnalysisReport                      │
└───────────────────────────┬───────────────────┘
                            │
                            ▼
┌─ ARCH PROPOSAL ──────────────────────────────┐
│ 14. Receive AnalysisReport                    │
│ 15. Match against template catalog            │
│ 16. Perform gap analysis                      │
│ 17. Generate ArchitectureSpec                 │
│ 18. Assign specId                             │
│ 19. ── HUMAN REVIEW GATE ──                   │  ◄── Human-in-the-loop
│ 20. Emit: ArchitectureSpec (approved)         │
└───────────────────────────┬───────────────────┘
                            │
                     ┌──────┴──────┐
                     ▼             ▼
              ┌─ MANIFEST ┐  ┌─ DELIVERY ──┐
              │ 21. Receive│  │ 24. Wrap in │
              │ 22. Resolve│  │     license │
              │     params │  │ 25. Package │
              │ 23. Compile│  │ 26. Publish │
              │     to     │  └─────────────┘
              │ Deployment │
              │  Manifest  │
              └─────┬──────┘
                    │
                    ▼
              ┌─ DEPLOYMENT ─────────────────┐
              │ 27. Validate manifest         │
              │ 28. Allocate ports            │
              │ 29. docker run per service    │
              │ 30. Update actual-state       │
              │ 31. Start reconciliation loop │
              │ 32. Emit: DeploymentStateEvent│
              └──────────────────────────────┘
```

### 7.2 Traceability chain

Every document carries IDs from upstream:

```
snapshotId ← analysisId ← specId ← manifestId ← containerName
```

Given any running container name, you can trace back through the entire chain to the original repo URL. This is the **compliance trace** that gives the platform its name.

---

## PART 8 — FAILURE MODES AND CONSISTENCY

### 8.1 Failure mode analysis

| Step | Failure | Detection | Recovery |
|------|---------|-----------|----------|
| Intake: GitHub API unavailable | Fetch timeout | HTTP 5xx / timeout | Retry 3x with exponential backoff; fail with `intake-failed` |
| Analysis: Unknown framework | No pattern match | Confidence < 0.3 | Emit report with `unknownFrameworks[]`; human review required |
| Proposal: No template match | Gap > threshold | `matchScore < 0.5` | Generate custom ArchitectureSpec from analysis (no template ref) |
| Manifest: Parameter missing | Schema validation | Zod error | Reject with specific field errors; return to human |
| Deployment: Docker daemon down | `spawn` fails | Exit code ≠ 0 | Retry with backoff; emit `deployment-failed` event |
| Deployment: Port collision | `EADDRINUSE` | getPort() fallback | Allocator retries from next available range |
| Reconciliation: Container crash loop | Restart > maxRetries | Counter in state-store | Mark service as `degraded`; emit alert; stop retrying |

### 8.2 Consistency strategy

| Mechanism | Where | Implementation |
|-----------|-------|---------------|
| **Idempotent deploys** | Deployment | containerName is deterministic from manifestId + service name. Re-deploy = same name = docker replaces |
| **State persistence** | Deployment | SQLite replaces services.json. Atomic writes, no race conditions |
| **Schema validation at boundaries** | All transitions | Zod schemas generated from TypeScript contracts. Reject-early. |
| **Event log** | All contexts | Append-only log of all emitted events with timestamps. Immutable. |
| **Human gate** | Arch Proposal | Step 19: No ArchitectureSpec reaches Manifest without explicit approval |

---

## PART 9 — ACTIONABLE CHANGES (Prioritized)

### Phase 1: Foundation (Week 1-2)

| # | Change | Files | Validates |
|---|--------|-------|-----------|
| A1 | Create `contracts/` directory with TypeScript interfaces + Zod schemas | New: 8-10 files | `npm run validate-contracts` |
| A2 | Move deploy engine to `engine/` with auth middleware | Refactor `tools/deploy-engine/` → `engine/` | Deploy engine starts, API key required |
| A3 | Replace `services.json` with SQLite (`better-sqlite3`) | `engine/deployment/state-store.ts` | No race conditions under concurrent deploys |
| A4 | Separate port from deploy engine — engine on 4010, backend on 4000 | `engine/api/server.ts` config | Both start simultaneously |
| A5 | Delete `packages/trace-engine/` (duplicate) | Remove entire directory | `docker-compose.yml` updated |

### Phase 2: Intelligence extraction (Week 3-4)

| # | Change | Files |
|---|--------|-------|
| A6 | Create `intelligence/intake/` — extract and improve `trace.js` import logic |
| A7 | Create `intelligence/analysis/` — extract `inferStack()` + add pattern detection |
| A8 | Move manifests from `apps/console/src/architectures/` to `templates/` |
| A9 | Unify manifest schema — all templates use `ArchitectureSpec v1` |
| A10 | Add schema validation to every manifest read/write |

### Phase 3: Productization (Week 5-8)

| # | Change | Files |
|---|--------|-------|
| A11 | Build `intelligence/proposal/` — template matching + recommendation engine |
| A12 | Build `delivery/` — license envelope, packaging, distribution |
| A13 | Console reads templates via authenticated API, not Vite glob import |
| A14 | CLI commands: `trace intake`, `trace analyze`, `trace propose`, `trace deploy` |
| A15 | Add human review gate in proposal flow (CLI prompt or web UI approval step) |

---

## PART 10 — CHECKLIST DE VERIFICACIÓN

### Contracts
- [ ] `contracts/` directory exists with TypeScript interfaces
- [ ] Every interface has `schemaVersion` as first field
- [ ] Zod schemas generated and tested for each contract
- [ ] `npm run validate-contracts` passes

### Separation
- [ ] `engine/` has zero imports from `intelligence/` or `templates/`
- [ ] `intelligence/` has zero imports from `engine/`
- [ ] `templates/` contains no executable code
- [ ] Console SPA makes zero direct filesystem reads of templates
- [ ] CLI talks to intelligence via API, not direct import

### Traceability
- [ ] Every document carries `snapshotId` chain
- [ ] Given a container name, the full chain resolves to a repo URL
- [ ] Event log captures every state transition
- [ ] Correlation IDs propagate through all HTTP requests

### Determinism
- [ ] Same repo URL + same template → same DeploymentManifest (modulo timestamps)
- [ ] Port allocation is deterministic given manifest content
- [ ] No global mutable state (`let port = 8081` eliminated)

### Security
- [ ] Deploy engine requires API key
- [ ] No `exec()` with string interpolation
- [ ] All Docker commands use `spawn()` with argument arrays
- [ ] No path traversal possible in manifest-runner
- [ ] Templates encrypted at rest in delivery pipeline

---

## PART 11 — RIESGOS RESIDUALES

1. **SQLite single-writer limitation** — If engine scales horizontally, SQLite becomes a bottleneck. Migration to PostgreSQL needed at ~100 concurrent deploys.

2. **Template versioning backward compatibility** — Once templates are sold, breaking changes require migration tooling for existing clients. Not yet designed.

3. **Intelligence as API creates latency** — Separating intelligence into its own service adds network hops to the proposal flow. Acceptable for async workflows; problematic if real-time UI is needed.

4. **Human-in-the-loop bottleneck** — The review gate at step 19 means throughput is limited by human capacity. Batch approval or confidence-based auto-approval needed for scale.

---

## PART 12 — SIGUIENTES 3 ACCIONES

1. **Crear `contracts/` con los 5 esquemas TypeScript + Zod**, publicar como `@trace/contracts` interno, y añadir `npm run validate-contracts` al CI. Esto establece la base para todo lo demás.

2. **Mover deploy engine a `engine/` con auth middleware y SQLite**, eliminar `packages/trace-engine/`, y separar puerto. Esto desbloquea la operación segura del runtime.

3. **Redactar ADR-002 (Domain Separation) y ADR-003 (Contract Versioning)** formalizando las decisiones de este documento. Sin ADRs, las decisiones se perderán en conversaciones.

---

*Documento de arquitectura v1.0.0-draft. Requiere revisión y formalización mediante ADR antes de ejecución.*
