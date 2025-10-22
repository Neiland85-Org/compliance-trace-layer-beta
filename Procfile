# Procfile for cloud platform deployments (Heroku, Railway, Render)
# Note: This is for deploying as a monolith. For microservices, use separate deployments.

# API Gateway (primary web process)
web: cd backend/api-gateway && npm start

# Alternative: Use multiple processes (requires process manager add-on)
# api-gateway: cd backend/api-gateway && npm start
# trace-service: cd backend/trace-service && npm start
# cookie-consent-service: cd backend/cookie-consent-service && npm start

# Database migrations (run as release phase if supported)
# release: cd backend/database/migrations && psql $DATABASE_URL -f schema.sql
