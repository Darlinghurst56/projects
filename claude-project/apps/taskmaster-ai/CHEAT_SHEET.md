# TaskMaster AI - Cheat Sheet

## 🚀 Essential Commands

### Quick Start
```bash
npm install                    # Install dependencies
./start-taskmaster.sh          # Smart start script
npm run system:status          # Verify system health
```

### Daily Operations
```bash
./start-taskmaster.sh         # Smart start script (recommended)
npm run workflow:dev          # Development workflow
npm run batch:quick-start     # Quick system startup
npm run batch:quick-shutdown  # Quick shutdown
npm run workflow:evening      # End-of-day cleanup
```

### Agent Management
```bash
npm run agents:start          # Start all agents
npm run agents:stop           # Stop all agents
npm run agents:status         # Check agent status
npm run agents:health-check   # Health check all agents
```

### Task Management
```bash
task-master add-task --prompt "Your task description"
task-master next              # Get next task
task-master set-status --id=1 --status=in-progress
task-master set-status --id=1 --status=done
npm run tasks:status          # View task status
```

### Batch Operations
```bash
npm run agents:batch-start    # Start agents in batches
npm run agents:batch-stop     # Stop agents in batches
npm run agents:system-status  # Complete system status
```

## 🤖 The 5 Agents

| Agent | Role | Use For |
|-------|------|---------|
| **orchestrator-agent** | Project Manager | Coordination, planning |
| **frontend-agent** | UI Developer | React, CSS, components |
| **backend-agent** | API Developer | APIs, databases, auth |
| **devops-agent** | Infrastructure | Docker, deployment |
| **qa-specialist** | Quality Assurance | Testing, validation |

## 📊 Quick Status Checks

```bash
# System health
curl http://localhost:3010/api/health

# Agent count
curl http://localhost:3010/api/v2/agents | jq '.count'

# Task status
curl http://localhost:3010/api/tasks
```

## 🔧 URLs

- **Home Dashboard**: `http://localhost:3010/`
- **Developer Dashboard**: `http://localhost:3010/developer-interface`
- **Agent Management**: `http://localhost:3010/agent-management`
- **API Health**: `http://localhost:3010/api/health`
- **Agent Status**: `http://localhost:3010/api/v2/agents`

## 🛠️ Workflows

```bash
npm run workflow:list         # List all workflows
npm run workflow:morning      # morning-startup
npm run workflow:dev          # development-session
npm run workflow:evening      # evening-shutdown
npm run workflow:test         # quick-test
```

## 🚨 Emergency

```bash
npm run batch:cleanup         # Clean up all resources
pkill -f taskmaster-api      # Kill API server
npm run agents:stop          # Stop all agents
```

## 📁 Key Files

- **Agent Manager**: `app/core/simple-agent-manager.js`
- **API Server**: `app/core/taskmaster-api-server.js`
- **Task Router**: `app/human-interface/cli/task-router.js`
- **Batch Ops**: `app/cli/batch-operations.js`
- **Workflows**: `app/cli/workflow-manager.js`

## 💡 Pro Tips

1. **Start with**: `./start-taskmaster.sh`
2. **Monitor with**: `npm run batch:health-check`
3. **Develop with**: `npm run workflow:dev`
4. **End with**: `npm run workflow:evening`
5. **Emergency**: `npm run batch:cleanup`
6. **Use TaskMaster CLI**: `task-master list` for live task data