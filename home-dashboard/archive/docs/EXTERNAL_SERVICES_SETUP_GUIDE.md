# External Services Installation Guide

## Overview
Complete installation and configuration guide for external services required by the Family Home Dashboard: n8n (workflow automation) and Ollama (local AI). This guide focuses on home-scale deployment optimized for family use.

## Prerequisites
- Linux server or workstation (192.168.1.74 or your family server)
- Docker and Docker Compose installed
- Minimum 4GB RAM, 20GB free disk space
- Stable internet connection for initial setup

## Architecture Overview
```
Family Devices (Windows/iOS)
           ↓
    Home Dashboard (Port 3000)
           ↓
    ┌─────────────────────┐
    │ External Services   │
    │ ├─ n8n (Port 5678)  │
    │ ├─ Ollama (11434)   │
    │ └─ (Optional DBs)   │
    └─────────────────────┘
```

## Part 1: Ollama AI Service Setup

### 1.1 Installation (Recommended: Docker)

**Option A: Docker Installation (Recommended)**
```bash
# Create directory for Ollama data
sudo mkdir -p /opt/ollama
cd /opt/ollama

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: family-ollama
    ports:
      - "11434:11434"
    volumes:
      - ./data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Start Ollama service
docker-compose up -d
```

**Option B: Direct Installation**
```bash
# Install Ollama directly (Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Configure to start on boot
sudo systemctl enable ollama
```

### 1.2 Download Family-Friendly AI Models

**Recommended models for family use:**
```bash
# Lightweight, fast model (good for basic questions)
docker exec family-ollama ollama pull llama3.2:1b

# Balanced model (recommended for families)
docker exec family-ollama ollama pull llama3.2:3b

# Advanced model (if you have sufficient resources)
docker exec family-ollama ollama pull llama3.2:7b

# Code assistant (for family members learning programming)
docker exec family-ollama ollama pull codellama:7b
```

**Storage requirements:**
- llama3.2:1b → ~1.3GB
- llama3.2:3b → ~2.0GB  
- llama3.2:7b → ~4.1GB
- codellama:7b → ~3.8GB

### 1.3 Test Ollama Installation
```bash
# Test API endpoint
curl http://localhost:11434/api/tags

# Test model inference
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "What is a good family dinner recipe?",
    "stream": false
  }'
```

### 1.4 Performance Optimization

**For family server optimization:**
```bash
# Optimize for family usage patterns
cat > /opt/ollama/modelfile-family << 'EOF'
FROM llama3.2:3b

# Family-oriented system prompt
SYSTEM """You are a helpful family AI assistant. You help with family coordination, meal planning, homework help, and daily household management. Keep responses family-friendly and practical."""

# Optimize for household use
PARAMETER temperature 0.8
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 2048
EOF

# Create family-optimized model
docker exec family-ollama ollama create family-assistant -f /opt/ollama/modelfile-family
```

## Part 2: n8n Workflow Automation Setup

### 2.1 Installation

**Create n8n deployment directory:**
```bash
sudo mkdir -p /opt/n8n
cd /opt/n8n

# Create environment configuration
cat > .env << 'EOF'
# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=FamilyDashboard2024!

# Database (SQLite for simplicity)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=n8n.sqlite

# Security
N8N_JWT_AUTH_HEADER=authorization
N8N_JWT_AUTH_HEADER_VALUE_PREFIX=Bearer

# Webhook settings
WEBHOOK_URL=http://192.168.1.74:5678/
N8N_HOST=192.168.1.74
N8N_PORT=5678
N8N_PROTOCOL=http
EOF

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: family-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      - DB_TYPE=${DB_TYPE}
      - DB_SQLITE_DATABASE=${DB_SQLITE_DATABASE}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=${N8N_PROTOCOL}
      - WEBHOOK_URL=${WEBHOOK_URL}
    volumes:
      - ./data:/home/node/.n8n
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - n8n-db

  n8n-db:
    image: sqlite:latest
    container_name: family-n8n-db
    restart: unless-stopped
    volumes:
      - ./db:/var/lib/sqlite
EOF
```

### 2.2 Start n8n Service
```bash
# Start n8n
docker-compose up -d

# Check status
docker-compose logs -f n8n

# Test web interface
curl -I http://localhost:5678
```

### 2.3 Initial n8n Configuration

**Access n8n web interface:**
1. Open http://192.168.1.74:5678 (or your server IP)
2. Login with credentials from .env file
3. Complete initial setup wizard

**Install essential n8n nodes:**
- Google Sheets (family data tracking)
- HTTP Request (API integrations)
- Schedule Trigger (recurring tasks)
- Email (notifications)
- Webhook (dashboard integration)

### 2.4 Family Workflow Examples

**Create basic family workflows:**

**Workflow 1: Morning Family Briefing**
```json
{
  "name": "Morning Family Briefing",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{
            "field": "cronExpression",
            "value": "0 7 * * 1-5"
          }]
        }
      }
    },
    {
      "name": "Get Weather",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openweathermap.org/data/2.5/weather",
        "method": "GET"
      }
    }
  ],
  "connections": {}
}
```

## Part 3: Service Integration with Home Dashboard

### 3.1 Update Dashboard Configuration

**Update your Home Dashboard .env file:**
```env
# External Services URLs
N8N_URL=http://192.168.1.74:5678
OLLAMA_URL=http://192.168.1.74:11434

# AI Configuration  
OLLAMA_MODEL=family-assistant
OLLAMA_TIMEOUT=60000

# Feature Flags
FEATURE_AI_CHAT=true
FEATURE_N8N_INTEGRATION=true
```

### 3.2 Test Service Integration

**Test from Home Dashboard:**
```bash
# From your dashboard directory
cd /home/darlinghurstlinux/projects/home-dashboard

# Test Ollama connection
curl http://192.168.1.74:11434/api/tags

# Test n8n connection  
curl http://192.168.1.74:5678/healthz

# Start dashboard with external services
npm start
```

**Verify integration:**
1. Dashboard startup should show successful service connections
2. AI Chat widget should be functional
3. System status should show all services healthy

## Part 4: Development vs Production Setup

### 4.1 Development Configuration

**For local development (both services on localhost):**
```env
# Development - services running locally
N8N_URL=http://localhost:5678
OLLAMA_URL=http://localhost:11434
MOCK_DATA=true  # Use mock data when services unavailable
```

### 4.2 Production Configuration

**For family server deployment:**
```env
# Production - services on family server
N8N_URL=http://192.168.1.74:5678
OLLAMA_URL=http://192.168.1.74:11434
NODE_ENV=production
MOCK_DATA=false
```

### 4.3 Fallback Strategies

**Circuit breaker configuration (automatic):**
- Services automatically detected as unavailable
- Fallback responses provided for offline scenarios
- Graceful degradation maintains dashboard functionality

**Manual fallback activation:**
```env
# Disable external services temporarily
FEATURE_AI_CHAT=false
FEATURE_N8N_INTEGRATION=false
MOCK_DATA=true
```

## Part 5: Monitoring and Maintenance

### 5.1 Service Health Monitoring

**Set up monitoring scripts:**
```bash
# Create monitoring script
cat > /opt/monitor-services.sh << 'EOF'
#!/bin/bash
echo "Family Services Health Check - $(date)"
echo "================================"

# Check Ollama
if curl -sf http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama: Healthy"
else
    echo "❌ Ollama: Down"
fi

# Check n8n
if curl -sf http://localhost:5678/healthz > /dev/null; then
    echo "✅ n8n: Healthy"
else
    echo "❌ n8n: Down"
fi

echo "================================"
EOF

chmod +x /opt/monitor-services.sh

# Run monitoring (can be added to cron)
/opt/monitor-services.sh
```

### 5.2 Backup Strategy

**Backup essential data:**
```bash
# Backup n8n workflows and data
cp -r /opt/n8n/data /backup/n8n-$(date +%Y%m%d)

# Backup Ollama models (optional - can be re-downloaded)
cp -r /opt/ollama/data /backup/ollama-$(date +%Y%m%d)

# Create automated backup script
cat > /opt/backup-services.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/family-services"
DATE=$(date +%Y%m%d-%H%M)

mkdir -p $BACKUP_DIR

# Backup n8n data
tar -czf $BACKUP_DIR/n8n-backup-$DATE.tar.gz -C /opt/n8n data

# Keep last 7 days of backups
find $BACKUP_DIR -name "n8n-backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: n8n-backup-$DATE.tar.gz"
EOF

chmod +x /opt/backup-services.sh
```

### 5.3 Automatic Service Restart

**Create service restart script:**
```bash
# Service restart script
cat > /opt/restart-services.sh << 'EOF'
#!/bin/bash
echo "Restarting Family Services..."

# Restart Ollama
cd /opt/ollama && docker-compose restart

# Restart n8n  
cd /opt/n8n && docker-compose restart

# Wait for services to stabilize
sleep 30

# Run health check
/opt/monitor-services.sh
EOF

chmod +x /opt/restart-services.sh
```

## Part 6: Family Usage Optimization

### 6.1 Resource Optimization for Home Use

**Adjust for typical family hardware:**
```yaml
# docker-compose.yml optimization
services:
  ollama:
    deploy:
      resources:
        limits:
          memory: 2G        # Limit memory for family server
          cpus: '1.0'       # Limit CPU usage
    environment:
      - OLLAMA_MAX_LOADED_MODELS=1  # Only keep one model in memory
```

### 6.2 Family-Friendly n8n Workflows

**Common family automation workflows:**
1. **Morning Routine**: Weather + calendar + reminders
2. **Meal Planning**: Recipe suggestions based on calendar
3. **Family Notifications**: Important email summaries
4. **Home Security**: Basic monitoring and alerts
5. **Shopping Lists**: Automated grocery list generation

### 6.3 Cost and Performance Considerations

**For family budget optimization:**
- Use local AI (Ollama) to minimize API costs
- Cache frequent requests
- Schedule intensive workflows for off-peak hours
- Monitor bandwidth usage

## Troubleshooting

### Common Issues

**1. Ollama "connection refused"**
```bash
# Check if service is running
docker ps | grep ollama

# Check logs
docker logs family-ollama

# Restart if needed
cd /opt/ollama && docker-compose restart
```

**2. n8n "502 Bad Gateway"**
```bash
# Check n8n status
docker logs family-n8n

# Verify database
ls -la /opt/n8n/data/

# Reset if corrupted
cd /opt/n8n && docker-compose down && docker-compose up -d
```

**3. Dashboard can't connect to services**
```bash
# Test network connectivity
ping 192.168.1.74

# Test service ports
telnet 192.168.1.74 11434  # Ollama
telnet 192.168.1.74 5678   # n8n

# Check firewall rules
sudo ufw status
```

**4. High resource usage**
```bash
# Monitor resource usage
docker stats

# Optimize model selection
docker exec family-ollama ollama pull llama3.2:1b  # Smaller model

# Limit concurrent workflows in n8n
```

## Security Considerations

### 6.1 Network Security
- Configure firewall to restrict external access
- Use VPN for remote family access
- Regular security updates for Docker and services

### 6.2 Data Privacy
- All AI processing happens locally (no data sent to external services)
- n8n workflows should avoid storing sensitive family data
- Regular backups with encryption

## Next Steps

Once external services are running:

1. **Test Integration**: Verify dashboard connects to all services
2. **Create Workflows**: Set up basic family automation
3. **Train Family**: Show family members how to use AI chat
4. **Monitor Performance**: Establish monitoring routine
5. **Backup Setup**: Implement regular backup strategy

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-08-06  
**Compatibility**: Home Dashboard v1.0+  
**Resource Requirements**: 4GB RAM, 20GB Storage, Family Internet Connection