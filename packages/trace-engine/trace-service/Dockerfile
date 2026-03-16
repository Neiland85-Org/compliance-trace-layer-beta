FROM node:22-alpine

WORKDIR /app

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R node:node logs

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Ensure node user owns all files
RUN chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]