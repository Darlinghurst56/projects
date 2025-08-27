/**
 * Google API Integration Routes for Home Dashboard
 * 
 * HTTP layer for Google services integration with comprehensive error handling.
 * This module handles routing, validation, and response formatting while
 * delegating business logic to GoogleService for proper separation of concerns.
 * 
 * Supports Google Calendar, Gmail, and Google Drive APIs with:
 * - Circuit breaker pattern protection via GoogleService
 * - Automatic authentication and token management
 * - Graceful degradation when services are unavailable
 * - Unified error handling and logging
 * 
 * @module GoogleRoutes
 * @version 3.0.0
 * @author Home Dashboard Team
 */

const express = require('express');
const { defaultContainer } = require('../services/ServiceContainer');
const authMiddleware = require('../middleware/auth');
const { ErrorResponse } = require('../utils/errorHandling');

const router = express.Router();
const googleService = defaultContainer.resolve('googleService');

// Apply authentication middleware to all Google routes
router.use(authMiddleware);

/**
 * Helper function to handle service errors and convert to HTTP responses
 * 
 * @param {ErrorResponse|Error} error - Error from service layer
 * @param {Object} res - Express response object
 * @param {string} defaultMessage - Default error message
 */
const handleServiceError = (error, res, defaultMessage = 'Google service operation failed') => {
  if (error instanceof ErrorResponse) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  console.error('Unhandled Google service error:', error);
  return res.status(500).json({ 
    error: defaultMessage,
    type: 'InternalServerError',
    timestamp: new Date().toISOString()
  });
};

/**
 * @route GET /google/calendar/events
 * @description Retrieve Google Calendar events with circuit breaker protection
 * 
 * Fetches events from the user's primary Google Calendar with configurable
 * time range and result limits. Protected by circuit breaker for reliability.
 * 
 * @param {string} [req.query.timeMin] - ISO timestamp for earliest event time
 * @param {string} [req.query.timeMax] - ISO timestamp for latest event time
 * @param {string} [req.query.maxResults=10] - Maximum number of events to return
 * 
 * @returns {Object} Calendar events response
 * @returns {Object[]} returns.events - Array of calendar events
 * @returns {string} returns.events[].id - Event ID
 * @returns {string} returns.events[].summary - Event title
 * @returns {string} returns.events[].description - Event description
 * @returns {string} returns.events[].start - Event start time (ISO string)
 * @returns {string} returns.events[].end - Event end time (ISO string)
 * @returns {string} returns.events[].location - Event location
 * @returns {Object[]} returns.events[].attendees - Event attendees
 * @returns {string} returns.events[].htmlLink - Google Calendar link
 * 
 * @throws {500} When calendar API call fails
 * 
 * @example
 * // Fetch upcoming events
 * GET /google/calendar/events?maxResults=5
 * 
 * @example
 * // Fetch events for specific date range
 * GET /google/calendar/events?timeMin=2024-01-01T00:00:00Z&timeMax=2024-01-31T23:59:59Z
 * 
 * @example
 * // Success Response
 * {
 *   "events": [
 *     {
 *       "id": "event123",
 *       "summary": "Team Meeting",
 *       "description": "Weekly team sync",
 *       "start": "2024-01-15T10:00:00Z",
 *       "end": "2024-01-15T11:00:00Z",
 *       "location": "Conference Room A",
 *       "attendees": [{"email": "john@example.com"}],
 *       "htmlLink": "https://calendar.google.com/event?eid=..."
 *     }
 *   ]
 * }
 * 
 * @example
 * // Circuit Breaker Fallback Response
 * {
 *   "error": "Calendar service temporarily unavailable",
 *   "message": "Google Calendar is experiencing issues. Please try again later.",
 *   "fallback": true,
 *   "timestamp": "2024-01-15T10:00:00.000Z",
 *   "events": []
 * }
 */
router.get('/calendar/events', async (req, res) => {
  try {
    const { timeMin, timeMax, maxResults = 10 } = req.query;
    
    const result = await googleService.getCalendarEvents(
      req.user.id,
      req.user.method,
      { timeMin, timeMax, maxResults }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to fetch calendar events');
  }
});

/**
 * @route POST /google/calendar/events
 * @description Create new Google Calendar event with circuit breaker protection
 * 
 * Creates a new event in the user's primary Google Calendar. Supports all
 * standard calendar event properties including attendees and location.
 * 
 * @param {Object} req.body - Event details
 * @param {string} req.body.summary - Event title (required)
 * @param {string} [req.body.description] - Event description
 * @param {string} req.body.start - Event start time (ISO string, required)
 * @param {string} req.body.end - Event end time (ISO string, required)
 * @param {string} [req.body.location] - Event location
 * @param {string[]} [req.body.attendees] - Array of attendee email addresses
 * 
 * @returns {Object} Created event response
 * @returns {Object} returns.event - Created event details (Google Calendar format)
 * 
 * @throws {500} When event creation fails
 * 
 * @example
 * // Create simple event
 * POST /google/calendar/events
 * {
 *   "summary": "Doctor Appointment",
 *   "start": "2024-01-15T14:00:00Z",
 *   "end": "2024-01-15T15:00:00Z"
 * }
 * 
 * @example
 * // Create detailed event with attendees
 * POST /google/calendar/events
 * {
 *   "summary": "Family Birthday Party",
 *   "description": "Celebrating Mom's birthday",
 *   "start": "2024-01-20T18:00:00Z",
 *   "end": "2024-01-20T21:00:00Z",
 *   "location": "Home",
 *   "attendees": ["dad@family.com", "sister@family.com"]
 * }
 */
router.post('/calendar/events', async (req, res) => {
  try {
    const { summary, description, start, end, location, attendees } = req.body;
    
    const result = await googleService.createCalendarEvent(
      req.user.id,
      req.user.method,
      { summary, description, start, end, location, attendees }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to create calendar event');
  }
});

/**
 * @route GET /google/gmail/messages
 * @description Retrieve Gmail messages with circuit breaker protection
 * 
 * Fetches messages from the user's Gmail inbox with configurable query
 * and result limits. Default query fetches unread messages.
 * 
 * @param {string} [req.query.q='is:unread'] - Gmail search query
 * @param {string} [req.query.maxResults=10] - Maximum messages to return
 * 
 * @returns {Object} Gmail messages response
 * @returns {Object[]} returns.messages - Array of email messages
 * @returns {string} returns.messages[].id - Message ID
 * @returns {string} returns.messages[].threadId - Thread ID
 * @returns {string} returns.messages[].subject - Email subject
 * @returns {string} returns.messages[].from - Sender information
 * @returns {string} returns.messages[].date - Message date
 * @returns {string} returns.messages[].snippet - Message preview
 * 
 * @example
 * // Get unread messages
 * GET /google/gmail/messages
 * 
 * @example
 * // Search for specific messages
 * GET /google/gmail/messages?q=from:john@example.com&maxResults=5
 */
router.get('/gmail/messages', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    const result = await googleService.getGmailMessages(
      req.user.id,
      req.user.method,
      { q, maxResults }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to fetch Gmail messages');
  }
});

/**
 * @route POST /google/gmail/send
 * @description Send email via Gmail with circuit breaker protection
 * 
 * Sends an email through the user's Gmail account. Supports basic email
 * composition with recipient, subject, and body content.
 * 
 * @param {Object} req.body - Email details
 * @param {string} req.body.to - Recipient email address (required)
 * @param {string} req.body.subject - Email subject (required)
 * @param {string} req.body.body - Email body content (required)
 * 
 * @returns {Object} Send email response
 * @returns {string} returns.messageId - ID of sent message
 * 
 * @example
 * POST /google/gmail/send
 * {
 *   "to": "family@example.com",
 *   "subject": "Dinner Plans",
 *   "body": "What should we have for dinner tonight?"
 * }
 */
router.post('/gmail/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    const result = await googleService.sendGmailMessage(
      req.user.id,
      req.user.method,
      { to, subject, body }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to send email');
  }
});

/**
 * @route GET /google/drive/files
 * @description List Google Drive files with circuit breaker protection
 * 
 * Retrieves files from the user's Google Drive with configurable search
 * query and pagination. Default query excludes trashed files.
 * 
 * @param {string} [req.query.q='trashed=false'] - Drive search query
 * @param {string} [req.query.pageSize=10] - Number of files to return
 * 
 * @returns {Object} Drive files response
 * @returns {Object[]} returns.files - Array of drive files
 * @returns {string} returns.files[].id - File ID
 * @returns {string} returns.files[].name - File name
 * @returns {string} returns.files[].mimeType - File MIME type
 * @returns {string} returns.files[].size - File size in bytes
 * @returns {string} returns.files[].modifiedTime - Last modified time
 * @returns {string} returns.files[].webViewLink - View link in browser
 * 
 * @example
 * // List recent files
 * GET /google/drive/files?pageSize=20
 * 
 * @example
 * // Search for specific files
 * GET /google/drive/files?q=name contains 'family photos'
 */
router.get('/drive/files', async (req, res) => {
  try {
    const { q, pageSize = 10 } = req.query;
    
    const result = await googleService.getDriveFiles(
      req.user.id,
      req.user.method,
      { q, pageSize }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to fetch Drive files');
  }
});

/**
 * @route POST /google/drive/upload
 * @description Upload file to Google Drive with circuit breaker protection
 * 
 * Creates a new file in the user's Google Drive with specified content.
 * Supports text files and basic file metadata.
 * 
 * @param {Object} req.body - File details
 * @param {string} req.body.name - File name (required)
 * @param {string} req.body.content - File content (required)
 * @param {string} [req.body.mimeType='text/plain'] - File MIME type
 * 
 * @returns {Object} Upload response
 * @returns {Object} returns.file - Created file details (Google Drive format)
 * 
 * @example
 * POST /google/drive/upload
 * {
 *   "name": "family-notes.txt",
 *   "content": "Remember to buy groceries",
 *   "mimeType": "text/plain"
 * }
 */
router.post('/drive/upload', async (req, res) => {
  try {
    const { name, content, mimeType = 'text/plain' } = req.body;
    
    const result = await googleService.uploadDriveFile(
      req.user.id,
      req.user.method,
      { name, content, mimeType }
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to upload file');
  }
});

/**
 * @route GET /google/auth/status
 * @description Get Google services authentication status
 * 
 * Returns the current user's authentication status and available Google
 * services based on their authentication method and stored tokens.
 * 
 * @returns {Object} Authentication status
 * @returns {boolean} returns.authenticated - Whether user has Google auth
 * @returns {string} returns.method - Authentication method used
 * @returns {Object} returns.services - Available service status
 * @returns {boolean} returns.services.calendar - Calendar access available
 * @returns {boolean} returns.services.gmail - Gmail access available
 * @returns {boolean} returns.services.drive - Drive access available
 * 
 * @example
 * // Success Response for Google user
 * {
 *   "authenticated": true,
 *   "method": "google",
 *   "services": {
 *     "calendar": true,
 *     "gmail": true,
 *     "drive": true
 *   }
 * }
 * 
 * @example
 * // Response for PIN user
 * {
 *   "authenticated": false,
 *   "method": "pin",
 *   "services": {
 *     "calendar": false,
 *     "gmail": false,
 *     "drive": false
 *   }
 * }
 */
router.get('/auth/status', async (req, res) => {
  try {
    const result = await googleService.getAuthStatus(
      req.user.id,
      req.user.method
    );
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get auth status');
  }
});

/**
 * @route GET /google/auth-url
 * @description Get Google OAuth 2.0 authorization URL
 * 
 * Generates the OAuth 2.0 authorization URL for Google services authentication.
 * Used by frontend widgets to redirect users to Google's consent screen.
 * 
 * @returns {Object} Authorization URL response
 * @returns {string} returns.authUrl - Google OAuth authorization URL
 * @returns {string} returns.state - OAuth state parameter for security
 * 
 * @example
 * // Request
 * GET /google/auth-url
 * 
 * @example
 * // Success Response
 * {
 *   "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
 *   "state": "random-state-string"
 * }
 */
router.get('/auth-url', async (req, res) => {
  try {
    const result = await googleService.getAuthUrl();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to generate auth URL');
  }
});

/**
 * @route GET /google/callback
 * @description Google OAuth 2.0 callback endpoint
 * 
 * Handles the callback from Google OAuth flow, exchanges authorization code
 * for access tokens, and redirects to the dashboard with authentication status.
 * 
 * @param {string} req.query.code - Authorization code from Google
 * @param {string} req.query.state - State parameter for validation
 * @param {string} [req.query.error] - Error from Google OAuth
 * 
 * @returns {Redirect} Redirects to dashboard with auth status
 * 
 * @example
 * // Google redirects to:
 * GET /google/callback?code=4/0AX4XfWh...&state=random-state-string
 * 
 * // Server redirects to:
 * http://localhost:3003/?auth=success&token=jwt-token
 * // or
 * http://localhost:3003/?auth=error&message=error-description
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${config.client.port === 80 ? 'http://localhost' : `http://localhost:${config.client.port}`}/?auth=error&message=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`${config.client.port === 80 ? 'http://localhost' : `http://localhost:${config.client.port}`}/?auth=error&message=${encodeURIComponent('No authorization code received')}`);
    }
    
    const result = await googleService.handleAuthCallback(code, state);
    
    const redirectUrl = `${config.client.port === 80 ? 'http://localhost' : `http://localhost:${config.client.port}`}/?auth=success&token=${encodeURIComponent(result.token)}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error.message || 'Authentication failed';
    const redirectUrl = `${config.client.port === 80 ? 'http://localhost' : `http://localhost:${config.client.port}`}/?auth=error&message=${encodeURIComponent(errorMessage)}`;
    res.redirect(redirectUrl);
  }
});

module.exports = router;