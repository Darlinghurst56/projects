# Telegram Bot Setup Guide

This guide explains how to create and configure a Telegram bot for Gmail integration.

## Step 1: Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Start a conversation with BotFather
3. Send `/newbot` command
4. Follow the prompts:
   - **Bot name**: "Gmail Manager Bot" (or your preferred name)
   - **Username**: must end with "bot" (e.g., `gmail_manager_bot`)

5. Save the **Bot Token** provided by BotFather
   - Example: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`

## Step 2: Configure Bot Settings

### Set Bot Description
```
/setdescription
[Select your bot]
Manage your Gmail emails through Telegram commands. Send, read, search, and archive emails directly from Telegram.
```

### Set Bot Commands
```
/setcommands
[Select your bot]
send_email - Send an email: /send_email to:email subject:subject body:message
read_emails - Read recent emails: /read_emails [count:5] [unread_only]  
search_email - Search emails: /search_email query:search terms
archive_email - Archive email: /archive_email id:email_id
help - Show available commands
```

### Set Bot Profile Picture (Optional)
```
/setuserpic
[Select your bot]
[Upload an appropriate image]
```

## Step 3: Configure in n8n

1. Access n8n at `http://192.168.1.74:5678`
2. Go to **Settings** > **Credentials**
3. Add new credential: **Telegram API**
4. Enter your bot token from Step 1
5. Save the credential with name: "Gmail Telegram Bot"

## Step 4: Set Up Webhook (for Telegram Trigger)

### Option 1: Manual Webhook Setup
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "http://192.168.1.74:5678/webhook/telegram-webhook"}'
```

### Option 2: Use n8n Telegram Trigger Node
- The Telegram Trigger node in n8n will automatically set up webhooks
- Make sure the webhook URL is accessible from Telegram servers
- For local development, consider using ngrok or similar tunneling service

## Step 5: Test Bot Functionality

1. Find your bot in Telegram using the username
2. Start a conversation with `/start`
3. Test basic commands:
   - `/help` - Should show available commands
   - Try other commands once workflows are active

## Security Considerations

### Bot Token Security
- Never share your bot token publicly
- Store token securely in n8n credentials
- Use environment variables for production deployment
- Regularly rotate bot tokens if needed

### Access Control
- Consider implementing user authentication
- Whitelist specific user IDs or chat IDs
- Monitor bot usage for suspicious activity
- Implement rate limiting for commands

### Privacy Settings
```
/setprivacy
[Select your bot]
Disable  # Allows bot to read all messages in groups
```

## Command Format Examples

### Send Email
```
/send_email to:recipient@example.com subject:Meeting Tomorrow body:Hi! Let's meet tomorrow at 2 PM. Thanks!
```

### Read Emails
```
/read_emails                    # Read last 5 emails
/read_emails count:10           # Read last 10 emails  
/read_emails unread_only        # Read only unread emails
/read_emails count:3 unread_only # Read last 3 unread emails
```

### Search Email
```
/search_email query:meeting
/search_email query:from:boss@company.com
/search_email query:subject:invoice
```

### Archive Email
```
/archive_email id:gmail_message_id_here
```

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check webhook configuration
2. **Invalid token**: Verify bot token in n8n credentials  
3. **Commands not recognized**: Ensure workflows are active
4. **Webhook errors**: Check n8n logs for connection issues

### Testing Webhook
```bash
# Test if webhook is reachable
curl -X POST "http://192.168.1.74:5678/webhook/telegram-webhook" \
     -H "Content-Type: application/json" \
     -d '{"message": {"text": "/test"}}'
```

### Webhook URL Requirements
- Must be HTTPS in production (HTTP allowed for local testing)
- Must be accessible from Telegram servers
- Port 5678 must be open if using direct connection
- Consider using reverse proxy with SSL certificate for production

## Rate Limits

- Telegram API allows 30 messages per second
- 1 message per chat per second
- Implement appropriate delays for bulk operations
- Monitor API usage to avoid hitting limits