# QA Agent: MVP-First Specification

## 🎯 **MVP Goal: Working QA Agent in 2 Weeks**

**Audience**: 1 user  
**Priority**: Ship fast, reuse everything, avoid custom code  
**Success Metric**: Automated testing pipeline that actually works

## 🛠️ **MVP Architecture: 100% Commercial Tools**

### **Core Stack (All Existing Solutions)**
```yaml
qa_agent_mvp:
  orchestrator_control: "TaskMaster existing coordination system"
  testing_engine: "Playwright (already installed)"
  code_quality: "Existing MCP tools (Semgrep, SonarQube)"
  monitoring: "Simple file-based logging + existing TaskMaster reporting"
  
mvp_capabilities:
  - "Run existing Playwright tests automatically"
  - "Scan code with Semgrep MCP for security issues"
  - "Report results back to Orchestrator via existing TaskMaster API"
  - "Basic scheduling (hourly/daily via cron)"
```

## 🚀 **Implementation Plan: Maximum Reuse**

### **Week 1: Use What Exists**
```bash
# 1. Fix existing Playwright setup (you already have this)
npm install @playwright/test --save-dev
npx playwright install

# 2. Add Semgrep MCP (hosted, no custom code needed)
# Add to .cursor/mcp.json:
{
  "mcpServers": {
    "semgrep": {
      "url": "https://mcp.semgrep.ai/sse"
    }
  }
}

# 3. Create simple test runner script (reuse TaskMaster patterns)
# File: qa-agent-runner.js (30 lines max)
```

### **Week 2: Basic Integration**
```bash
# 1. Connect to existing TaskMaster coordination
# 2. Add simple reporting (reuse existing TaskMaster reporting)
# 3. Add basic scheduling (Windows Task Scheduler or cron)
```

## 📋 **MVP Tool Integration (All Commercial/Existing)**

### **1. Testing: Playwright (Already Have)**
```javascript
// File: run-tests.js (simple wrapper)
const { exec } = require('child_process');

async function runTests() {
  return new Promise((resolve, reject) => {
    exec('npx playwright test', (error, stdout, stderr) => {
      if (error) reject(error);
      resolve({ stdout, stderr });
    });
  });
}
```

### **2. Security: Semgrep MCP (Hosted Service)**
```json
// .cursor/mcp.json (no coding required)
{
  "mcpServers": {
    "semgrep": {
      "url": "https://mcp.semgrep.ai/sse"
    }
  }
}
```

### **3. Reporting: TaskMaster API (Already Exists)**
```javascript
// File: report-results.js (reuse existing TaskMaster patterns)
const taskmaster = require('./taskmaster-api-server.js');

function reportToOrchestrator(results) {
  // Use existing TaskMaster agent communication
  taskmaster.reportTask({
    agent: 'qa-agent',
    status: results.passed ? 'success' : 'failed',
    details: results
  });
}
```

### **4. Monitoring: File-Based + Existing Logging**
```javascript
// File: simple-monitor.js (reuse existing patterns)
const fs = require('fs');

function logHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'running',
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  fs.appendFileSync('.taskmaster/qa-agent.log', JSON.stringify(health) + '\n');
}
```

## 🎯 **MVP Features (Minimal Custom Code)**

### **Core Capabilities**
1. **Automated Test Execution**: 
   - Wrapper around existing Playwright tests
   - Use existing test files (no new test creation)

2. **Security Scanning**: 
   - Semgrep MCP (hosted service, zero setup)
   - Results piped to TaskMaster reporting

3. **Basic Orchestration**:
   - Integrates with existing TaskMaster agent system
   - Uses existing priority/coordination logic

4. **Simple Monitoring**:
   - File-based logging (no databases)
   - Basic health checks (CPU/memory via Node.js built-ins)

### **MVP Workflow**
```yaml
simple_workflow:
  trigger: "Scheduled (Windows Task Scheduler) or manual"
  steps:
    1: "Check if Orchestrator allows execution (existing API)"
    2: "Run Playwright tests (existing command)"
    3: "Run Semgrep scan (MCP call)"
    4: "Aggregate results (simple JSON)"
    5: "Report to Orchestrator (existing TaskMaster API)"
    6: "Log health status (append to file)"
```

## 📊 **MVP Monitoring (Reuse Existing)**

### **Health Checks (Built-in Node.js)**
```javascript
// File: health-check.js (10 lines)
const health = {
  timestamp: Date.now(),
  memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  uptime_seconds: Math.round(process.uptime()),
  status: 'running'
};
```

### **Results Dashboard (Reuse TaskMaster UI)**
- Use existing TaskMaster web interface
- Agent appears as "qa-agent" in existing agent list
- Results show up in existing task/agent reporting

## 🏗️ **MVP File Structure (Minimal)**

```
.taskmaster/agents/qa-agent/
├── package.json              # Minimal dependencies
├── qa-runner.js              # Main runner (50 lines max)
├── health-monitor.js         # Basic monitoring (20 lines)
├── report-results.js         # TaskMaster integration (30 lines)
└── config.json              # Simple configuration
```

## ⚡ **Implementation Shortcuts**

### **1. Use Existing TaskMaster Patterns**
- Copy agent coordination from existing agents
- Reuse existing reporting mechanisms
- Use existing configuration patterns

### **2. Leverage Hosted Services**
- Semgrep MCP (hosted): `https://mcp.semgrep.ai/sse`
- Playwright (local): Already installed and working
- TaskMaster (local): Already running

### **3. Simple Scheduling**
```bash
# Windows Task Scheduler (GUI setup, 2 minutes)
# OR simple cron-like with node-cron (1 dependency)
npm install node-cron
```

## 🎯 **MVP Success Criteria**

1. ✅ QA Agent appears in TaskMaster agent list
2. ✅ Runs Playwright tests automatically  
3. ✅ Scans code for security issues via Semgrep
4. ✅ Reports results to Orchestrator
5. ✅ Basic health monitoring (alive/dead)
6. ✅ Works for 1 user without manual intervention

## 📝 **MVP Implementation Estimate**

- **Day 1-2**: Fix Playwright setup, create simple runner
- **Day 3-4**: Add Semgrep MCP integration
- **Day 5-6**: Connect to TaskMaster coordination
- **Day 7**: Add basic monitoring and scheduling
- **Day 8-10**: Testing and refinement

**Total Custom Code**: ~150 lines maximum  
**External Dependencies**: Playwright, Semgrep MCP, TaskMaster (all existing)

## 🚀 **Post-MVP Expansion (Only If Needed)**

If the MVP works well for the 1 user:
1. Add more MCP tools (SonarQube, Sentry)
2. Enhanced reporting and analytics
3. More sophisticated scheduling
4. Better error handling and recovery

**Key Principle**: Don't build anything until the MVP proves value! 🎯 