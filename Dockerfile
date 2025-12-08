# syntax=docker/dockerfile:1.4
# Multi-stage build for standalone deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (separate layer for better caching)
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies with cache mounts (faster rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    cd backend && npm ci --no-audit --no-fund --build-from-source=false

RUN --mount=type=cache,target=/root/.npm \
    cd frontend && npm ci --no-audit --no-fund

# Copy source files (only invalidates if code changes)
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/
COPY frontend/src ./frontend/src/
COPY frontend/index.html ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/tsconfig.node.json ./frontend/
COPY frontend/vite.config.ts ./frontend/

# Build applications
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies in single layer
RUN apk add --no-cache curl sqlite

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    cd backend && npm ci --omit=dev --no-audit --no-fund --build-from-source=false

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist/
COPY --from=builder /app/frontend/build ./frontend/build/

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production \
    DB_PATH=/app/data/growflow.db

# Expose port
EXPOSE 8080

# Labels
LABEL \
    org.opencontainers.image.title="GrowFlow Plant Tracker" \
    org.opencontainers.image.description="Standalone plant tracking system for documenting the complete grow process" \
    org.opencontainers.image.vendor="GrowFlow" \
    org.opencontainers.image.authors="Moritz Heine" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/grow-flow/growflow" \
    org.opencontainers.image.source="https://github.com/grow-flow/growflow"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "/app/backend/dist/index.js"]
