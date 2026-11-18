/**
 * Authentication Plugin for Fastify
 * JWT verification and user attachment
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';
import { AppError, UnauthorizedError, ForbiddenError } from '../shared/errors/index.js';
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    session?: AuthSession;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: Date;
  phoneVerified?: Date;
  verificationLevel: number;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceId?: string;
  expiresAt: Date;
}

const PUBLIC_PATHS = [
  '/health',
  '/ready',
  '/metrics',
  '/documentation',
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-phone',
  '/auth/send-otp',
  '/villas/search',
  '/villas/suggest',
  '/villas/:slug',
  '/webhooks/',
];

const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => {
    if (publicPath.endsWith('*')) {
      return path.startsWith(publicPath.slice(0, -1));
    }
    if (publicPath.includes(':')) {
      const regex = new RegExp(`^${publicPath.replace(/:slug/g, '[^/]+').replace(/:id/g, '[^/]+')}$`);
      return regex.test(path);
    }
    return path === publicPath;
  });
};

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin
  await fastify.register(import('@fastify/jwt'), {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn, issuer: config.jwt.issuer, audience: config.jwt.audience },
    verify: { issuer: config.jwt.issuer, audience: config.jwt.audience },
    cookie: {
      cookieName: 'accessToken',
      signed: false,
      secure: config.isProduction,
      httpOnly: true,
      sameSite: 'lax',
    },
  });

  await fastify.register(import('@fastify/jwt'), {
    secret: config.jwt.refreshSecret,
    sign: { expiresIn: config.jwt.refreshExpiresIn, issuer: config.jwt.issuer, audience: config.jwt.audience },
    verify: { issuer: config.jwt.issuer, audience: config.jwt.audience },
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
      secure: config.isProduction,
      httpOnly: true,
      sameSite: 'lax',
    },
  });

  // Decorate request with auth helpers
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('session', null);

  // Authentication hook
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip public paths
    if (isPublicPath(request.routerPath || request.url)) {
      return;
    }

    // Skip if already authenticated (e.g., by previous hook)
    if (request.user) {
      return;
    }

    try {
      // Verify access token
      const payload = await request.jwtVerify<{ sub: string; sessionId: string; type: string }>();

      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Verify session exists and is valid
      const session = await fastify.prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedError('Session expired or invalid');
      }

      if (session.user.status !== 'ACTIVE') {
        throw new ForbiddenError('Account is suspended or deactivated');
      }

      // Attach user and session to request
      request.user = {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone || undefined,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        status: session.user.status,
        emailVerified: session.user.emailVerified || undefined,
        phoneVerified: session.user.phoneVerified || undefined,
        verificationLevel: session.user.verificationLevel,
      };

      request.session = {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId || undefined,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new UnauthorizedError('Authentication required');
    }
  });

  // Helper: Require specific role
  fastify.decorate('requireRole', (...roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }
      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
    };
  });

  // Helper: Require specific permission
  fastify.decorate('requirePermission', (...permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const userPermissions = getPermissionsForRole(request.user.role);
      const hasPermission = permissions.every(p => userPermissions.includes(p));
      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }
    };
  });

  // Helper: Require host ownership
  fastify.decorate('requireHostOwnership', (propertyIdParam = 'id') => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }
      if (request.user.role !== 'HOST' && request.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only hosts can access this resource');
      }

      const propertyId = (request.params as Record<string, string>)[propertyIdParam];
      if (!propertyId) {
        throw new AppError('Property ID not found in params', 400);
      }

      const property = await fastify.prisma.property.findUnique({
        where: { id: propertyId },
        select: { hostId: true },
      });

      if (!property) {
        throw new AppError('Property not found', 404);
      }

      if (property.hostId !== request.user.id && request.user.role !== 'ADMIN') {
        throw new ForbiddenError('You do not own this property');
      }
    };
  });
};

/**
 * Get permissions for a role
 */
function getPermissionsForRole(role: UserRole): string[] {
  const basePermissions = [
    'profile:read',
    'profile:update',
    'booking:create',
    'booking:read:own',
    'booking:cancel:own',
    'payment:process',
    'message:send',
    'message:read:own',
    'review:create',
    'review:read:own',
  ];

  const hostPermissions = [
    ...basePermissions,
    'villa:create',
    'villa:read:own',
    'villa:update:own',
    'villa:delete:own',
    'villa:manage:calendar',
    'villa:manage:pricing',
    'villa:manage:photos',
    'booking:read:host',
    'booking:confirm',
    'booking:cancel:host',
    'payout:manage',
    'analytics:view:own',
    'review:respond',
  ];

  const adminPermissions = [
    ...hostPermissions,
    'villa:read:any',
    'villa:update:any',
    'villa:approve',
    'villa:delete:any',
    'user:manage',
    'booking:read:any',
    'booking:cancel:any',
    'payment:refund',
    'payout:manage:any',
    'analytics:view:all',
    'admin:access',
    'dispute:manage',
    'system:config',
  ];

  switch (role) {
    case 'ADMIN':
      return adminPermissions;
    case 'HOST':
      return hostPermissions;
    case 'GUEST':
    default:
      return basePermissions;
  }
}