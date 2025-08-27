# TaskMaster AI - Complete CLI Guide

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- TaskMaster AI system running
- API server active on port 3001

### Basic Setup
```bash
# Navigate to TaskMaster directory
cd /path/to/taskmaster-ai

# Start API server
node taskmaster-api-server.js

# In another terminal, verify health
curl http://localhost:3001/api/health
```

---

## 📋 Core Task Management

### Creating Tasks
```bash
# Basic task creation
task-master add-task --prompt="Your task description" --priority="high"

# Task with PROJECT metadata (required for agent routing)
task-master add-task --prompt="PROJECT: Your Project | SUBPROJECT: Component - Task description with specific requirements" --priority="medium"

# Research-enabled task
task-master add-task --prompt="Research latest React patterns" --research --priority="low"
```

### Viewing Tasks
```bash
# List all tasks
task-master list

# Show specific task details
task-master show 25

# List tasks by status
task-master list --status=pending
task-master list --status=in-progress
task-master list --status=done

# List tasks in specific workspace
task-master use-tag backend-agent
task-master list
```

### Managing Task Status
```bash
# Set task status
task-master set-status --id=25 --status=in-progress
task-master set-status --id=25 --status=done

# Update task with progress
task-master update-task --id=25 --prompt="AGENT: backend-agent - Progress update message"
```

---

## 🤖 Agent System

### Agent Workspaces
```bash
# Switch to different agent workspaces
task-master use-tag orchestrator-agent
task-master use-tag frontend-agent
task-master use-tag backend-agent
task-master use-tag devops-agent
task-master use-tag qa-specialist

# Check current workspace
task-master tags

# Get next task for current agent
task-master next
```

### Agent Roles & Capabilities

#### Orchestrator Agent
- **Role:** Project coordination and human interface
- **Capabilities:** Multi-agent coordination, task routing, conflict resolution
- **Use for:** Project management, task assignment, human approval workflows

#### Frontend Agent
- **Role:** UI/UX development
- **Capabilities:** React, TypeScript, CSS, responsive design, accessibility
- **Use for:** Web interfaces, components, styling, user experience

#### Backend Agent
- **Role:** Server-side development
- **Capabilities:** Node.js, APIs, databases, authentication, server logic
- **Use for:** API development, database work, authentication, server tasks

#### DevOps Agent
- **Role:** Infrastructure and deployment
- **Capabilities:** Docker, CI/CD, deployment, server management
- **Use for:** Deployment, infrastructure, build systems, server operations

#### QA Specialist
- **Role:** Quality assurance and testing
- **Capabilities:** Testing, validation, debugging, accessibility testing
- **Use for:** Test creation, quality assurance, bug fixing, validation

---

## 🔄 Simple Agent Manager

### Starting Agents
```bash
# Start basic agent
node simple-agent-manager.js start backend-agent

# Start with coordination integration
node simple-agent-manager.js start-with-coordination backend-agent

# Check agent status
node simple-agent-manager.js status
node simple-agent-manager.js status backend-agent
```

### Agent Operations
```bash
# Execute task with agent
node simple-agent-manager.js execute-task backend-agent 25 "Task description"

# Create task suggestion
node simple-agent-manager.js suggest-task 25 backend-agent "Agent has right capabilities"

# Get coordination status
node simple-agent-manager.js coordination-status

# Hot-reload agent
node simple-agent-manager.js reload backend-agent

# Stop agent
node simple-agent-manager.js stop backend-agent
```

### Research and File Operations
```bash
# Start research task
node simple-agent-manager.js research frontend-agent "React Server Components"

# Enable file creation
node simple-agent-manager.js enable-files backend-agent ./workspace
```

---

## 🌐 Human Approval API

### Creating Suggestions
```bash
# Create task assignment suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "25",
    "targetAgent": "backend-agent",
    "reasoning": "Agent has matching capabilities",
    "suggestedBy": "orchestrator-agent"
  }'
```

### Managing Approvals
```bash
# Get pending suggestions
curl http://localhost:3001/api/human-approval/suggestions/pending

# Approve suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions/SUGGESTION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Approved - correct agent choice",
    "approvedBy": "human"
  }'

# Reject suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions/SUGGESTION_ID/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Wrong agent for this task type",
    "rejectedBy": "human"
  }'
```

### Approval Statistics
```bash
# Get approval workflow stats
curl http://localhost:3001/api/human-approval/stats

# Get specific suggestion details
curl http://localhost:3001/api/human-approval/suggestions/SUGGESTION_ID
```

---

## 🔧 System Administration

### Server Management
```bash
# Check server health
curl http://localhost:3001/api/health

# Get comprehensive server status
curl http://localhost:3001/api/server/status

# Hot-reload routes
curl -X POST http://localhost:3001/api/admin/reload-routes
```

### Agent Coordination
```bash
# Get coordination status
curl http://localhost:3001/api/coordination/status

# Register agent manually
curl -X POST http://localhost:3001/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "backend-agent",
    "role": "backend"
  }'

# Update agent status
curl -X PUT http://localhost:3001/api/agents/backend-agent/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Task Management API
```bash
# Get all tasks
curl http://localhost:3001/api/tasks

# Get unassigned tasks
curl http://localhost:3001/api/tasks/unassigned

# Assign task to agent
curl -X POST http://localhost:3001/api/tasks/25/assign \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "backend-agent",
    "priority": "high"
  }'

# Mark task as failed
curl -X POST http://localhost:3001/api/tasks/25/fail \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "backend-agent",
    "reason": "Task requirements unclear"
  }'
```

---

## 🛠️ Task Update Wrapper

### Basic Usage
```bash
# Update task progress
node task-update-wrapper.js progress 25 backend-agent "Making good progress"

# Complete task
node task-update-wrapper.js complete 25 backend-agent "Task completed successfully"

# Mark task as failed
node task-update-wrapper.js fail 25 backend-agent "Unable to complete due to missing requirements"

# Custom update
node task-update-wrapper.js update 25 "Custom update message"
```

### Advanced Options
```bash
# Update with research mode
node task-update-wrapper.js update 25 "Research findings" --research

# Update with JSON output
node task-update-wrapper.js update 25 "Status update" --json

# Update with custom timeout
node task-update-wrapper.js update 25 "Update message" --timeout=600000
```

---

## 🔍 Troubleshooting

### Common Issues

#### Task Creation Fails
```bash
# Check task dependencies
task-master fix-dependencies

# Verify PROJECT metadata format
task-master add-task --prompt="PROJECT: Name | SUBPROJECT: Component - Description"
```

#### Agent Registration Issues
```bash
# Check agent status
node simple-agent-manager.js status

# Restart with coordination
node simple-agent-manager.js stop backend-agent
node simple-agent-manager.js start-with-coordination backend-agent
```

#### API Integration Problems
```bash
# Check server health
curl http://localhost:3001/api/health

# Reload routes
curl -X POST http://localhost:3001/api/admin/reload-routes

# Check coordination status
curl http://localhost:3001/api/coordination/status
```

#### Task Update Failures
```bash
# Check for AI response issues (auto-sanitized)
node task-update-wrapper.js update 25 "Simple status update"

# Use direct status change instead
task-master set-status --id=25 --status=in-progress
```

### System Monitoring
```bash
# Check cleanup jobs
curl http://localhost:3001/api/cleanup/status

# Force cleanup for specific task
curl -X POST http://localhost:3001/api/cleanup/force/25 \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'

# Monitor agent workload
curl http://localhost:3001/api/agents/workload
```

---

## 📊 Dashboard Access

### Web Interfaces
- **Main Dashboard:** `http://localhost:3001/`
- **Human Interface:** `http://localhost:3001/human-interface`
- **Agent Registry:** Access through API endpoints

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to agent updates
ws.send(JSON.stringify({
  type: 'subscribe_agents'
}));

// Subscribe to task updates
ws.send(JSON.stringify({
  type: 'subscribe_tasks'
}));
```

---

## 🔐 Security Considerations

### Agent Tool Restrictions
- Each agent has specific MCP tool access
- Tool usage is validated against agent permissions
- Violations result in automatic task reversion

### API Security
- Input validation on all endpoints
- Agent role enforcement
- Audit logging for coordination actions

### Best Practices
- Always use PROJECT metadata for task routing
- Verify agent capabilities before assignment
- Monitor coordination status regularly
- Use human approval for critical tasks

---

## 📈 Performance Optimization

### Response Times
- Task creation: ~2-3 seconds (with AI)
- Agent registration: <50ms
- API calls: <200ms average
- Task assignment: <300ms

### Scaling Considerations
- Current capacity: 5 agents, 50 concurrent tasks
- Scale target: 20 agents, 200 concurrent tasks
- Bottlenecks: AI model calls, file I/O

### Monitoring
```bash
# Check performance metrics
curl http://localhost:3001/api/server/status

# Monitor memory usage
curl http://localhost:3001/api/server/status | jq '.performance.memory'

# Check WebSocket connections
curl http://localhost:3001/api/server/status | jq '.connectivity.webSocket'
```

---

## 🎯 Example Workflows

### Full E2E Workflow
```bash
# 1. Create task
task-master add-task --prompt="PROJECT: Web App | SUBPROJECT: Authentication - Implement OAuth login" --priority="high"

# 2. Create suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions \
  -H "Content-Type: application/json" \
  -d '{"taskId": "26", "targetAgent": "backend-agent", "reasoning": "OAuth implementation requires backend skills"}'

# 3. Approve suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions/SUGGESTION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"comment": "Approved", "approvedBy": "human"}'

# 4. Execute task
node simple-agent-manager.js execute-task backend-agent 26 "OAuth implementation"

# 5. Complete task
task-master set-status --id=26 --status=done
```

### Agent Coordination Test
```bash
# Start orchestrator
node simple-agent-manager.js start-with-coordination orchestrator-agent

# Start backend agent
node simple-agent-manager.js start-with-coordination backend-agent

# Check coordination status
node simple-agent-manager.js coordination-status

# Create and assign task
node simple-agent-manager.js suggest-task 27 backend-agent "Task requires backend skills"
```

---

## 📚 Additional Resources

### Configuration Files
- `.taskmaster/tasks/tasks.json` - Task database
- `.taskmaster/agents/agents.json` - Agent registry
- `.taskmaster/agents/coordination.json` - Coordination state

### Log Files
- `logs/` - Application logs
- Agent output in terminal sessions
- WebSocket connection logs

### API Documentation
- OpenAPI spec available at runtime
- All endpoints documented with examples
- WebSocket message format specifications

---

*This guide covers the complete TaskMaster AI system as of 2025-07-15. For the latest updates and features, check the system documentation and API endpoints.*