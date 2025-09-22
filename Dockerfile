# Multi-stage build for standalone deployment
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm ci --no-audit --no-fund
RUN cd frontend && npm ci --no-audit --no-fund

# Copy and build backend
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

# Copy and build frontend
COPY frontend/src ./frontend/src/
COPY frontend/public ./frontend/public/
COPY frontend/tsconfig.json ./frontend/
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache curl sqlite

WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev --no-audit --no-fund

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist/
COPY --from=builder /app/frontend/build ./frontend/build/

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/growflow.db

# Expose port
EXPOSE 8080

# Labels
LABEL \
    org.opencontainers.image.title="GrowFlow Plant Tracker" \
    org.opencontainers.image.description="Standalone plant tracking system for documenting the complete grow process" \
    org.opencontainers.image.vendor="GrowFlow" \
    org.opencontainers.image.authors="Moritz Heine" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/moritzheine/growflow" \
    org.opencontainers.image.source="https://github.com/moritzheine/growflow"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "/app/backend/dist/index.js"]