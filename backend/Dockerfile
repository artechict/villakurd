# VillaKurd Backend - Production Dockerfile
# Multi-stage build for smaller production image

# ============================================
# BASE STAGE
# ============================================
FROM node:20-alpine AS base

# Install dependencies for native modules (sharp, bcrypt, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

WORKDIR /app

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# ============================================
# DEPENDENCIES STAGE
# ============================================
FROM base AS deps

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# ============================================
# BUILD STAGE
# ============================================
FROM base AS builder

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    vips \
    tzdata \
    dumb-init

# Set timezone
ENV TZ=Asia/Baghdad

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create necessary directories
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/app.js"]