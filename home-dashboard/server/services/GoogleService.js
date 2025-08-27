/**
 * Google API Service for Home Dashboard
 * 
 * Centralized business logic for all Google API integrations including:
 * - Google Calendar events management
 * - Gmail message handling and sending
 * - Google Drive file operations
 * - Circuit breaker pattern implementation for reliability
 * - OAuth token management and authentication
 * 
 * This service abstracts Google API complexity from route handlers,
 * providing consistent error handling and circuit breaker protection.
 * 
 * @module GoogleService
 * @version 1.0.0
 * @author Home Dashboard Team
 */

const { google } = require('googleapis');
const config = require('../../config');
const tokenManager = require('../utils/tokenManager');
const { registry } = require('../utils/circuitBreaker');
const { ErrorTypes, ErrorResponse } = require('../utils/errorHandling');

/**
 * Google API Service Class
 * 
 * Provides comprehensive Google API services with circuit breaker protection
 * and unified error handling.
 */
class GoogleService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.services.google.clientId,
      config.services.google.clientSecret,
      config.services.google.redirectUri
    );
    
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for Google API services
   * 
   * Sets up individual circuit breakers for each Google service to prevent
   * cascade failures and provide service-specific fallback responses.
   */
  initializeCircuitBreakers() {
    // Google Calendar API circuit breaker
    registry.register('google-calendar', async (apiCall) => {
      return await apiCall();
    }, {
      name: 'Google Calendar API',
      failureThreshold: 3,
      timeWindow: 60000,
      timeout: 15000,
      resetTimeout: 30000,
      fallback: (error) => ({
        error: 'Calendar service temporarily unavailable',
        message: 'Google Calendar is experiencing issues. Please try again later.',
        fallback: true,
        timestamp: new Date().toISOString(),
        events: []
      })
    });

    // Gmail API circuit breaker
    registry.register('google-gmail', async (apiCall) => {
      return await apiCall();
    }, {
      name: 'Gmail API',
      failureThreshold: 3,
      timeWindow: 60000,
      timeout: 15000,
      resetTimeout: 30000,
      fallback: (error) => ({
        error: 'Gmail service temporarily unavailable',
        message: 'Gmail is experiencing issues. Please try again later.',
        fallback: true,
        timestamp: new Date().toISOString(),
        messages: []
      })
    });

    // Google Drive API circuit breaker
    registry.register('google-drive', async (apiCall) => {
      return await apiCall();
    }, {
      name: 'Google Drive API',
      failureThreshold: 3,
      timeWindow: 60000,
      timeout: 15000,
      resetTimeout: 30000,
      fallback: (error) => ({
        error: 'Drive service temporarily unavailable',
        message: 'Google Drive is experiencing issues. Please try again later.',
        fallback: true,
        timestamp: new Date().toISOString(),
        files: []
      })
    });
  }

  /**
   * Execute Google API calls through circuit breaker protection
   * 
   * @param {string} service - Service name ('calendar', 'gmail', 'drive')
   * @param {Function} apiCall - Async function making the Google API call
   * @returns {Promise<Object>} API response or fallback response
   */
  async executeWithCircuitBreaker(service, apiCall) {
    const breaker = registry.get(`google-${service}`);
    if (!breaker) {
      console.warn(`Circuit breaker not found for service: ${service}, executing directly`);
      return await apiCall();
    }
    return await breaker.execute(apiCall);
  }

  /**
   * Setup authenticated Google client for user
   * 
   * @param {string} userId - User ID to get tokens for
   * @param {string} method - Authentication method ('google' or 'pin')
   * @returns {Promise<google.auth.OAuth2>} Configured OAuth2 client
   * @throws {ErrorResponse} When authentication setup fails
   */
  async setupAuthenticatedClient(userId, method) {
    try {
      const client = new google.auth.OAuth2(
        config.services.google.clientId,
        config.services.google.clientSecret,
        config.services.google.redirectUri
      );

      if (method === 'google') {
        // Get stored tokens for Google-authenticated users
        const tokens = await tokenManager.getTokens(userId);
        if (!tokens) {
          throw new ErrorResponse(
            ErrorTypes.UNAUTHORIZED,
            'Google tokens not found',
            'User needs to re-authenticate with Google',
            401
          );
        }

        // Validate and refresh tokens if needed
        const validation = await tokenManager.validateTokens(userId);
        if (!validation.valid) {
          throw new ErrorResponse(
            ErrorTypes.UNAUTHORIZED,
            'Google tokens expired',
            validation.reason,
            401
          );
        }

        client.setCredentials(validation.tokens);
      } else {
        // For PIN users, check if they have inherited Google tokens
        const tokens = await tokenManager.getTokens(userId);
        if (tokens) {
          const validation = await tokenManager.validateTokens(userId);
          if (validation.valid) {
            client.setCredentials(validation.tokens);
          } else {
            throw new ErrorResponse(
              ErrorTypes.FORBIDDEN,
              'Google services not available',
              'PIN users need Google authentication for API access',
              403
            );
          }
        } else {
          throw new ErrorResponse(
            ErrorTypes.FORBIDDEN,
            'Google services not available',
            'PIN users need Google authentication for API access',
            403
          );
        }
      }

      return client;
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Google client setup error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to setup Google authentication',
        error.message,
        500
      );
    }
  }

  /**
   * Get Google Calendar events
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} options - Query options
   * @param {string} [options.timeMin] - Earliest event time (ISO string)
   * @param {string} [options.timeMax] - Latest event time (ISO string)
   * @param {number} [options.maxResults=10] - Maximum events to return
   * @returns {Promise<Object>} Calendar events response
   * @throws {ErrorResponse} When calendar access fails
   */
  async getCalendarEvents(userId, method, options = {}) {
    try {
      const client = await this.setupAuthenticatedClient(userId, method);
      const { timeMin, timeMax, maxResults = 10 } = options;

      return await this.executeWithCircuitBreaker('calendar', async () => {
        const calendar = google.calendar({ version: 'v3', auth: client });
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin || new Date().toISOString(),
          timeMax: timeMax,
          maxResults: parseInt(maxResults),
          singleEvents: true,
          orderBy: 'startTime',
        });
        
        const events = response.data.items.map(event => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location,
          attendees: event.attendees,
          htmlLink: event.htmlLink,
        }));
        
        return { events };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Calendar events error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to fetch calendar events',
        error.message,
        500
      );
    }
  }

  /**
   * Create Google Calendar event
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} eventData - Event details
   * @param {string} eventData.summary - Event title (required)
   * @param {string} [eventData.description] - Event description
   * @param {string} eventData.start - Start time (ISO string, required)
   * @param {string} eventData.end - End time (ISO string, required)
   * @param {string} [eventData.location] - Event location
   * @param {string[]} [eventData.attendees] - Attendee emails
   * @returns {Promise<Object>} Created event response
   * @throws {ErrorResponse} When event creation fails
   */
  async createCalendarEvent(userId, method, eventData) {
    try {
      if (!eventData.summary || !eventData.start || !eventData.end) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Missing required event data',
          'summary, start, and end are required',
          400
        );
      }

      const client = await this.setupAuthenticatedClient(userId, method);

      return await this.executeWithCircuitBreaker('calendar', async () => {
        const calendar = google.calendar({ version: 'v3', auth: client });
        
        const event = {
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.start,
            timeZone: 'UTC',
          },
          end: {
            dateTime: eventData.end,
            timeZone: 'UTC',
          },
          location: eventData.location,
          attendees: eventData.attendees?.map(email => ({ email })),
        };
        
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });
        
        return { event: response.data };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Create calendar event error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to create calendar event',
        error.message,
        500
      );
    }
  }

  /**
   * Get Gmail messages
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} options - Query options
   * @param {string} [options.q='is:unread'] - Gmail search query
   * @param {number} [options.maxResults=10] - Maximum messages to return
   * @returns {Promise<Object>} Gmail messages response
   * @throws {ErrorResponse} When Gmail access fails
   */
  async getGmailMessages(userId, method, options = {}) {
    try {
      const client = await this.setupAuthenticatedClient(userId, method);
      const { q = 'is:unread', maxResults = 10 } = options;

      return await this.executeWithCircuitBreaker('gmail', async () => {
        const gmail = google.gmail({ version: 'v1', auth: client });
        
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: q,
          maxResults: parseInt(maxResults),
        });
        
        const messages = [];
        
        if (response.data.messages) {
          for (const message of response.data.messages) {
            const messageData = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
            });
            
            const headers = messageData.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value;
            const from = headers.find(h => h.name === 'From')?.value;
            const date = headers.find(h => h.name === 'Date')?.value;
            
            messages.push({
              id: message.id,
              threadId: message.threadId,
              subject,
              from,
              date,
              snippet: messageData.data.snippet,
            });
          }
        }
        
        return { messages };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Gmail messages error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to fetch Gmail messages',
        error.message,
        500
      );
    }
  }

  /**
   * Send Gmail message
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} emailData - Email details
   * @param {string} emailData.to - Recipient email (required)
   * @param {string} emailData.subject - Email subject (required)
   * @param {string} emailData.body - Email body (required)
   * @returns {Promise<Object>} Send email response
   * @throws {ErrorResponse} When email sending fails
   */
  async sendGmailMessage(userId, method, emailData) {
    try {
      if (!emailData.to || !emailData.subject || !emailData.body) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Missing required email data',
          'to, subject, and body are required',
          400
        );
      }

      const client = await this.setupAuthenticatedClient(userId, method);

      return await this.executeWithCircuitBreaker('gmail', async () => {
        const gmail = google.gmail({ version: 'v1', auth: client });
        
        const email = [
          `To: ${emailData.to}`,
          `Subject: ${emailData.subject}`,
          '',
          emailData.body,
        ].join('\n');
        
        const base64Email = Buffer.from(email).toString('base64');
        
        const response = await gmail.users.messages.send({
          userId: 'me',
          resource: {
            raw: base64Email,
          },
        });
        
        return { messageId: response.data.id };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Send Gmail error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to send email',
        error.message,
        500
      );
    }
  }

  /**
   * Get Google Drive files
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} options - Query options
   * @param {string} [options.q='trashed=false'] - Drive search query
   * @param {number} [options.pageSize=10] - Number of files to return
   * @returns {Promise<Object>} Drive files response
   * @throws {ErrorResponse} When Drive access fails
   */
  async getDriveFiles(userId, method, options = {}) {
    try {
      const client = await this.setupAuthenticatedClient(userId, method);
      const { q = 'trashed=false', pageSize = 10 } = options;

      return await this.executeWithCircuitBreaker('drive', async () => {
        const drive = google.drive({ version: 'v3', auth: client });
        
        const response = await drive.files.list({
          q: q,
          pageSize: parseInt(pageSize),
          fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)',
        });
        
        const files = response.data.files.map(file => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
        }));
        
        return { files };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Drive files error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to fetch Drive files',
        error.message,
        500
      );
    }
  }

  /**
   * Upload file to Google Drive
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @param {Object} fileData - File details
   * @param {string} fileData.name - File name (required)
   * @param {string} fileData.content - File content (required)
   * @param {string} [fileData.mimeType='text/plain'] - File MIME type
   * @returns {Promise<Object>} Upload response
   * @throws {ErrorResponse} When file upload fails
   */
  async uploadDriveFile(userId, method, fileData) {
    try {
      if (!fileData.name || !fileData.content) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Missing required file data',
          'name and content are required',
          400
        );
      }

      const client = await this.setupAuthenticatedClient(userId, method);

      return await this.executeWithCircuitBreaker('drive', async () => {
        const drive = google.drive({ version: 'v3', auth: client });
        
        const response = await drive.files.create({
          resource: {
            name: fileData.name,
          },
          media: {
            mimeType: fileData.mimeType || 'text/plain',
            body: fileData.content,
          },
        });
        
        return { file: response.data };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Drive upload error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to upload file',
        error.message,
        500
      );
    }
  }

  /**
   * Get authentication status for Google services
   * 
   * @param {string} userId - User ID
   * @param {string} method - Authentication method
   * @returns {Promise<Object>} Authentication status
   */
  async getAuthStatus(userId, method) {
    try {
      const hasGoogleAuth = method === 'google';
      let servicesAvailable = false;

      if (method === 'pin') {
        // Check if PIN user has inherited Google tokens
        const tokens = await tokenManager.getTokens(userId);
        if (tokens) {
          const validation = await tokenManager.validateTokens(userId);
          servicesAvailable = validation.valid;
        }
      } else {
        servicesAvailable = hasGoogleAuth;
      }

      return {
        authenticated: hasGoogleAuth,
        method: method,
        services: {
          calendar: servicesAvailable,
          gmail: servicesAvailable,
          drive: servicesAvailable,
        },
      };
    } catch (error) {
      console.error('Auth status error:', error);
      return {
        authenticated: false,
        method: method,
        services: {
          calendar: false,
          gmail: false,
          drive: false,
        },
      };
    }
  }

  /**
   * Generate Google OAuth 2.0 authorization URL
   * 
   * Creates an authorization URL for Google OAuth flow with proper scopes
   * and state parameter for security.
   * 
   * @returns {Promise<Object>} Authorization URL response
   * @returns {string} returns.authUrl - Google OAuth authorization URL
   * @returns {string} returns.state - OAuth state parameter
   */
  async getAuthUrl() {
    try {
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: config.services.google.scopes,
        state: state,
        prompt: 'consent' // Force consent screen to get refresh token
      });

      return {
        authUrl: authUrl,
        state: state
      };
    } catch (error) {
      console.error('Generate auth URL error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to generate authorization URL',
        error.message,
        500
      );
    }
  }

  /**
   * Handle Google OAuth 2.0 callback
   * 
   * Exchanges authorization code for access tokens and creates JWT token
   * for dashboard authentication.
   * 
   * @param {string} code - Authorization code from Google
   * @param {string} state - State parameter for validation
   * @returns {Promise<Object>} Authentication result
   * @returns {string} returns.token - JWT token for dashboard access
   * @returns {Object} returns.user - User profile information
   */
  async handleAuthCallback(code, state) {
    try {
      if (!code) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Authorization code required',
          'No authorization code provided',
          400
        );
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user profile
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const user = {
        id: userInfo.data.id,
        name: userInfo.data.name,
        email: userInfo.data.email,
        picture: userInfo.data.picture,
        method: 'google'
      };

      // Store tokens for API access
      await tokenManager.storeTokens(user.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      });

      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(user, config.auth.jwtSecret, { 
        expiresIn: config.auth.jwtExpiresIn 
      });

      return {
        token: token,
        user: user,
        hasGoogleTokens: true
      };
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('OAuth callback handling error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to handle OAuth callback',
        error.message,
        500
      );
    }
  }
}

module.exports = GoogleService;