/**
 * Authentication Routes for Home Dashboard
 * 
 * HTTP layer for authentication system supporting multiple methods:
 * - Google OAuth 2.0 authentication with full API access
 * - PIN-based authentication for family members
 * - Enhanced token validation with Google token status
 * - Secure logout with optional Google access revocation
 * 
 * This module handles HTTP concerns (routing, validation, response formatting)
 * while delegating business logic to AuthService for proper separation of concerns.
 * 
 * @module AuthRoutes
 * @version 3.0.0
 * @author Home Dashboard Team
 */

const express = require('express');
const { defaultContainer } = require('../services/ServiceContainer');
const validation = require('../middleware/validation');
const { ErrorResponse } = require('../utils/errorHandling');

const router = express.Router();
const authService = defaultContainer.resolve('authService');

/**
 * Helper function to handle service errors and convert to HTTP responses
 * 
 * @param {ErrorResponse|Error} error - Error from service layer
 * @param {Object} res - Express response object
 * @param {string} defaultMessage - Default error message
 */
const handleServiceError = (error, res, defaultMessage = 'Operation failed') => {
  if (error instanceof ErrorResponse) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  console.error('Unhandled service error:', error);
  return res.status(500).json({ 
    error: defaultMessage,
    type: 'InternalServerError',
    timestamp: new Date().toISOString()
  });
};


/**
 * @route POST /auth/login-google
 * @description Google OAuth 2.0 authentication endpoint
 * 
 * Authenticates users via Google OAuth and stores access tokens for API access.
 * Supports both ID token only (basic auth) and full OAuth flow (with API access).
 * 
 * @param {Object} req.body - Request body
 * @param {string} req.body.idToken - Google ID token (required)
 * @param {string} [req.body.accessToken] - Google access token (for API access)
 * @param {string} [req.body.refreshToken] - Google refresh token (for token refresh)
 * 
 * @returns {Object} Authentication response
 * @returns {string} returns.token - JWT token for dashboard access
 * @returns {Object} returns.user - User profile information
 * @returns {string} returns.user.id - Google user ID (sub)
 * @returns {string} returns.user.name - User's full name
 * @returns {string} returns.user.email - User's email address
 * @returns {string} returns.user.picture - Profile picture URL
 * @returns {string} returns.user.method - Authentication method ('google')
 * @returns {boolean} returns.hasGoogleTokens - Whether user has stored API tokens
 * 
 * @throws {400} When ID token is missing
 * @throws {401} When Google token verification fails
 * 
 * @example
 * // Basic Google Sign-In (ID token only)
 * POST /auth/login-google
 * {
 *   "idToken": "eyJhbGciOiJSUzI1NiIs..."
 * }
 * 
 * // Full OAuth flow (with API access)
 * POST /auth/login-google  
 * {
 *   "idToken": "eyJhbGciOiJSUzI1NiIs...",
 *   "accessToken": "ya29.a0AfH6SMA...",
 *   "refreshToken": "1//04xXxXxXxX..."
 * }
 * 
 * @example
 * // Success Response
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "1234567890",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "picture": "https://lh3.googleusercontent.com/...",
 *     "method": "google"
 *   },
 *   "hasGoogleTokens": true
 * }
 */
router.post('/login-google', 
  validation.validationChains.googleAuth,
  validation.handleValidationErrors,
  async (req, res) => {
    try {
      const { idToken, accessToken, refreshToken } = req.body;
      
      const result = await authService.authenticateWithGoogle(idToken, accessToken, refreshToken);
      res.json(result);
    } catch (error) {
      handleServiceError(error, res, 'Google authentication failed');
    }
  });

/**
 * @route POST /auth/login-pin
 * @description PIN-based authentication for family members
 * 
 * Provides simple authentication for family members using predefined PINs.
 * Designed for children and family members who don't have Google accounts
 * or prefer simpler authentication. Can inherit Google tokens from previous
 * Google authentication if available.
 * 
 * @param {Object} req.body - Request body
 * @param {string} req.body.pin - User's PIN (required)
 * @param {string} req.body.name - User's display name (required)
 * 
 * @returns {Object} Authentication response
 * @returns {string} returns.token - JWT token for dashboard access
 * @returns {Object} returns.user - User profile information
 * @returns {string} returns.user.id - PIN user ID
 * @returns {string} returns.user.name - User's display name
 * @returns {string} returns.user.method - Authentication method ('pin')
 * @returns {boolean} returns.hasGoogleTokens - Whether user has stored Google tokens
 * 
 * @throws {400} When PIN or name is missing
 * @throws {401} When PIN is invalid
 * 
 * @example
 * // PIN Authentication Request
 * POST /auth/login-pin
 * {
 *   "pin": "1234",
 *   "name": "Family Member"
 * }
 * 
 * @example
 * // Success Response
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "family_member_1",
 *     "name": "Family Member",
 *     "method": "pin"
 *   },
 *   "hasGoogleTokens": false
 * }
 * 
 * @security PIN validation is currently simple for demo purposes.
 * In production, implement proper PIN storage with hashing and rate limiting.
 */
router.post('/login-pin',
  validation.validationChains.pinAuth,
  validation.handleValidationErrors,
  async (req, res) => {
    try {
      const { pin, name } = req.body;
      const clientIdentifier = req.ip || req.connection.remoteAddress || 'unknown';
      
      const result = await authService.authenticateWithPin(pin, name, clientIdentifier);
      res.json(result);
    } catch (error) {
      handleServiceError(error, res, 'PIN authentication failed');
    }
  });

/**
 * @route GET /auth/validate
 * @description Enhanced JWT token validation with Google token status
 * 
 * Validates JWT tokens and provides comprehensive status information including
 * Google OAuth token validity for users with Google authentication. Used by
 * client applications to verify authentication status and token freshness.
 * 
 * @param {string} req.headers.authorization - Bearer token (required)
 * 
 * @returns {Object} Validation response
 * @returns {boolean} returns.valid - Whether token is valid
 * @returns {Object} returns.user - User information from token
 * @returns {string} returns.user.id - User ID
 * @returns {string} returns.user.name - User's name
 * @returns {string} returns.user.email - User's email (if available)
 * @returns {string} returns.user.method - Authentication method
 * @returns {Object|null} returns.googleTokens - Google token status (if applicable)
 * @returns {boolean} returns.googleTokens.valid - Whether Google tokens are valid
 * @returns {string} returns.googleTokens.reason - Reason if invalid
 * @returns {string[]} returns.googleTokens.scopes - Available API scopes
 * 
 * @throws {401} When no token is provided
 * @throws {401} When token is invalid or expired
 * 
 * @example
 * // Request with Bearer token
 * GET /auth/validate
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * @example
 * // Success Response (Google user with valid tokens)
 * {
 *   "valid": true,
 *   "user": {
 *     "id": "1234567890",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "method": "google"
 *   },
 *   "googleTokens": {
 *     "valid": true,
 *     "reason": null,
 *     "scopes": ["email", "profile", "https://www.googleapis.com/auth/calendar"]
 *   }
 * }
 * 
 * @example
 * // Response for PIN user
 * {
 *   "valid": true,
 *   "user": {
 *     "id": "family_member_1",
 *     "name": "Family Member",
 *     "method": "pin"
 *   },
 *   "googleTokens": null
 * }
 */
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const result = await authService.validateToken(token);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Token validation failed');
  }
});

/**
 * @route POST /auth/logout
 * @description Enhanced logout with optional Google access revocation
 * 
 * Logs out users and optionally revokes Google API access tokens. For JWT-based
 * authentication, logout is primarily handled client-side by discarding the token.
 * This endpoint provides additional cleanup for Google OAuth tokens when requested.
 * 
 * @param {string} [req.headers.authorization] - Bearer token (optional)
 * @param {Object} req.body - Request body
 * @param {boolean} [req.body.revokeGoogleAccess=false] - Whether to revoke Google tokens
 * 
 * @returns {Object} Logout response
 * @returns {string} returns.message - Success message
 * @returns {boolean} returns.googleAccessRevoked - Whether Google access was revoked
 * 
 * @example
 * // Basic logout (JWT invalidation only)
 * POST /auth/logout
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * {
 *   "revokeGoogleAccess": false
 * }
 * 
 * @example
 * // Complete logout with Google access revocation
 * POST /auth/logout
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * {
 *   "revokeGoogleAccess": true
 * }
 * 
 * @example
 * // Success Response
 * {
 *   "message": "Logged out successfully",
 *   "googleAccessRevoked": true
 * }
 * 
 * @note JWT tokens cannot be truly invalidated server-side without maintaining
 * a token blacklist. Clients must discard tokens to complete logout.
 * 
 * @note Google access revocation is best-effort. Logout succeeds even if
 * revocation fails to ensure users can always log out.
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { revokeGoogleAccess = false } = req.body;
    
    const result = await authService.logout(token, revokeGoogleAccess);
    res.json(result);
  } catch (error) {
    // Always succeed for logout to ensure users can always log out
    console.error('Logout error:', error);
    res.json({ 
      message: 'Logged out successfully',
      googleAccessRevoked: false
    });
  }
});


module.exports = router;