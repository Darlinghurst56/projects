# n8n Google API Integration Documentation

## Overview

This documentation covers the setup and configuration of n8n workflows for Google API integration via Telegram bot commands. The primary workflow enables sending emails through Gmail using Telegram bot commands.

## Workflow: Telegram to Gmail Integration

### Location
```
workflows/telegram-to-gmail.json
```

### Description
This workflow enables users to send Gmail emails via Telegram bot commands with the following features:
- Command-based email sending via `/send_email` command
- User authentication via Telegram user ID verification
- Email parameter parsing (recipient, subject, body)
- Gmail API integration with OAuth2 authentication
- Success/error response handling

### Workflow Nodes

#### 1. Telegram Trigger
- **Type**: `n8n-nodes-base.telegramTrigger`
- **Purpose**: Listens for incoming Telegram messages
- **Configuration**:
  - Updates: `message`
  - Webhook ID: Auto-generated
  - Credentials: `Home Telegram Bot`

#### 2. Check Email Command
- **Type**: `n8n-nodes-base.if`
- **Purpose**: Filters messages for `/send_email` commands
- **Condition**: `message.text` starts with `/send_email`

#### 3. Parse Email Command
- **Type**: `n8n-nodes-base.code`
- **Purpose**: Extracts email parameters and validates user authorization
- **Security Features**:
  - User ID verification (only authorized Telegram user ID)
  - Email address validation
  - Command format validation
- **Expected Format**: 
  ```
  /send_email to@email.com Subject: Your subject Body: Your message
  ```

#### 4. Send Gmail
- **Type**: `n8n-nodes-base.gmail`
- **Purpose**: Sends email via Gmail API
- **Configuration**:
  - Operation: `send`
  - Credentials: `Google APIs - Home User` (OAuth2)
  - Dynamic fields: to, subject, message from parsed command

#### 5. Reply Success
- **Type**: `n8n-nodes-base.telegram`
- **Purpose**: Sends success confirmation to Telegram user
- **Message Template**:
  ```
  ✅ Email sent successfully!
  📧 To: {recipient}
  📝 Subject: {subject}
  💬 Body: {body}
  🤖 Sent via Home Assistant
  ```

#### 6. Reply Error
- **Type**: `n8n-nodes-base.telegram`
- **Purpose**: Sends error messages for failed operations
- **Error Handling**: Captures errors from parsing and Gmail sending

### Required Credentials

#### 1. Telegram Bot API
- **Name**: `Home Telegram Bot`
- **Type**: Telegram API credentials
- **Requirements**: Bot token from @BotFather

#### 2. Google OAuth2 API
- **Name**: `Google APIs - Home User`
- **Type**: Google OAuth2 credentials
- **Scopes Required**:
  - `https://www.googleapis.com/auth/gmail.send`
- **Setup**: OAuth2 flow with Google Console project

### Security Configuration

#### User Authorization
```javascript
// Replace with your actual Telegram user ID
const ALLOWED_USER_ID = 123456789;
```

#### Email Validation
- Email address format validation
- Command structure validation
- Error handling for malformed commands

### Usage Examples

#### Send Email Command
```
/send_email user@example.com Subject: Test Email Body: This is a test message from Telegram bot
```

#### Error Responses
- Invalid format: Format instructions provided
- Unauthorized user: Access denied message
- Gmail API errors: Technical error details

### Workflow Configuration

#### Settings
- **Timezone**: `America/New_York`
- **Error Workflow**: None (errors handled inline)
- **Manual Executions**: Saved
- **Tags**: 
  - `home-automation`
  - `google-api`
  - `telegram-bot`

#### Connection Flow
```
Telegram Trigger → Check Email Command → Parse Email Command → Send Gmail → Reply Success
                                                            ↓ (on error)
                                      Parse Email Command → Reply Error
                                      Send Gmail → Reply Error
```

### Deployment Instructions

1. **Import Workflow**
   ```bash
   # Import the workflow JSON file into n8n
   # Navigate to n8n web interface → Import from file
   # Select: workflows/telegram-to-gmail.json
   ```

2. **Configure Credentials**
   - Set up Telegram Bot credentials
   - Configure Google OAuth2 credentials
   - Update authorized user ID in Parse Email Command node

3. **Test Workflow**
   - Send test message to Telegram bot
   - Verify email delivery
   - Check error handling with invalid commands

4. **Activate Workflow**
   - Enable the workflow in n8n
   - Monitor execution logs

### Troubleshooting

#### Common Issues
- **Telegram webhook not responding**: Check bot token and webhook setup
- **Gmail API errors**: Verify OAuth2 scopes and token refresh
- **User authorization failures**: Confirm Telegram user ID matches configuration
- **Command parsing errors**: Validate command format and parameters

#### Debug Steps
1. Check n8n execution logs
2. Verify credential configuration
3. Test individual nodes in manual execution
4. Review error messages in Telegram bot responses

### Extension Possibilities

#### Additional Google APIs
- Google Calendar integration
- Google Drive file operations
- Google Sheets data management
- Google Docs creation/editing

#### Enhanced Features
- Multiple user authorization
- Email templates
- Attachment support
- Scheduled email sending
- Contact list integration

## Related Documentation

- [Google Calendar Integration](.taskmaster/docs/google-calendar-integration.md)
- [Google Docs Integration](.taskmaster/docs/google-docs-integration.md)
- [HTTP MCP Integration](.taskmaster/docs/HTTP_MCP_INTEGRATION.md)

## Support

For issues or questions regarding this integration:
1. Check n8n execution logs
2. Verify Google API quotas and limits
3. Review Telegram bot configuration
4. Consult n8n community documentation