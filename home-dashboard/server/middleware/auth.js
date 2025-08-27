/**
 * Authentication Middleware for Home Dashboard
 * 
 * Provides multiple authentication strategies for family dashboard access:
 * - Standard JWT authentication for all authenticated routes
 * - Optional authentication for routes that work with/without auth
 * - Enhanced authentication with Google token validation for OAuth users
 * 
 * Features:
 * - JWT token validation with proper error handling
 * - Google OAuth token validation and refresh
 * - Flexible authentication patterns for different use cases
 * - Security logging and error reporting
 * 
 * @module AuthMiddleware
 * @version 2.0.0
 * @author Home Dashboard Team
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');
const tokenManager = require('../utils/tokenManager');

/**
 * Extract user information from JWT token payload
 * @param {Object} decoded - JWT token payload
 * @returns {Object} User object with standardized structure
 */
const extractUserFromToken = (decoded) => ({
  id: decoded.id,
  name: decoded.name,
  method: decoded.method,
  email: decoded.email,
  googleTokens: decoded.googleTokens,
});

/**
 * Standard authentication middleware for protected routes
 * 
 * Validates JWT tokens and extracts user information. Rejects requests without
 * valid tokens with 401 Unauthorized status.
 * 
 * @function authMiddleware
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object  
 * @param {Function} next - Express next middleware function
 * 
 * @throws {401} When no token is provided
 * @throws {401} When token is invalid or malformed
 * @throws {401} When token has expired
 * 
 * @example
 * // Apply to protected routes
 * router.use('/api/protected', authMiddleware);
 * 
 * // Access user info in subsequent middleware
 * router.get('/profile', (req, res) => {
 *   console.log(req.user.id); // User ID from JWT
 *   console.log(req.user.method); // 'google' or 'pin'
 * });
 * 
 * @returns {void} Calls next() on success, sends error response on failure
 */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = extractUserFromToken(decoded);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware for flexible endpoints
 * 
 * Uses standard Express pattern with shared token extraction logic.
 * Always calls next(), setting req.user to authenticated user or null.
 * 
 * @function optionalAuthMiddleware
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Always calls next(), sets req.user to user object or null
 */
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = extractUserFromToken(decoded);
    next();
  } catch (error) {
    // For optional auth, continue without authentication on any error
    req.user = null;
    next();
  }
};

/**
 * Enhanced authentication middleware with Google OAuth token validation
 * 
 * Provides comprehensive authentication with additional Google token validation
 * for OAuth users. Ensures Google API access tokens are valid and refreshes
 * them automatically when needed.
 * 
 * Features:
 * - Standard JWT validation
 * - Google OAuth token validation for 'google' method users
 * - Automatic token refresh handling
 * - Detailed error reporting with specific error codes
 * - Token validation metadata in request object
 * 
 * @function enhancedAuthMiddleware
 * @async
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @throws {401} When no token is provided
 * @throws {401} When JWT token is invalid or expired
 * @throws {401} When Google tokens are invalid (code: GOOGLE_TOKEN_INVALID)
 * 
 * @example
 * // Apply to Google API dependent routes
 * router.use('/api/google', enhancedAuthMiddleware);
 * 
 * // Access token validation info
 * router.get('/calendar', (req, res) => {
 *   if (req.googleTokenValidation?.valid) {
 *     // Proceed with Google API calls
 *     console.log('Google tokens are valid and fresh');
 *   }
 * });
 * 
 * @returns {Promise<void>} Calls next() on success, sends error response on failure
 */
const enhancedAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = extractUserFromToken(decoded);
    
    // For Google OAuth users, validate tokens are still valid
    if (decoded.method === 'google') {
      const validation = await tokenManager.validateTokens(decoded.id);
      
      if (!validation.valid) {
        return res.status(401).json({
          error: 'Google authentication expired',
          code: 'GOOGLE_TOKEN_INVALID',
          reason: validation.reason
        });
      }
      
      req.googleTokenValidation = validation;
    }
    
    next();
  } catch (error) {
    console.error('Enhanced auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Guest-safe authentication middleware for family dashboard
 * 
 * Provides basic dashboard functionality without requiring authentication while
 * maintaining security for sensitive family data. Designed for home use where
 * family members should access general information but need authentication
 * for personal/sensitive features.
 * 
 * @function guestSafeAuthMiddleware
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void} Always calls next(), sets req.user to user object or guest
 */
const guestSafeAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // Set guest user for guest-safe endpoints
    req.user = {
      id: 'guest',
      name: 'Guest User',
      method: 'guest',
      email: null,
      googleTokens: null,
      isGuest: true
    };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = extractUserFromToken(decoded);
    req.user.isGuest = false;
    next();
  } catch (error) {
    // On token error, continue as guest for guest-safe endpoints
    req.user = {
      id: 'guest',
      name: 'Guest User',
      method: 'guest',
      email: null,
      googleTokens: null,
      isGuest: true
    };
    next();
  }
};

/**
 * Family-safe system endpoint middleware
 * 
 * Allows access to basic system information for family members while
 * restricting sensitive system operations and detailed metrics to
 * authenticated users only.
 * 
 * @function familySafeSystemAuth
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void} Calls next() for safe endpoints, requires auth for sensitive ones
 */
const familySafeSystemAuth = (req, res, next) => {
  // List of system endpoints safe for family/guest access
  const guestSafeSystemEndpoints = [
    '/health',
    '/status', // Basic system status only
    '/config'  // Safe configuration subset only
  ];
  
  // Check if current endpoint is guest-safe
  const isGuestSafeEndpoint = guestSafeSystemEndpoints.some(endpoint => 
    req.path.endsWith(endpoint)
  );
  
  if (isGuestSafeEndpoint) {
    // Use guest-safe auth for basic endpoints
    return guestSafeAuthMiddleware(req, res, next);
  } else {
    // Require full authentication for sensitive system operations
    return authMiddleware(req, res, next);
  }
};

/**
 * Family meal planning middleware
 * 
 * Allows basic meal planning features for family use while protecting
 * personal meal plans and AI processing for authenticated users.
 * 
 * @function familyMealAuth
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void} Allows guest access to basic features, requires auth for personal data
 */
const familyMealAuth = (req, res, next) => {
  // Endpoints that require authentication (personal data)
  const authRequiredEndpoints = [
    '/upload-shopping-list', // Personal shopping lists
    '/generate-suggestions' // AI meal suggestions
  ];
  
  // Special handling for /plan endpoint - allow guest access for basic meal suggestions
  if (req.path.endsWith('/plan') && req.method === 'GET') {
    return guestSafeAuthMiddleware(req, res, next);
  }
  
  // PUT/POST to /plan requires authentication for personal meal plans
  if (req.path.includes('/plan') && (req.method === 'PUT' || req.method === 'POST')) {
    return authMiddleware(req, res, next);
  }
  
  // Check if endpoint requires authentication
  const requiresAuth = authRequiredEndpoints.some(endpoint => 
    req.path.includes(endpoint)
  );
  
  if (requiresAuth) {
    return authMiddleware(req, res, next);
  } else {
    // Allow guest access for basic meal planning features
    return guestSafeAuthMiddleware(req, res, next);
  }
};

/**
 * Export authentication middleware functions
 * 
 * @exports {Function} authMiddleware - Standard JWT authentication
 * @exports {Function} optional - Optional authentication (allows anonymous)
 * @exports {Function} enhanced - Enhanced authentication with Google token validation
 * @exports {Function} guestSafe - Guest-safe authentication for family dashboard
 * @exports {Function} familySafeSystem - Family-safe system endpoint authentication
 * @exports {Function} familyMeal - Family meal planning authentication
 */
module.exports = authMiddleware;
module.exports.optional = optionalAuthMiddleware;
module.exports.enhanced = enhancedAuthMiddleware;
module.exports.guestSafe = guestSafeAuthMiddleware;
module.exports.familySafeSystem = familySafeSystemAuth;
module.exports.familyMeal = familyMealAuth;

/**
 * User object structure added to req.user by authentication middleware
 * 
 * @typedef {Object} AuthenticatedUser
 * @property {string} id - Unique user identifier (Google sub or PIN user ID)
 * @property {string} name - User's display name
 * @property {string} method - Authentication method: 'google' or 'pin'
 * @property {string|null} email - User's email address (Google users only)
 * @property {Object|null} googleTokens - Google token metadata (if available)
 * @property {boolean} googleTokens.hasTokens - Whether user has stored Google tokens
 * @property {string[]} googleTokens.scopes - Available Google API scopes
 * @property {number} googleTokens.expiryDate - Token expiration timestamp
 */

/**
 * Google token validation result structure
 * 
 * @typedef {Object} GoogleTokenValidation
 * @property {boolean} valid - Whether Google tokens are valid and fresh
 * @property {string} reason - Reason for validation failure (if invalid)
 * @property {Object} tokens - The validated token object (if valid)
 */