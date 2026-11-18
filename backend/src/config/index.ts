/**
 * VillaKurd Backend Configuration
 * Centralized, validated, type-safe configuration using Zod
 */

import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

// ============================================
// ENVIRONMENT SCHEMA (Zod validation)
// ============================================

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('VillaKurd'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  API_PREFIX: z.string().default('/api/v1'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // Redis
  REDIS_URL: z.string().url().startsWith('redis://').default('redis://localhost:6379'),

  // Elasticsearch
  ELASTICSEARCH_URL: z.string().url().default('http://localhost:9200'),

  // MinIO / S3
  MINIO_ENDPOINT: z.string().url().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.string().min(3).default('villakurd'),
  MINIO_SECRET_KEY: z.string().min(8).default('villakurd_secret'),
  MINIO_BUCKET: z.string().default('villakurd'),
  MINIO_REGION: z.string().default('us-east-1'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),

  // JWT Auth
  JWT_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_ISSUER: z.string().default('villakurd-api'),
  JWT_AUDIENCE: z.string().default('villakurd-client'),

  // NextAuth (Frontend)
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:8081'),

  // Rate Limiting
  RATE_LIMIT_GLOBAL: z.coerce.number().default(1000),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  // Metrics
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090),

  // Tracing
  TRACING_ENABLED: z.coerce.boolean().default(false),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('villakurd-backend'),

  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@villakurd.com'),
  SMTP_SECURE: z.coerce.boolean().default(false),

  // SMS
  SMS_PROVIDER: z.string().default('local'),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default('VillaKurd'),
  SMS_BASE_URL: z.string().url().optional(),

  // Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Maps
  MAPBOX_TOKEN: z.string().optional(),

  // Payment Gateways
  ASIA_HAWALA_MERCHANT_ID: z.string().optional(),
  ASIA_HAWALA_TERMINAL_ID: z.string().optional(),
  ASIA_HAWALA_PASSWORD: z.string().optional(),
  ASIA_HAWALA_CALLBACK_URL: z.string().url().optional(),
  ASIA_HAWALA_BASE_URL: z.string().url().optional(),

  QI_CARD_MERCHANT_ID: z.string().optional(),
  QI_CARD_TERMINAL_ID: z.string().optional(),
  QI_CARD_PASSWORD: z.string().optional(),
  QI_CARD_CALLBACK_URL: z.string().url().optional(),
  QI_CARD_BASE_URL: z.string().url().optional(),

  ZAIN_CASH_MERCHANT_ID: z.string().optional(),
  ZAIN_CASH_PASSWORD: z.string().optional(),
  ZAIN_CASH_CALLBACK_URL: z.string().url().optional(),
  ZAIN_CASH_BASE_URL: z.string().url().optional(),

  // Business Settings
  PLATFORM_COMMISSION_PERCENT: z.coerce.number().default(12),
  CLEANING_FEE_PERCENT: z.coerce.number().default(5),
  SERVICE_FEE_PERCENT: z.coerce.number().default(3),
  TAX_PERCENT: z.coerce.number().default(0),
  CURRENCY: z.string().default('IQD'),
  DEFAULT_LOCALE: z.string().default('ckb'),
  SUPPORTED_LOCALES: z.string().default('ckb,ar,en,fa'),
  TIMEZONE: z.string().default('Asia/Baghdad'),

  // Feature Flags
  FEATURE_MOBILE_APP: z.coerce.boolean().default(true),
  FEATURE_INSTANT_BOOKING: z.coerce.boolean().default(true),
  FEATURE_DYNAMIC_PRICING: z.coerce.boolean().default(true),
  FEATURE_ESCROW: z.coerce.boolean().default(true),
  FEATURE_INSURANCE: z.coerce.boolean().default(false),
  FEATURE_CONCIERGE: z.coerce.boolean().default(false),
  FEATURE_WHITE_LABEL: z.coerce.boolean().default(false),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z.string().min(32).optional(),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp,image/heic'),
  ALLOWED_VIDEO_TYPES: z.string().default('video/mp4,video/webm'),
  IMAGE_QUALITY: z.coerce.number().default(80),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Prisma
  PRISMA_STUDIO_PORT: z.coerce.number().default(5555),
});

// ============================================
// PARSE AND VALIDATE
// ============================================

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

// ============================================
// EXPORT CONFIG OBJECT
// ============================================

export const config = {
  // Application
  nodeEnv: env.NODE_ENV,
  appName: env.APP_NAME,
  appVersion: env.APP_VERSION,
  appUrl: env.APP_URL,
  apiUrl: env.API_URL,
  apiPrefix: env.API_PREFIX,
  port: env.PORT,
  host: env.HOST,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  databaseUrl: env.DATABASE_URL,

  // Redis
  redisUrl: env.REDIS_URL,

  // Elasticsearch
  elasticsearchUrl: env.ELASTICSEARCH_URL,

  // MinIO / S3
  minio: {
    endpoint: env.MINIO_ENDPOINT,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucket: env.MINIO_BUCKET,
    region: env.MINIO_REGION,
    useSSL: env.MINIO_USE_SSL,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },

  // NextAuth
  nextAuth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
  },

  // CORS
  corsOrigin: env.CORS_ORIGIN.split(',').map(s => s.trim()),

  // Rate Limiting
  rateLimit: {
    global: env.RATE_LIMIT_GLOBAL,
    window: env.RATE_LIMIT_WINDOW,
  },

  // Logging
  logLevel: env.LOG_LEVEL,
  logPretty: env.LOG_PRETTY,

  // Metrics
  metricsEnabled: env.METRICS_ENABLED,
  metricsPort: env.METRICS_PORT,

  // Tracing
  tracingEnabled: env.TRACING_ENABLED,
  otelEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  otelServiceName: env.OTEL_SERVICE_NAME,

  // Email
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
    secure: env.SMTP_SECURE,
  },

  // SMS
  sms: {
    provider: env.SMS_PROVIDER,
    apiKey: env.SMS_API_KEY,
    senderId: env.SMS_SENDER_ID,
    baseUrl: env.SMS_BASE_URL,
  },

  // Push
  push: {
    expoAccessToken: env.EXPO_ACCESS_TOKEN,
    firebase: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  },

  // Maps
  mapboxToken: env.MAPBOX_TOKEN,

  // Payment Gateways
  payments: {
    asiaHawala: {
      merchantId: env.ASIA_HAWALA_MERCHANT_ID,
      terminalId: env.ASIA_HAWALA_TERMINAL_ID,
      password: env.ASIA_HAWALA_PASSWORD,
      callbackUrl: env.ASIA_HAWALA_CALLBACK_URL,
      baseUrl: env.ASIA_HAWALA_BASE_URL || 'https://pgw.asiahawala.com',
    },
    qiCard: {
      merchantId: env.QI_CARD_MERCHANT_ID,
      terminalId: env.QI_CARD_TERMINAL_ID,
      password: env.QI_CARD_PASSWORD,
      callbackUrl: env.QI_CARD_CALLBACK_URL,
      baseUrl: env.QI_CARD_BASE_URL || 'https://pgw.qicard.net',
    },
    zainCash: {
      merchantId: env.ZAIN_CASH_MERCHANT_ID,
      password: env.ZAIN_CASH_PASSWORD,
      callbackUrl: env.ZAIN_CASH_CALLBACK_URL,
      baseUrl: env.ZAIN_CASH_BASE_URL || 'https://api.zaincash.iq',
    },
  },

  // Business
  business: {
    platformCommissionPercent: env.PLATFORM_COMMISSION_PERCENT,
    cleaningFeePercent: env.CLEANING_FEE_PERCENT,
    serviceFeePercent: env.SERVICE_FEE_PERCENT,
    taxPercent: env.TAX_PERCENT,
    currency: env.CURRENCY,
    defaultLocale: env.DEFAULT_LOCALE,
    supportedLocales: env.SUPPORTED_LOCALES.split(',').map(s => s.trim()),
    timezone: env.TIMEZONE,
  },

  // Features
  features: {
    mobileApp: env.FEATURE_MOBILE_APP,
    instantBooking: env.FEATURE_INSTANT_BOOKING,
    dynamicPricing: env.FEATURE_DYNAMIC_PRICING,
    escrow: env.FEATURE_ESCROW,
    insurance: env.FEATURE_INSURANCE,
    concierge: env.FEATURE_CONCIERGE,
    whiteLabel: env.FEATURE_WHITE_LABEL,
  },

  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
  },

  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedImageTypes: env.ALLOWED_IMAGE_TYPES.split(',').map(s => s.trim()),
    allowedVideoTypes: env.ALLOWED_VIDEO_TYPES.split(',').map(s => s.trim()),
    imageQuality: env.IMAGE_QUALITY,
  },

  // Sentry
  sentry: {
    dsn: env.SENTRY_DSN,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,
  },

  // Prisma
  prismaStudioPort: env.PRISMA_STUDIO_PORT,
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type Config = typeof config;
export type NodeEnv = 'development' | 'test' | 'staging' | 'production';