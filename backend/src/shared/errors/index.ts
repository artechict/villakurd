/**
 * Custom Error Classes for VillaKurd
 * Structured error handling with codes, status codes, and metadata
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.isOperational = true;

    // Maintains proper stack trace in V8 environments
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// 4xx CLIENT ERRORS
// ============================================

export class ValidationError extends AppError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, { validation: validationErrors });
    this.validationErrors = validationErrors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, metadata);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'BAD_REQUEST', 400, metadata);
  }
}

export class GoneError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'GONE', 410, metadata);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'UNPROCESSABLE_ENTITY', 422, metadata);
  }
}

// ============================================
// 5xx SERVER ERRORS
// ============================================

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred', metadata?: Record<string, unknown>) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, metadata);
    this.isOperational = false;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', metadata?: Record<string, unknown>) {
    super(message, 'SERVICE_UNAVAILABLE', 503, metadata);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'Gateway timeout', metadata?: Record<string, unknown>) {
    super(message, 'GATEWAY_TIMEOUT', 504, metadata);
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      originalError: originalError?.message,
    });
    this.service = service;
    this.originalError = originalError;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, { originalError: originalError?.message });
    this.isOperational = false;
  }
}

// ============================================
// BUSINESS LOGIC ERRORS
// ============================================

export class InsufficientFundsError extends AppError {
  constructor(required: number, available: number, currency = 'IQD') {
    super(
      `Insufficient funds. Required: ${required} ${currency}, Available: ${available} ${currency}`,
      'INSUFFICIENT_FUNDS',
      400,
      { required, available, currency }
    );
  }
}

export class BookingConflictError extends AppError {
  constructor(propertyId: string, checkIn: Date, checkOut: Date) {
    super(
      `Property is not available for the selected dates`,
      'BOOKING_CONFLICT',
      409,
      { propertyId, checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString() }
    );
  }
}

export class PropertyNotAvailableError extends AppError {
  constructor(propertyId: string, reason: string) {
    super(
      `Property is not available: ${reason}`,
      'PROPERTY_NOT_AVAILABLE',
      400,
      { propertyId, reason }
    );
  }
}

export class PaymentFailedError extends AppError {
  public readonly gateway: string;
  public readonly transactionId?: string;

  constructor(gateway: string, message: string, transactionId?: string) {
    super(`Payment failed: ${message}`, 'PAYMENT_FAILED', 400, { gateway, transactionId });
    this.gateway = gateway;
    this.transactionId = transactionId;
  }
}

export class PayoutFailedError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'PAYOUT_FAILED', 400, metadata);
  }
}

export class VerificationRequiredError extends AppError {
  public readonly verificationType: string;

  constructor(verificationType: string) {
    super(
      `${verificationType} verification is required to perform this action`,
      'VERIFICATION_REQUIRED',
      403,
      { verificationType }
    );
    this.verificationType = verificationType;
  }
}

export class SubscriptionRequiredError extends AppError {
  public readonly requiredPlan: string;

  constructor(requiredPlan: string) {
    super(
      `This feature requires ${requiredPlan} subscription`,
      'SUBSCRIPTION_REQUIRED',
      403,
      { requiredPlan }
    );
    this.requiredPlan = requiredPlan;
  }
}

export class FeatureDisabledError extends AppError {
  public readonly feature: string;

  constructor(feature: string) {
    super(
      `Feature '${feature}' is currently disabled`,
      'FEATURE_DISABLED',
      403,
      { feature }
    );
    this.feature = feature;
  }
}

// ============================================
// ERROR UTILITIES
// ============================================

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.message });
  }
  return new InternalServerError('Unknown error', { originalError: String(error) });
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: Error, locale = 'en'): string {
  if (error instanceof AppError) {
    // Return the message as-is for operational errors
    if (error.isOperational) {
      return error.message;
    }
  }
  // Generic message for programming errors
  const messages: Record<string, string> = {
    en: 'Something went wrong. Please try again later.',
    ckb: 'هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەوە.',
    ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.',
    fa: 'خطایی رخ داد. لطفاً بعداً مجدداً تلاش کنید.',
  };
  return messages[locale] || messages.en;
}

// Re-export Zod for validation
export { z } from 'zod';
export type { ZodError } from 'zod';