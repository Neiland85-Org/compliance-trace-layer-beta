# Arquitectura de Microservicios - Compliance Trace Layer

## Visión General

El sistema está diseñado con arquitectura de microservicios para permitir escalabilidad, mantenibilidad y despliegue independiente de componentes.

## Diagrama de Arquitectura

```
┌─────────────┐
│   Frontend  │
│ React + R3F │
│  (Port 5173)│
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│         API Gateway                 │
│  - CORS, Rate Limiting, Helmet      │
│  - Request routing & proxying       │
│  - Logging & monitoring             │
│         (Port 4000)                 │
└────┬──────────────────────┬─────────┘
     │                      │
     │ HTTP                 │ HTTP
     ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│Trace Service │    │Cookie Consent    │
│  (Port 4001) │    │Service (Port 4002)│
└──────┬───────┘    └────────┬─────────┘
       │                     │
       │ PostgreSQL          │ PostgreSQL
       ▼                     ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│  - traces table                     │
│  - cookie_consents table            │
│  - cookie_categories table          │
│  - cookie_vendors table             │
│         (Port 5432)                 │
└─────────────────────────────────────┘
```

## Componentes

### 1. API Gateway (Port 4000)

**Responsabilidades:**

- Punto de entrada único para todas las peticiones del frontend
- Aplicar seguridad global: CORS, Helmet, rate limiting
- Enrutar peticiones a servicios correspondientes
- Agregar headers de correlación para tracing
- Logging centralizado

**Tecnologías:**

- Express.js 5.1.0
- http-proxy-middleware para proxy
- helmet para headers de seguridad
- express-rate-limit para protección DoS
- winston para logging

**Endpoints:**

- `/api/trace/*` → proxy a Trace Service
- `/api/cookies/*` → proxy a Cookie Consent Service
- `/api/health` → healthcheck del gateway

### 2. Trace Service (Port 4001)

**Responsabilidades:**

- Gestionar transacciones de trazabilidad de carbono
- Crear, verificar y auditar transacciones
- Persistir en PostgreSQL (tabla `traces`)
- Generar hashes SHA-256 para integridad

**Tecnologías:**

- Express.js 5.1.0
- pg (PostgreSQL client)
- crypto (SHA-256 hashing)
- express-validator

**Endpoints:**

- `POST /create` - Crear nueva transacción
- `GET /verify/:hash` - Verificar transacción por hash
- `GET /check` - Verificar estado KYC/AML
- `GET /health` - Healthcheck

**Modelo de datos:**

```sql
traces (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE,
  hash VARCHAR(64) UNIQUE,
  status VARCHAR(20),
  timestamp TIMESTAMP,
  metadata JSONB
)
```

### 3. Cookie Consent Service (Port 4002)

**Responsabilidades:**

- Gestionar consentimientos de cookies GDPR-compliant
- Registrar, recuperar y retirar consentimientos
- Proveer catálogo de categorías y vendors
- Auditoría completa de consentimientos

**Tecnologías:**

- Express.js 5.1.0
- pg (PostgreSQL client)
- uuid para generación de IDs
- express-validator

**Endpoints:**

- `POST /consent` - Registrar consentimiento
- `GET /consent/:user_id` - Recuperar consentimiento
- `DELETE /consent/:user_id` - Retirar consentimiento
- `GET /categories` - Listar categorías de cookies
- `GET /vendors` - Listar vendors de terceros
- `GET /audit/:user_id` - Historial de consentimientos
- `GET /health` - Healthcheck

**Modelo de datos:**

```sql
cookie_consents (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(10),
  timestamp TIMESTAMP,
  consent_given BOOLEAN,
  preferences JSONB,
  third_party_vendors JSONB,
  expires_at TIMESTAMP,
  withdrawn_at TIMESTAMP
)

cookie_categories (
  id SERIAL PRIMARY KEY,
  category_key VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  description TEXT,
  is_necessary BOOLEAN,
  default_enabled BOOLEAN
)

cookie_vendors (
  id SERIAL PRIMARY KEY,
  vendor_key VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  description TEXT,
  privacy_policy_url TEXT,
  category_id INTEGER REFERENCES cookie_categories(id),
  cookies_set JSONB,
  retention_period VARCHAR(50)
)
```

### 4. PostgreSQL Database (Port 5432)

**Responsabilidades:**

- Almacenamiento persistente de todos los datos
- Transacciones ACID
- Índices para performance
- Backups y recuperación

**Configuración:**

- Versión: PostgreSQL 16
- Pool de conexiones: max 20 por servicio
- Timeout: 30 segundos idle

**Esquema:**

- `traces` - Transacciones de trazabilidad
- `cookie_consents` - Consentimientos de usuarios
- `cookie_categories` - Catálogo de categorías
- `cookie_vendors` - Catálogo de vendors

### 5. Frontend (Port 5173)

**Responsabilidades:**

- Interfaz de usuario 3D con React Three Fiber
- Banner de cookies integrado en escena 3D
- Comunicación con API Gateway
- Gestión de estado con Zustand

**Tecnologías:**

- React 18.3.1
- Vite 7.1.10
- React Three Fiber 8.18.0
- @react-three/drei (Html component)
- Three.js 0.171.0
- Zustand 5.0.8
- Axios para HTTP
- TailwindCSS 4.1.14

**Componentes clave:**

- `CookieBanner.jsx` - Banner GDPR-compliant en 3D
- `EarthScene.jsx` - Escena 3D principal
- `Dashboard.jsx` - Panel de transacciones
- `useCookieConsent.js` - Hook de gestión de cookies

## Flujos de Datos

### Flujo de Creación de Transacción

```
1. Usuario → Frontend: Click "Generate Transaction"
2. Frontend → API Gateway: POST /api/trace/create
3. API Gateway → Trace Service: POST /create
4. Trace Service → PostgreSQL: INSERT INTO traces
5. PostgreSQL → Trace Service: Record created
6. Trace Service → API Gateway: {transaction_id, hash, status}
7. API Gateway → Frontend: Response
8. Frontend: Actualiza UI
```

### Flujo de Consentimiento de Cookies

```
1. Usuario → Frontend: Abre sitio por primera vez
2. Frontend → API Gateway: GET /api/cookies/consent/:user_id
3. API Gateway → Cookie Consent Service: GET /consent/:user_id
4. Cookie Consent Service → PostgreSQL: SELECT FROM cookie_consents
5. PostgreSQL → Cookie Consent Service: No consent found (404)
6. Cookie Consent Service → API Gateway: 404
7. API Gateway → Frontend: 404
8. Frontend: Muestra CookieBanner
9. Usuario → Frontend: Click "Aceptar todas"
10. Frontend → API Gateway: POST /api/cookies/consent
11. API Gateway → Cookie Consent Service: POST /consent
12. Cookie Consent Service → PostgreSQL: INSERT INTO cookie_consents
13. PostgreSQL → Cookie Consent Service: Record created
14. Cookie Consent Service → API Gateway: {id, preferences, expires_at}
15. API Gateway → Frontend: Response
16. Frontend: Oculta banner, guarda en localStorage
```

## Seguridad

### Capa de API Gateway

- CORS restrictivo (solo orígenes configurados)
- Rate limiting (100 req/15min por IP)
- Helmet headers (CSP, HSTS, X-Frame-Options, etc.)
- Request ID para tracing
- Logging de todas las peticiones

### Capa de Servicios

- Validación de entrada con express-validator
- Sanitización de datos
- Prepared statements para prevenir SQL injection
- Logging de errores sin exponer stack traces

### Capa de Base de Datos

- Conexiones con SSL en producción
- Pool de conexiones limitado
- Índices para prevenir full table scans
- Backups automáticos

### Cumplimiento GDPR

- Registro de IP y user_agent para auditoría
- Expiración automática de consentimientos (12 meses)
- Retiro de consentimiento en cualquier momento
- Sin cookies no-esenciales antes del consentimiento
- Auditoría completa de cambios

## Escalabilidad

### Horizontal Scaling

- Cada servicio puede escalarse independientemente
- API Gateway: múltiples instancias detrás de load balancer
- Trace Service: múltiples instancias con pool de BD compartido
- Cookie Consent Service: múltiples instancias

### Vertical Scaling

- PostgreSQL: aumentar recursos (CPU, RAM, IOPS)
- Servicios: aumentar límites de memoria/CPU en Docker

### Caching (futuro)

- Redis para cache de consentimientos frecuentes
- Cache de categorías y vendors (raramente cambian)

## Monitoreo y Observabilidad

### Logging

- Winston con formato JSON
- Niveles: error, warn, info, debug
- Correlación de requests con X-Request-ID

### Healthchecks

- Cada servicio expone `/health`
- Docker healthchecks integrados
- Verificación de conectividad a BD

### Métricas (futuro)

- Prometheus para métricas
- Grafana para visualización
- Alertas en Slack/PagerDuty

## Despliegue

### Desarrollo

```bash
docker-compose up
```

### Producción (futuro)

- Kubernetes con Helm charts
- CI/CD con GitHub Actions
- Blue-green deployment
- Rollback automático en fallos

## Migración Futura

### Database per Service

Actualmente usamos shared database por simplicidad. Migración futura:

1. **Trace Service DB**: PostgreSQL dedicado para traces
2. **Cookie Consent Service DB**: PostgreSQL dedicado para consents
3. **Comunicación**: Event-driven con RabbitMQ/Kafka
4. **Consistencia**: Saga pattern para transacciones distribuidas

### Service Mesh

- Istio o Linkerd para:
  - mTLS entre servicios
  - Circuit breaking
  - Retry policies
  - Distributed tracing

### Event-Driven Architecture

- Message broker (RabbitMQ/Kafka)
- Eventos: TraceCreated, ConsentGiven, ConsentWithdrawn
- Subscribers: Analytics Service, Notification Service

## Referencias

- [Microservices Patterns](https://microservices.io/patterns/)
- [GDPR Cookie Consent Requirements](https://gdpr.eu/cookies/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
