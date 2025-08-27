# TaskMaster Agent System - Complete Documentation

## System Overview

The TaskMaster Agent System is a multi-agent coordination platform that enables autonomous agents to collaborate on tasks within a structured workflow. The system combines TaskMaster CLI task management with a dashboard API for real-time coordination and monitoring.

## Architecture Components

### 1. Core Infrastructure

**TaskMaster CLI (`task-master`)**

- Local CLI tool for task management
- Manages tasks in `.taskmaster/tasks/tasks.json`
- Supports role-based task assignment via tags
- Commands: `list`, `next`, `show`, `set-status`, `update-task`, etc.

**Dashboard API Server (`dashboard/simple-api-server.js`)**

- Runs on `http://localhost:3001`
- Bridges TaskMaster data with web dashboard
- Handles agent registration and coordination
- Provides REST endpoints for task and agent management

**Agent Storage System (`dashboard/agent-storage.js`)**

- Persistent agent tracking in `.taskmaster/agents/live-agents.json`
- Heartbeat monitoring and cleanup
- Agent lifecycle management

### 2. Agent Types

**Background Agents (Autonomous)**

- `family-dashboard-qa-agent.js` - House AI family dashboard testing
- `background-ux-agent.js` - UX/UI improvements and testing
- `background-qa-agent.js` - General QA testing and validation
- `background-integration-agent.js` - API integration and coordination

**Agent Roles**

- `qa-specialist` - Testing, validation, quality assurance
- `ui-developer` - Frontend development, UX/UI work
- `integration-specialist` - API integration, system coordination
- `backend-agent` - Server-side development
- `devops-agent` - Infrastructure and deployment

### 3. Dashboard Interface

**Live Agent Dashboard (`dashboard/live-agent-dashboard.html`)**

- Real-time agent monitoring
- Task assignment interface
- Agent control hub with toggle switches
- System metrics and activity tracking

**Agent Dashboard (`dashboard/agent-dashboard.html`)**

- TaskMaster coordination interface
- Task assignment and workflow management
- Agent registry and status display

## Multi-Agent Setup and Operations

### Starting Multiple Background Agents

**Method 1: Manual CLI (Development)**

```bash
# Terminal 1 - Start dashboard API server
cd dashboard
node simple-api-server.js

# Terminal 2 - Family Dashboard QA Agent
node family-dashboard-qa-agent.js

# Terminal 3 - UX Specialist Agent
node background-ux-agent.js

# Terminal 4 - Integration Agent
node background-integration-agent.js
```

**Method 2: Process Manager (Production)**

```bash
# Install PM2 process manager
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [
    { name: 'dashboard-api', script: 'dashboard/simple-api-server.js' },
    { name: 'family-qa-agent', script: 'family-dashboard-qa-agent.js' },
    { name: 'ux-agent', script: 'background-ux-agent.js' },
    { name: 'integration-agent', script: 'background-integration-agent.js' }
  ]
}

# Start all agents
pm2 start ecosystem.config.js
pm2 monit  # Monitor all processes
```

**Method 3: Shell Script (Simple)**

```bash
#!/bin/bash
# start-agents.sh
cd dashboard && node simple-api-server.js &
sleep 2
node family-dashboard-qa-agent.js &
node background-ux-agent.js &
node background-integration-agent.js &
wait
```

### Agent Coordination Protocol

**1. Agent Registration**

```javascript
// Each agent registers with the dashboard
const registrationData = {
    agentId: 'family-dashboard-qa-001',
    role: 'qa-specialist',
    capabilities: ['family-dashboard-testing', 'authentication-testing'],
    status: 'idle'
};

await fetch('http://localhost:3001/api/agents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
});
```

**2. Task Discovery**

```javascript
// Agents poll for tasks matching their role
const response = await fetch('http://localhost:3001/api/taskmaster/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        tag: 'qa-specialist',
        include_subtasks: true 
    })
});
```

**3. Task Execution**

```javascript
// Claim task via TaskMaster CLI
await execAsync(`task-master set-status --id=${task.id} --status=in-progress`);

// Execute task work
const result = await executeTask(task);

// Report progress via TaskMaster CLI
await execAsync(`task-master update-task --id=${task.id} --prompt="Agent completed work..."`);

// Mark complete
await execAsync(`task-master set-status --id=${task.id} --status=done`);
```

## TaskMaster Integration

### Essential Commands

**Task Management**

```bash
# View all tasks
task-master list

# Get next available task
task-master next

# View task details
task-master show 19

# Claim a task
task-master set-status --id=19 --status=in-progress

# Update task with progress
task-master update-task --id=19 --prompt="Implementation notes..."

# Complete task
task-master set-status --id=19 --status=done
```

**Role-Based Task Assignment**

```bash
# List available agent roles
task-master tags

# Switch to specific role context
task-master use-tag qa-specialist

# View role-specific tasks
task-master list --status=pending
```

### Critical ID Format Rules

**Task IDs vs Subtask IDs**

- Task IDs: `19`, `20`, `21` (simple numbers)
- Subtask IDs: `19.1`, `19.2`, `20.1` (parentId.subtaskId format)

**Correct Command Usage**

```bash
# ✅ Correct for main tasks
task-master set-status --id=19 --status=done
task-master update-task --id=19 --prompt="Progress update"

# ❌ Incorrect - will fail with subtask format error
task-master update-subtask --id=19 --prompt="Update"

# ✅ Correct for subtasks
task-master update-subtask --id=19.1 --prompt="Subtask update"
```

## API Endpoints

### Agent Management

```
POST /api/agents/register          # Register new agent
POST /api/agents/{id}/heartbeat    # Send heartbeat
PUT  /api/agents/{id}/status       # Update agent status
GET  /api/agents/dashboard/summary # Get system overview
```

### Task Management

```
POST /api/taskmaster/tasks         # Get tasks by tag
GET  /api/taskmaster/agents/status # Get agent status
GET  /api/tasks?status=pending     # Get pending tasks
POST /api/tasks/{id}/claim         # Claim task for agent
```

### Dashboard Integration

```
GET  /api/health                   # System health check
GET  /dashboard/live-agent-dashboard.html  # Live agent monitoring
GET  /dashboard/agent-dashboard.html       # Task coordination interface
```

## File Structure

```
project/
├── .taskmaster/
│   ├── tasks/
│   │   ├── tasks.json              # Main task database
│   │   └── task_*.txt              # Individual task files
│   ├── agents/
│   │   └── live-agents.json        # Agent registration data
│   └── config.json                 # TaskMaster configuration
├── dashboard/
│   ├── simple-api-server.js        # Main API server
│   ├── agent-storage.js            # Agent persistence system
│   ├── live-agent-dashboard.html   # Live monitoring interface
│   └── agent-dashboard.html        # Task coordination interface
├── family-dashboard-qa-agent.js    # Family dashboard QA agent
├── background-ux-agent.js          # UX specialist agent
├── background-qa-agent.js          # General QA agent
├── background-integration-agent.js # Integration specialist agent
└── TASKMASTER-AGENT-SYSTEM-DOCUMENTATION.md  # This file
```

## Configuration

### Environment Setup

**Required Dependencies**

```bash
npm install express cors
```

**TaskMaster Configuration (`.taskmaster/config.json`)**

```json
{
  "aiModels": {
    "mainModel": "claude-3-5-sonnet",
    "provider": "anthropic"
  }
}
```

**MCP Configuration (`.mcp.json`)**

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"]
    }
  }
}
```

**Note**: The MCP configuration uses `task-master-ai` as the package name for the MCP server, while the CLI commands use `task-master` directly. This is correct as they serve different purposes:

- `task-master-ai` is the MCP server package
- `task-master` is the CLI command installed globally or locally

## Monitoring and Debugging

### Agent Status Monitoring

**Via Dashboard**

- Live Agent Dashboard: `http://localhost:3001/live-agent-dashboard.html`
- Shows real-time agent status, task completion, and system metrics

**Via CLI**

```bash
# Check agent storage
cat .taskmaster/agents/live-agents.json

# Monitor agent logs
tail -f family-dashboard-qa-agent.log

# Check TaskMaster task status
task-master list
```

### Common Issues and Solutions

**Agent Not Appearing in Dashboard**

1. Check agent registration in `.taskmaster/agents/live-agents.json`
2. Verify dashboard API server is running on port 3001
3. Check agent console for registration errors

**Tasks Not Being Claimed**

1. Verify task status is `pending` in TaskMaster
2. Check agent role matches task tag requirements
3. Ensure task filtering logic matches task content

**Subtask ID Format Errors**

```bash
# ❌ This will fail
task-master update-subtask --id=19 --prompt="Update"

# ✅ Use this instead
task-master update-task --id=19 --prompt="Update"
```

## Security Considerations

**Agent Authentication**

- Agents register with unique IDs
- Heartbeat system prevents zombie agents
- Agent capabilities are validated during registration

**Task Isolation**

- Role-based task assignment prevents unauthorized access
- Each agent can only claim tasks matching their role
- Task status changes are audited via TaskMaster

**API Security**

- CORS enabled for dashboard access
- No authentication required for local development
- Production deployments should add authentication

## Scaling and Performance

### Horizontal Scaling

**Agent Scaling**

- Multiple agents of same role can run simultaneously
- Task claiming prevents duplicate work
- Agent heartbeat system manages agent lifecycle

**Database Scaling**

- TaskMaster uses file-based storage (tasks.json)
- Agent data stored in separate live-agents.json
- Consider database backend for high-volume deployments

### Performance Optimization

**Task Polling**

- Agents poll every 45 seconds by default
- Configurable via `TASK_CHECK_INTERVAL`
- Consider WebSocket for real-time updates

**Memory Management**

- Agents clean up completed tasks from memory
- Heartbeat system removes inactive agents
- Dashboard API has built-in cleanup intervals

## Development Workflow

### Adding New Agent Types

1. **Create Agent File**

```javascript
// new-agent.js
class NewAgent {
    constructor() {
        this.agentId = 'new-agent-001';
        this.role = 'new-specialist';
        this.capabilities = ['new-capability'];
    }
    
    async executeTask(task) {
        // Implement task execution logic
    }
}
```

2. **Register Agent Role**

```bash
# Add to TaskMaster role system
task-master use-tag --name=new-specialist
```

3. **Update Dashboard**

- Add agent to ecosystem.config.js
- Update dashboard filtering for new role

### Testing New Features

**Unit Testing**

```bash
# Test individual agent functionality
node new-agent.js --test-mode

# Test dashboard API endpoints
curl http://localhost:3001/api/agents/dashboard/summary
```

**Integration Testing**

```bash
# Test full workflow
task-master add-task --prompt="Test task for new agent"
# Start agent and verify it claims task
# Verify task completion in dashboard
```

## Deployment

### Local Development

```bash
# Start development environment
npm run dev:agents  # Start all agents in development mode
npm run dev:dashboard  # Start dashboard with hot reload
```

### Production Deployment

```bash
# Use PM2 for process management
pm2 start ecosystem.config.js --env production
pm2 save  # Save current process list
pm2 startup  # Generate startup script
```

### Docker Deployment

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm install -g pm2
CMD ["pm2-runtime", "ecosystem.config.js"]
```

## Support and Troubleshooting

### Log Files

- Agent logs: Console output with timestamps
- TaskMaster logs: `.taskmaster/logs/`
- Dashboard logs: Express server console

### Health Checks

```bash
# Check system health
curl http://localhost:3001/api/health

# Check agent status
curl http://localhost:3001/api/agents/dashboard/summary

# Check TaskMaster
task-master list
```

### Contact and Support

- Documentation: This file
- Issue tracking: Project repository
- Agent development: Follow patterns in existing agents

---

*Last updated: July 2025*
*Version: 2.0*
*Status: Production Ready*
