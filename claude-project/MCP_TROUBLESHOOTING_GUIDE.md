# MCP Troubleshooting and Best Practices Guide

## Overview

This comprehensive guide provides troubleshooting solutions, best practices, and optimization strategies for the Model Context Protocol (MCP) server ecosystem across all project contexts.

## Quick Diagnosis Tool

### Health Check Script
```bash
#!/bin/bash
# MCP Health Check - Quick diagnosis tool

echo "=== MCP System Health Check ==="
echo "Project Context: $(pwd)"
echo "Date: $(date)"
echo

# Check project context
if [[ "$PWD" == *"taskmaster-ai"* ]]; then
    echo "Context: TaskMaster AI (8 servers expected)"
    EXPECTED_SERVERS=8
elif [[ "$PWD" == *"crewai-studio"* ]]; then
    echo "Context: CrewAI Studio (7 servers expected)"
    EXPECTED_SERVERS=7
elif [[ "$PWD" == *"claude-project"* ]]; then
    echo "Context: Main Project (17 servers expected)"
    EXPECTED_SERVERS=17
else
    echo "Context: Unknown - Please navigate to a valid project directory"
    exit 1
fi

# Check .mcp.json exists
if [ -f ".mcp.json" ]; then
    echo "✅ MCP configuration found"
    SERVER_COUNT=$(jq '.mcpServers | length' .mcp.json)
    echo "Configured servers: $SERVER_COUNT/$EXPECTED_SERVERS"
else
    echo "❌ No .mcp.json found in current directory"
    exit 1
fi

# Check environment variables
echo -e "\n=== Environment Check ==="
if [ -f ".env" ]; then
    echo "✅ .env file found"
    if grep -q "GITHUB_TOKEN" .env; then
        echo "✅ GITHUB_TOKEN configured"
    else
        echo "⚠️  GITHUB_TOKEN missing (required for github MCP)"
    fi
    if grep -q "GOOGLE_API_KEY" .env; then
        echo "✅ GOOGLE_API_KEY configured"
    else
        echo "⚠️  GOOGLE_API_KEY missing (required for task-master-ai MCP)"
    fi
else
    echo "❌ .env file missing - copy .env.example"
fi

# Check dependencies
echo -e "\n=== Dependencies Check ==="
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules directory exists"
    else
        echo "⚠️  node_modules missing - run 'npm install'"
    fi
else
    echo "❌ package.json missing"
fi

echo -e "\n=== Health Check Complete ==="
```

## Common Issues and Solutions

### 1. Server Not Found Errors

**Symptoms:**
- `MCP server not available`
- `Connection refused`
- `Server not responding`

**Diagnosis:**
```bash
# Check current project context
pwd

# Verify MCP configuration
cat .mcp.json | jq '.mcpServers | keys'

# Test server connectivity
./scripts/validate-mcp-setup.sh
```

**Solutions:**
1. **Wrong Project Directory:**
   ```bash
   # Navigate to correct project
   cd /home/darlinghurstlinux/projects/claude-project  # Main project
   cd /home/darlinghurstlinux/projects/claude-project/apps/taskmaster-ai  # TaskMaster
   cd /home/darlinghurstlinux/projects/crewai-studio/CrewAI-Studio  # CrewAI
   ```

2. **Missing Dependencies:**
   ```bash
   npm install
   ```

3. **Server Not Configured:**
   - Verify server exists in `.mcp.json`
   - Check spelling and case sensitivity
   - Ensure server path is correct

### 2. API Authentication Failures

**Symptoms:**
- `401 Unauthorized`
- `403 Forbidden`
- `Invalid API key`

**Diagnosis:**
```bash
# Check environment file
cat .env | grep -E "(GITHUB_TOKEN|GOOGLE_API_KEY)"

# Test API connectivity
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**Solutions:**
1. **Missing API Keys:**
   ```bash
   # Copy example environment
   cp .env.example .env
   
   # Edit with your API keys
   nano .env
   ```

2. **Invalid GitHub Token:**
   - Generate new token at: https://github.com/settings/tokens
   - Ensure `repo` scope is selected
   - Update `.env` file

3. **Invalid Google API Key:**
   - Check Google Cloud Console
   - Verify API key permissions
   - Ensure required APIs are enabled

### 3. Browser Automation Failures

**Symptoms:**
- `Browser failed to launch`
- `Puppeteer/Playwright connection error`
- `Headless browser issues`

**Diagnosis:**
```bash
# Check system dependencies
which chromium-browser
which google-chrome

# Test browser launch
node -e "const puppeteer = require('puppeteer'); puppeteer.launch({headless: true}).then(browser => { console.log('Browser OK'); browser.close(); });"
```

**Solutions:**
1. **WSL/Linux Browser Issues:**
   ```bash
   # Install browser dependencies
   sudo apt update
   sudo apt install -y chromium-browser
   
   # For WSL specifically
   export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

2. **Headless Mode Problems:**
   - Use `--no-sandbox` flag in browser configuration
   - Enable `--disable-dev-shm-usage` for memory issues
   - Configure headless mode properly: `headless: "new"`

3. **Permission Issues:**
   ```bash
   # Fix browser permissions
   sudo chmod +x /usr/bin/chromium-browser
   ```

### 4. Path Resolution Errors

**Symptoms:**
- `File not found`
- `Cannot resolve module`
- `Path does not exist`

**Diagnosis:**
```bash
# Check working directory
pwd

# Verify file paths in MCP configuration
cat .mcp.json | jq '.mcpServers | to_entries[] | select(.value.args[0] | contains("./"))'
```

**Solutions:**
1. **Relative Path Issues:**
   ```bash
   # Ensure you're in the correct project root
   cd /home/darlinghurstlinux/projects/claude-project
   
   # Verify relative paths exist
   ls -la ./mcp-servers/
   ```

2. **Custom Server Paths:**
   - Check custom MCP server paths are correct
   - Verify index.js files exist
   - Ensure proper file permissions

### 5. Memory and Performance Issues

**Symptoms:**
- High RAM usage
- Slow server responses
- System freezing
- `ENOMEM` errors

**Diagnosis:**
```bash
# Check memory usage
free -h

# Check running processes
ps aux | grep -E "(node|chromium|playwright)"

# Monitor resource usage
htop
```

**Solutions:**
1. **Limit Concurrent Servers:**
   ```javascript
   // Don't run both playwright and puppeteer simultaneously
   const testingServer = await checkResourceAvailability() 
     ? 'playwright' 
     : 'puppeteer';
   ```

2. **Resource Management:**
   ```bash
   # Kill existing browser processes
   pkill chromium
   pkill -f "playwright"
   
   # Clear node_modules cache
   npm cache clean --force
   ```

3. **Server Priority:**
   - Start core servers first (filesystem, memory)
   - Add specialized servers as needed
   - Avoid running all 17 servers simultaneously unless necessary

### 6. Network and Connectivity Issues

**Symptoms:**
- `ECONNREFUSED`
- `Timeout errors`
- `Network unreachable`

**Diagnosis:**
```bash
# Test network connectivity
ping 8.8.8.8

# Check port availability
netstat -tuln | grep -E "(8000|3001)"

# Test API endpoints
curl -I https://api.github.com
```

**Solutions:**
1. **Port Conflicts:**
   ```bash
   # Find and kill processes using ports
   sudo lsof -i :8000
   sudo kill -9 <PID>
   ```

2. **Firewall Issues:**
   ```bash
   # Check firewall status
   sudo ufw status
   
   # Allow necessary ports
   sudo ufw allow 8000
   sudo ufw allow 3001
   ```

3. **DNS Resolution:**
   ```bash
   # Flush DNS cache
   sudo systemctl restart systemd-resolved
   ```

## Performance Optimization

### 1. Server Selection Strategy

**Resource-Aware Selection:**
```javascript
const serverPriority = {
  essential: ['filesystem', 'memory'],
  lightweight: ['eslint', 'fetch', 'sequential-thinking'],
  medium: ['github', 'task-master-ai', 'context7'],
  heavyweight: ['playwright', 'puppeteer', 'docker']
};

function selectOptimalServers(taskType, systemResources) {
  const base = serverPriority.essential;
  
  if (systemResources === 'limited') {
    return [...base, ...serverPriority.lightweight.slice(0, 2)];
  }
  
  if (taskType === 'development') {
    return [...base, ...serverPriority.lightweight, ...serverPriority.medium.slice(0, 2)];
  }
  
  if (taskType === 'testing') {
    return [...base, ...serverPriority.heavyweight.slice(0, 1)];
  }
  
  return [...base, ...serverPriority.lightweight, ...serverPriority.medium];
}
```

### 2. Caching and Optimization

**Memory Management:**
```javascript
// Implement connection pooling
const mcpConnectionPool = new Map();

async function getMcpConnection(serverName) {
  if (mcpConnectionPool.has(serverName)) {
    return mcpConnectionPool.get(serverName);
  }
  
  const connection = await initializeMcpServer(serverName);
  mcpConnectionPool.set(serverName, connection);
  return connection;
}

// Cleanup on exit
process.on('exit', () => {
  mcpConnectionPool.forEach((connection, serverName) => {
    connection.close();
  });
});
```

**Request Batching:**
```javascript
// Batch multiple MCP operations
class McpBatcher {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(server, method, args) {
    return new Promise((resolve, reject) => {
      this.queue.push({ server, method, args, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, 5); // Process 5 at a time
    
    const results = await Promise.allSettled(
      batch.map(item => mcpServers[item.server][item.method](...item.args))
    );
    
    batch.forEach((item, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        item.resolve(result.value);
      } else {
        item.reject(result.reason);
      }
    });
    
    this.processing = false;
    if (this.queue.length > 0) this.process();
  }
}
```

### 3. Error Recovery Patterns

**Circuit Breaker Pattern:**
```javascript
class McpCircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async call(server, method, args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker OPEN for ${server}.${method}`);
      }
    }
    
    try {
      const result = await mcpServers[server][method](...args);
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

**Retry with Exponential Backoff:**
```javascript
async function retryMcpOperation(server, method, args, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await mcpServers[server][method](...args);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`MCP ${server}.${method} failed (attempt ${attempt}), retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Best Practices

### 1. Initialization and Configuration

**Best Practice: Lazy Loading**
```javascript
// Don't initialize all servers at startup
const mcpServers = new Proxy({}, {
  get(target, serverName) {
    if (!target[serverName]) {
      target[serverName] = initializeMcpServer(serverName);
    }
    return target[serverName];
  }
});
```

**Best Practice: Configuration Validation**
```javascript
function validateMcpConfiguration() {
  const requiredServers = getRequiredServersForProject();
  const availableServers = Object.keys(mcpConfig.mcpServers);
  const missingServers = requiredServers.filter(s => !availableServers.includes(s));
  
  if (missingServers.length > 0) {
    throw new Error(`Missing required MCP servers: ${missingServers.join(', ')}`);
  }
  
  return true;
}
```

### 2. Security Practices

**API Key Management:**
```javascript
// Never log API keys
const sensitiveKeys = ['GITHUB_TOKEN', 'GOOGLE_API_KEY'];

function sanitizeConfig(config) {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
      sanitized[key] = '***redacted***';
    }
  });
  
  return sanitized;
}

// Log sanitized configuration only
console.log('MCP Config:', sanitizeConfig(mcpConfig));
```

**Access Control:**
```javascript
const agentPermissions = {
  'documentation-agent': ['filesystem', 'memory', 'context7', 'github'],
  'ux-agent': ['accessibility-testing-mcp', 'user-testing-mcp', 'design-system-mcp'],
  'development-agent': ['filesystem', 'memory', 'sequential-thinking', 'eslint', 'github']
};

function validateAccess(agentType, requestedServer) {
  const allowedServers = agentPermissions[agentType] || [];
  if (!allowedServers.includes(requestedServer)) {
    throw new Error(`Agent ${agentType} not authorized to access ${requestedServer}`);
  }
  return true;
}
```

### 3. Monitoring and Logging

**Performance Monitoring:**
```javascript
class McpMonitor {
  constructor() {
    this.metrics = {
      calls: new Map(),
      errors: new Map(),
      latency: new Map()
    };
  }
  
  async wrapCall(server, method, args, originalCall) {
    const key = `${server}.${method}`;
    const startTime = Date.now();
    
    try {
      const result = await originalCall();
      
      // Record success
      this.metrics.calls.set(key, (this.metrics.calls.get(key) || 0) + 1);
      this.metrics.latency.set(key, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Record error
      this.metrics.errors.set(key, (this.metrics.errors.get(key) || 0) + 1);
      throw error;
    }
  }
  
  getMetrics() {
    return {
      calls: Object.fromEntries(this.metrics.calls),
      errors: Object.fromEntries(this.metrics.errors),
      averageLatency: Object.fromEntries(
        Array.from(this.metrics.latency.entries()).map(([key, latency]) => [
          key,
          `${latency}ms`
        ])
      )
    };
  }
}
```

## Maintenance and Updates

### Regular Maintenance Tasks

**Weekly Tasks:**
```bash
#!/bin/bash
# Weekly MCP maintenance script

echo "=== Weekly MCP Maintenance ==="

# Update core MCP packages
npm update @modelcontextprotocol/sdk

# Check for outdated dependencies
npm outdated

# Validate all MCP configurations
./scripts/validate-mcp-setup.sh

# Clear cache
npm cache clean --force

# Check disk space for logs
du -sh ~/.mcp/logs/

echo "=== Maintenance Complete ==="
```

**Monthly Tasks:**
- Review API key usage and rotate if needed
- Update custom MCP servers
- Performance analysis and optimization
- Documentation updates

### Version Management

**Dependency Updates:**
```json
{
  "scripts": {
    "update-mcp": "npm update @modelcontextprotocol/sdk && npm audit fix",
    "check-mcp-health": "./scripts/validate-mcp-setup.sh",
    "mcp-maintenance": "./scripts/weekly-maintenance.sh"
  }
}
```

This troubleshooting guide provides comprehensive solutions for maintaining a healthy MCP ecosystem across all project contexts.