# Use Home Assistant base image with s6-overlay and bashio
ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install Node.js and dependencies
RUN \
    apk add --no-cache \
        nodejs=18.19.1-r0 \
        npm=9.8.1-r0 \
        python3=3.11.8-r0 \
        make=4.4.1-r1 \
        g++=12.2.1_git20220924-r10 \
        sqlite=3.41.2-r2 \
    && npm install -g npm@latest

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund
RUN cd backend && npm ci --only=production --no-audit --no-fund
RUN cd frontend && npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Build applications
RUN cd frontend && npm run build
RUN cd backend && npm run build

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

# Copy root filesystem
COPY rootfs /

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION