/**
 * Authentication Service for Home Dashboard
 * 
 * Centralized business logic for all authentication operations including:
 * - Google OAuth 2.0 authentication and token management
 * - PIN-based authentication for family members
 * - JWT token generation and validation
 * - User session management and logout
 * 
 * This service abstracts complex authentication logic from route handlers,
 * providing consistent error handling using the unified error system.
 * 
 * @module AuthService
 * @version 1.0.0
 * @author Home Dashboard Team
 */

const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const config = require('../../config');
const tokenManager = require('../utils/tokenManager');
const pinManager = require('../utils/pinManager');
const { ErrorTypes, ErrorResponse } = require('../utils/errorHandling');

/**
 * Authentication Service Class
 * 
 * Provides comprehensive authentication services with consistent error handling
 * and business logic separation from HTTP layer concerns.
 */
class AuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.services.google.clientId,
      config.services.google.clientSecret,
      config.services.google.redirectUri
    );
  }

  /**
   * Generate JWT token with user information and Google token metadata
   * 
   * Creates a signed JWT containing user identity and authentication method.
   * For Google OAuth users, includes token metadata (not actual tokens) for
   * client-side feature detection and security validation.
   * 
   * @param {Object} user - User object with identity information
   * @param {string} user.id - Unique user identifier
   * @param {string} user.name - User's display name
   * @param {string} user.email - User's email address
   * @param {string} [method='google'] - Authentication method ('google' or 'pin')
   * @param {Object|null} [googleTokens=null] - Google OAuth tokens for metadata
   * @returns {string} Signed JWT token
   */
  generateToken(user, method = 'google', googleTokens = null) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      method: method
    };
    
    // Add Google token metadata if available (not the actual tokens for security)
    if (googleTokens) {
      payload.googleTokens = {
        hasTokens: true,
        scopes: googleTokens.scope ? googleTokens.scope.split(' ') : [],
        expiryDate: googleTokens.expiry_date
      };
    }
    
    return jwt.sign(payload, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn });
  }

  /**
   * Authenticate user with Google OAuth ID token
   * 
   * Handles both basic Google Sign-In (ID token only) and full OAuth flow
   * (with API access tokens). Verifies ID token, creates user profile,
   * and optionally stores OAuth tokens for API access.
   * 
   * @param {string} idToken - Google ID token (required)
   * @param {string} [accessToken] - Google access token (for API access)
   * @param {string} [refreshToken] - Google refresh token (for token refresh)
   * @returns {Promise<Object>} Authentication result
   * @throws {ErrorResponse} When token verification fails
   */
  async authenticateWithGoogle(idToken, accessToken = null, refreshToken = null) {
    try {
      if (!idToken) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'ID token is required',
          null,
          400
        );
      }

      // Verify Google ID token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: config.services.google.clientId,
      });

      const payload = ticket.getPayload();
      
      // Create user object
      const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      // Store OAuth tokens if provided (from full OAuth flow)
      let googleTokens = null;
      if (accessToken && refreshToken) {
        googleTokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
          id_token: idToken,
          token_type: 'Bearer',
          scope: config.services.google.scopes.join(' '),
          expiry_date: Date.now() + (3600 * 1000) // 1 hour default
        };
        
        const stored = await tokenManager.storeTokens(user.id, googleTokens);
        if (!stored) {
          console.warn(`Failed to store Google tokens for user: ${user.id}`);
        }
      }

      const jwtToken = this.generateToken(user, 'google', googleTokens);
      
      return {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          method: 'google'
        },
        hasGoogleTokens: !!googleTokens
      };
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Google authentication error:', error);
      throw new ErrorResponse(
        ErrorTypes.UNAUTHORIZED,
        'Google token verification failed',
        error.message,
        401
      );
    }
  }

  /**
   * Authenticate user with PIN
   * 
   * Provides simple authentication for family members using predefined PINs.
   * Includes rate limiting and can inherit Google tokens from previous
   * Google authentication if available.
   * 
   * @param {string} pin - User's PIN (required)
   * @param {string} name - User's display name (required)
   * @param {string} clientIdentifier - Client IP for rate limiting
   * @returns {Promise<Object>} Authentication result
   * @throws {ErrorResponse} When PIN validation fails
   */
  async authenticateWithPin(pin, name, clientIdentifier) {
    try {
      if (!pin || !name) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'PIN and name are required',
          null,
          400
        );
      }
      
      // Validate PIN using secure PIN manager
      const pinValidation = await pinManager.validatePin(pin, name, clientIdentifier);
      
      if (!pinValidation.valid) {
        const statusCode = pinValidation.lockoutEnd ? 429 : 401; // 429 for rate limiting
        throw new ErrorResponse(
          pinValidation.lockoutEnd ? ErrorTypes.TIMEOUT : ErrorTypes.UNAUTHORIZED,
          pinValidation.error,
          {
            lockoutEnd: pinValidation.lockoutEnd,
            remainingTime: pinValidation.remainingTime
          },
          statusCode
        );
      }
      
      const user = pinValidation.user;
      
      // Check if user has stored Google tokens
      const tokenValidation = await tokenManager.validateTokens(user.id);
      
      const jwtToken = this.generateToken(user, 'pin', tokenValidation.valid ? tokenValidation.tokens : null);
      
      return {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          method: 'pin'
        },
        hasGoogleTokens: tokenValidation.valid
      };
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('PIN authentication error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'PIN authentication failed',
        error.message,
        500
      );
    }
  }

  /**
   * Validate JWT token with optional Google token validation
   * 
   * Validates JWT tokens and provides comprehensive status information including
   * Google OAuth token validity for users with Google authentication.
   * 
   * @param {string} token - JWT token to validate
   * @returns {Promise<Object>} Validation result
   * @throws {ErrorResponse} When token is invalid
   */
  async validateToken(token) {
    try {
      if (!token) {
        throw new ErrorResponse(
          ErrorTypes.UNAUTHORIZED,
          'No token provided',
          null,
          401
        );
      }

      const decoded = jwt.verify(token, config.auth.jwtSecret);
      
      // Check Google token status if user has them
      let googleTokenStatus = null;
      if (decoded.method === 'google' || decoded.googleTokens?.hasTokens) {
        const validation = await tokenManager.validateTokens(decoded.id);
        googleTokenStatus = {
          valid: validation.valid,
          reason: validation.reason,
          scopes: validation.tokens?.scope?.split(' ') || []
        };
      }
      
      return {
        valid: true,
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          method: decoded.method
        },
        googleTokens: googleTokenStatus
      };
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Token validation error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        throw new ErrorResponse(
          ErrorTypes.UNAUTHORIZED,
          'Invalid token',
          null,
          401
        );
      }
      
      if (error.name === 'TokenExpiredError') {
        throw new ErrorResponse(
          ErrorTypes.UNAUTHORIZED,
          'Token expired',
          null,
          401
        );
      }
      
      throw new ErrorResponse(
        ErrorTypes.UNAUTHORIZED,
        'Token validation failed',
        error.message,
        401
      );
    }
  }

  /**
   * Logout user with optional Google access revocation
   * 
   * Handles user logout with optional cleanup of Google OAuth tokens.
   * For JWT-based authentication, logout is primarily handled client-side
   * by discarding the token. This method provides additional cleanup for
   * Google OAuth tokens when requested.
   * 
   * @param {string|null} token - JWT token (optional)
   * @param {boolean} [revokeGoogleAccess=false] - Whether to revoke Google tokens
   * @returns {Promise<Object>} Logout result
   */
  async logout(token = null, revokeGoogleAccess = false) {
    try {
      let googleAccessRevoked = false;
      
      if (token && revokeGoogleAccess) {
        try {
          const decoded = jwt.verify(token, config.auth.jwtSecret);
          
          // Revoke Google tokens if requested
          if (decoded.method === 'google' || decoded.googleTokens?.hasTokens) {
            const tokens = await tokenManager.getTokens(decoded.id);
            
            if (tokens && tokens.access_token) {
              this.oauth2Client.setCredentials(tokens);
              await this.oauth2Client.revokeCredentials();
              console.log(`Google access revoked for user: ${decoded.id}`);
              googleAccessRevoked = true;
            }
            
            // Remove stored tokens
            await tokenManager.removeTokens(decoded.id);
          }
        } catch (error) {
          console.warn('Failed to revoke Google access during logout:', error);
          // Continue with logout even if revocation fails
        }
      }
      
      return { 
        message: 'Logged out successfully',
        googleAccessRevoked: googleAccessRevoked
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Always succeed for logout to ensure users can always log out
      return { 
        message: 'Logged out successfully',
        googleAccessRevoked: false
      };
    }
  }
}

module.exports = AuthService;