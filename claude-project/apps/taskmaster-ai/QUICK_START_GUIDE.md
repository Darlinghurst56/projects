# TaskMaster AI - Quick Start Guide

Welcome to TaskMaster AI! This guide will get you up and running with the 5-agent system in minutes.

## 🚀 What is TaskMaster AI?

TaskMaster AI is a multi-agent coordination system that helps you manage development tasks efficiently. It features:
- **5 specialized agents** for different development roles
- **Batch operations** for managing 10-20 agents efficiently
- **Automated workflows** for common development tasks
- **Single-user optimization** for home projects

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** package manager
- **Git** (optional, for version control)

## ⚡ Quick Start (2 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the System
```bash
# Option A: Use the smart start script (recommended)
./start-taskmaster.sh

# Option B: Manual start
npm start
```

### 3. Verify Everything is Running
```bash
npm run system:status
```

You should see:
- ✅ API Server: HEALTHY
- ✅ TaskMaster Integration: CONNECTED

### 4. Access the Dashboard
Open your browser: `http://localhost:3001/`

## 🤖 The 5-Agent System

| Agent | Role | Capabilities |
|-------|------|-------------|
| **Orchestrator** | Project Manager | Coordination, human interface, task routing |
| **Frontend** | UI Developer | React, TypeScript, CSS, responsive design |
| **Backend** | API Developer | Node.js, Express, databases, authentication |
| **DevOps** | Infrastructure | Docker, CI/CD, deployment, server management |
| **QA** | Quality Assurance | Testing, validation, debugging, accessibility |

## 🔧 Common Operations

### Daily Workflow
```bash
# Start your day
./start-taskmaster.sh

# Development session with test tasks
npm run workflow:dev

# End of day cleanup
npm run workflow:evening
```

### Agent Management
```bash
# Start all agents
npm run agents:start

# Check agent status
npm run agents:status

# Stop all agents
npm run agents:stop

# Health check
npm run agents:health-check
```

### Task Management
```bash
# Add a new task
task-master add-task --prompt "Create user authentication system"

# Get next task
task-master next

# Set task status
task-master set-status --id=1 --status=in-progress

# View task status
npm run tasks:status
```

## 🎯 Your First Task Assignment

### Method 1: Use the CLI Task Router
```bash
npm run task-router
```
Follow the interactive prompts to assign tasks to agents.

### Method 2: Use the API
```bash
# Create a task suggestion
curl -X POST http://localhost:3001/api/human-approval/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "my-first-task",
    "targetAgent": "frontend-agent",
    "reasoning": "Need to create a responsive navigation component"
  }'
```

### Method 3: Use TaskMaster CLI
```bash
# Add a task
task-master add-task --prompt "Create user authentication system"

# Get next task
task-master next

# Start working on task
task-master set-status --id=1 --status=in-progress

# Complete task
task-master set-status --id=1 --status=done
```

### Method 4: Use Web Interface (Recommended)
1. **Open Agent Management**: `http://localhost:3001/agent-management`
2. **View Available Tasks**: See all pending and in-progress tasks
3. **Assign Tasks**: 
   - Click on a task to populate the assignment form
   - Select an agent from the dropdown
   - Click "Assign Task" to complete assignment
4. **Auto-Assignment**: Click "Auto-Assign" button for automatic task matching
5. **Manual Refresh**: Click "Refresh" button to update data

## 📊 Monitoring & Status

### System Status
```bash
# Complete system overview
npm run agents:system-status

# API server health
npm run system:status

# Agent workload
curl -s http://localhost:3001/api/agents/workload | jq

# Check TaskMaster CLI integration
task-master list
```

### Real-time Monitoring
- **Developer Dashboard**: `http://localhost:3001/developer-interface`
- **Agent Management**: `http://localhost:3001/agent-management`
- **API Health**: `http://localhost:3001/api/health`
- **Agent Status**: `http://localhost:3001/api/agents`
- **Task Status**: `http://localhost:3001/api/tasks`

## 🔄 Batch Operations (For 10-20 Agents)

### Start Agents in Batches
```bash
# Start specific agents
npm run agents:batch-start "frontend-agent,backend-agent,qa-specialist"

# Start all agents (default batch size: 3)
npm run agents:batch-start

# Custom batch size
node app/core/simple-agent-manager.js start-batch "agent1,agent2,agent3,agent4,agent5" 2
```

### Process Multiple Tasks
```bash
# Queue multiple tasks
npm run agents:queue-task task1 frontend-agent "Create navigation" high
npm run agents:queue-task task2 backend-agent "Setup API" high
npm run agents:queue-task task3 qa-specialist "Write tests" medium

# Process all queued tasks
npm run agents:process-queue
```

## 🛠️ Available Workflows

### View Available Workflows
```bash
npm run workflow:list
```

### Pre-built Workflows
- **morning-startup**: Daily system startup
- **development-session**: Full dev workflow with test tasks
- **evening-shutdown**: Clean shutdown sequence
- **quick-test**: Quick system validation

### Run a Workflow
```bash
npm run workflow:run <workflow-name>
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Stop any existing processes
npm run batch:cleanup

# Or kill specific processes
pkill -f taskmaster-api-server.js
```

#### Agent Not Starting
```bash
# Check system status
npm run agents:system-status

# Restart specific agent
node app/core/simple-agent-manager.js restart frontend-agent
```

#### API Server Issues
```bash
# Check if server is running
curl http://localhost:3001/api/health

# Restart server
npm run system:stop
npm run start
```

### Health Checks
```bash
# Full system health check
npm run batch:health-check

# Agent-specific health
npm run agents:health-check
```

## 📁 Project Structure

```
taskmaster-ai/
├── app/
│   ├── core/                    # Core system components
│   │   ├── simple-agent-manager.js    # Agent management
│   │   └── taskmaster-api-server.js   # API server
│   ├── agents/                  # Agent scripts
│   │   ├── orchestrator-agent.js
│   │   ├── frontend-agent.js
│   │   ├── backend-agent.js
│   │   ├── devops-agent.js
│   │   └── qa-specialist-agent.js
│   ├── cli/                     # CLI tools
│   │   ├── batch-operations.js
│   │   └── workflow-manager.js
│   └── human-interface/         # Human interface components
├── .taskmaster/                 # TaskMaster configuration
│   ├── tasks/                   # Task storage
│   └── agents/                  # Agent coordination
└── dashboard/                   # Web dashboard
```

## 🎓 Next Steps

### 1. Create Your First Project
```bash
# Initialize a new project workspace
task-master use-tag my-project

# Add your first task
task-master add-task --prompt "Set up project structure"
```

### 2. Customize Agent Capabilities
Edit `app/core/simple-agent-manager.js` to modify agent capabilities and MCP tools.

### 3. Create Custom Workflows
Add your own workflows to `app/cli/workflow-manager.js`.

### 4. Set Up Task Templates
Create task templates in `.taskmaster/tasks/` for recurring work.

## 🔗 Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run workflow:morning` | Start daily workflow |
| `npm run batch:quick-start` | Quick system startup |
| `npm run batch:health-check` | System health check |
| `npm run agents:status` | Agent status overview |
| `npm run task-router` | Interactive task assignment |
| `npm run batch:dev-workflow` | Full development workflow |
| `npm run workflow:evening` | End-of-day shutdown |

## 📞 Support

### Documentation
- **System Architecture**: `ARCHITECTURE.md`
- **Agent Workflow**: `.taskmaster/docs/agent-workflow.md`
- **API Reference**: `api-design.md`

### Debugging
- **Logs**: Check console output from agent processes
- **Health Checks**: Use `npm run batch:health-check`
- **System Status**: Use `npm run agents:system-status`

---

## 🎉 You're Ready!

Your TaskMaster AI system is now ready for productive development work. Start with the smart start script and begin managing your tasks!

```bash
# Start your first session
./start-taskmaster.sh

# Check everything is working
npm run system:status

# Open dashboard
open http://localhost:3001/
```

Happy coding! 🚀