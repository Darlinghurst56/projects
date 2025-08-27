# n8n Google API Credential Troubleshooting Guide

## Overview

This guide provides solutions for common authentication and credential issues when setting up Google API integrations with n8n.

## Quick Diagnosis

### Running the Credential Validation Workflow

1. Import `n8n-credential-validation.json` into your n8n instance
2. Execute the "Manual Trigger" to run all credential tests
3. Review the generated report for specific issues
4. Follow the recommendations in the report

## Common Issues and Solutions

### 1. OAuth2 Redirect URI Mismatch

**Error Messages:**
- `redirect_uri_mismatch`
- `Error 400: redirect_uri_mismatch`
- `The redirect URI in the request does not match`

**Causes:**
- Incorrect redirect URI configured in Google Cloud Console
- n8n URL doesn't match the registered redirect URI
- HTTP vs HTTPS mismatch

**Solutions:**

**For Local n8n (localhost):**
```
Correct Redirect URI: http://localhost:5678/rest/oauth2-credential/callback
```

**For Cloud n8n:**
```
Correct Redirect URI: https://your-n8n-domain.com/rest/oauth2-credential/callback
```

**Steps to Fix:**
1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure the correct URI is listed
4. Save changes
5. Re-authenticate the credential in n8n

### 2. Invalid Client ID or Secret

**Error Messages:**
- `invalid_client`
- `Client authentication failed`
- `Invalid client_id`

**Causes:**
- Incorrect Client ID or Client Secret copied from Google Cloud Console
- Credentials created for wrong Google Cloud project
- Copy-paste errors (extra spaces, missing characters)

**Solutions:**
1. **Verify Credentials:**
   - Go to Google Cloud Console > Credentials
   - Copy Client ID and Client Secret again
   - Ensure no extra spaces or characters

2. **Update n8n Credentials:**
   - Go to n8n > Credentials
   - Edit the failing credential
   - Paste the correct Client ID and Secret
   - Re-authenticate

3. **Check Google Cloud Project:**
   - Ensure APIs are enabled in the same project where credentials were created
   - Verify you're using credentials from the correct project

### 3. Insufficient Permissions / Scope Issues

**Error Messages:**
- `insufficient_scope`
- `Access denied`
- `The request is missing a valid API key`
- `Insufficient Permission: Request had insufficient authentication scopes`

**Required Scopes:**
```
Gmail API:
- https://www.googleapis.com/auth/gmail.send
- https://www.googleapis.com/auth/gmail.readonly

Calendar API:
- https://www.googleapis.com/auth/calendar

Drive API:
- https://www.googleapis.com/auth/drive.file

Docs API:
- https://www.googleapis.com/auth/documents
```

**Solutions:**
1. **Update OAuth Consent Screen:**
   - Go to Google Cloud Console > APIs & Services > OAuth consent screen
   - Click "EDIT APP"
   - Go to "Scopes" section
   - Add missing scopes from the list above
   - Save changes

2. **Re-authenticate in n8n:**
   - Delete the existing credential in n8n
   - Create a new credential with same name
   - Complete OAuth flow again

### 4. API Not Enabled

**Error Messages:**
- `API has not been used in project`
- `Gmail API has not been used`
- `Access Not Configured`

**Solutions:**
1. **Enable Required APIs:**
   - Go to [Google Cloud Console > API Library](https://console.cloud.google.com/apis/library)
   - Search for and enable:
     - Gmail API
     - Google Calendar API
     - Google Drive API
     - Google Docs API
   - Wait 1-2 minutes for activation

2. **Verify API Status:**
   - Go to APIs & Services > Enabled APIs
   - Confirm all required APIs are listed

### 5. Quota Exceeded

**Error Messages:**
- `User rate limit exceeded`
- `Quota exceeded`
- `Rate limit exceeded`

**Solutions:**
1. **Check Quotas:**
   - Go to Google Cloud Console > APIs & Services > Quotas
   - Review usage for each API
   - Check if daily/hourly limits are reached

2. **Implement Rate Limiting:**
   - Add delay nodes in n8n workflows
   - Reduce frequency of API calls
   - Implement batch processing where possible

3. **Request Quota Increase:**
   - For production use, request quota increases in Google Cloud Console
   - Provide justification for increased limits

### 6. External App Verification Required

**Error Messages:**
- `This app isn't verified`
- `Google hasn't verified this app`

**Solutions:**
1. **For Development/Personal Use:**
   - Click "Advanced" on the warning screen
   - Click "Go to [Your App Name] (unsafe)"
   - This is safe for your own applications

2. **For Production Use:**
   - Submit app for verification through Google Cloud Console
   - This process can take several weeks
   - Consider using Internal app type if you have Google Workspace

### 7. Token Refresh Issues

**Error Messages:**
- `Token has been expired or revoked`
- `invalid_grant`
- `Authorization code was already redeemed`

**Solutions:**
1. **Re-authenticate Credential:**
   - Go to n8n > Credentials
   - Click "Reconnect" on the failing credential
   - Complete OAuth flow again

2. **Check Token Storage:**
   - Ensure n8n has proper permissions to store credentials
   - For self-hosted n8n, check file system permissions

### 8. Telegram Bot Issues

**Error Messages:**
- `Unauthorized`
- `Bot token invalid`
- `Chat not found`

**Solutions:**
1. **Verify Bot Token:**
   - Ensure token is correctly copied from BotFather
   - Token format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Test Bot Connection:**
   - Use the credential validation workflow
   - Or test manually with a simple "Get Me" operation

3. **Check Bot Settings:**
   - Ensure bot is not deleted in BotFather
   - Verify bot has necessary permissions

## Advanced Troubleshooting

### Debug Mode in n8n

1. **Enable Debug Logging:**
   - Set environment variable `N8N_LOG_LEVEL=debug`
   - Restart n8n
   - Check logs for detailed error information

2. **Workflow Execution Logs:**
   - Go to n8n > Executions
   - Click on failed execution
   - Review detailed error information

### Network and Firewall Issues

**For Self-Hosted n8n:**
1. **Check Outbound Connections:**
   - Ensure n8n can reach `accounts.google.com`
   - Verify HTTPS (port 443) is not blocked

2. **Proxy Configuration:**
   - If behind corporate firewall, configure HTTP proxy
   - Set `HTTP_PROXY` and `HTTPS_PROXY` environment variables

### Google Cloud Console Project Issues

1. **Multiple Projects:**
   - Ensure APIs and credentials are in the same project
   - Check project switcher in top navigation

2. **Billing Account:**
   - Some APIs require a billing account even for free tier
   - Enable billing if required

3. **Organization Policies:**
   - Check if organization policies restrict external app access
   - May need admin approval for OAuth consent screen

## Testing and Validation

### Manual Testing Steps

1. **Test Individual APIs:**
   ```bash
   # Use Google API Explorer to test:
   https://developers.google.com/apis-explorer
   ```

2. **Verify Scopes:**
   ```bash
   # Check token scopes at:
   https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=YOUR_TOKEN
   ```

### Automated Testing

1. **Use Credential Validation Workflow:**
   - Import and run `n8n-credential-validation.json`
   - Review generated report
   - Follow specific recommendations

2. **Test API Operations:**
   - Create simple test workflows for each API
   - Verify basic operations work (get profile, list files, etc.)

## Prevention and Best Practices

### Setup Best Practices

1. **Consistent Environment:**
   - Use same Google account for Cloud Console and testing
   - Keep consistent redirect URIs
   - Document all configuration settings

2. **Security Considerations:**
   - Use least-privilege scopes
   - Regularly rotate client secrets
   - Monitor API usage

3. **Development Workflow:**
   - Test credentials immediately after setup
   - Use staging environment before production
   - Keep backup of working configurations

### Monitoring and Maintenance

1. **Regular Health Checks:**
   - Run credential validation monthly
   - Monitor API quota usage
   - Check for expired credentials

2. **Documentation:**
   - Keep setup documentation updated
   - Document any custom configurations
   - Maintain troubleshooting notes

## Emergency Recovery

### Complete Reset Procedure

If all else fails, follow this complete reset:

1. **Google Cloud Console:**
   - Delete existing OAuth2 credentials
   - Create new OAuth2 credentials
   - Verify all APIs are enabled
   - Check OAuth consent screen configuration

2. **n8n:**
   - Delete all Google API credentials
   - Create new credentials with exact same names
   - Re-authenticate all credentials
   - Test with validation workflow

3. **Verification:**
   - Run credential validation workflow
   - Test basic operations for each API
   - Verify Telegram bot integration

## Support Resources

### Official Documentation
- [Google Cloud Console Help](https://cloud.google.com/support)
- [n8n Documentation](https://docs.n8n.io)
- [Google API Documentation](https://developers.google.com/apis-explorer)

### Community Support
- [n8n Community Forum](https://community.n8n.io)
- [Google Developers Community](https://developers.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/n8n)

### Professional Support
- Google Cloud Support (for API issues)
- n8n Cloud Support (for hosted instances)
- Professional consulting services

---

**Remember**: Most credential issues are resolved by carefully following the setup guide and ensuring all components (Google Cloud Console, n8n, and workflows) are properly configured and synchronized.