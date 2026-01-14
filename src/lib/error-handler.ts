import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

/**
 * Error severity levels for Sentry
 */
export enum ErrorSeverity {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

/**
 * Enhanced error logging with Sentry integration
 * Provides consistent error handling across the application
 */
export class ErrorHandler {
  /**
   * Log an error with Sentry and console
   */
  static logError(
    error: Error | unknown,
    context?: {
      severity?: ErrorSeverity;
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      userId?: string;
      source?: string;
    }
  ): void {
    const actualError = error instanceof Error ? error : new Error(String(error));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context?.source || 'Error'}]`, actualError, context);
    }

    // Log to Sentry if configured
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(actualError, {
        level: context?.severity || ErrorSeverity.Error,
        tags: {
          source: context?.source || 'unknown',
          ...context?.tags,
        },
        extra: context?.extra,
        user: context?.userId ? { id: context.userId } : undefined,
      });
    }
  }

  /**
   * Create a standardized error response for API routes
   */
  static apiErrorResponse(
    error: Error | unknown,
    options?: {
      statusCode?: number;
      message?: string;
      source?: string;
      userId?: string;
      includeDetails?: boolean;
    }
  ): NextResponse {
    const actualError = error instanceof Error ? error : new Error(String(error));
    const statusCode = options?.statusCode || 500;
    const message = options?.message || 'An unexpected error occurred';

    // Log the error
    this.logError(actualError, {
      severity: statusCode >= 500 ? ErrorSeverity.Error : ErrorSeverity.Warning,
      source: options?.source || 'api',
      userId: options?.userId,
      extra: {
        statusCode,
        message,
      },
    });

    // Build response
    const response: Record<string, any> = {
      error: message,
    };

    // Include error details in development or if explicitly requested
    if (options?.includeDetails || process.env.NODE_ENV === 'development') {
      response.details = actualError.message;
      if (process.env.NODE_ENV === 'development') {
        response.stack = actualError.stack;
      }
    }

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Wrap an async API handler with error handling
   */
  static wrapApiHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    options?: {
      source?: string;
      userId?: string;
    }
  ): (...args: T) => Promise<R | NextResponse> {
    return async (...args: T) => {
      try {
        return await handler(...args);
      } catch (error) {
        return this.apiErrorResponse(error, {
          source: options?.source,
          userId: options?.userId,
        });
      }
    };
  }

  /**
   * Log a warning message
   */
  static logWarning(
    message: string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      userId?: string;
      source?: string;
    }
  ): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${context?.source || 'Warning'}]`, message, context);
    }

    // Log to Sentry if configured
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: ErrorSeverity.Warning,
        tags: {
          source: context?.source || 'unknown',
          ...context?.tags,
        },
        extra: context?.extra,
        user: context?.userId ? { id: context.userId } : undefined,
      });
    }
  }

  /**
   * Log an info message
   */
  static logInfo(
    message: string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      userId?: string;
      source?: string;
    }
  ): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${context?.source || 'Info'}]`, message, context);
    }

    // Log to Sentry if configured (only in production)
    if (
      process.env.NODE_ENV === 'production' &&
      (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
    ) {
      Sentry.captureMessage(message, {
        level: ErrorSeverity.Info,
        tags: {
          source: context?.source || 'unknown',
          ...context?.tags,
        },
        extra: context?.extra,
        user: context?.userId ? { id: context.userId } : undefined,
      });
    }
  }

  /**
   * Set user context for Sentry
   */
  static setUserContext(user: {
    id: string;
    email?: string;
    username?: string;
  }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Clear user context from Sentry
   */
  static clearUserContext(): void {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }
}

/**
 * Convenience functions for common error handling scenarios
 */

/**
 * Handle database errors with appropriate messages
 */
export function handleDatabaseError(error: unknown): NextResponse {
  const err = error instanceof Error ? error : new Error(String(error));

  // Check for common database errors
  if (err.message.includes('Unique constraint')) {
    return ErrorHandler.apiErrorResponse(err, {
      statusCode: 409,
      message: 'A record with this information already exists',
      source: 'database',
    });
  }

  if (err.message.includes('Foreign key constraint')) {
    return ErrorHandler.apiErrorResponse(err, {
      statusCode: 400,
      message: 'This operation violates data integrity constraints',
      source: 'database',
    });
  }

  if (err.message.includes('Not found')) {
    return ErrorHandler.apiErrorResponse(err, {
      statusCode: 404,
      message: 'The requested resource was not found',
      source: 'database',
    });
  }

  // Generic database error
  return ErrorHandler.apiErrorResponse(err, {
    statusCode: 500,
    message: 'A database error occurred',
    source: 'database',
  });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Authentication required'): NextResponse {
  ErrorHandler.logWarning(message, {
    source: 'auth',
    tags: { type: 'authentication' },
  });

  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  errors?: Record<string, string[]>
): NextResponse {
  ErrorHandler.logWarning(message, {
    source: 'validation',
    extra: { errors },
  });

  return NextResponse.json(
    {
      error: message,
      validationErrors: errors,
    },
    { status: 400 }
  );
}
