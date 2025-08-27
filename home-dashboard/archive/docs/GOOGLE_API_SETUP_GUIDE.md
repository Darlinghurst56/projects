# Google API Integration Setup Guide

## Overview
Complete setup guide for configuring Google API integration with the Family Home Dashboard. This integration provides Calendar, Gmail, and Drive functionality with robust error handling designed for home network environments.

## Prerequisites
- Google account (preferably the family's primary account)
- Access to Google Cloud Console
- Home Dashboard project set up

## Step 1: Google Cloud Console Configuration

### 1.1 Create Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. **Project Name**: `Family Home Dashboard`
4. **Project ID**: `family-dashboard-[your-suffix]` (must be globally unique)
5. Click "Create"

### 1.2 Enable Required APIs
Navigate to "APIs & Services" → "Library" and enable these APIs:

- ✅ **Google Calendar API** - For family event management
- ✅ **Gmail API** - For email notifications and monitoring
- ✅ **Google Drive API** - For family document access
- ✅ **Google Docs API** - For document creation (optional)

**Enable each API:**
1. Search for the API name
2. Click on the API
3. Click "Enable"
4. Wait for activation (usually instant)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure OAuth consent screen first:
   - **User Type**: External (for family access)
   - **Application Name**: "Family Home Dashboard"
   - **User Support Email**: Your family email
   - **Scopes**: Add the required scopes (see Section 2.2)

4. **Application Type**: Web application
5. **Name**: "Family Dashboard Auth"

### 1.4 Configure Authorized Redirect URIs
Add these URIs based on your deployment:

**Development Environment:**
```
http://localhost:3000/auth/google/callback
```

**Production Environment (Family Server):**
```
http://192.168.1.74:3000/auth/google/callback
```

**If using custom domain:**
```
http://your-family-domain.com:3000/auth/google/callback
```

### 1.5 Download and Secure Credentials
1. Click "Download JSON" to get your credentials file
2. Note the `client_id` and `client_secret` values
3. **Security**: Never commit these credentials to version control

## Step 2: Home Dashboard Configuration

### 2.1 Environment Variables Setup
Create or update your `.env` file in the project root:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here

# OAuth Redirect URI (must match Google Cloud Console)
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# For production deployment
# GOOGLE_REDIRECT_URI=http://192.168.1.74:3000/auth/google/callback
```

### 2.2 Required OAuth Scopes
The dashboard requires these Google API scopes (already configured in the code):

```javascript
scopes: [
  'https://www.googleapis.com/auth/calendar',           // Calendar read/write
  'https://www.googleapis.com/auth/gmail.modify',      // Gmail read/send
  'https://www.googleapis.com/auth/drive.file',        // Drive file access
  'https://www.googleapis.com/auth/documents',         // Google Docs (optional)
  'openid',                                            // OpenID Connect
  'email',                                             // User email
  'profile'                                            // User profile
]
```

### 2.3 Security Configuration
Generate a secure JWT secret:

```bash
# Generate secure random key
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env`:
```env
JWT_SECRET=your-generated-64-character-hex-string-here
```

## Step 3: Testing Google Integration

### 3.1 Start the Dashboard
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### 3.2 Test Authentication Flow
1. Open http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify successful authentication

### 3.3 Test API Endpoints
Use the built-in system status to verify Google API connectivity:

```bash
# Check system status
curl http://localhost:3000/api/system/status

# Test Google auth status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/google/auth/status

# Test Calendar API
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/google/calendar/events
```

## Step 4: Production Deployment

### 4.1 Update OAuth Settings
1. Return to Google Cloud Console
2. Update Authorized Redirect URIs to include production URL
3. Consider creating separate Development/Production projects

### 4.2 Production Environment Variables
```env
NODE_ENV=production
GOOGLE_REDIRECT_URI=http://192.168.1.74:3000/auth/google/callback
JWT_SECRET=your-production-jwt-secret-64-chars-minimum
```

### 4.3 Network Configuration
Ensure your family server (192.168.1.74) can:
- ✅ Reach Google API endpoints (requires internet)
- ✅ Serve the OAuth callback URL to family devices
- ✅ Handle SSL/TLS if using HTTPS (recommended for production)

## Troubleshooting

### Common Issues

**1. "Error 400: redirect_uri_mismatch"**
- Verify redirect URI in Google Cloud Console matches exactly
- Check for http vs https, trailing slashes, port numbers

**2. "Error 403: access_denied"**
- Verify all required APIs are enabled
- Check OAuth consent screen configuration
- Ensure user email is added to test users (if app not published)

**3. "Token refresh failed"**
- Check token storage in `server/data/tokens/`
- Verify JWT_SECRET is consistent
- Re-authenticate user if tokens corrupted

**4. "Service temporarily unavailable"**
- Circuit breaker may be open due to API failures
- Check system status endpoint: `/api/system/circuit-breakers`
- Reset circuit breakers: `POST /api/system/circuit-breakers/reset`

### Debug Mode
Enable verbose logging for troubleshooting:

```env
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### API Quotas and Limits
Monitor your Google API usage:
- Calendar API: 1,000,000 requests/day
- Gmail API: 1,000,000,000 quota units/day  
- Drive API: 1,000,000,000 quota units/day

For family use, these limits should be more than sufficient.

## Security Best Practices

### 1. Credential Security
- ✅ Never commit credentials to version control
- ✅ Use environment variables for all secrets
- ✅ Rotate credentials periodically
- ✅ Use separate credentials for development/production

### 2. Network Security
- ✅ Consider HTTPS for production (Let's Encrypt)
- ✅ Restrict access to family network
- ✅ Regular security updates

### 3. Token Management
- ✅ Automatic token refresh implemented
- ✅ Secure token storage with optional encryption
- ✅ Token validation on each request

## Family Usage Patterns

### Typical API Usage
- **Morning**: Calendar sync, weather integration
- **Evening**: Email summaries, family coordination
- **Weekend**: Event planning, photo organization

### Cost Optimization
- Built-in circuit breakers prevent excessive API calls
- Local caching reduces redundant requests
- Batch operations where possible

## Support and Maintenance

### Regular Maintenance
1. **Monthly**: Check API quotas and usage
2. **Quarterly**: Review and rotate credentials
3. **Annually**: Update OAuth consent screen

### Family Training
- Show family members how to authenticate
- Explain privacy implications of Google integration
- Demonstrate key features (calendar, email)

## Next Steps
Once Google API integration is working:
1. Configure external services (Ollama, n8n)
2. Set up family-specific automations
3. Customize widgets for family needs
4. Implement backup strategies

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-08-06  
**Compatibility**: Home Dashboard v1.0+