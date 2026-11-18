# VillaKurd Frontend - Production Dockerfile
# Multi-stage build for Next.js standalone output

# ============================================
# BASE STAGE
# ============================================
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# ============================================
# DEPENDENCIES STAGE
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# ============================================
# BUILD STAGE
# ============================================
FROM base AS builder

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js application (output: standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache tzdata dumb-init

# Set timezone
ENV TZ=Asia/Baghdad

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]