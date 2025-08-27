// Unified Error Handling System
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System
//
// This module provides a centralized error handling strategy across the entire system
// to prevent redundant processing and ensure consistent error responses.

const config = require('../../config');

/**
 * Error Classification System
 * 
 * Standardizes error types and response codes across the application
 */
const ErrorTypes = {
  VALIDATION: 'ValidationError',
  UNAUTHORIZED: 'UnauthorizedError', 
  FORBIDDEN: 'ForbiddenError',
  NOT_FOUND: 'NotFoundError',
  SERVICE_UNAVAILABLE: 'ServiceUnavailableError',
  TIMEOUT: 'TimeoutError',
  INTERNAL: 'InternalServerError',
  EXTERNAL_SERVICE: 'ExternalServiceError',
};

/**
 * Error Response Factory
 * 
 * Creates consistent error response objects for API endpoints
 */
class ErrorResponse {
  constructor(type, message, details = null, statusCode = 500) {
    this.type = type;
    this.message = message;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.environment = config.server.nodeEnv;
  }

  toJSON() {
    const response = {
      error: this.message,
      type: this.type,
      timestamp: this.timestamp,
    };

    if (this.details) {
      response.details = this.details;
    }

    // Include additional debug info in development
    if (this.environment === 'development') {
      response.environment = this.environment;
    }

    return response;
  }
}

/**
 * Unified Error Handler
 * 
 * Processes errors consistently across all middleware and routes
 */
const createUnifiedErrorHandler = (logger = console) => {
  return (err, req, res, next) => {
    // Prevent multiple error handling
    if (res.headersSent) {
      return next(err);
    }

    let errorResponse;

    // Map common errors to standardized responses
    switch (err.name || err.code) {
      case 'ValidationError':
        errorResponse = new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Request validation failed',
          err.details || err.message,
          400
        );
        break;

      case 'UnauthorizedError':
      case 'JsonWebTokenError':
      case 'TokenExpiredError':
        errorResponse = new ErrorResponse(
          ErrorTypes.UNAUTHORIZED,
          'Authentication required',
          null,
          401
        );
        break;

      case 'ForbiddenError':
        errorResponse = new ErrorResponse(
          ErrorTypes.FORBIDDEN,
          'Access denied',
          null,
          403
        );
        break;

      case 'NotFoundError':
        errorResponse = new ErrorResponse(
          ErrorTypes.NOT_FOUND,
          'Resource not found',
          null,
          404
        );
        break;

      case 'ECONNREFUSED':
      case 'ENOTFOUND':
        errorResponse = new ErrorResponse(
          ErrorTypes.SERVICE_UNAVAILABLE,
          'External service unavailable',
          'Service connection failed',
          503
        );
        break;

      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        errorResponse = new ErrorResponse(
          ErrorTypes.TIMEOUT,
          'Service timeout',
          'Request exceeded maximum wait time',
          504
        );
        break;

      default:
        errorResponse = new ErrorResponse(
          ErrorTypes.INTERNAL,
          'Internal server error',
          config.server.nodeEnv === 'development' ? err.stack : null,
          500
        );
    }

    // Log error with consistent format
    logger.error('🔥 Error Handler:', {
      type: errorResponse.type,
      message: errorResponse.message,
      statusCode: errorResponse.statusCode,
      path: req?.path,
      method: req?.method,
      userAgent: req?.get('User-Agent'),
      timestamp: errorResponse.timestamp,
      ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
    });

    // Send unified error response
    res.status(errorResponse.statusCode).json(errorResponse.toJSON());
  };
};

/**
 * Process-level Error Handlers
 * 
 * Handles uncaught exceptions and unhandled rejections with graceful shutdown
 */
const setupProcessErrorHandlers = (server = null, logger = console) => {
  // Track if we're already shutting down
  let isShuttingDown = false;

  const gracefulShutdown = (signal, error = null) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.error(`\n🛑 Received ${signal}${error ? ' due to error' : ''}\n`);
    
    if (error) {
      logger.error('❌ Fatal Error Details:');
      logger.error('   Type:', error.name || 'Unknown');
      logger.error('   Message:', error.message || 'No message');
      if (config.server.nodeEnv === 'development' && error.stack) {
        logger.error('   Stack:', error.stack);
      }
    }

    // Close server gracefully
    if (server) {
      logger.log('🔄 Closing HTTP server...');
      server.close((err) => {
        if (err) {
          logger.error('❌ Error during server shutdown:', err.message);
        } else {
          logger.log('✅ HTTP server closed');
        }
        process.exit(error ? 1 : 0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(error ? 1 : 0);
    }
  };

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('\n💥 UNCAUGHT EXCEPTION - This should not happen in production!');
    gracefulShutdown('UNCAUGHT_EXCEPTION', error);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('\n💥 UNHANDLED PROMISE REJECTION - This should not happen in production!');
    logger.error('Promise:', promise);
    logger.error('Reason:', reason);
    
    // Convert reason to error-like object
    const error = reason instanceof Error ? reason : new Error(String(reason));
    gracefulShutdown('UNHANDLED_REJECTION', error);
  });

  // Handle process warnings
  process.on('warning', (warning) => {
    logger.warn('⚠️  Process Warning:', {
      name: warning.name,
      message: warning.message,
      ...(warning.stack && config.server.nodeEnv === 'development' && { stack: warning.stack }),
    });
  });

  // Handle graceful shutdown signals
  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  return gracefulShutdown;
};

/**
 * Client Error Response Parser
 * 
 * Standardizes error handling for frontend API clients
 */
const parseClientError = (error) => {
  if (!error.response) {
    // Network error or request setup error
    return {
      type: ErrorTypes.SERVICE_UNAVAILABLE,
      message: 'Network error - please check your connection',
      statusCode: 0,
      isNetworkError: true,
    };
  }

  const { status, data } = error.response;
  
  return {
    type: data?.type || ErrorTypes.INTERNAL,
    message: data?.error || data?.message || 'An error occurred',
    details: data?.details,
    statusCode: status,
    timestamp: data?.timestamp,
    isNetworkError: false,
  };
};

module.exports = {
  ErrorTypes,
  ErrorResponse,
  createUnifiedErrorHandler,
  setupProcessErrorHandlers,
  parseClientError,
};