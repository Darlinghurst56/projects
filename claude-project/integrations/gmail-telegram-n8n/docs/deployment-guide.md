# Gmail-Telegram n8n Integration Deployment Guide

This guide provides step-by-step instructions to deploy the Gmail-Telegram integration using the existing n8n instance.

## Prerequisites Checklist

- [x] n8n instance running at `192.168.1.74:5678`
- [ ] Gmail API credentials configured
- [ ] Telegram bot created and token obtained
- [ ] Network access to n8n instance
- [ ] SSL certificate (for production webhook)

## Deployment Steps

### 1. Prepare Credentials

#### Gmail OAuth2 Setup
1. Follow [Gmail Setup Guide](.taskmaster/docs/gmail-setup.md) to create OAuth2 credentials
2. Note down:
   - Client ID
   - Client Secret
   - Authorized redirect URIs

#### Telegram Bot Setup  
1. Follow [Telegram Setup Guide](.taskmaster/docs/telegram-setup.md) to create bot
2. Note down:
   - Bot token
   - Bot username

### 2. Configure n8n Credentials

#### Add Gmail OAuth2 Credential
```json
{
  "name": "Gmail OAuth2",
  "type": "googleOAuth2Api",
  "data": {
    "clientId": "YOUR_GMAIL_CLIENT_ID",
    "clientSecret": "YOUR_GMAIL_CLIENT_SECRET",
    "scope": "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "accessTokenUrl": "https://oauth2.googleapis.com/token"
  }
}
```

#### Add Telegram Bot Credential
```json
{
  "name": "Gmail Telegram Bot",
  "type": "telegramApi", 
  "data": {
    "accessToken": "YOUR_TELEGRAM_BOT_TOKEN"
  }
}
```

### 3. Import Workflows

#### Method 1: Manual Import via n8n UI
1. Access n8n at `http://192.168.1.74:5678`
2. Go to **Workflows** → **Import from File**
3. Import each workflow file:
   - `workflows/send-email-workflow.json`
   - `workflows/read-emails-workflow.json`
   - `workflows/search-emails-workflow.json` (when created)
   - `workflows/archive-emails-workflow.json` (when created)

#### Method 2: API Import (Alternative)
```bash
# Import send email workflow
curl -X POST "http://192.168.1.74:5678/rest/workflows/import" \
     -H "Content-Type: application/json" \
     -d @workflows/send-email-workflow.json

# Import read emails workflow  
curl -X POST "http://192.168.1.74:5678/rest/workflows/import" \
     -H "Content-Type: application/json" \
     -d @workflows/read-emails-workflow.json
```

### 4. Configure Webhook URLs

#### Set Telegram Webhook
```bash
# Replace YOUR_BOT_TOKEN with actual token
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "http://192.168.1.74:5678/webhook/telegram-gmail-bot",
       "allowed_updates": ["message"]
     }'
```

#### Verify Webhook Status
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 5. Test Integration

#### Basic Connectivity Tests

1. **Test n8n Access**:
   ```bash
   curl -I http://192.168.1.74:5678/healthz
   ```

2. **Test Telegram Bot**:
   - Message your bot: `/start`
   - Should receive a response if webhook is working

3. **Test Gmail API**:
   - Use n8n test functionality in Gmail node
   - Verify OAuth2 authentication works

#### Functional Tests

1. **Send Email Test**:
   ```
   /send_email to:test@example.com subject:Test body:This is a test email
   ```

2. **Read Emails Test**:
   ```
   /read_emails count:3
   ```

### 6. Production Considerations

#### Security Hardening

1. **Enable HTTPS**:
   - Set up reverse proxy with SSL certificate
   - Update webhook URLs to use HTTPS
   - Configure proper firewall rules

2. **Access Control**:
   ```javascript
   // Add to workflow function nodes
   const allowedUsers = ['username1', 'username2'];
   const userId = $node['Telegram Trigger'].json.message.from.username;
   
   if (!allowedUsers.includes(userId)) {
     return [{
       json: {
         chatId: $node['Telegram Trigger'].json.message.chat.id,
         text: "❌ Unauthorized access"
       }
     }];
   }
   ```

3. **Rate Limiting**:
   - Implement per-user rate limits
   - Add cooldown periods for heavy operations
   - Monitor API usage

#### Monitoring Setup

1. **n8n Execution Logs**:
   - Monitor workflow execution history
   - Set up alerts for failed executions
   - Log important events

2. **API Monitoring**:
   - Monitor Gmail API quota usage
   - Track Telegram API rate limits
   - Set up usage alerts

#### Backup Strategy

1. **Workflow Backup**:
   ```bash
   # Export all workflows
   curl "http://192.168.1.74:5678/rest/workflows" > workflows-backup.json
   ```

2. **Credentials Backup**:
   - Document credential IDs and names
   - Securely store credential values
   - Plan credential rotation schedule

### 7. Troubleshooting

#### Common Issues

1. **Webhook Not Working**:
   - Check firewall settings
   - Verify webhook URL accessibility
   - Review n8n execution logs

2. **Gmail Authentication Fails**:
   - Re-authenticate OAuth2 credentials
   - Check API quotas in Google Cloud Console
   - Verify scopes are correct

3. **Bot Not Responding**:
   - Check bot token validity
   - Verify webhook configuration
   - Review Telegram API limits

#### Debug Commands

```bash
# Check n8n logs
docker logs n8n

# Test webhook manually
curl -X POST "http://192.168.1.74:5678/webhook/telegram-gmail-bot" \
     -H "Content-Type: application/json" \
     -d '{
       "message": {
         "text": "/test",
         "chat": {"id": 123},
         "from": {"id": 123, "username": "testuser"}
       }
     }'

# Check workflow status
curl "http://192.168.1.74:5678/rest/workflows"
```

### 8. Maintenance

#### Regular Tasks

1. **Weekly**:
   - Review execution logs
   - Check API usage quotas
   - Monitor error rates

2. **Monthly**:
   - Update dependencies if needed
   - Review and rotate credentials
   - Backup workflow configurations

3. **Quarterly**:
   - Security audit
   - Performance optimization
   - Update documentation

#### Updates and Patches

1. **n8n Updates**:
   - Test in staging environment first
   - Backup workflows before updating
   - Review changelog for breaking changes

2. **API Changes**:
   - Monitor Gmail API deprecation notices
   - Keep up with Telegram Bot API updates
   - Update workflows as needed

## Environment Variables

For production deployment, consider using environment variables:

```bash
# n8n configuration
N8N_HOST=192.168.1.74
N8N_PORT=5678
N8N_PROTOCOL=http

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
```

## Support and Documentation

- n8n Documentation: https://docs.n8n.io/
- Gmail API Reference: https://developers.google.com/gmail/api
- Telegram Bot API: https://core.telegram.org/bots/api
- Project Repository: `/integrations/gmail-telegram-n8n/`