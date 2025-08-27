# Google Cloud Console Setup for n8n Integration

## Overview

This guide provides step-by-step instructions for setting up Google Cloud Console to enable n8n workflow integration with Google APIs (Gmail, Calendar, Drive, and Docs).

## Prerequisites

- Google account with access to Google Cloud Console
- n8n instance running (local or cloud)
- Basic understanding of OAuth2 authentication

## Step 1: Create Google Cloud Project

### 1.1 Access Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept terms of service if prompted

### 1.2 Create New Project

1. Click the project dropdown in the top navigation bar
2. Click "NEW PROJECT"
3. Enter project details:
   - **Project name**: `n8n-google-integration` (or your preferred name)
   - **Organization**: Leave as default or select your organization
   - **Location**: Leave as default
4. Click "CREATE"
5. Wait for project creation (may take 1-2 minutes)
6. Select the new project from the project dropdown

## Step 2: Enable Google APIs

### 2.1 Navigate to APIs & Services

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Or use direct link: https://console.cloud.google.com/apis/library

### 2.2 Enable Required APIs

Enable the following APIs by searching for each and clicking "ENABLE":

**Required APIs:**
1. **Gmail API**
   - Search for "Gmail API"
   - Click on "Gmail API" result
   - Click "ENABLE"

2. **Google Calendar API**
   - Search for "Google Calendar API"
   - Click on "Google Calendar API" result
   - Click "ENABLE"

3. **Google Drive API**
   - Search for "Google Drive API"
   - Click on "Google Drive API" result
   - Click "ENABLE"

4. **Google Docs API**
   - Search for "Google Docs API"
   - Click on "Google Docs API" result
   - Click "ENABLE"

**Wait for each API to be enabled before proceeding to the next.**

## Step 3: Configure OAuth Consent Screen

### 3.1 Navigate to OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Or use direct link: https://console.cloud.google.com/apis/credentials/consent

### 3.2 Configure Consent Screen

1. **User Type Selection:**
   - For personal use: Select "External" (unless you have Google Workspace)
   - For organization use: Select "Internal" if available
   - Click "CREATE"

2. **OAuth Consent Screen Configuration:**
   - **App name**: `n8n Google Integration`
   - **User support email**: Your email address
   - **App logo**: Optional (leave blank for home use)
   - **App domain**: Leave blank for local development
   - **Developer contact information**: Your email address
   - Click "SAVE AND CONTINUE"

3. **Scopes Configuration:**
   - Click "ADD OR REMOVE SCOPES"
   - Add the following scopes by searching and selecting:
     ```
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/drive.file
     https://www.googleapis.com/auth/documents
     ```
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

4. **Test Users (for External apps):**
   - Click "ADD USERS"
   - Add your email address and any other users who need access
   - Click "SAVE AND CONTINUE"

5. **Summary:**
   - Review configuration
   - Click "BACK TO DASHBOARD"

## Step 4: Create OAuth2 Credentials

### 4.1 Navigate to Credentials

1. Go to "APIs & Services" > "Credentials"
2. Or use direct link: https://console.cloud.google.com/apis/credentials

### 4.2 Create OAuth2 Client ID

1. Click "CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"

2. **Application Type Configuration:**
   - **Application type**: Select "Web application"
   - **Name**: `n8n-google-integration`

3. **Authorized Redirect URIs:**
   
   **For Local n8n Instance:**
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
   
   **For Cloud n8n Instance:**
   ```
   https://your-n8n-domain.com/rest/oauth2-credential/callback
   ```
   
   **Replace `your-n8n-domain.com` with your actual n8n domain**

4. Click "CREATE"

### 4.3 Download Credentials

1. A popup will appear with your credentials
2. **Copy and save the following:**
   - **Client ID**: `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
3. Click "OK"
4. Optionally, click the download icon to save as JSON file

## Step 5: Configure n8n Credentials

### 5.1 Access n8n Credentials

1. Open your n8n instance in web browser
2. Navigate to "Credentials" in the left sidebar
3. Click "Add Credential"

### 5.2 Create Google OAuth2 Credentials

**For Gmail API:**
1. Search for "Gmail OAuth2 API"
2. Click "Gmail OAuth2 API"
3. Enter credential details:
   - **Credential Name**: `gmail-oauth2-credentials`
   - **Client ID**: `[Your Client ID from Step 4.3]`
   - **Client Secret**: `[Your Client Secret from Step 4.3]`
4. Click "Connect my account"
5. Complete OAuth2 authorization flow
6. Click "Save"

**For Google Calendar API:**
1. Click "Add Credential"
2. Search for "Google Calendar OAuth2 API"
3. Enter credential details:
   - **Credential Name**: `google-calendar-oauth2-credentials`
   - **Client ID**: `[Your Client ID from Step 4.3]`
   - **Client Secret**: `[Your Client Secret from Step 4.3]`
4. Complete OAuth2 flow and save

**For Google Drive API:**
1. Click "Add Credential"
2. Search for "Google Drive OAuth2 API"
3. Enter credential details:
   - **Credential Name**: `google-drive-oauth2-credentials`
   - **Client ID**: `[Your Client ID from Step 4.3]`
   - **Client Secret**: `[Your Client Secret from Step 4.3]`
4. Complete OAuth2 flow and save

**For Google Docs API:**
1. Click "Add Credential"
2. Search for "Google Docs OAuth2 API"
3. Enter credential details:
   - **Credential Name**: `google-docs-oauth2-credentials`
   - **Client ID**: `[Your Client ID from Step 4.3]`
   - **Client Secret**: `[Your Client Secret from Step 4.3]`
4. Complete OAuth2 flow and save

### 5.3 Create Telegram Bot Credentials

1. Click "Add Credential"
2. Search for "Telegram"
3. Click "Telegram API"
4. Enter credential details:
   - **Credential Name**: `telegram-bot-credentials`
   - **Access Token**: `[Your Telegram Bot Token from BotFather]`
5. Click "Save"

## Step 6: Import n8n Workflows

### 6.1 Import Workflow Files

Import the following workflow files created in task 19.6:

1. **Gmail Workflow:**
   - Import `n8n-gmail-node-config.json`
   - Verify credentials are mapped correctly

2. **Calendar Workflow:**
   - Import `n8n-calendar-node-config.json`
   - Verify credentials are mapped correctly

3. **Drive Workflow:**
   - Import `n8n-drive-node-config.json`
   - Verify credentials are mapped correctly

4. **Docs Workflow:**
   - Import `n8n-docs-node-config.json`
   - Verify credentials are mapped correctly

### 6.2 Activate Workflows

1. Open each imported workflow
2. Click "Active" toggle to enable the workflow
3. Verify no credential errors are shown

## Step 7: Test Authentication

### 7.1 Basic Connection Test

1. Create a simple test workflow:
   - Add "Manual Trigger" node
   - Add "Gmail" node with "Get" operation
   - Connect to your `gmail-oauth2-credentials`
   - Execute manually to test connection

### 7.2 Telegram Bot Test

1. Send test message to your Telegram bot
2. Verify workflows execute correctly
3. Check n8n execution logs for any authentication errors

## Troubleshooting

### Common Issues

**1. "Redirect URI Mismatch" Error**
- Verify redirect URI in Google Cloud Console matches your n8n instance
- For local: `http://localhost:5678/rest/oauth2-credential/callback`
- For cloud: `https://your-domain.com/rest/oauth2-credential/callback`

**2. "Access Blocked" Error**
- Ensure your email is added to test users in OAuth consent screen
- Check that required APIs are enabled
- Verify scopes are correctly configured

**3. "Invalid Client ID" Error**
- Double-check Client ID and Client Secret are correctly copied
- Ensure credentials are for the same Google Cloud project where APIs are enabled

**4. "Token Expired" Error**
- n8n automatically refreshes tokens
- If persistent, re-authenticate the credential in n8n
- Check Google Cloud Console for any project changes

### Advanced Configuration

**Rate Limiting:**
- Google APIs have usage quotas
- Monitor usage in Google Cloud Console > APIs & Services > Quotas
- Implement appropriate delays in n8n workflows if needed

**Security Considerations:**
- Regularly review OAuth consent screen configuration
- Monitor credential usage in n8n
- Use least-privilege scopes for production deployment
- Consider rotating Client Secret periodically

**Production Deployment:**
- Submit OAuth consent screen for verification (for external app type)
- Use environment variables for sensitive configuration
- Implement proper backup and disaster recovery for credentials
- Monitor API usage and costs

## Next Steps

After completing this setup:

1. **Test Workflows**: Use the testing guide from task 19.6
2. **Configure Security**: Update authorized user IDs in workflow configurations
3. **Monitor Usage**: Set up alerts for API quota limits
4. **Documentation**: Keep this setup guide updated with any changes

## Support Resources

- [Google Cloud Console Documentation](https://cloud.google.com/docs)
- [n8n Credentials Documentation](https://docs.n8n.io/credentials/)
- [Google API Documentation](https://developers.google.com/apis-explorer)
- [n8n Community Forum](https://community.n8n.io/)

---

**Setup Status**: Ready for n8n workflow deployment and testing.