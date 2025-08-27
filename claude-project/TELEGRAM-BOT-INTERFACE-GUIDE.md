# Telegram Bot Interface - Complete Setup & Usage Guide

**Project**: The House AI - Google API Integration  
**Version**: 1.0 (Production Ready)  
**Date**: July 2025  
**Documentation**: Finalized for Task 19.13

---

## 🎯 Overview

This comprehensive guide provides everything needed to set up and use the Telegram Bot interface for Google API operations through n8n workflows. The bot serves as a mobile-friendly, secure command-line interface for Gmail, Google Calendar, Google Drive, and Google Docs operations.

### Key Features
- 📱 **Mobile-First Design**: Works perfectly on smartphones and tablets
- 🔒 **Security Built-In**: User authentication and rate limiting
- 🚀 **Production Ready**: Comprehensive error handling and logging
- 🎨 **User-Friendly**: Intuitive commands with helpful error messages
- 🔗 **n8n Integration**: Seamless workflow automation

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Bot Creation & Configuration](#bot-creation--configuration)
3. [n8n Integration Setup](#n8n-integration-setup)
4. [Available Commands](#available-commands)
5. [Security Configuration](#security-configuration)
6. [Error Handling](#error-handling)
7. [Testing & Troubleshooting](#testing--troubleshooting)
8. [Advanced Configuration](#advanced-configuration)
9. [Production Deployment](#production-deployment)
10. [Monitoring & Analytics](#monitoring--analytics)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Telegram account
- ✅ n8n instance running (default: `http://192.168.1.74:5678`)
- ✅ Google Cloud Console project with APIs enabled
- ✅ Network access between Telegram and your n8n instance

### 5-Minute Setup
1. **Create Bot**: Message `@BotFather` → `/newbot`
2. **Get Token**: Save the bot token from BotFather
3. **Configure n8n**: Add Telegram credentials in n8n
4. **Import Workflows**: Import the provided JSON workflows
5. **Test**: Send `/help` to your bot

---

## 🤖 Bot Creation & Configuration

### Step 1: Create Bot with BotFather

1. **Open Telegram** and search for `@BotFather`
2. **Start conversation** and send `/start`
3. **Create new bot**:
   ```
   /newbot
   ```
4. **Configure bot details**:
   - **Bot Name**: `Home Assistant Google API Bot`
   - **Bot Username**: `your_home_google_bot` (must end with 'bot')

5. **Save the bot token** (e.g., `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooQQrrSS`)

⚠️ **CRITICAL**: Keep this token secure - treat it like a password!

### Step 2: Configure Bot Settings

#### Set Bot Description
```
/setdescription
[Select your bot]
Manage Gmail, Calendar, Drive, and Docs through Telegram commands. Send emails, create events, upload files, and create documents directly from Telegram.
```

#### Set Bot Commands
```
/setcommands
[Select your bot]
```

Paste this command list:
```
send_email - Send email: /send_email to@example.com Subject: Title Body: Message
calendar_today - Show today's calendar events
calendar_week - Show this week's calendar events
calendar_upcoming - Show upcoming events (next 30 days)
doc_create - Create Google Doc: /doc_create Title: Title Body: Content
doc_read - Read Google Doc: /doc_read document_id
doc_edit - Edit Google Doc: /doc_edit document_id Body: New content
drive_upload - Upload file to Google Drive (send file with command)
help - Show all available commands with examples
status - Check Google API connection status
test_error - Test error handling system
```

#### Set Bot Profile Picture (Optional)
```
/setuserpic
[Select your bot]
[Upload an appropriate image]
```

### Step 3: Get Your Telegram User ID

#### Method 1: Using @userinfobot
1. Message `@userinfobot` in Telegram
2. Copy your User ID (e.g., `123456789`)

#### Method 2: Using Bot API
```bash
# Send a message to your bot first, then:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

---

## 🔧 n8n Integration Setup

### Step 1: Add Telegram Bot Credentials

1. **Open n8n**: Navigate to `http://192.168.1.74:5678`
2. **Go to Settings** → **Credentials**
3. **Add Credential** → **Telegram Bot**
4. **Configure**:
   - **Name**: `Home Telegram Bot`
   - **Access Token**: `your-bot-token-from-botfather`
5. **Test connection** and save

### Step 2: Import Workflows

Import these workflow files from `/workflows/` directory:

#### Core Workflows
- **`telegram-to-gmail.json`** - Email operations
- **`telegram-to-google-docs.json`** - Document management
- **`telegram-to-google-calendar.json`** - Calendar operations
- **`telegram-bot-commands.json`** - Command routing system

#### Supporting Workflows
- **`error-handling-framework.json`** - Error management
- **`n8n-credential-validation.json`** - Credential testing

### Step 3: Configure Credentials

Each workflow requires these credentials:
- **Telegram Bot**: `Home Telegram Bot`
- **Google OAuth2**: `Google APIs - Home User`

### Step 4: Update User Authentication

In each workflow, update the user ID in security checks:

```javascript
// Replace with your actual Telegram User ID
const ALLOWED_USER_ID = 123456789; // Your user ID from Step 3
```

### Step 5: Activate Workflows

1. **Import all workflows**
2. **Update credentials** in each workflow
3. **Activate workflows** (toggle switch in n8n)
4. **Test basic functionality**

---

## 📱 Available Commands

### Email Commands (Gmail)

#### Send Email
```
/send_email recipient@example.com Subject: Meeting Tomorrow Body: Hi! Let's meet tomorrow at 2 PM in the conference room. Thanks!
```

**Features:**
- ✅ Multiple recipients supported
- ✅ Subject and body parsing
- ✅ User authentication
- ✅ Delivery confirmation

**Example Response:**
```
✅ Email sent successfully!

📧 To: recipient@example.com
📝 Subject: Meeting Tomorrow
💬 Body: Hi! Let's meet tomorrow at 2 PM...

🤖 Sent via Home Assistant
```

### Calendar Commands (Google Calendar)

#### Show Today's Events
```
/calendar_today
```

#### Show This Week's Events
```
/calendar_week
```

#### Show Upcoming Events
```
/calendar_upcoming
```

#### Custom Date Range
```
/calendar_list 2025-01-15 to 2025-01-20
```

**Example Response:**
```
📅 **Calendar Events (today)**

📊 Found 3 events

1. **Team Meeting**
   📅 1/15/2025
   🕐 09:00 AM - 10:00 AM
   📍 Conference Room A
   👥 5 attendees

2. **Lunch Break**
   📅 1/15/2025
   🕐 12:00 PM - 01:00 PM
   📝 Team lunch at Italian restaurant

3. **Project Review**
   📅 1/15/2025
   🕐 03:00 PM - 04:00 PM
   🔗 [View in Calendar](https://calendar.google.com/...)
```

### Document Commands (Google Docs)

#### Create Document
```
/doc_create Title: Meeting Notes Body: Discussion about project timeline and deliverables for Q1 2025.
```

#### Read Document
```
/doc_read 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

#### Edit Document
```
/doc_edit 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms Body: Updated content with new project requirements.
```

**Example Response:**
```
✅ Document created successfully!

📄 Title: Meeting Notes
🔗 Document ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
📝 Content: Discussion about project timeline...

🤖 Created via Home Assistant

💡 Use /doc_read [document_id] to read this document
💡 Use /doc_edit [document_id] Body: New content to edit
```

### Utility Commands

#### Help
```
/help
```

Shows all available commands with examples and usage instructions.

#### Status Check
```
/status
```

Tests Google API connections and reports system status.

#### Error Testing
```
/test_error
/test_error auth
/test_error quota
/test_error network
```

Tests error handling system with different error types.

---

## 🔒 Security Configuration

### User Authentication

Each workflow includes security validation:

```javascript
// Security check in Code node
const userId = $input.first().json.message.from.id;
const ALLOWED_USER_IDS = [123456789, 987654321]; // Add your user IDs

if (!ALLOWED_USER_IDS.includes(userId)) {
  throw new Error('Unauthorized user');
}
```

### Rate Limiting

Prevents spam and abuse:

```javascript
// Rate limiting check
const userId = $input.first().json.message.from.id;
const currentTime = Date.now();
const lastCommand = global.lastCommandTime || {};

if (lastCommand[userId] && (currentTime - lastCommand[userId]) < 2000) {
  throw new Error('Please wait before sending another command');
}

global.lastCommandTime = global.lastCommandTime || {};
global.lastCommandTime[userId] = currentTime;
```

### Command Validation

Input sanitization and validation:

```javascript
// Command format validation
const text = $input.first().json.message.text;
const parts = text.split(' ');

if (parts.length < 2) {
  throw new Error('Invalid format. Use: /command_name parameters');
}

// Email validation
const email = parts[1];
if (!email.includes('@') || !email.includes('.')) {
  throw new Error('Invalid email address format');
}
```

### Security Best Practices

1. **Keep Bot Token Secure**
   - Never share publicly
   - Store in n8n credentials only
   - Use environment variables in production

2. **Implement User Whitelist**
   - Only allow specific Telegram user IDs
   - Monitor unauthorized access attempts
   - Log all command usage

3. **Rate Limiting**
   - 2-second minimum between commands
   - Monitor for suspicious patterns
   - Implement progressive delays for repeat violations

4. **Input Validation**
   - Validate all user inputs
   - Sanitize email addresses and text
   - Check file types and sizes

---

## 🚨 Error Handling

The system includes comprehensive error handling with user-friendly messages:

### Error Categories

1. **Authentication Errors**
   ```
   🔐 Authentication Error: Your Google account credentials need to be refreshed.
   
   What to do: Please re-authenticate in n8n Settings → Credentials → Google OAuth2
   ```

2. **Quota/Rate Limit Errors**
   ```
   ⏱️ API Limit Reached: Too many requests to Google APIs.
   
   What to do: Please wait a few minutes before trying again
   ```

3. **Network Errors**
   ```
   🌐 Network Error: Unable to connect to Google services.
   
   What to do: Check your internet connection and try again
   ```

4. **Permission Errors**
   ```
   🚫 Permission Error: Insufficient access to requested Google API.
   
   What to do: Update OAuth2 scope in n8n credentials to include required permissions
   ```

5. **Invalid Request Errors**
   ```
   ❌ Invalid Request: The data sent to Google API was incorrect.
   
   What to do: Check command format and try again
   ```

### Error Testing

Test error handling with these commands:

```bash
/test_error                    # General error
/test_error auth              # Authentication error
/test_error quota             # Quota limit error
/test_error network           # Network error
/test_error permission        # Permission error
/test_error invalid           # Invalid request error
```

### Error Logging

All errors are logged with:
- Timestamp
- User ID
- Error category
- Original error message
- User-friendly message sent
- Action taken

---

## 🧪 Testing & Troubleshooting

### Basic Testing

1. **Bot Responsiveness**
   ```
   /start
   /help
   ```

2. **Command Parsing**
   ```
   /send_email test@example.com Subject: Test Body: Test message
   ```

3. **Error Handling**
   ```
   /test_error auth
   ```

### Comprehensive Testing

Use the provided test script:

```bash
node test-n8n-error-handling.js
```

**Expected Output:**
```
✅ All error handling tests passed! (100% success rate)
✅ Error handling framework is working correctly.
✅ Ready for production deployment.
```

### Common Issues & Solutions

#### 1. Bot Not Responding
**Symptoms**: No response to commands
**Solutions**:
- Check bot token in n8n credentials
- Verify workflows are activated
- Check n8n logs for errors
- Ensure bot received `/start` command

#### 2. Authentication Errors
**Symptoms**: Google API permission errors
**Solutions**:
- Verify Google OAuth2 credentials in n8n
- Check OAuth2 scope includes required permissions
- Re-authenticate if tokens expired
- Verify Google Cloud Console API settings

#### 3. Rate Limiting
**Symptoms**: \"Please wait\" messages
**Solutions**:
- Wait 2 seconds between commands
- Check Google API quota usage
- Monitor n8n execution logs
- Implement progressive delays

#### 4. Webhook Issues
**Symptoms**: Commands not reaching n8n
**Solutions**:
- Check webhook URL configuration
- Verify network connectivity
- Test webhook endpoint manually
- Check firewall settings

### Testing Workflows

#### Test Gmail Integration
```bash
# Test email sending
/send_email test@example.com Subject: Test Email Body: This is a test message from the Telegram bot.

# Expected: Success confirmation with email details
```

#### Test Calendar Integration
```bash
# Test calendar events
/calendar_today

# Expected: List of today's events or "No events found"
```

#### Test Docs Integration
```bash
# Test document creation
/doc_create Title: Test Document Body: This is a test document created via Telegram bot.

# Expected: Document created confirmation with ID
```

#### Test Error Handling
```bash
# Test error system
/test_error auth

# Expected: Formatted error message with instructions
```

---

## ⚙️ Advanced Configuration

### Custom Reply Keyboards

Add visual command buttons:

```javascript
// In Telegram reply node parameters
{
  "reply_markup": {
    "keyboard": [
      [{"text": "📧 Send Email"}, {"text": "📅 Calendar"}],
      [{"text": "📁 Drive Upload"}, {"text": "📝 Create Doc"}],
      [{"text": "ℹ️ Help"}, {"text": "📊 Status"}],
      [{"text": "🔧 Test Error"}, {"text": "🔍 Search"}]
    ],
    "resize_keyboard": true,
    "one_time_keyboard": false
  }
}
```

### Inline Query Support

Enable inline commands:

```javascript
// Handle inline queries in workflow
if ($json.inline_query) {
  const query = $json.inline_query.query;
  
  if (query.startsWith('email ')) {
    // Process inline email command
    const emailData = query.substring(6);
    // Continue with email processing
  }
}
```

### File Upload Handling

Support file uploads for Google Drive:

```javascript
// Handle file uploads
if ($json.message.document || $json.message.photo) {
  const fileId = $json.message.document?.file_id || $json.message.photo?.[0]?.file_id;
  const fileName = $json.message.document?.file_name || `photo_${Date.now()}.jpg`;
  
  // Process file upload to Google Drive
  return {
    json: {
      fileId: fileId,
      fileName: fileName,
      uploadToDrive: true
    }
  };
}
```

### Multi-Language Support

Configure language responses:

```javascript
// Language configuration
const userLanguage = $json.message.from.language_code || 'en';
const messages = {
  'en': {
    'success': '✅ Email sent successfully!',
    'error': '❌ Failed to send email!'
  },
  'es': {
    'success': '✅ ¡Correo enviado exitosamente!',
    'error': '❌ ¡Error al enviar correo!'
  }
};

const message = messages[userLanguage] || messages['en'];
```

### Advanced Security Features

#### IP Whitelist
```javascript
// Check request origin (if available)
const allowedIPs = ['192.168.1.0/24', '10.0.0.0/8'];
// Implementation depends on n8n webhook configuration
```

#### Command Logging
```javascript
// Log all commands for audit
const logEntry = {
  timestamp: new Date().toISOString(),
  userId: $json.message.from.id,
  username: $json.message.from.username,
  command: $json.message.text,
  chatId: $json.message.chat.id
};

console.log('COMMAND_LOG:', JSON.stringify(logEntry));
```

### Performance Optimization

#### Async Processing
```javascript
// For heavy operations, use async processing
const processAsync = async () => {
  // Long-running task
  const result = await heavyOperation();
  
  // Send status update
  await sendTelegramMessage('Processing complete!');
  
  return result;
};
```

#### Caching
```javascript
// Cache frequently accessed data
const cacheKey = `calendar_${userId}_${date}`;
const cachedData = global.cache?.[cacheKey];

if (cachedData && (Date.now() - cachedData.timestamp) < 300000) {
  return cachedData.data;
}

// Fetch fresh data and cache
const freshData = await fetchCalendarData();
global.cache = global.cache || {};
global.cache[cacheKey] = {
  data: freshData,
  timestamp: Date.now()
};
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] **Security Configuration**
  - [ ] User ID whitelist configured
  - [ ] Rate limiting implemented
  - [ ] Input validation enabled
  - [ ] Bot token secured

- [ ] **Workflow Configuration**
  - [ ] All workflows imported and activated
  - [ ] Credentials properly configured
  - [ ] Error handling tested
  - [ ] Command responses verified

- [ ] **Network Configuration**
  - [ ] n8n accessible from internet (if needed)
  - [ ] Webhook URL configured
  - [ ] Firewall rules set up
  - [ ] SSL certificate installed (recommended)

- [ ] **Google API Configuration**
  - [ ] OAuth2 credentials configured
  - [ ] API quotas sufficient
  - [ ] Scopes properly set
  - [ ] Service account (if using) configured

### Deployment Steps

1. **Prepare Production Environment**
   ```bash
   # Update n8n configuration
   export N8N_HOST=your-domain.com
   export N8N_PORT=5678
   export N8N_PROTOCOL=https
   
   # Start n8n with production settings
   n8n start --tunnel
   ```

2. **Configure Webhooks**
   ```bash
   # Set production webhook
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-domain.com/webhook/telegram"}'
   ```

3. **Test Production Setup**
   ```bash
   # Run comprehensive tests
   node test-n8n-error-handling.js
   ```

4. **Monitor Initial Deployment**
   - Check n8n execution logs
   - Monitor webhook responses
   - Test all command categories
   - Verify error handling

### SSL/HTTPS Configuration

For production, use HTTPS:

```nginx
# Nginx configuration example
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables

```bash
# Production environment variables
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=your-secure-password
export N8N_HOST=your-domain.com
export N8N_PORT=5678
export N8N_PROTOCOL=https
export WEBHOOK_URL=https://your-domain.com
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_PORT=5432
export DB_POSTGRESDB_DATABASE=n8n
export DB_POSTGRESDB_USER=n8n_user
export DB_POSTGRESDB_PASSWORD=n8n_password
```

---

## 📊 Monitoring & Analytics

### Workflow Execution Monitoring

#### n8n Dashboard
1. **Access n8n interface**: `https://your-domain.com`
2. **Go to Executions tab**
3. **Monitor**:
   - Success/failure rates
   - Execution times
   - Error patterns
   - Resource usage

#### Command Usage Analytics

Track bot usage patterns:

```javascript
// Analytics tracking in workflows
const analytics = {
  timestamp: new Date().toISOString(),
  userId: $json.message.from.id,
  username: $json.message.from.username,
  command: $json.message.text.split(' ')[0],
  success: true,
  responseTime: Date.now() - startTime,
  apiCalls: {
    gmail: 0,
    calendar: 0,
    drive: 0,
    docs: 0
  }
};

// Store analytics data
global.analytics = global.analytics || [];
global.analytics.push(analytics);
```

### Health Check Endpoints

Create monitoring endpoints:

```javascript
// Health check workflow
const healthCheck = {
  timestamp: new Date().toISOString(),
  services: {
    telegram: 'healthy',
    gmail: 'healthy',
    calendar: 'healthy',
    drive: 'healthy',
    docs: 'healthy'
  },
  uptime: process.uptime(),
  memory: process.memoryUsage()
};

return { json: healthCheck };
```

### Alert Configuration

Set up alerts for critical issues:

```javascript
// Alert conditions
const alertConditions = {
  highErrorRate: errorRate > 0.1,
  slowResponse: averageResponseTime > 5000,
  quotaExceeded: apiCallsPerHour > 1000,
  diskSpaceLow: diskUsage > 0.9
};

// Send alerts via Telegram
if (Object.values(alertConditions).some(Boolean)) {
  await sendAdminAlert(alertConditions);
}
```

### Performance Metrics

Track key performance indicators:

```javascript
// Performance metrics
const metrics = {
  daily: {
    totalCommands: 0,
    successfulCommands: 0,
    errorRate: 0,
    averageResponseTime: 0,
    uniqueUsers: new Set(),
    popularCommands: {},
    errorCategories: {}
  },
  weekly: {
    // Similar structure
  },
  monthly: {
    // Similar structure
  }
};
```

### Log Analysis

Analyze logs for insights:

```bash
# Extract command usage patterns
grep "COMMAND_LOG" n8n.log | jq '.command' | sort | uniq -c | sort -nr

# Find error patterns
grep "ERROR_LOG" n8n.log | jq '.category' | sort | uniq -c

# Monitor response times
grep "ANALYTICS" n8n.log | jq '.responseTime' | awk '{sum+=$1; count++} END {print "Average:", sum/count}'
```

---

## 🔧 Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Review execution logs
- [ ] Check error rates
- [ ] Update security configurations
- [ ] Monitor API quotas
- [ ] Test critical workflows

#### Monthly Tasks
- [ ] Update n8n version
- [ ] Review and rotate credentials
- [ ] Analyze usage patterns
- [ ] Performance optimization
- [ ] Security audit

#### Quarterly Tasks
- [ ] Full system backup
- [ ] Disaster recovery test
- [ ] Security penetration test
- [ ] Performance benchmarking
- [ ] Documentation updates

### Update Procedures

#### Updating Workflows
1. **Backup current workflows**
2. **Test updates in development**
3. **Deploy during low-usage periods**
4. **Monitor post-deployment**
5. **Rollback if issues occur**

#### Updating Credentials
1. **Generate new credentials**
2. **Test with single workflow**
3. **Update all workflows**
4. **Verify functionality**
5. **Revoke old credentials**

### Backup Strategy

#### Workflow Backup
```bash
# Export all workflows
n8n export:workflow --backup --output=./backup/workflows/

# Export credentials (without sensitive data)
n8n export:credentials --backup --output=./backup/credentials/
```

#### Database Backup
```bash
# PostgreSQL backup
pg_dump n8n > backup/n8n_backup_$(date +%Y%m%d).sql

# SQLite backup (if using)
cp ~/.n8n/database.sqlite backup/database_backup_$(date +%Y%m%d).sqlite
```

---

## 📚 Additional Resources

### Documentation Links
- [n8n Documentation](https://docs.n8n.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google APIs Documentation](https://developers.google.com/docs)
- [OAuth2 Setup Guide](.taskmaster/docs/./google-cloud-console-setup.md)
- [Credential Troubleshooting](.taskmaster/docs/./credential-troubleshooting-guide.md)

### Workflow Files
- `telegram-to-gmail.json` - Email operations
- `telegram-to-google-docs.json` - Document management
- `telegram-to-google-calendar.json` - Calendar operations
- `telegram-bot-commands.json` - Command routing
- `error-handling-framework.json` - Error management
- `n8n-credential-validation.json` - Credential testing

### Test Files
- `test-n8n-error-handling.js` - Error handling test suite
- `test-telegram-integration.js` - Telegram integration tests
- `test-google-docs-workflow.json` - Google Docs workflow tests

### Configuration Files
- `google-cloud-console-setup.md` - Google Cloud setup
- `credential-troubleshooting-guide.md` - Troubleshooting guide
- `n8n-integration-testing-guide.md` - Integration testing guide

---

## 🎉 Conclusion

The Telegram Bot interface provides a powerful, secure, and user-friendly way to interact with Google APIs through n8n workflows. With comprehensive error handling, security features, and extensive documentation, it's ready for production deployment.

### Key Benefits
- **Mobile-First**: Works perfectly on any device with Telegram
- **Secure**: Built-in authentication and rate limiting
- **Reliable**: Comprehensive error handling and logging
- **Extensible**: Easy to add new commands and features
- **Maintainable**: Well-documented and tested codebase

### Next Steps
1. Complete the setup following this guide
2. Test all functionality thoroughly
3. Deploy to production environment
4. Monitor and maintain the system
5. Extend with additional features as needed

---

**Support**: For issues or questions, refer to the troubleshooting section or check the n8n execution logs.

**Contributing**: To add new features or improve existing ones, modify the appropriate workflow files and update this documentation.

**Version**: This guide is current as of July 2025 and compatible with n8n v1.0+ and Telegram Bot API v7.0+.

---

*This documentation is part of The House AI project's Google API integration implementation, completed under Task 19.13 by the Integration Specialist.*