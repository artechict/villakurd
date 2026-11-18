/**
 * CORS Plugin for Fastify
 * Configures Cross-Origin Resource Sharing
 */

import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config/index.js';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Check against allowed origins
      const allowedOrigins = config.corsOrigin;
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost with any port
      if (config.isDevelopment) {
        const localhostRegex = /^https?:\/\/localhost:\d+$/;
        if (localhostRegex.test(origin)) {
          return callback(null, true);
        }
      }

      // Check for Expo development URLs
      if (origin.startsWith('exp://') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
      'X-CSRF-Token',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
};