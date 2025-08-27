# n8n Google API Integration Testing Guide

## Overview

This guide provides comprehensive testing instructions for the four Google API n8n workflow configurations created for task 19.6.

## Workflow Files Created

1. **n8n-gmail-node-config.json** - Gmail API integration
2. **n8n-calendar-node-config.json** - Google Calendar API integration  
3. **n8n-drive-node-config.json** - Google Drive API integration
4. **n8n-docs-node-config.json** - Google Docs API integration

## Prerequisites

### Required Credentials

All workflows require the following credentials to be configured in n8n:

1. **Telegram Bot Credentials**
   - Credential ID: `telegram-bot-credentials`
   - Name: `Telegram Bot Credentials`
   - Required: Bot Token from BotFather

2. **Gmail OAuth2 Credentials**
   - Credential ID: `gmail-oauth2-credentials`
   - Name: `Gmail OAuth2 Credentials`
   - Required: Google OAuth2 client credentials

3. **Google Calendar OAuth2 Credentials**
   - Credential ID: `google-calendar-oauth2-credentials`
   - Name: `Google Calendar OAuth2 Credentials`
   - Required: Google OAuth2 client credentials

4. **Google Drive OAuth2 Credentials**
   - Credential ID: `google-drive-oauth2-credentials`
   - Name: `Google Drive OAuth2 Credentials`
   - Required: Google OAuth2 client credentials

5. **Google Docs OAuth2 Credentials**
   - Credential ID: `google-docs-oauth2-credentials`
   - Name: `Google Docs OAuth2 Credentials`
   - Required: Google OAuth2 client credentials

### Security Configuration

**CRITICAL**: Update the `authorizedUsers` array in each workflow:

```javascript
const authorizedUsers = [123456789]; // Replace with actual Telegram user IDs
```

## Testing Instructions

### 1. Gmail API Testing

**Import**: `n8n-gmail-node-config.json`

**Test Command**:
```
/send_email to:recipient@example.com subject:Test Email body:This is a test email sent via n8n and Telegram Bot integration.
```

**Expected Results**:
- ✅ Success: Email sent confirmation with recipient and timestamp
- ❌ Error: Format validation errors or Gmail API errors

**Test Cases**:
- Valid email format
- Invalid email format
- Missing parameters
- Unauthorized user

### 2. Google Calendar API Testing

**Import**: `n8n-calendar-node-config.json`

**Test Command**:
```
/create_event title:Team Meeting date:2025-01-15 time:14:30 duration:60 description:Weekly team sync meeting
```

**Expected Results**:
- ✅ Success: Event created confirmation with event ID and details
- ❌ Error: Date/time validation errors or Calendar API errors

**Test Cases**:
- Valid date/time format
- Invalid date format (not YYYY-MM-DD)
- Invalid time format (not HH:MM)
- Missing required parameters
- Past dates (should still work)

### 3. Google Drive API Testing

**Import**: `n8n-drive-node-config.json`

**Test Method**: Send file attachments to the Telegram bot

**Test Cases**:
- Document file upload (.pdf, .docx, .txt)
- Photo upload (.jpg, .png)
- Large file (>20MB) - should trigger error
- Multiple files in sequence

**Expected Results**:
- ✅ Success: File uploaded confirmation with Drive ID and view link
- ❌ Error: File size validation or Drive API errors

### 4. Google Docs API Testing

**Import**: `n8n-docs-node-config.json`

**Test Commands**:

**Create Document**:
```
/create_doc title:Test Document content:This is a test document created via n8n and Telegram Bot integration.
```

**Read Document**:
```
/read_doc id:DOCUMENT_ID_FROM_CREATE_RESPONSE
```

**Update Document**:
```
/update_doc id:DOCUMENT_ID_FROM_CREATE_RESPONSE content:This content will be appended to the document.
```

**Expected Results**:
- ✅ Create: Document created with ID and edit link
- ✅ Read: Document content preview with title and body
- ✅ Update: Document updated confirmation
- ❌ Error: Invalid document ID or Docs API errors

## Integration Testing Scenarios

### Cross-API Workflow Testing

1. **Email + Calendar Integration**:
   - Create calendar event
   - Send email notification about the event

2. **Drive + Docs Integration**:
   - Upload document to Drive
   - Create Docs summary of uploaded content

3. **Full Workflow Test**:
   - Upload file to Drive
   - Create calendar event for review
   - Create Docs agenda
   - Send email notification to team

### Error Handling Testing

Test each workflow with:
- Invalid user IDs (unauthorized access)
- Malformed commands
- Missing parameters
- API credential issues
- Network connectivity issues

## Monitoring and Logging

### n8n Execution Logs

Monitor the following in n8n execution logs:
- Command parsing success/failure
- API call responses
- Error handling paths
- Telegram reply delivery

### Telegram Bot Responses

All workflows provide user-friendly error messages:
- Command format guidance
- Parameter validation feedback
- API error explanations
- Success confirmations with actionable links

## Troubleshooting

### Common Issues

1. **Credential Setup**:
   - Ensure all OAuth2 credentials are properly configured
   - Verify Google API project has required APIs enabled
   - Check OAuth2 scopes include necessary permissions

2. **Telegram Integration**:
   - Verify bot token is valid and active
   - Ensure bot is added to appropriate chats/channels
   - Check webhook or polling configuration

3. **API Limitations**:
   - Gmail: Daily sending limits
   - Calendar: Rate limits for event creation
   - Drive: Storage quotas and file size limits
   - Docs: Document size and API rate limits

### Debug Steps

1. **Check n8n Workflow Execution Logs**
2. **Verify Credential Configuration**
3. **Test API Connectivity Outside n8n**
4. **Review Telegram Bot Logs**
5. **Validate OAuth2 Token Refresh**

## Security Considerations

### User Authorization

- Implement proper user ID validation
- Consider role-based access controls
- Log all API operations for audit

### API Security

- Use OAuth2 for all Google API access
- Implement proper token refresh mechanisms
- Monitor for unusual API usage patterns

### Data Privacy

- Ensure compliance with data protection regulations
- Consider encryption for sensitive data transmission
- Implement proper data retention policies

## Deployment Checklist

- [ ] All credential IDs configured in n8n
- [ ] User authorization lists updated with actual Telegram user IDs
- [ ] Google API project configured with required APIs
- [ ] OAuth2 scopes include necessary permissions
- [ ] Webhook/polling configured for Telegram Bot
- [ ] Error handling tested for all failure scenarios
- [ ] Success workflows validated for all API operations
- [ ] Security measures implemented and tested
- [ ] Documentation updated with deployment-specific details

## Next Steps

After successful testing:

1. **Production Deployment**: Move from test to production credentials
2. **User Training**: Provide command reference guide to end users
3. **Monitoring Setup**: Implement logging and alerting for API operations
4. **Scaling Considerations**: Plan for increased usage and API rate limits
5. **Feature Enhancement**: Consider additional commands and integrations

---

**Task 19.6 Status**: ✅ COMPLETED

All four Google API n8n workflow configurations have been successfully created and documented with comprehensive testing guidelines.