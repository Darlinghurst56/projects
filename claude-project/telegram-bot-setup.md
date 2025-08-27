# Telegram Bot Configuration for n8n Google API Integration

**Task 19.3: Telegram Bot Interface Framework - Integration Specialist**

## Overview

This guide sets up a Telegram Bot to serve as the primary user interface for Google API operations through n8n workflows. The bot replaces traditional web interfaces with simple chat commands.

## 1. Create Telegram Bot with BotFather

### Step 1: Start Chat with BotFather
1. Open Telegram and search for `@BotFather`
2. Start a conversation and send `/start`

### Step 2: Create New Bot
```
/newbot
```

### Step 3: Configure Bot Details
- **Bot Name**: `Home Assistant Google API Bot` (display name)
- **Bot Username**: `your_home_google_bot` (must end with 'bot')

### Step 4: Save Bot Token
BotFather will provide a token like: `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooQQrrSS`

⚠️ **SECURITY**: Keep this token secure - treat it like a password!

## 2. Get Your Telegram User ID

### Method 1: Using @userinfobot
1. Message `@userinfobot` in Telegram
2. It will reply with your User ID (e.g., `123456789`)

### Method 2: Using Bot API
```bash
# Send a message to your bot first, then:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

## 3. Configure Bot in n8n

### Step 1: Add Telegram Bot Credentials
1. Open n8n web interface: `http://localhost:5678`
2. Go to **Settings** → **Credentials**
3. Click **Add Credential**
4. Select **Telegram Bot**
5. Fill in:
   - **Name**: `Home Telegram Bot`
   - **Access Token**: `your-bot-token-from-botfather`
6. Test connection and save

### Step 2: Set Bot Commands (Optional)
Configure bot commands via BotFather for better UX:

```
/setcommands
```

Then send this command list:
```
send_email - Send email via Gmail
calendar - Create calendar event
gmail_check - Check recent emails
calendar_today - Show today's events
drive_upload - Upload file to Google Drive
doc_create - Create Google Doc
doc_read - Read Google Doc
doc_edit - Edit Google Doc
help - Show available commands
```

## 4. Bot Security Configuration

### User ID Whitelist
In each workflow, add security validation:

```javascript
// Security check in Code node
const userId = $input.first().json.message.from.id;
const ALLOWED_USER_IDS = [123456789, 987654321]; // Replace with your user IDs

if (!ALLOWED_USER_IDS.includes(userId)) {
  throw new Error('Unauthorized user');
}
```

### Command Rate Limiting
Add this to prevent spam:

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

## 5. Test Bot Connection

### Step 1: Basic Test
Send `/start` to your bot - it should respond (if you have a workflow active)

### Step 2: Import Test Workflow
Import the provided `telegram-to-gmail.json` workflow to test:

1. In n8n, go to **Workflows**
2. Click **Import from file**
3. Select `workflows/telegram-to-gmail.json`
4. Update credentials to match your setup
5. Activate the workflow

### Step 3: Test Email Command
Send this message to your bot:
```
/send_email test@example.com Subject: Test from Bot Body: This is a test message from my Telegram bot!
```

## 6. Available Command Patterns

Based on existing workflows:

### Email Commands
```
/send_email recipient@example.com Subject: Your subject Body: Your message
/gmail_check - Show recent emails
```

### Calendar Commands  
```
/calendar Meeting Title | 2025-01-15 14:00 | 1 hour
/calendar_today - Show today's events
```

### Drive Commands
```
/drive_upload - Reply with file attachment
/drive_list - List recent files
```

### Docs Commands
```
/doc_create Title: Meeting Notes Body: Discussion about project
/doc_read 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
/doc_edit document_id Body: Updated content
```

### Utility Commands
```
/help - Show available commands
/status - Check API connection status
```

## 7. Troubleshooting

### Bot Not Responding
1. Check bot token is correct in n8n credentials
2. Verify workflow is activated
3. Check n8n logs for errors
4. Ensure bot has received `/start` command

### Permission Errors
1. Verify your Telegram User ID in security checks
2. Check Google API credentials in n8n
3. Ensure OAuth2 scope includes required permissions

### Rate Limiting
1. Wait 2 seconds between commands
2. Check Google API quota usage
3. Monitor n8n execution logs

## 8. Advanced Configuration

### Custom Keyboards
Add custom reply keyboards to workflows:

```javascript
// In Telegram reply node
{
  "reply_markup": {
    "keyboard": [
      [{"text": "📧 Send Email"}, {"text": "📅 Calendar"}],
      [{"text": "📁 Drive Upload"}, {"text": "📝 Create Doc"}],
      [{"text": "ℹ️ Help"}, {"text": "📊 Status"}]
    ],
    "resize_keyboard": true,
    "one_time_keyboard": false
  }
}
```

### Inline Commands
Support inline queries for quick actions:

```javascript
// Handle inline queries
if ($json.inline_query) {
  const query = $json.inline_query.query;
  // Process inline commands
}
```

### File Handling
Configure file uploads for Drive integration:

```javascript
// Handle file uploads
if ($json.message.document || $json.message.photo) {
  const fileId = $json.message.document?.file_id || $json.message.photo?.[0]?.file_id;
  // Process file upload to Google Drive
}
```

## 9. Integration with Existing Workflows

The bot integrates with these existing workflow files:
- `workflows/telegram-to-gmail.json` - Email operations
- `workflows/telegram-to-calendar.json` - Calendar management  
- `workflows/telegram-to-drive.json` - File operations
- `workflows/telegram-to-docs.json` - Document management

## 10. Monitoring and Logs

### n8n Execution Logs
Monitor workflow executions in n8n web interface:
1. Go to **Executions**
2. Filter by workflow name
3. Check success/failure status
4. Review error details

### Bot Analytics
Track bot usage through workflow data:
- User command frequency
- API operation success rates
- Error patterns and responses

---

**Next Steps**: 
1. Create the bot with BotFather
2. Configure credentials in n8n
3. Import and test existing workflows
4. Customize commands for your use case

This Telegram Bot interface provides a mobile-friendly, secure way to interact with Google APIs through n8n workflows, perfect for single home user scenarios.