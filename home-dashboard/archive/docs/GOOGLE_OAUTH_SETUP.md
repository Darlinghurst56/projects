# Google OAuth 2.0 Setup Guide for Home Dashboard

## Overview

This guide walks you through setting up Google OAuth 2.0 credentials for the Home Dashboard's Google integration (Calendar, Gmail, Drive).

## Prerequisites

- Google account with access to Google Cloud Console
- Home Dashboard running on your local network
- Basic understanding of OAuth 2.0 concepts

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project Name: `Home Dashboard` (or your preference)
4. Organization: Leave as default or select your organization
5. Click "Create"

## Step 2: Enable Required APIs

Navigate to **APIs & Services** → **Library** and enable these APIs:

### Required APIs:
- **Google Calendar API** - For calendar events
- **Gmail API** - For email access
- **Google Drive API** - For file management
- **Google+ API** (legacy) or **People API** - For user profiles

### Enable each API:
1. Search for the API name
2. Click on the API
3. Click "Enable"
4. Repeat for all required APIs

## Step 3: Configure OAuth Consent Screen

Go to **APIs & Services** → **OAuth consent screen**:

### User Type Selection:
- **External** - For family members with different Google accounts
- **Internal** - Only if you have a Google Workspace organization

### App Information:
- **App name**: `Home Dashboard`
- **User support email**: Your email address
- **App logo**: Optional (upload family/home logo if desired)
- **Application home page**: `http://192.168.1.74` (your server IP)
- **Application privacy policy**: `http://192.168.1.74/privacy` (optional)
- **Application terms of service**: `http://192.168.1.74/terms` (optional)
- **Developer contact information**: Your email address

### Scopes Configuration:
Add these scopes (click "Add or Remove Scopes"):

#### Required Scopes:
```
email
profile
openid
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/documents
```

### Test Users (for External apps):
Add family member email addresses who will use the dashboard:
- dad@family.com
- mom@family.com
- etc.

## Step 4: Create OAuth 2.0 Credentials

Go to **APIs & Services** → **Credentials**:

1. Click "Create Credentials" → "OAuth client ID"
2. **Application type**: Web application
3. **Name**: `Home Dashboard Web Client`

### Authorized JavaScript Origins:
Add your dashboard URLs:
```
http://localhost:3003
http://localhost
http://192.168.1.74
http://192.168.1.74:3003
```

### Authorized Redirect URIs:
Add your callback URLs:
```
http://localhost:3000/auth/google/callback
http://192.168.1.74:3000/auth/google/callback
```

4. Click "Create"
5. **Copy the Client ID and Client Secret** - you'll need these for your `.env` file

## Step 5: Update Environment Configuration

Update your `.env` file with the real credentials:

```bash
# Replace with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YourActualClientSecretHere

# OAuth Redirect URI (must match Google Cloud Console)
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### For Production Deployment (192.168.1.74):
```bash
GOOGLE_REDIRECT_URI=http://192.168.1.74:3000/auth/google/callback
```

## Step 6: Test the Configuration

1. **Restart the Home Dashboard server**:
   ```bash
   cd /home/darlinghurstlinux/projects/home-dashboard
   npm run dev
   ```

2. **Access the dashboard**: `http://localhost:3003`

3. **Test Google Authentication**:
   - Click on a Google widget (Calendar, Gmail, or Drive)
   - Click "Sign in with Google" when prompted
   - Complete the OAuth flow
   - Verify that the widget shows real data

## Step 7: Family Member Setup

### For Each Family Member:
1. They need a Google account
2. Add their email to "Test Users" in OAuth consent screen (if External app)
3. They can sign in with their own Google account
4. Each family member gets their own Google data (calendar, email, drive)

### For Children/PIN Users:
- Children can use PIN authentication
- If a parent signs in with Google first, PIN users can inherit Google API access
- This allows shared family calendar access without requiring Google accounts for children

## Security Considerations

### Production Recommendations:
1. **Use HTTPS** in production (highly recommended for OAuth)
2. **Restrict API Key usage** if you create API keys
3. **Monitor usage** in Google Cloud Console
4. **Review permissions** regularly

### Family-Friendly Security:
- Each family member authenticates with their own Google account
- PIN authentication provides simple access for children
- Admin users can manage overall dashboard settings

## Troubleshooting

### Common Issues:

#### "redirect_uri_mismatch" Error:
- Verify redirect URIs match exactly in Google Cloud Console
- Check for typos in URLs
- Ensure you're accessing the dashboard from the correct URL

#### "invalid_client" Error:
- Check Client ID and Client Secret are correct
- Verify the OAuth client is for "Web application" type
- Ensure environment variables are loaded properly

#### Scopes/Permissions Issues:
- Verify all required APIs are enabled
- Check OAuth consent screen has correct scopes
- Re-authenticate to pick up new permissions

#### Calendar/Gmail/Drive Not Working:
- Check API quotas in Google Cloud Console
- Verify user has granted necessary permissions
- Check server logs for specific API error messages

### Debug Commands:
```bash
# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Test server configuration
cd /home/darlinghurstlinux/projects/home-dashboard
node -e "console.log(require('./config').services.google)"

# Check server logs
tail -f logs/dashboard.log
```

## Cost Considerations

### Google API Usage (Family Scale):
- **Free Tier Limits**: Very generous for family use
- **Calendar API**: 1M requests/day (free)
- **Gmail API**: 1B quota units/day (free)
- **Drive API**: 20,000 requests/100 seconds (free)

### Family Usage Estimates:
- **10-50 API calls/hour per family member**
- **Well within free tier limits**
- **Monitor usage in Google Cloud Console**

## Next Steps

After completing OAuth setup:

1. **Configure automation workflows** (n8n integration)
2. **Set up family calendar sharing**
3. **Test with all family members**
4. **Configure backup/sync options**
5. **Set up monitoring and alerts**

## Support

For Google-specific issues:
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Libraries](https://developers.google.com/api-client-library)

For Home Dashboard issues:
- Check server logs: `tail -f logs/dashboard.log`
- Verify network connectivity to Google services
- Test with curl commands to verify API access