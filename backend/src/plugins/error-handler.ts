/**
 * Global Error Handler Plugin for Fastify
 * Centralized error handling with proper logging and response formatting
 */

import { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  ExternalServiceError,
} from '../shared/errors/index.js';

export const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  // Custom error handler
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error with context
    const logContext = {
      reqId: request.id,
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorCode = error.code;
      message = error.message;
      details = error.metadata;
      fastify.log.warn({ ...logContext, errorCode, message }, 'Application error');
    } else if (error instanceof z.ZodError) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Validation failed';
      details = { validation: formatZodErrors(error) };
      fastify.log.warn({ ...logContext, errorCode, message }, 'Validation error');
    } else if (error.validation) {
      // Fastify validation error
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = { validation: error.validation };
      fastify.log.warn({ ...logContext, errorCode, message }, 'Fastify validation error');
    } else if (error.statusCode === 401 || error.code === 'FASTIFY_JWT_AUTH_ERROR') {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
      message = 'Authentication required';
      fastify.log.warn({ ...logContext, errorCode }, 'Authentication error');
    } else if (error.statusCode === 403 || error.code === 'FASTIFY_JWT_AUTH_ERROR') {
      statusCode = 403;
      errorCode = 'FORBIDDEN';
      message = 'Access denied';
      fastify.log.warn({ ...logContext, errorCode }, 'Authorization error');
    } else if (error.statusCode === 404) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      message = 'Resource not found';
      fastify.log.info({ ...logContext }, 'Resource not found');
    } else if (error.statusCode === 409) {
      statusCode = 409;
      errorCode = 'CONFLICT';
      message = 'Resource conflict';
      fastify.log.warn({ ...logContext, errorCode }, 'Conflict error');
    } else if (error.statusCode === 429) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = 'Too many requests';
      fastify.log.warn({ ...logContext, errorCode }, 'Rate limit exceeded');
    } else if (error.code === 'P2003' || error.code === 'P2002') {
      // Prisma errors
      statusCode = 400;
      errorCode = 'DATABASE_CONSTRAINT_ERROR';
      message = 'Database constraint violation';
      details = { prismaCode: error.code };
      fastify.log.warn({ ...logContext, errorCode, prismaCode: error.code }, 'Database constraint error');
    } else {
      // Unknown error
      fastify.log.error({ ...logContext, error: error.message, stack: error.stack }, 'Internal server error');
    }

    // Send error response
    const response: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        ...(config.isDevelopment && { stack: error.stack }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        path: request.url,
      },
    };

    // Set headers
    if (statusCode === 429) {
      reply.header('Retry-After', '60');
    }

    reply.code(statusCode).send(response);
  });

  // Not found handler
  fastify.setNotFoundHandler(async (request, reply) => {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        path: request.url,
      },
    };

    reply.code(404).send(response);
  });
};

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}

/**
 * Format Zod errors
 */
function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!formatted[path]) formatted[path] = [];
    formatted[path].push(`${issue.code}: ${issue.message}`);
  }
  return formatted;
}

/**
 * Async wrapper for route handlers to catch errors
 */
export function asyncHandler(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (error) {
      // Error will be caught by global error handler
      throw error;
    }
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  meta?: Record<string, unknown>
) {
  return {
    success: true,
    data,
    pagination,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}