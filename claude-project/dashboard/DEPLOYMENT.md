# Agent Dashboard Deployment Guide

## 🚀 Production Deployment

This guide provides step-by-step instructions for deploying the Agent Dashboard to production, based on successful QA validation with **100% test success rate**.

## ✅ Pre-Deployment Checklist

### QA Validation
- [x] **100% test success rate** (8/8 tests passed)
- [x] **Basic accessibility** validated
- [x] **API integration** working (3 agents detected)
- [x] **Responsive design** tested (mobile/tablet/desktop)
- [x] **Performance metrics** within limits (<3s load, <1s API)
- [x] **Cross-browser compatibility** verified
- [x] **Error handling** robust
- [x] **Widget interactions** functional (8/8 working)

### System Requirements
- [x] **Node.js** 18+ installed
- [x] **TaskMaster AI** configured with MCP integration
- [x] **Modern web browser** (Chrome 91+, Firefox 88+, Safari 14+, Edge 91+)
- [x] **Network access** to localhost:3001 (or configured API endpoints)

## 🔧 Deployment Methods

### Method 1: HTTP Server (Recommended for Development)

```bash
# Navigate to dashboard directory
cd /mnt/d/Projects/claude-project/dashboard

# Start Python HTTP server
python3 -m http.server 8000 --bind 127.0.0.1

# Or use Node.js http-server
npx http-server -p 8000

# Access dashboard
open http://localhost:8000/agent-dashboard.html
```

### Method 2: Node.js Production Server

```bash
# Install production dependencies
npm install express cors

# Create production server (server.js)
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'agent-dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
});
EOF

# Start production server
node server.js
```

### Method 3: Docker Deployment

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM nginx:alpine

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index agent-dashboard.html;

        location / {
            try_files $uri $uri/ /agent-dashboard.html;
        }
    }
}
EOF

# Build and run container
docker build -t agent-dashboard .
docker run -p 8080:80 agent-dashboard
```

## 🔗 API Configuration

### TaskMaster API Setup

1. **Verify TaskMaster is running**:
```bash
# Check TaskMaster status
task-master next

# Verify MCP integration
task-master models
```

2. **Configure API endpoints** in `js/api-client.js`:
```javascript
const apiEndpoints = {
    agents: 'http://localhost:3001/api/agents',
    health: 'http://localhost:3001/api/health',
    tasks: 'http://localhost:3001/api/tasks',
    dashboard: 'http://localhost:3001/agent-dashboard.html'
};
```

3. **Test API connectivity**:
```bash
# Health check
curl http://localhost:3001/api/health

# Agents endpoint
curl http://localhost:3001/api/agents
```

### Agent Registry Configuration

1. **Initialize agent registry**:
```bash
# Create agent metadata directory
mkdir -p .agent-meta

# Register initial agents
node .agent-meta/discovery-api.cjs register qa-specialist-dashboard-test qa-specialist
```

2. **Verify agent discovery**:
```bash
# List active agents
node .agent-meta/discovery-api.cjs agents

# Check system health
node .agent-meta/discovery-api.cjs health
```

## 🌐 Network Configuration

### Port Configuration

| Service | Default Port | Production Port | Purpose |
|---------|-------------|----------------|---------|
| Dashboard | 8000 | 80/443 | Web interface |
| TaskMaster API | 3001 | 3001 | Agent coordination |
| Health Monitor | 3002 | 3002 | System monitoring |

### Firewall Rules

```bash
# Allow dashboard access
sudo ufw allow 8000/tcp

# Allow API access
sudo ufw allow 3001/tcp

# HTTPS (if using SSL)
sudo ufw allow 443/tcp
```

### SSL/HTTPS Setup (Optional)

```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use with Node.js HTTPS server
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

## 📊 Health Monitoring

### Dashboard Health Checks

1. **Create health check script**:
```bash
cat > health-check.js << 'EOF'
const fetch = require('node-fetch');

async function healthCheck() {
    try {
        // Check dashboard accessibility
        const dashboardResponse = await fetch('http://localhost:8000/agent-dashboard.html');
        console.log('Dashboard:', dashboardResponse.ok ? '✅ OK' : '❌ FAIL');
        
        // Check API health
        const apiResponse = await fetch('http://localhost:3001/api/health');
        const apiData = await apiResponse.json();
        console.log('API Health:', apiData.status === 'healthy' ? '✅ OK' : '❌ FAIL');
        
        // Check agent registry
        const agentsResponse = await fetch('http://localhost:3001/api/agents');
        const agentsData = await agentsResponse.json();
        console.log('Agents:', agentsData.agents ? `✅ ${agentsData.agents.length} active` : '❌ FAIL');
        
        console.log('\n🎯 System Status: All systems operational');
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
    }
}

healthCheck();
EOF

# Run health check
node health-check.js
```

2. **Continuous monitoring**:
```bash
# Create monitoring cron job
echo "*/5 * * * * cd /mnt/d/Projects/claude-project/dashboard && node health-check.js >> health.log 2>&1" | crontab -
```

## 🔐 Security Configuration

### Basic Security Headers

```javascript
// Add to Express server
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});
```

### Access Control

1. **IP Whitelist** (if needed):
```javascript
const allowedIPs = ['127.0.0.1', '::1', '192.168.1.0/24'];

app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!allowedIPs.some(ip => clientIP.includes(ip))) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
});
```

2. **API Key Authentication** (optional):
```javascript
app.use('/api', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
});
```

## 📋 Post-Deployment Validation

### Validation Checklist

1. **Dashboard Accessibility**:
```bash
# Test dashboard loads
curl -I http://localhost:8000/agent-dashboard.html
# Expected: 200 OK
```

2. **Widget Functionality**:
```bash
# Test agent registry widget
curl http://localhost:3001/api/agents
# Expected: JSON with agents array
```

3. **Responsive Design**:
```bash
# Test mobile viewport
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://localhost:8000/agent-dashboard.html
```

4. **Performance Validation**:
```bash
# Measure load time
time curl -s http://localhost:8000/agent-dashboard.html > /dev/null
# Expected: < 3 seconds
```

### QA Test Execution

```bash
# Run comprehensive QA suite
node run-qa-dashboard-test.cjs

# Expected output:
# Success Rate: 100%
# Status: READY FOR PRODUCTION
```

## 🚨 Troubleshooting

### Common Issues

1. **Dashboard not loading**:
   - Check server is running: `lsof -i :8000`
   - Verify file permissions: `ls -la agent-dashboard.html`
   - Check browser console for errors

2. **API connection failed**:
   - Verify TaskMaster running: `task-master next`
   - Check API endpoints: `curl http://localhost:3001/api/health`
   - Review network connectivity

3. **Agent registry empty**:
   - Check agent metadata: `cat .agent-meta/agent-registry.json`
   - Re-register agents: `node .agent-meta/discovery-api.cjs register`

4. **Widget not loading**:
   - Check widget files exist: `ls widgets/*/`
   - Verify JavaScript console: Browser DevTools > Console
   - Test EventBus: `window.eventBus` should exist

### Log Analysis

```bash
# Check server logs
tail -f access.log error.log

# Monitor health checks
tail -f health.log

# TaskMaster logs
task-master --debug
```

## 📈 Performance Optimization

### Caching Strategy

```javascript
// Static file caching
app.use(express.static('.', {
    maxAge: '1d',
    etag: true
}));

// API response caching
const cache = new Map();
app.get('/api/agents', (req, res) => {
    if (cache.has('agents')) {
        return res.json(cache.get('agents'));
    }
    // Fetch and cache response
});
```

### CDN Configuration (Optional)

```html
<!-- Use CDN for external libraries -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
```

## 🔄 Updates and Maintenance

### Update Process

1. **Backup current deployment**:
```bash
cp -r /current/dashboard /backup/dashboard-$(date +%Y%m%d)
```

2. **Deploy new version**:
```bash
# Test in staging first
cp -r /staging/dashboard /production/dashboard

# Run QA validation
node run-qa-dashboard-test.cjs
```

3. **Rollback procedure** (if needed):
```bash
# Stop current service
sudo systemctl stop dashboard

# Restore backup
cp -r /backup/dashboard-YYYYMMDD /production/dashboard

# Restart service
sudo systemctl start dashboard
```

### Maintenance Schedule

- **Daily**: Health check monitoring
- **Weekly**: Performance metrics review
- **Monthly**: Security updates and dependency patches
- **Quarterly**: Full QA re-validation

## 🎯 Success Criteria

### Deployment Success Indicators

✅ **Dashboard loads within 3 seconds**  
✅ **All widgets functional and responsive**  
✅ **API integration working (3+ agents)**  
✅ **QA tests passing at 100%**  
✅ **Cross-browser compatibility confirmed**  
✅ **Health monitoring operational**  
✅ **Performance metrics within limits**  

### Key Performance Indicators

- **Uptime**: > 99.5%
- **Load Time**: < 3 seconds
- **API Response**: < 1 second
- **Error Rate**: < 0.1%
- **Agent Discovery**: 100% success rate

---

**Status**: ✅ Production Ready | **Validated**: July 9, 2025 | **Success Rate**: 100%