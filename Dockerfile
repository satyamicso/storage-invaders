# Multi-stage production Dockerfile for Storage Invaders
# Optimized for Google Cloud Run (Stateless, Non-root, Minimal attack surface)

# Stage 1: Build client, server, and shared workspaces
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci --legacy-peer-deps

# Copy source code
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# Build all workspaces
RUN npm run build --workspace=@storage-invaders/shared && \
    npm run build --workspace=@storage-invaders/client && \
    npm run build --workspace=@storage-invaders/server

# Stage 2: Minimal production runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Security: Run as unprivileged non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist

# Set file ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["node", "server/dist/index.js"]
