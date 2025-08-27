# Server Instance Enforcement System

**Task 2.1 - Server Agent Implementation**

## Overview

The Server Instance Enforcement System prevents multiple server instances from running on the same port, eliminating coordination conflicts and resource competition in development environments.

## Key Features

### ✅ Single Instance Enforcement
- **Process Detection**: Uses `pgrep` and `lsof` to detect existing server processes
- **Port Validation**: Checks port availability before server startup
- **Conflict Resolution**: Provides automatic and manual conflict resolution options
- **Startup Blocking**: Prevents new servers from starting when conflicts exist

### ✅ Server Instance Tracking
- **Real-time Monitoring**: Tracks all known server instances with PID, port, status
- **State Management**: Maintains server lifecycle states (starting/running/stopping/stopped)
- **Process Information**: Stores command, start time, and server type details

### ✅ Graceful Conflict Resolution
- **Automatic Termination**: Can automatically kill conflicting processes with grace periods
- **Manual Override**: Force start options for development scenarios
- **Port Alternatives**: Suggests alternative ports when conflicts occur

## System Components

### 1. ServerInstanceManager
**Location**: `src/server/ServerInstanceManager.js`

Core engine for server detection and management:

```javascript
import { serverInstanceManager } from './src/server/ServerInstanceManager.js';

// Check if port is available
const portCheck = await serverInstanceManager.isPortInUse(5173);

// Find running server processes
const servers = await serverInstanceManager.findServerProcesses();

// Register a new server
serverInstanceManager.registerServer(5173, {
  pid: process.pid,
  serverType: 'vite-dev',
  command: 'npm run dev'
});
```

#### Key Methods:
- `isPortInUse(port)` - Check port availability with process details
- `findServerProcesses(patterns)` - Find servers by process name patterns
- `validateServerStartup(port, serverType)` - Comprehensive startup validation
- `killServerProcess(pid, gracePeriod)` - Graceful process termination
- `performEnvironmentCheck()` - Full system environment analysis

### 2. ServerStartupValidator
**Location**: `src/server/ServerStartupValidator.js`

High-level validation and blocking system:

```javascript
import { validateServerStartup } from './src/server/ServerStartupValidator.js';

try {
  // Validate and block if conflicts exist
  const validation = await validateServerStartup(5173, 'vite-dev');
  console.log('✅ Server can start safely');
} catch (error) {
  console.error('❌ Server startup blocked:', error.message);
}
```

#### Key Features:
- **Automatic Blocking**: Throws `ServerStartupBlockedError` when conflicts exist
- **Validation History**: Tracks all validation attempts for diagnostics
- **Force Override**: Allows bypassing validation in development scenarios
- **Environment Integration**: Optional comprehensive environment checks

### 3. Command Line Tools
**Location**: `scripts/validate-server-startup.js`

Comprehensive CLI for server validation:

```bash
# Validate specific port and server type
npm run validate:dev
node scripts/validate-server-startup.js validate 5173 vite-dev

# Quick port availability check
npm run validate:port 3000
node scripts/validate-server-startup.js check-port 3000

# Full environment analysis
npm run validate:env
node scripts/validate-server-startup.js environment

# Force kill processes on port (DANGEROUS)
npm run kill:port 5173 --confirm
node scripts/validate-server-startup.js kill-port 5173 --confirm

# List tracked servers
npm run server:list
node scripts/validate-server-startup.js list-servers
```

### 4. Safe Development Server Starter
**Location**: `scripts/safe-dev-start.js`

Integrated safe startup for development servers:

```bash
# Safe startup with validation
npm run dev:safe

# Start on different port
npm run dev:safe --port 3000

# Force start and resolve conflicts
npm run dev:safe --force --kill-conflicts

# Verbose mode with full environment check
npm run dev:safe --verbose
```

## Usage Scenarios

### Scenario 1: Normal Development
```bash
# Start development server safely
npm run dev:safe
```
**Result**: ✅ Validates port 5173, starts Vite if clear

### Scenario 2: Port Conflict
```bash
# Try to start when port is busy
npm run dev:safe
```
**Result**: ❌ Blocks startup, shows conflict details, offers resolution options

### Scenario 3: Automatic Conflict Resolution
```bash
# Force start and kill conflicts
npm run dev:safe --kill-conflicts
```
**Result**: 🛑 Kills conflicting processes, then starts Vite safely

### Scenario 4: Environment Analysis
```bash
# Check entire development environment
npm run validate:env
```
**Result**: 📊 Shows all ports, processes, recommendations

## Integration with Package.json

The system integrates seamlessly with npm scripts:

```json
{
  "scripts": {
    "dev": "npm run validate:dev && vite",           // Validate then start
    "dev:force": "vite",                             // Direct start (bypass validation)
    "dev:safe": "node scripts/safe-dev-start.js",   // Integrated safe start
    "validate:dev": "node scripts/validate-server-startup.js validate 5173 vite-dev",
    "validate:env": "node scripts/validate-server-startup.js environment",
    "kill:port": "node scripts/validate-server-startup.js kill-port"
  }
}
```

## Error Handling

### ServerStartupBlockedError
Thrown when server startup is blocked due to conflicts:

```javascript
try {
  await validateServerStartup(3000, 'express');
} catch (error) {
  if (error.name === 'ServerStartupBlockedError') {
    console.log('Port:', error.port);
    console.log('Server Type:', error.serverType);
    console.log('Conflicts:', error.conflicts);
    
    // Resolution options
    console.log('1. Use --force to override');
    console.log('2. Use --kill-conflicts to resolve');
    console.log('3. Use different port');
  }
}
```

## Security Considerations

### Process Termination
- **Grace Period**: Always attempts SIGTERM before SIGKILL
- **Confirmation Required**: Force kill operations require explicit confirmation
- **Development Only**: Designed for development environments, not production

### Port Scanning
- **Local Only**: Only scans localhost/127.0.0.1 interfaces
- **Common Ports**: Focuses on common development ports (3000, 5173, 8080, etc.)
- **No Network Scanning**: Does not scan external network interfaces

## Monitoring and Diagnostics

### Server Tracking
The system maintains real-time tracking of all server instances:

```javascript
// Get all tracked servers
const servers = serverInstanceManager.getAllTrackedServers();

servers.forEach(server => {
  console.log(`Port ${server.port}: ${server.serverType} (${server.status})`);
  console.log(`PID: ${server.pid}, Started: ${server.startTime}`);
});
```

### Validation History
All validation attempts are logged for diagnostics:

```javascript
const validator = new ServerStartupValidator();
const history = validator.getValidationHistory();

history.forEach(validation => {
  console.log(`${validation.timestamp}: ${validation.serverType} on ${validation.port}`);
  console.log(`Result: ${validation.canStart ? 'ALLOWED' : 'BLOCKED'}`);
});
```

## Configuration

### Default Ports
```javascript
const defaultPorts = {
  vite: 5173,
  express: 3000,
  dashboard: 8080
};
```

### Process Patterns
```javascript
const serverPatterns = [
  'vite',           // Vite development server
  'node.*dev',      // Node.js development servers
  'npm.*dev',       // npm run dev processes
  'yarn.*dev'       // yarn dev processes
];
```

### Grace Periods
```javascript
const gracePeriods = {
  default: 5000,    // 5 seconds for SIGTERM -> SIGKILL
  quick: 3000,      // 3 seconds for urgent termination
  gentle: 10000     // 10 seconds for careful shutdown
};
```

## Testing

### Manual Testing
```bash
# 1. Start a server on port 3000
npm run dev:force --port 3000 &

# 2. Try to start another server on same port
npm run dev:safe --port 3000
# Should be blocked

# 3. Check environment
npm run validate:env
# Should show port 3000 in use

# 4. Force resolution
npm run dev:safe --port 3000 --kill-conflicts
# Should kill existing and start new
```

### Automated Testing
```bash
# Run validation tests
npm run test:validation

# Run port conflict tests
npm run test:conflicts

# Run integration tests
npm run test:integration
```

## Troubleshooting

### Common Issues

**Issue**: Port appears available but server won't start
```bash
# Check for zombie processes
npm run validate:env
# Look for orphaned processes without port binding
```

**Issue**: Validation fails but no conflicts visible
```bash
# Check with verbose mode
npm run dev:safe --verbose
# Review full environment report
```

**Issue**: Force kill doesn't work
```bash
# Check process permissions
ps aux | grep <pid>
# May need sudo for system processes
```

### Recovery Procedures

**Clean Environment Reset**:
```bash
# 1. Kill all development servers
pkill -f "vite|npm.*dev|yarn.*dev"

# 2. Check for orphaned processes
npm run validate:env

# 3. Clear tracked servers
npm run server:list
# (Manual cleanup if needed)

# 4. Start fresh
npm run dev:safe
```

## Future Enhancements

### Planned Features
- [ ] **Docker Integration**: Detect containerized servers
- [ ] **Network Interface Scanning**: Support for non-localhost interfaces
- [ ] **Configuration Files**: External configuration for ports and patterns
- [ ] **Health Checks**: Verify server responsiveness after startup
- [ ] **Log Integration**: Integration with server logs for status detection
- [ ] **API Endpoints**: REST API for server management
- [ ] **Dashboard Widget**: Real-time server status in dashboard

### Potential Improvements
- [ ] **Process Tree Analysis**: Detect parent-child server relationships
- [ ] **Resource Monitoring**: Track CPU/memory usage of server processes
- [ ] **Automatic Port Selection**: Suggest optimal available ports
- [ ] **Conflict Prediction**: Predict conflicts before they occur
- [ ] **Integration with PM2**: Support for PM2 process manager

---

## Summary

The Server Instance Enforcement System provides comprehensive protection against server conflicts in development environments. It combines:

- **Proactive Detection** using system tools (`pgrep`, `lsof`)
- **Intelligent Validation** with detailed conflict analysis  
- **Flexible Resolution** with automatic and manual options
- **Seamless Integration** with existing development workflows
- **Comprehensive Tooling** for diagnostics and management

This system ensures that the **Server Agent** can enforce single-instance rules and prevent the coordination conflicts that were identified in the original requirements.