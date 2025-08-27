# Gmail API Setup Guide

This guide explains how to set up Gmail API credentials for the n8n workflows.

## Prerequisites

- Google Cloud Console account
- Gmail account for integration
- n8n instance with Gmail node available

## Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Gmail API:
   - Go to **APIs & Services** > **Library**
   - Search for "Gmail API"
   - Click **Enable**

## Step 2: Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure OAuth consent screen (if not done):
   - Choose **External** user type
   - Fill in required fields:
     - App name: "Gmail Telegram Integration"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`

4. Create OAuth2 client:
   - Application type: **Web application**
   - Name: "Gmail n8n Integration"
   - Authorized redirect URIs:
     - `http://192.168.1.74:5678/rest/oauth2-credential/callback`
     - `http://localhost:5678/rest/oauth2-credential/callback`

5. Download the credentials JSON file

## Step 3: Configure in n8n

1. Access n8n at `http://192.168.1.74:5678`
2. Go to **Settings** > **Credentials**
3. Add new credential: **Google OAuth2 API**
4. Fill in the details:
   - **Client ID**: From downloaded JSON
   - **Client Secret**: From downloaded JSON
   - **Scope**: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify`
   - **Auth URI**: `https://accounts.google.com/o/oauth2/v2/auth`
   - **Access Token URI**: `https://oauth2.googleapis.com/token`

5. Save and test the connection
6. Complete OAuth flow when prompted

## Step 4: Test Gmail Connection

1. Create a simple workflow with Gmail node
2. Test the following operations:
   - **List Messages**: Verify you can read emails
   - **Send Message**: Send a test email
   - **Modify Message**: Archive/unarchive a test email

## Security Considerations

- Keep OAuth2 credentials secure
- Use environment variables for sensitive data
- Regularly review and rotate credentials
- Monitor API usage in Google Cloud Console

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check if Gmail API is enabled
2. **Invalid Redirect URI**: Verify redirect URI matches exactly
3. **Scope Issues**: Ensure all required scopes are added
4. **Token Expired**: Re-authenticate in n8n credentials

### Required Scopes

```
https://www.googleapis.com/auth/gmail.readonly    # Read emails
https://www.googleapis.com/auth/gmail.send        # Send emails  
https://www.googleapis.com/auth/gmail.modify      # Archive/label emails
```

## Rate Limits

- Gmail API has quotas and rate limits
- Monitor usage in Google Cloud Console
- Implement retry logic for production use
- Consider caching for frequently accessed data