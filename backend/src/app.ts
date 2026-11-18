/**
 * VillaKurd Backend - Fastify Application Entry Point
 * Modular monolith architecture with domain-driven design
 */

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { config } from './config/index.js';
import { logger } from './shared/utils/logger.js';

// Plugins
import { corsPlugin } from './plugins/cors.js';
import { helmetPlugin } from './plugins/helmet.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { authPlugin } from './plugins/auth.js';
import { validationPlugin } from './plugins/validation.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { metricsPlugin } from './plugins/metrics.js';
import { tracingPlugin } from './plugins/tracing.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { sensiblePlugin } from './plugins/sensible.js';
import { websocketPlugin } from './plugins/websocket.js';

// Modules (auto-loaded via @fastify/autoload)
import { autoload } from '@fastify/autoload';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

/**
 * Create Fastify instance with configuration
 */
export async function createApp(options: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.logLevel === 'silent' ? false : logger,
    ajv: {
      customOptions: {
        strict: false,
        coerceTypes: 'array',
        removeAdditional: false,
        useDefaults: true,
        allErrors: true,
      },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    disableRequestLogging: config.nodeEnv === 'production',
    ...options,
  });

  // ============================================
  // CORE PLUGINS (Order matters!)
  // ============================================

  // 1. Sensible - adds useful decorators and utilities
  await app.register(sensiblePlugin);

  // 2. CORS - must be early
  await app.register(corsPlugin);

  // 3. Helmet - security headers
  await app.register(helmetPlugin);

  // 4. Rate Limiting - protect APIs
  await app.register(rateLimitPlugin);

  // 5. Request ID & Logging
  app.addHook('onRequest', async (request) => {
    request.log.info({ reqId: request.id }, 'Request received');
  });

  // 6. Authentication - JWT verification
  await app.register(authPlugin);

  // 7. Validation - Zod schema validation
  await app.register(validationPlugin);

  // 8. Metrics - Prometheus
  if (config.metricsEnabled) {
    await app.register(metricsPlugin);
  }

  // 9. Tracing - OpenTelemetry
  if (config.tracingEnabled) {
    await app.register(tracingPlugin);
  }

  // 10. WebSocket - for real-time features
  await app.register(websocketPlugin);

  // 11. Swagger/OpenAPI Documentation
  if (config.nodeEnv !== 'production') {
    await app.register(swaggerPlugin);
  }

  // ============================================
  // MODULE ROUTES (Auto-loaded from modules/)
  // ============================================
  await app.register(autoload, {
    dir: join(__dirname, 'modules'),
    options: { prefix: config.apiPrefix },
    autoHooks: true,
    cascadeHooks: true,
    routeParams: true,
    matchFilter: (path: string) => path.endsWith('.routes.ts'),
    // Override route registration to add module-level prefix
    transformRoute: (route) => ({
      ...route,
      prefix: `${config.apiPrefix}${route.prefix || ''}`,
    }),
  });

  // ============================================
  // GLOBAL ERROR HANDLER (must be last)
  // ============================================
  await app.register(errorHandlerPlugin);

  // ============================================
  // HEALTH CHECK ENDPOINTS
  // ============================================
  app.get('/health', {
    schema: {
      hide: true,
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            checks: { type: 'object' },
          },
        },
      },
    },
  }, async () => {
    const checks = {
      database: 'ok', // Will be overridden by actual check
      redis: 'ok',
      elasticsearch: 'ok',
    };

    // Quick database check
    try {
      await app.prisma.$queryRaw`SELECT 1`;
    } catch {
      checks.database = 'down';
    }

    // Quick Redis check
    try {
      await app.redis.ping();
    } catch {
      checks.redis = 'down';
    }

    const isHealthy = Object.values(checks).every(v => v === 'ok');
    const isDegraded = Object.values(checks).some(v => v === 'down');

    return {
      status: isHealthy ? 'ok' : isDegraded ? 'degraded' : 'down',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: config.appVersion,
      environment: config.nodeEnv,
      checks,
    };
  });

  app.get('/ready', {
    schema: { hide: true },
  }, async (request, reply) => {
    // Readiness check - more thorough
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      await app.redis.ping();
      // Add more checks as needed
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      reply.code(503);
      return { status: 'not ready', timestamp: new Date().toISOString(), error: error.message };
    }
  });

  // ============================================
  // METRICS ENDPOINT
  // ============================================
  if (config.metricsEnabled) {
    app.get('/metrics', {
      schema: { hide: true },
    }, async (request, reply) => {
      reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return app.prometheusClient.register.metrics();
    });
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Shutting down gracefully...');
    try {
      await app.close();
      app.log.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      app.log.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('unhandledRejection', (reason) => {
    app.log.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    app.log.error({ error }, 'Uncaught exception');
    shutdown('uncaughtException');
  });

  return app;
}

/**
 * Start the server
 */
export async function start(): Promise<void> {
  const app = await createApp();

  try {
    const port = config.port;
    const host = config.host;

    await app.listen({ port, host });
    app.log.info(`🚀 Server listening on http://${host}:${port}`);
    app.log.info(`📚 API Documentation: http://${host}:${port}${config.apiPrefix}/documentation`);
    app.log.info(`🏥 Health Check: http://${host}:${port}/health`);
    app.log.info(`📊 Metrics: http://${host}:${port}/metrics`);
  } catch (error) {
    app.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { app } from './app.js';