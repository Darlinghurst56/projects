# Google Authentication Testing Guide

## Overview
The Home Dashboard now supports graceful degradation with Google authentication. This guide explains how to test both authenticated and unauthenticated states.

## URL Changes
- **New Landing URL**: `/HurstHome` (public access)
- **Legacy URLs**: `/`, `/dashboard` (still work)
- **Login URL**: `/login` (Google OAuth flow)

## Authentication Modes

### Guest Mode (No Login Required)
**Available Widgets:**
- ✅ DNS Status - Network monitoring
- ✅ DNS Analytics - Usage statistics  
- ✅ AI Chat - Local Ollama assistant

**Features:**
- Full DNS monitoring and safety
- AI assistant for general questions
- System status monitoring
- No personal data access

### Authenticated Mode (Google Login)
**Additional Widgets:**
- ✅ Google Calendar - Family events
- ✅ Gmail - Family inbox
- ✅ Google Drive - Family files
- ✅ Meal Planner - PDF shopping lists

**Enhanced Features:**
- Personalized AI responses
- Family data integration
- Calendar-aware suggestions
- Meal planning with Google integration

## Testing Approaches

### 1. Mock Authentication (Automated Tests)
```javascript
// Guest mode (default)
await page.goto('/HurstHome');

// Mock authenticated state
await page.evaluate(() => {
  localStorage.setItem('authToken', 'mock-token');
  localStorage.setItem('user', JSON.stringify({ 
    email: 'test@example.com',
    name: 'Test User' 
  }));
});
```

### 2. Real Google Authentication (Manual Testing)

#### Setup Google OAuth for Testing

**Prerequisites:**
1. Google Cloud Console project
2. OAuth 2.0 credentials configured
3. Test Google account

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**Test Account Recommendations:**
- Use a dedicated test Google account
- Enable Google Calendar, Gmail, Drive APIs
- Create test data (calendar events, emails, files)

#### Manual Testing Flow

**Step 1: Guest Mode Testing**
```bash
# Start the application
sudo npm run dev

# Visit the landing page
http://localhost/HurstHome

# Verify guest mode features:
# - DNS widgets visible and functional
# - AI chat works (local mode)
# - "Guest Mode" banner visible
# - Google widgets hidden
```

**Step 2: Authentication Testing**
```bash
# Click "Sign in for full access" link
# Should redirect to /login

# Click Google login button
# Should redirect to Google OAuth
# Complete authentication flow

# Should return to /HurstHome with full access
# Verify all widgets now visible
```

**Step 3: Logout Testing**
```bash
# Click user menu in top right
# Click "Sign out"
# Should remain on /HurstHome but return to guest mode
```

### 3. API Testing with Real Google Services

#### Test Google Calendar Integration
```javascript
// Test calendar API calls
const response = await fetch('/api/google/calendar/events');
const data = await response.json();

// Should return real calendar events or auth error
```

#### Test Gmail Integration
```javascript
// Test Gmail API calls
const response = await fetch('/api/google/gmail/messages');
const data = await response.json();

// Should return inbox messages or auth error
```

### 4. Playwright with Real Google Auth

For comprehensive testing with real Google authentication:

```javascript
// Save authenticated state after manual login
await page.context().storageState({ path: 'tests/auth-state.json' });

// Use saved auth state in tests
test.use({ storageState: 'tests/auth-state.json' });
```

## Test Scenarios

### Critical User Journeys

**Journey 1: First-time Visitor**
1. Visit `/HurstHome`
2. See guest mode with public widgets
3. Use DNS monitoring and AI chat
4. Click login link when needed

**Journey 2: Returning Family Member**
1. Visit `/HurstHome` with saved auth
2. See full dashboard with all widgets
3. Access Google services seamlessly
4. Use meal planning and calendar features

**Journey 3: Authentication Recovery**
1. Start authenticated
2. Token expires during session
3. Google widgets show auth prompts
4. Re-authenticate without losing progress

### Error Scenarios

**Network Issues:**
- Internet down: DNS widgets show offline
- Google services down: Show service status
- Ollama offline: AI chat shows local error

**Authentication Issues:**
- Token expired: Graceful re-auth prompt
- Permissions revoked: Clear error messages
- Account suspended: Proper error handling

## Environment-Specific Testing

### Development Environment
```bash
# Local testing
sudo npm run dev
# Access: http://localhost/HurstHome
```

### Production Environment (192.168.1.74)
```bash
# Production testing
# Access: http://192.168.1.74/HurstHome
# Verify Ollama integration
# Test real DNS monitoring
```

## Common Issues and Solutions

### Issue: Google OAuth Redirect Mismatch
**Solution:** Update redirect URIs in Google Console
```
Development: http://localhost/auth/google/callback
Production: http://192.168.1.74/auth/google/callback
```

### Issue: CORS Errors with Google APIs
**Solution:** Configure proper origins in Google Console
```
http://localhost
http://192.168.1.74
```

### Issue: API Quota Limits
**Solution:** Use test account with higher limits or mock responses

## Performance Considerations

**Guest Mode:**
- Should load in < 2 seconds
- DNS and AI widgets functional immediately
- No Google API calls to slow down loading

**Authenticated Mode:**
- Additional 1-2 seconds for Google API calls
- Widgets should load progressively
- Failed Google calls shouldn't block other widgets

## Security Testing

**Authentication Security:**
- Verify secure token storage
- Test token expiration handling
- Ensure logout clears all data

**API Security:**
- Verify auth headers on Google API calls
- Test unauthorized access attempts
- Confirm no sensitive data in guest mode

## Accessibility Testing

**Guest Mode:**
- Should be fully accessible without login
- Clear indication of limited functionality
- Easy path to authentication

**Authenticated Mode:**
- No accessibility features lost after login
- User menu accessible via keyboard
- Logout accessible and clear

## Monitoring and Analytics

**Key Metrics:**
- Guest mode usage vs authenticated usage
- Google authentication success rate
- Widget load times in each mode
- Error rates for API calls

**Logging:**
- Authentication attempts and failures
- API call success/failure rates
- User journey completion rates

This testing approach ensures the dashboard works reliably for both guest users and authenticated family members while providing clear paths between modes.