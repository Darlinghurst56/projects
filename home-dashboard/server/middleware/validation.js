/**
 * Home Dashboard Validation Middleware
 * 
 * Simple validation and security middleware using standard Express patterns.
 * Focused on home deployment with reasonable security for family use.
 * 
 * @module ValidationMiddleware
 * @version 2.0.0
 * @author Home Dashboard Team
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

/**
 * General rate limiting - relaxed for home use
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for family use
  message: { error: 'Too many requests, please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiting - reasonable for home use
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow for multiple family members
  message: { error: 'Too many login attempts, try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Basic input sanitization for home use
 * Removes common script patterns but allows reasonable text input
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove script tags and javascript: urls
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  // Simple recursive sanitization
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
};

/**
 * Security headers using Helmet with home-appropriate settings
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for home apps
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://accounts.google.com"],
      frameSrc: ["https://accounts.google.com"]
    },
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Simple validation chains using express-validator
 */

/**
 * Simplified validation chains for home use
 */
const validationChains = {
  // PIN authentication
  pinAuth: [
    body('pin')
      .isLength({ min: 4, max: 8 })
      .isNumeric()
      .withMessage('PIN must be 4-8 digits'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters')
  ],

  // Google authentication
  googleAuth: [
    body('idToken')
      .isLength({ min: 50, max: 10000 })
      .withMessage('Invalid ID token')
  ],

  // Basic text input
  textInput: [
    body('*')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('Input too long')
  ]
};

/**
 * Handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

module.exports = {
  // Rate limiting
  generalRateLimit,
  authRateLimit,
  
  // Security middleware
  securityHeaders,
  sanitizeInput,
  
  // Express-validator chains
  validationChains,
  handleValidationErrors
};