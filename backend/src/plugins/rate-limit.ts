/**
 * Rate Limiting Plugin for Fastify
 * Multiple rate limiters for different endpoint types
 */

import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config/index.js';

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Global rate limiter
  await fastify.register(rateLimit, {
    global: true,
    max: config.rateLimit.global,
    timeWindow: config.rateLimit.window,
    keyGenerator: (request) => request.ip,
    skipOnError: true,
    allowList: config.isDevelopment ? ['127.0.0.1', '::1'] : [],
    errorMessage: 'Too many requests, please try again later',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    hook: 'onRequest',
  });

  // Auth endpoints - stricter
  await fastify.register(rateLimit, {
    max: 10,
    timeWindow: '15 minutes',
    keyGenerator: (request) => `auth:${request.ip}`,
    scope: ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/verify-phone'],
    errorMessage: 'Too many authentication attempts, please try again later',
    addHeaders: true,
  });

  // Search API - moderate
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (request) => `search:${request.user?.id || request.ip}`,
    scope: ['/villas/search', '/villas/suggest'],
    errorMessage: 'Too many search requests, please slow down',
    addHeaders: true,
  });

  // Booking creation - per user
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '1 hour',
    keyGenerator: (request) => `booking:${request.user?.id}`,
    scope: ['/bookings'],
    method: ['POST'],
    errorMessage: 'Too many booking attempts, please try again later',
    addHeaders: true,
  });

  // Payment endpoints - strict
  await fastify.register(rateLimit, {
    max: 20,
    timeWindow: '1 hour',
    keyGenerator: (request) => `payment:${request.user?.id || request.ip}`,
    scope: ['/payments'],
    errorMessage: 'Too many payment requests',
    addHeaders: true,
  });

  // Admin endpoints - higher limits
  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (request) => `admin:${request.user?.id}`,
    scope: ['/admin/**'],
    errorMessage: 'Too many admin requests',
    addHeaders: true,
  });
};