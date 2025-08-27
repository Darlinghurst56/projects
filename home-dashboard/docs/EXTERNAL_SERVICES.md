# External Services Integration

## Overview

The Family Dashboard integrates with several external services to provide comprehensive functionality:

- **Google APIs**: Calendar, Gmail, Drive integration
- **Ollama AI**: Local AI chat assistant
- **n8n**: Workflow automation
- **ControlD**: DNS filtering and analytics

## Google Services Integration

### Setup Requirements
1. Google Cloud Console project
2. OAuth 2.0 credentials
3. Enabled APIs: Calendar, Gmail, Drive
4. Authorized redirect URIs configured

### API Configuration
```bash
# Required environment variables
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://192.168.1.74:3003/auth/google/callback
```

### Enabled Services
- **Google Calendar**: Family calendar widget
- **Google Gmail**: Email notifications (future)
- **Google Drive**: File sharing widget (future)

### Rate Limits & Quotas
- Calendar API: 100,000 requests/day
- Gmail API: 250 quota units/user/second
- Drive API: 20,000 requests/100 seconds

### Troubleshooting Google Services
```bash
# Test Google API connectivity
curl -s "https://www.googleapis.com/oauth2/v2/userinfo" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check API quotas in Google Cloud Console
# Enable required APIs if disabled
# Verify OAuth consent screen is published
```

## Ollama AI Service

### Service Details
- **URL**: http://192.168.1.74:11434
- **Purpose**: Local AI chat assistant for family
- **Model**: Latest compatible model
- **Access**: All family members

### Health Check
```bash
# Check Ollama service status
curl -f http://192.168.1.74:11434/api/tags

# List available models
curl http://192.168.1.74:11434/api/tags | jq '.models'

# Test chat functionality
curl -X POST http://192.168.1.74:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "Hello, how are you?"}'
```

### Troubleshooting Ollama
```bash
# Restart Ollama service (on family server)
sudo systemctl restart ollama

# Check service logs
journalctl -u ollama -f

# Verify model availability
ollama list

# Pull new model if needed
ollama pull llama2
```

## n8n Automation Service

### Service Details
- **URL**: http://192.168.1.74:5678
- **Purpose**: Family workflow automation
- **Access**: Admin only (PIN 999999)
- **Functions**: Scheduled tasks, integrations

### Health Check
```bash
# Check n8n service status
curl -f http://192.168.1.74:5678/healthz

# Test API endpoint
curl -f http://192.168.1.74:5678/api/v1/workflows
```

### Available Workflows
- Meal planning automation
- Calendar synchronization
- System health monitoring
- Backup automation

### Troubleshooting n8n
```bash
# Restart n8n service (on family server)
sudo systemctl restart n8n

# Check service logs
journalctl -u n8n -f

# Access n8n web interface
# Navigate to http://192.168.1.74:5678
```

## ControlD DNS Service

### Service Integration
- **Purpose**: Family-safe DNS filtering
- **Features**: Analytics, threat protection, custom rules
- **Access**: View-only through dashboard

### DNS Analytics Widget
- Real-time query statistics
- Blocked domains tracking
- Family member activity (anonymized)
- Threat detection alerts

### Configuration
```bash
# DNS status endpoint
CONTROLD_API_URL=https://api.controld.com/
CONTROLD_API_KEY=your_api_key_here

# Test connectivity
curl -H "Authorization: Bearer $CONTROLD_API_KEY" \
  https://api.controld.com/profiles
```

### Troubleshooting DNS
```bash
# Check DNS resolution
nslookup google.com 192.168.1.1

# Test filtering (should be blocked)
nslookup malware-example.com 192.168.1.1

# Verify dashboard connectivity
curl -f http://192.168.1.74:3003/api/dns/status
```

## Service Dependencies

### Critical Dependencies
These services are required for core functionality:
- **Authentication Service**: Local JWT validation
- **Database**: Local PIN storage
- **File System**: Configuration and logs

### Optional Dependencies
These services enhance functionality but dashboard works without them:
- **Google APIs**: Calendar widget, OAuth login
- **Ollama**: AI chat widget
- **n8n**: Automation features
- **ControlD**: DNS analytics

### Graceful Degradation
The dashboard handles service failures gracefully:
- Disabled widgets when services unavailable
- Fallback authentication with PINs
- Cached data for temporary outages
- User-friendly error messages

## Backup Strategies

### Service Availability
If external services are unavailable:
- **Calendar**: Use calendar.google.com directly
- **Email**: Use gmail.com directly
- **Files**: Use drive.google.com directly
- **AI Chat**: Wait for Ollama restoration

### Data Backup
```bash
# Backup dashboard configuration
tar -czf dashboard-backup-$(date +%Y%m%d).tar.gz \
  server/data/ .env package.json

# Backup n8n workflows (on family server)
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz \
  ~/.n8n/

# Backup Ollama models (on family server)
tar -czf ollama-backup-$(date +%Y%m%d).tar.gz \
  /usr/share/ollama/.ollama/models/
```

## Performance Optimization

### Caching Strategy
- Google Calendar: 5-minute cache
- DNS Status: 1-minute cache
- System Status: 30-second cache
- AI Responses: No caching (real-time)

### Timeout Configuration
```javascript
// Service timeouts
const TIMEOUTS = {
  google: 5000,      // 5 seconds
  ollama: 10000,     // 10 seconds
  n8n: 3000,         // 3 seconds
  controld: 2000     // 2 seconds
};
```

### Error Handling
All external service calls include:
- Circuit breaker pattern
- Retry logic with exponential backoff
- Fallback responses
- User-friendly error messages

## Security Considerations

### API Key Management
- Store all keys in environment variables
- Never commit keys to version control
- Rotate keys regularly
- Use minimum required permissions

### Network Security
- All traffic over HTTPS where possible
- Internal services on private network
- Firewall rules restrict external access
- Regular security updates

### Data Privacy
- No external logging of family data
- Local processing where possible
- Anonymized analytics only
- Parental controls respected

## Monitoring & Alerts

### Health Monitoring
The dashboard continuously monitors:
- Service availability
- Response times
- Error rates
- Authentication status

### Alert Conditions
Alerts are triggered for:
- Service downtime > 5 minutes
- Response times > 10 seconds
- Authentication failures
- Security threats detected

### Recovery Procedures
Automated recovery includes:
- Service restart attempts
- Cache clearing
- Configuration reload
- User notification

---

**Need Help?** Check service-specific documentation in `/home/darlinghurstlinux/projects/home-dashboard/archive/docs/` or contact your family tech person.