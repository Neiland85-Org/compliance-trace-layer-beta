# Deployment Guide - Compliance Trace Layer Beta

This guide covers deployment strategies for local development, staging, and production environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platform Deployment](#cloud-platform-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Migrations](#database-migrations)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js v22.x LTS (recommended) or v20.x LTS
- npm v10.x or higher
- PostgreSQL 16 (optional if using Docker)
- Docker & Docker Compose (for containerized development)

### Quick Start (Without Docker)

1. **Install Dependencies**

```bash
# Backend services
cd backend/api-gateway && npm install
cd ../trace-service && npm install
cd ../cookie-consent-service && npm install

# Frontend
cd ../../frontend && npm install
```

2. **Configure Environment**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your local database credentials

# Frontend
cp frontend/.env.example frontend/.env
# Default values should work for local development
```

3. **Setup Database**

```bash
# Create database
createdb compliance_trace

# Run migrations
psql -U postgres -d compliance_trace -f backend/database/migrations/schema.sql
```

4. **Start Services**

Open 4 terminal windows:

```bash
# Terminal 1: Trace Service
cd backend/trace-service && npm run dev

# Terminal 2: Cookie Consent Service
cd backend/cookie-consent-service && npm run dev

# Terminal 3: API Gateway
cd backend/api-gateway && npm run dev

# Terminal 4: Frontend
cd frontend && npm run dev
```

5. **Verify Services**

- Frontend: http://localhost:5173
- API Gateway: http://localhost:4000/api/health
- Trace Service: http://localhost:4001/health
- Cookie Consent Service: http://localhost:4002/health

---

## Docker Deployment

### Development with Docker Compose

1. **Create Environment File**

```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Start All Services**

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
```

3. **Stop Services**

```bash
docker-compose down

# Remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### Production with Docker Compose

1. **Create Production Environment**

```bash
cp .env.example .env.production
# Configure with production values:
# - Strong POSTGRES_PASSWORD
# - Production ALLOWED_ORIGINS
# - Production VITE_API_URL
```

2. **Deploy Production Stack**

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Monitor Services**

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api-gateway
```

### Docker Service Management

```bash
# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale trace-service=3

# Update single service
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway

# Execute commands inside containers
docker-compose exec postgres psql -U postgres -d compliance_trace
docker-compose exec api-gateway sh
```

---

## Cloud Platform Deployment

### Heroku

1. **Prerequisites**

```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS
# or visit: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login
```

2. **Create Heroku App**

```bash
# Create app
heroku create compliance-trace-beta

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://compliance-trace-beta.herokuapp.com
heroku config:set LOG_LEVEL=info
heroku config:set LOG_FORMAT=json
```

3. **Deploy**

```bash
# Deploy via Git
git push heroku main

# Or deploy specific branch
git push heroku develop:main
```

4. **Run Migrations**

```bash
heroku run "psql \$DATABASE_URL -f backend/database/migrations/schema.sql"
```

5. **View Logs**

```bash
heroku logs --tail
```

### Railway.app

1. **Create Project**

- Visit https://railway.app
- Connect GitHub repository
- Select "compliance-trace-layer-beta"

2. **Add PostgreSQL**

- Click "New" → "Database" → "PostgreSQL"
- Railway automatically sets DATABASE_URL

3. **Configure Services**

Create services for each microservice:
- api-gateway (Start Command: `cd backend/api-gateway && npm start`)
- trace-service (Start Command: `cd backend/trace-service && npm start`)
- cookie-consent-service (Start Command: `cd backend/cookie-consent-service && npm start`)
- frontend (Start Command: `cd frontend && npm run build && npx serve -s dist -l 5173`)

4. **Set Environment Variables**

For each service, add:
```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.railway.app
LOG_LEVEL=info
LOG_FORMAT=json
```

5. **Deploy**

Railway automatically deploys on git push to connected branch.

### Render.com

1. **Create Web Services**

- API Gateway: Node service, start command `cd backend/api-gateway && npm start`
- Trace Service: Private service, start command `cd backend/trace-service && npm start`
- Cookie Consent Service: Private service, start command `cd backend/cookie-consent-service && npm start`
- Frontend: Static site, build command `cd frontend && npm run build`, publish directory `frontend/dist`

2. **Create PostgreSQL Database**

- Add PostgreSQL database from Render dashboard
- Copy DATABASE_URL

3. **Configure Environment**

Set environment variables in each service dashboard.

---

## Kubernetes Deployment

### Prerequisites

- kubectl configured
- Kubernetes cluster (EKS, GKE, AKS, or local minikube)
- helm (optional, for package management)

### Deployment Manifests

Create `k8s/` directory with the following structure:

```
k8s/
├── namespace.yaml
├── postgres/
│   ├── statefulset.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── api-gateway/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── trace-service/
│   ├── deployment.yaml
│   └── service.yaml
├── cookie-consent-service/
│   ├── deployment.yaml
│   └── service.yaml
├── frontend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
└── secrets.yaml
```

### Basic Kubernetes Commands

```bash
# Create namespace
kubectl create namespace compliance-trace

# Apply configurations
kubectl apply -f k8s/ -n compliance-trace

# Check status
kubectl get pods -n compliance-trace
kubectl get services -n compliance-trace

# View logs
kubectl logs -f deployment/api-gateway -n compliance-trace

# Scale services
kubectl scale deployment api-gateway --replicas=3 -n compliance-trace

# Update deployment
kubectl set image deployment/api-gateway api-gateway=your-registry/api-gateway:v2 -n compliance-trace

# Rollback deployment
kubectl rollout undo deployment/api-gateway -n compliance-trace
```

---

## Environment Configuration

### Required Environment Variables

#### Backend Services (All)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Service port | Yes | varies |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `LOG_LEVEL` | Logging level | No | `info` |
| `LOG_FORMAT` | Log output format | No | `json` |

#### API Gateway

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes | `http://localhost:5173` |
| `TRACE_SERVICE_URL` | Trace service URL | Yes | `http://localhost:4001` |
| `COOKIE_CONSENT_SERVICE_URL` | Cookie service URL | Yes | `http://localhost:4002` |

#### Frontend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | API Gateway URL | Yes | `http://localhost:4000` |
| `VITE_MODE` | Build mode | No | `development` |

### Security Best Practices

1. **Never commit .env files** - Always use .env.example as template
2. **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault)
3. **Rotate credentials** regularly (every 90 days minimum)
4. **Use strong passwords** - minimum 16 characters, alphanumeric + symbols
5. **Enable SSL/TLS** for all production connections
6. **Restrict database access** - use firewall rules and VPC peering

---

## Database Migrations

### Running Migrations

**Docker:**
```bash
docker-compose exec postgres psql -U postgres -d compliance_trace -f /docker-entrypoint-initdb.d/schema.sql
```

**Local:**
```bash
psql -U postgres -d compliance_trace -f backend/database/migrations/schema.sql
```

**Heroku:**
```bash
heroku run "psql \$DATABASE_URL -f backend/database/migrations/schema.sql"
```

### Backup and Restore

**Backup:**
```bash
# Docker
docker-compose exec postgres pg_dump -U postgres compliance_trace > backup_$(date +%Y%m%d_%H%M%S).sql

# Local
pg_dump -U postgres compliance_trace > backup.sql
```

**Restore:**
```bash
# Docker
docker-compose exec -T postgres psql -U postgres compliance_trace < backup.sql

# Local
psql -U postgres compliance_trace < backup.sql
```

---

## Monitoring & Logging

### Health Checks

All services expose health check endpoints:

- API Gateway: `GET /api/health`
- Trace Service: `GET /health`
- Cookie Consent Service: `GET /health`
- Frontend (nginx): `GET /health`

### Logging

All backend services use Winston for structured logging:

```bash
# View real-time logs (Docker)
docker-compose logs -f api-gateway

# Filter by log level
docker-compose logs api-gateway | grep ERROR

# Export logs
docker-compose logs --no-color > logs_$(date +%Y%m%d).txt
```

### Metrics Collection (Recommended for Production)

Install Prometheus + Grafana:

```bash
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :4000
# or
netstat -tulpn | grep 4000

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres
# or
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### 3. Frontend Can't Connect to Backend

1. Check CORS configuration in backend/.env
2. Verify VITE_API_URL in frontend/.env
3. Check API Gateway is running: `curl http://localhost:4000/api/health`

#### 4. Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check disk space
docker system df
```

#### 5. Node Module Issues

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Debug Mode

Enable debug logging:

```bash
# Backend
LOG_LEVEL=debug docker-compose up

# Frontend
VITE_DEBUG=true npm run dev
```

### Performance Issues

1. **Check resource usage:**
```bash
docker stats
```

2. **Increase Docker resources:**
   - Docker Desktop → Settings → Resources
   - Increase Memory to 4GB+
   - Increase CPUs to 4+

3. **Optimize database:**
```sql
-- Run ANALYZE
ANALYZE;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured securely
- [ ] Strong database password set
- [ ] SSL/TLS certificates configured
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured appropriately
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] Security headers verified (use https://securityheaders.com)
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/Neiland85-Org/compliance-trace-layer-beta/issues
- Documentation: README.md, ARCHITECTURE.md, SECURITY_SETUP.md

---

Last updated: 2025-10-22
