const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const config = require('../../config');

/**
 * Google OAuth Token Management System
 * 
 * Features:
 * - Secure token storage with AES-256-GCM encryption
 * - Automatic token refresh before expiration
 * - Graceful error handling and logging
 * - Support for multiple users
 * - Circuit breaker pattern for reliability
 */
class TokenManager {
  constructor() {
    this.tokenStorePath = path.join(__dirname, '../data/tokens');
    this.encryptionKey = this.getEncryptionKey();
    this.refreshPromises = new Map(); // Prevent concurrent refresh attempts
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      isOpen: false,
      threshold: 5,
      timeout: 60000 // 1 minute
    };
    
    this.initializeStorage();
  }

  /**
   * Initialize secure token storage directory
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.tokenStorePath, { recursive: true, mode: 0o700 });
    } catch (error) {
      console.error('Failed to initialize token storage:', error);
    }
  }

  /**
   * Get or generate encryption key from environment or file
   */
  getEncryptionKey() {
    const envKey = process.env.TOKEN_ENCRYPTION_KEY;
    if (envKey && envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }

    // Generate and store a key if none exists
    const keyPath = path.join(__dirname, '../data/.token_key');
    try {
      const existingKey = require('fs').readFileSync(keyPath);
      return existingKey;
    } catch {
      const newKey = crypto.randomBytes(32);
      try {
        require('fs').writeFileSync(keyPath, newKey, { mode: 0o600 });
        console.log('Generated new token encryption key');
      } catch (error) {
        console.error('Failed to save encryption key:', error);
      }
      return newKey;
    }
  }

  /**
   * Encrypt token data using AES-256-GCM
   */
  encryptTokens(tokens) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM('aes-256-gcm', this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('google-oauth-tokens'));
      
      let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt tokens');
    }
  }

  /**
   * Decrypt token data
   */
  decryptTokens(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.encryptionKey, Buffer.from(iv, 'hex'));
      
      decipher.setAAD(Buffer.from('google-oauth-tokens'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt tokens');
    }
  }

  /**
   * Store encrypted tokens for a user
   */
  async storeTokens(userId, tokens) {
    try {
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
        stored_at: Date.now()
      };

      const encryptedData = this.encryptTokens(tokenData);
      const filePath = path.join(this.tokenStorePath, `${userId}.enc`);
      
      await fs.writeFile(filePath, JSON.stringify(encryptedData), { mode: 0o600 });
      console.log(`Tokens stored securely for user: ${userId}`);
      
      return true;
    } catch (error) {
      console.error(`Failed to store tokens for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt tokens for a user
   */
  async getTokens(userId) {
    try {
      const filePath = path.join(this.tokenStorePath, `${userId}.enc`);
      const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      const tokens = this.decryptTokens(encryptedData);
      
      // Check if tokens need refresh (5 minutes before expiry)
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes
      const needsRefresh = tokens.expiry_date && 
                          (tokens.expiry_date - Date.now()) < expiryBuffer;

      if (needsRefresh) {
        console.log(`Tokens for user ${userId} need refresh`);
        return await this.refreshTokens(userId, tokens);
      }

      return tokens;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No stored tokens found for user: ${userId}`);
        return null;
      }
      console.error(`Failed to retrieve tokens for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Refresh OAuth tokens with circuit breaker pattern
   */
  async refreshTokens(userId, currentTokens) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new Error('Token refresh circuit breaker is open');
    }

    // Prevent concurrent refresh attempts for the same user
    if (this.refreshPromises.has(userId)) {
      return await this.refreshPromises.get(userId);
    }

    const refreshPromise = this.performTokenRefresh(userId, currentTokens);
    this.refreshPromises.set(userId, refreshPromise);

    try {
      const result = await refreshPromise;
      this.onRefreshSuccess();
      return result;
    } catch (error) {
      this.onRefreshFailure(error);
      throw error;
    } finally {
      this.refreshPromises.delete(userId);
    }
  }

  /**
   * Perform the actual token refresh
   */
  async performTokenRefresh(userId, currentTokens) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        config.services.google.clientId,
        config.services.google.clientSecret,
        config.services.google.redirectUri
      );

      oauth2Client.setCredentials({
        refresh_token: currentTokens.refresh_token
      });

      console.log(`Refreshing tokens for user: ${userId}`);
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update expiry date if not provided
      if (!credentials.expiry_date) {
        credentials.expiry_date = Date.now() + (credentials.expires_in * 1000);
      }

      // Preserve refresh token if not returned (some providers don't return it)
      if (!credentials.refresh_token) {
        credentials.refresh_token = currentTokens.refresh_token;
      }

      // Store the refreshed tokens
      await this.storeTokens(userId, credentials);

      console.log(`Tokens refreshed successfully for user: ${userId}`);
      return credentials;
    } catch (error) {
      console.error(`Token refresh failed for user ${userId}:`, error);
      
      // Handle specific OAuth errors
      if (error.message.includes('invalid_grant')) {
        console.error(`Refresh token expired for user ${userId}. Re-authentication required.`);
        await this.removeTokens(userId);
        throw new Error('Refresh token expired. Please re-authenticate.');
      }
      
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Remove stored tokens for a user
   */
  async removeTokens(userId) {
    try {
      const filePath = path.join(this.tokenStorePath, `${userId}.enc`);
      await fs.unlink(filePath);
      console.log(`Tokens removed for user: ${userId}`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to remove tokens for user ${userId}:`, error);
      }
      return false;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen() {
    if (!this.circuitBreaker.isOpen) return false;
    
    const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceLastFailure > this.circuitBreaker.timeout) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      console.log('Circuit breaker reset');
      return false;
    }
    
    return true;
  }

  /**
   * Handle successful token refresh
   */
  onRefreshSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
  }

  /**
   * Handle failed token refresh
   */
  onRefreshFailure(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      console.error(`Circuit breaker opened after ${this.circuitBreaker.failures} failures`);
    }
  }

  /**
   * Create and configure OAuth2 client with stored tokens
   */
  async createAuthenticatedClient(userId) {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) {
        throw new Error('No tokens available for user');
      }

      const oauth2Client = new google.auth.OAuth2(
        config.services.google.clientId,
        config.services.google.clientSecret,
        config.services.google.redirectUri
      );

      oauth2Client.setCredentials(tokens);

      // Set up automatic token refresh
      oauth2Client.on('tokens', async (newTokens) => {
        console.log(`Received new tokens for user: ${userId}`);
        await this.storeTokens(userId, { ...tokens, ...newTokens });
      });

      return oauth2Client;
    } catch (error) {
      console.error(`Failed to create authenticated client for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate tokens and check scopes
   */
  async validateTokens(userId, requiredScopes = []) {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) return { valid: false, reason: 'No tokens found' };

      // Check expiry
      if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
        return { valid: false, reason: 'Tokens expired' };
      }

      // Check scopes if provided
      if (requiredScopes.length > 0 && tokens.scope) {
        const tokenScopes = tokens.scope.split(' ');
        const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
        
        if (missingScopes.length > 0) {
          return { 
            valid: false, 
            reason: 'Insufficient scopes',
            missingScopes 
          };
        }
      }

      return { valid: true, tokens };
    } catch (error) {
      console.error(`Token validation failed for user ${userId}:`, error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Health check for token management system
   */
  async healthCheck() {
    try {
      // Check if storage directory is accessible
      await fs.access(this.tokenStorePath);
      
      return {
        status: 'healthy',
        circuitBreakerOpen: this.circuitBreaker.isOpen,
        failures: this.circuitBreaker.failures,
        activeRefreshes: this.refreshPromises.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

/**
 * Usage Examples for Token Manager
 * 
 * @example
 * // Store Google OAuth tokens after authentication
 * const tokenManager = require('./tokenManager');
 * 
 * router.post('/auth/google', async (req, res) => {
 *   try {
 *     // Verify Google token and get user info
 *     const { credentials } = await oauth2Client.getToken(authCode);
 *     
 *     // Store tokens securely
 *     const stored = await tokenManager.storeTokens(user.id, credentials);
 *     if (!stored) {
 *       throw new Error('Failed to store tokens');
 *     }
 *     
 *     res.json({ success: true, user });
 *   } catch (error) {
 *     res.status(500).json({ error: 'Authentication failed' });
 *   }
 * });
 * 
 * @example
 * // Validate tokens before making API calls
 * router.get('/google/calendar', async (req, res) => {
 *   try {
 *     const validation = await tokenManager.validateTokens(
 *       req.user.id,
 *       ['https://www.googleapis.com/auth/calendar']
 *     );
 *     
 *     if (!validation.valid) {
 *       return res.status(401).json({
 *         error: 'Google authentication required',
 *         reason: validation.reason
 *       });
 *     }
 *     
 *     // Use validated tokens for API call
 *     const client = await tokenManager.createAuthenticatedClient(req.user.id);
 *     // ... make Google API calls
 *   } catch (error) {
 *     res.status(500).json({ error: 'Token validation failed' });
 *   }
 * });
 * 
 * @example
 * // Handle token refresh in middleware
 * const refreshTokenMiddleware = async (req, res, next) => {
 *   if (req.user.method !== 'google') {
 *     return next();
 *   }
 *   
 *   try {
 *     // Get fresh tokens (automatically refreshes if needed)
 *     const tokens = await tokenManager.getTokens(req.user.id);
 *     if (!tokens) {
 *       return res.status(401).json({ error: 'Re-authentication required' });
 *     }
 *     
 *     req.googleTokens = tokens;
 *     next();
 *   } catch (error) {
 *     if (error.message.includes('expired')) {
 *       return res.status(401).json({ 
 *         error: 'Google tokens expired',
 *         code: 'REAUTH_REQUIRED'
 *       });
 *     }
 *     next(error);
 *   }
 * };
 * 
 * @example
 * // Clean up tokens on logout
 * router.post('/auth/logout', async (req, res) => {
 *   try {
 *     if (req.body.revokeGoogleAccess && req.user.method === 'google') {
 *       const tokens = await tokenManager.getTokens(req.user.id);
 *       if (tokens) {
 *         // Revoke access with Google
 *         const oauth2Client = new google.auth.OAuth2();
 *         oauth2Client.setCredentials(tokens);
 *         await oauth2Client.revokeCredentials();
 *       }
 *       
 *       // Remove stored tokens
 *       await tokenManager.removeTokens(req.user.id);
 *     }
 *     
 *     res.json({ message: 'Logged out successfully' });
 *   } catch (error) {
 *     // Log error but don't fail logout
 *     console.error('Logout cleanup error:', error);
 *     res.json({ message: 'Logged out successfully' });
 *   }
 * });
 * 
 * @example
 * // Health monitoring
 * router.get('/health/tokens', async (req, res) => {
 *   try {
 *     const health = await tokenManager.healthCheck();
 *     res.json(health);
 *   } catch (error) {
 *     res.status(500).json({ error: 'Health check failed' });
 *   }
 * });
 */

module.exports = new TokenManager();