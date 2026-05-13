FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create logs and uploads directories
RUN mkdir -p logs uploads

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S testbook -u 1001 && \
    chown -R testbook:nodejs /app

USER testbook

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["dumb-init", "node", "src/server.js"]
