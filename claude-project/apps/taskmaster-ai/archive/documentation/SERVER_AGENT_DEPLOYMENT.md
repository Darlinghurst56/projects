# TaskMaster Server Agent - Deployment Guide

## 🚀 Overview

The TaskMaster Server Agent provides automated system launch, monitoring, and management capabilities. It acts as a dedicated agent responsible for the entire TaskMaster infrastructure lifecycle.

## 📋 Quick Start

### Simple Launch

```bash
# Launch complete system with server agent
npm run launch

# Check system status
npm run status

# Graceful shutdown
npm run stop
```

### Manual Launch

```bash
# Launch with detailed output
node server-agent-launcher.js start

# Check status
node server-agent-launcher.js status

# Stop system
node server-agent-launcher.js stop
```

## 🔧 Server Agent Capabilities

### 1. **System Launch Orchestration**

- **Pre-launch checks**: Validates all required files and directories
- **API Server startup**: Launches TaskMaster API on port 3001
- **Cleanup processor**: Starts background cleanup job management
- **Agent registration**: Registers itself as `server-agent-001`
- **Health monitoring**: Continuous system monitoring every 60 seconds

### 2. **Component Management**

```
┌─ Server Agent Launcher ─┐
│                         │
├── TaskMaster API Server ├─── Port 3001
│   ├── REST Endpoints    │
│   ├── WebSocket Server  │
│   └── Agent Coordination│
│                         │
├── Cleanup Job Processor ├─── Background Process
│   ├── Immediate Cleanup │
│   ├── Delayed Cleanup   │
│   └── Archival System   │
│                         │
└── System Monitoring ────├─── Health Checks
    ├── Performance Metrics
    ├── Error Tracking
    └── Status Reporting
```

### 3. **Health Monitoring Features**

- **API Server Health**: Endpoint responsiveness and performance
- **Cleanup Job Status**: Queue size, error rates, processing status
- **Agent Coordination**: Active agent count and task distribution
- **System Resources**: Memory usage, connection counts, uptime
- **Automated Alerts**: Warnings for high error rates or queue backlogs

## 📊 Monitoring & Status

### Real-time Status Endpoints

```bash
# Complete system status
curl http://localhost:3001/api/server/status | jq

# Health check
curl http://localhost:3001/api/health

# Cleanup job status
curl http://localhost:3001/api/cleanup/status

# Agent coordination status
curl http://localhost:3001/api/coordination/status
```

### Dashboard Access

- **Main Dashboard**: <http://localhost:3001>
- **Agent Dashboard**: <http://localhost:3001/agent-dashboard.html>
- **Live Dashboard**: <http://localhost:3001/live-agent-dashboard.html>

### Command Line Status

```bash
# System status via npm
npm run status

# Detailed server agent status
node server-agent-launcher.js status
```

## 🔄 Server Agent Lifecycle

### Startup Sequence

1. **Pre-launch Validation**

   ```
   ✅ package.json
   ✅ API Server (taskmaster-api-server.js)
   ✅ Cleanup Jobs (task-cleanup-jobs.js)
   ✅ Task Wrapper (task-update-wrapper.js)
   ✅ Agent Directory (.taskmaster/agents)
   ```

2. **Component Initialization**

   ```
   🌐 Starting TaskMaster API Server...
   🧹 Starting Cleanup Jobs Processor...
   🤖 Registering Server Agent...
   📊 Starting system monitoring...
   ```

3. **Ready State**

   ```
   ✅ TaskMaster System Launch Complete
   🔄 System monitoring active
   📊 Dashboard: http://localhost:3001
   ```

### Runtime Monitoring

```
📊 [2025-07-13T10:30:00.000Z] System Health Check:
  🌐 API Server: running
  🧹 Cleanup Jobs: RUNNING
  📋 Cleanup Queue: 3 items
  🤖 Active Agents: 2
  📝 Total Tasks: 45
```

### Graceful Shutdown

```
🛑 Initiating system shutdown...
🔌 Stopping api-server...
🔌 Stopping cleanup-processor...
✅ System shutdown complete
```

## ⚙️ Configuration

### Environment Variables

```bash
# Optional: Server agent configuration
SERVER_AGENT_MONITORING_INTERVAL=60000  # Health check interval (ms)
SERVER_AGENT_STARTUP_TIMEOUT=30000      # API startup timeout (ms)
SERVER_AGENT_SHUTDOWN_TIMEOUT=5000      # Graceful shutdown timeout (ms)

# Optional: System configuration
PORT=3001                               # API server port
NODE_ENV=production                     # Environment
```

### Agent Registration

- **Agent ID**: `server-agent-001`
- **Role**: `server-agent`
- **Responsibilities**: System orchestration, monitoring, lifecycle management
- **Auto-registration**: Registers with API server after startup

## 🚨 Error Handling & Recovery

### Startup Failures

```bash
# Common startup issues and solutions

# Port already in use
❌ Error: listen EADDRINUSE: address already in use :::3001
💡 Solution: Stop existing process or change PORT environment variable

# Missing dependencies
❌ Pre-launch check failed: package.json
💡 Solution: Run 'npm install' to install dependencies

# Permission issues
❌ EACCES: permission denied
💡 Solution: Check file permissions and run with appropriate privileges
```

### Runtime Issues

```bash
# High cleanup error count
⚠️ High cleanup error count: 15
💡 Check cleanup logs and consider manual cleanup: npm run cleanup:force

# Large cleanup queue
⚠️ Large cleanup queue: 150 items  
💡 Monitor system resources and consider increasing cleanup frequency

# API server unresponsive
❌ Health check error: fetch failed
💡 Check API server logs and consider restart
```

### Recovery Procedures

```bash
# Force cleanup of stuck tasks
npm run cleanup:force

# Restart individual components
npm run stop && npm run launch

# Manual process management
pkill -f "taskmaster-api-server"
pkill -f "task-cleanup-jobs"
npm run launch
```

## 🛠 Advanced Usage

### Custom Launch Configuration

```javascript
// Custom server agent configuration
const launcher = new ServerAgentLauncher();

// Override default settings
launcher.agentId = 'custom-server-agent';
launcher.monitoringInterval = 30000; // 30 seconds

await launcher.launchSystem();
```

### Process Management Integration

```bash
# PM2 integration
pm2 start server-agent-launcher.js --name taskmaster-system

# Systemd service
sudo systemctl start taskmaster-system
sudo systemctl enable taskmaster-system

# Docker container
docker run -d --name taskmaster -p 3001:3001 taskmaster-ai
```

### Load Balancing & Scaling

```bash
# Multiple server agents (advanced)
SERVER_AGENT_ID=server-agent-002 npm run launch
SERVER_AGENT_ID=server-agent-003 npm run launch

# Health check load balancer integration
curl http://localhost:3001/api/health
# Response: {"status":"healthy","service":"TaskMaster API","timestamp":"..."}
```

## 📝 Logging & Debugging

### Server Agent Logs

```bash
# Launch with detailed logging
DEBUG=taskmaster:* npm run launch

# Specific component logs
[API] TaskMaster System Ready for Agent Deployment
[CLEANUP] Starting task cleanup processor...
[HEALTH] System Health Check: API Server: running
```

### Log Files Location

```
.logs/
├── server-agent.log          # Server agent activity
├── api-server.log            # API server requests/responses
├── cleanup/                  # Cleanup job logs
│   ├── cleanup.log          # General cleanup activity
│   └── error.log            # Cleanup errors
└── agents/                   # Individual agent logs
```

### Debug Commands

```bash
# System diagnostic
npm run status | jq '.serverStatus.performance'

# Cleanup job diagnostic  
node task-cleanup-jobs.js --status

# Process diagnostic
ps aux | grep -E "(taskmaster|cleanup)"
netstat -tulpn | grep 3001
```

## 🔗 Integration Points

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
- name: Launch TaskMaster System
  run: npm run launch &
  
- name: Wait for system ready
  run: |
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health; do sleep 2; done'
    
- name: Run tests
  run: npm test
  
- name: Shutdown system
  run: npm run stop
```

### Monitoring System Integration

```bash
# Prometheus metrics endpoint
curl http://localhost:3001/api/server/status | jq '.performance'

# Health check for uptime monitoring
curl -f http://localhost:3001/api/health || exit 1

# Alert webhook integration
COMPLETION_WEBHOOK_URL=https://alerts.example.com/webhook npm run launch
```

### API Gateway Integration

```nginx
# Nginx reverse proxy configuration
upstream taskmaster {
    server localhost:3001;
}

location /taskmaster/ {
    proxy_pass http://taskmaster/;
    proxy_websocket_upgrade;
}
```

## 📚 Best Practices

### Production Deployment

1. **Use process manager**: PM2, systemd, or container orchestration
2. **Set up monitoring**: Health checks, log aggregation, alerting
3. **Configure persistence**: Database backups, log rotation
4. **Security hardening**: Firewall rules, access controls, HTTPS
5. **Resource limits**: Memory, CPU, file descriptor limits

### Development Workflow

1. **Local development**: `npm run launch` for full system testing
2. **Component testing**: Individual component startup for debugging
3. **Status monitoring**: Regular `npm run status` checks
4. **Graceful shutdown**: Always use `npm run stop` for clean shutdown

### Troubleshooting Checklist

- [ ] Check port availability (3001)
- [ ] Verify Node.js version compatibility
- [ ] Confirm all dependencies installed
- [ ] Check file permissions
- [ ] Review system resources (memory, disk)
- [ ] Validate network connectivity
- [ ] Check environment variables

---

## 🎯 Summary

The TaskMaster Server Agent provides comprehensive system orchestration with:

- **Automated Launch**: One-command system deployment
- **Health Monitoring**: Continuous system health tracking  
- **Graceful Management**: Clean startup and shutdown procedures
- **Error Recovery**: Robust error handling and recovery mechanisms
- **Production Ready**: Process management and monitoring integration

**Launch Command**: `npm run launch`  
**Dashboard**: <http://localhost:3001>  
**Status Check**: `npm run status`  
**Shutdown**: `npm run stop`

The server agent ensures reliable TaskMaster system operation with automated lifecycle management and comprehensive monitoring capabilities.

---

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Compatibility**: Node.js 16+, TaskMaster AI 2.0
