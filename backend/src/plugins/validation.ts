/**
 * Validation Plugin for Fastify
 * Zod schema validation for request body, query, params, headers
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors/index.js';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    validatedBody?: unknown;
    validatedQuery?: unknown;
    validatedParams?: unknown;
    validatedHeaders?: unknown;
  }
}

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export const validationPlugin: FastifyPluginAsync = async (fastify) => {
  // Add validation decorator to routes
  fastify.decorate('validate', (schemas: ValidationSchemas) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const errors: Record<string, string[]> = {};

      // Validate body
      if (schemas.body && request.body) {
        const result = schemas.body.safeParse(request.body);
        if (!result.success) {
          errors.body = formatZodErrors(result.error);
        } else {
          request.validatedBody = result.data;
        }
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(request.query);
        if (!result.success) {
          errors.query = formatZodErrors(result.error);
        } else {
          request.validatedQuery = result.data;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = schemas.params.safeParse(request.params);
        if (!result.success) {
          errors.params = formatZodErrors(result.error);
        } else {
          request.validatedParams = result.data;
        }
      }

      // Validate headers
      if (schemas.headers) {
        const result = schemas.headers.safeParse(request.headers);
        if (!result.success) {
          errors.headers = formatZodErrors(result.error);
        } else {
          request.validatedHeaders = result.data;
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Validation failed', errors);
      }
    };
  });

  // Global validation error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const validationError = new ValidationError('Validation failed', formatZodErrors(error));
      return fastify.errorHandler(validationError, request, reply);
    }
    return fastify.errorHandler(error, request, reply);
  });
};

/**
 * Format Zod errors into a readable structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    const message = `${issue.code}: ${issue.message}`;

    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(message);
  }

  return formatted;
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().cuid(),
  }),

  // Slug parameter
  slugParam: z.object({
    slug: z.string().min(1).max(250),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  }),

  // Coordinates
  coordinates: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),

  // Price range
  priceRange: z.object({
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
  }),

  // Language header
  languageHeader: z.object({
    'accept-language': z.string().optional(),
  }),
};

/**
 * Create a validated route schema
 */
export function createRouteSchema(schemas: ValidationSchemas) {
  return {
    schema: {
      body: schemas.body ? { $ref: schemas.body.$id || 'body' } : undefined,
      query: schemas.query ? { $ref: schemas.query.$id || 'query' } : undefined,
      params: schemas.params ? { $ref: schemas.params.$id || 'params' } : undefined,
      headers: schemas.headers ? { $ref: schemas.headers.$id || 'headers' } : undefined,
    },
  };
}