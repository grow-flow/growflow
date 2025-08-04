# Use Node.js Alpine as base for now (can be optimized later)
FROM node:18-alpine

# Install bashio for Home Assistant integration
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    python3 \
    make \
    g++ \
    sqlite

# Install bashio
RUN curl -J -L -o /tmp/bashio.tar.gz \
    "https://github.com/hassio-addons/bashio/archive/v0.16.2.tar.gz" \
    && mkdir /tmp/bashio \
    && tar zxvf /tmp/bashio.tar.gz --strip 1 -C /tmp/bashio \
    && mv /tmp/bashio/lib /usr/lib/bashio \
    && ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
    && rm -rf /tmp/bashio*

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies (including dev dependencies for build)
RUN npm ci --no-audit --no-fund
RUN cd backend && npm ci --no-audit --no-fund
RUN cd frontend && npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build applications
RUN cd frontend && npm run build
RUN cd backend && npm run build

# Clean up dev dependencies after build
RUN npm ci --only=production --no-audit --no-fund
RUN cd backend && npm ci --only=production --no-audit --no-fund
RUN cd frontend && npm ci --only=production --no-audit --no-fund

# Clean up development dependencies and cache
RUN npm cache clean --force \
    && rm -rf /tmp/* /var/cache/apk/* /root/.npm

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/data/growflow.db

# Labels for Home Assistant
LABEL \
    io.hass.name="GrowFlow Plant Tracker" \
    io.hass.description="Plant tracking system with automation and Home Assistant integration" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    maintainer="Moritz Heine" \
    org.opencontainers.image.title="GrowFlow Plant Tracker" \
    org.opencontainers.image.description="Plant tracking system with automation and Home Assistant integration" \
    org.opencontainers.image.vendor="GrowFlow" \
    org.opencontainers.image.authors="Moritz Heine" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/moritzheine/growflow" \
    org.opencontainers.image.source="https://github.com/moritzheine/growflow" \
    org.opencontainers.image.documentation="https://github.com/moritzheine/growflow/blob/main/README.md"

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION