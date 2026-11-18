/**
 * Helmet Plugin for Fastify
 * Security headers for HTTP responses
 */

import { FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';
import { config } from '../config/index.js';

export const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: config.isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js needs unsafe-eval in dev
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://api.mapbox.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://api.mapbox.com'],
        connectSrc: [
          "'self'",
          'ws:',
          'wss:',
          config.apiUrl,
          'https://api.mapbox.com',
          'https://events.mapbox.com',
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Next.js compatibility
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: config.isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  });
};