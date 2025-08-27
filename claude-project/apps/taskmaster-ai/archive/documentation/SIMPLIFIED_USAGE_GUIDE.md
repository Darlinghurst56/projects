# TaskMaster AI - Simplified Usage Guide

## 🚀 Quick Start

### 1. Start the System
```bash
# Start API server (in background)
npm start &

# Start main dashboard
npm run dashboard
```

### 2. Main Interface Navigation

**Central Dashboard:**
```bash
npm run dashboard
```
- 📊 Agent Overview - Live agent monitoring
- 🤖 Agent Details - Individual agent control
- 🔄 Workflow Builder - Visual workflow creation
- 📋 Task Router - Task assignment interface
- ⚙️ Agent Manager - Agent lifecycle control

## 🎯 Core Operations

### Agent Management
```bash
# Start all agents
npm run agents:start

# Stop all agents
npm run agents:stop

# Check status
npm run agents:status

# Individual agent control
node simple-agent-manager.js start backend-agent
node simple-agent-manager.js stop backend-agent
```

### Task Operations
```bash
# Create task
task-master add-task --prompt="PROJECT: Web App | SUBPROJECT: Auth - Implement login" --priority="high"

# View tasks
task-master list

# Get next task
task-master next
```

### Quick Views
```bash
# Agent overview (live monitoring)
npm run overview

# Agent details (specific agent)
npm run details

# Workflow builder
npm run workflow
```

## 🔧 System Architecture

### Terminal-Based Interface
- Uses `chalk` for colors
- Uses `boxen` for terminal boxes
- Uses `inquirer` for interactive prompts
- Uses `cli-table3` for data tables

### Agent Independence
- Each agent runs as separate process
- Web access via Puppeteer/Playwright
- File creation capabilities
- Individual LLM models (configurable)
- Tool restrictions per agent role

### Coordination System
- Central API server for task distribution
- Agent registration and status tracking
- Human approval workflows (simplified)
- Real-time monitoring via terminal refresh

## 🎨 Interface Examples

### Agent Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🤖 TaskMaster AI - Agent Overview                            │
│  System Status Monitor | Single User Mode                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┬──────────┬──────┬────────┬────────┬─────────────────┐
│ Agent           │ Status   │ PID  │ Memory │ Uptime │ Current Task    │
├─────────────────┼──────────┼──────┼────────┼────────┼─────────────────┤
│ 🎯 Orchestrator │ ● Running│ 1234 │ 45MB   │ 2:30   │ Idle           │
│ 🎨 Frontend Dev │ ● Running│ 1235 │ 67MB   │ 2:29   │ #25 - UI Work  │
│ 🔧 Backend Dev  │ ○ Stopped│ -    │ -      │ -      │ Idle           │
│ 🚀 DevOps       │ ● Running│ 1236 │ 52MB   │ 2:28   │ #26 - Deploy   │
│ 🔍 QA Specialist│ ● Running│ 1237 │ 38MB   │ 2:27   │ Idle           │
└─────────────────┴──────────┴──────┴────────┴────────┴─────────────────┘

📊 System Health
CPU Load: 1.2 | Memory: 12.5GB / 16GB free

⚡ Quick Actions
Press [S] to start an agent | [X] to stop an agent | [T] to view tasks | [Q] to quit
```

### Agent Details
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🤖 Backend Agent                                              │
│  Manages backend and API development                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

 OVERVIEW   activity   tools   config 

📊 Agent Status
┌─────────┬────────────┐
│ Status  │ ● Running  │
│ PID     │ 1235       │
│ Uptime  │ 2:30:45    │
│ Memory  │ 67MB       │
│ CPU     │ 2.3%       │
└─────────┴────────────┘

📋 Current Task
┌─────────────────────────────────────────────────────────────────┐
│ ID: #25                                                         │
│ Title: Create API endpoints for user authentication             │
│ Status: in-progress                                             │
│ Priority: high                                                  │
└─────────────────────────────────────────────────────────────────┘

⚡ Quick Actions
[P] Pause | [S] Stop | [R] Restart | [L] View Logs

Press [Tab] to switch tabs | [Q] to quit
```

## 🔄 Workflow Builder

### ASCII Workflow Visualization
```
🔄 Workflow Diagram

  🎯 Orchestrator
  └─ Analyze Requirements
    ↓
  🔧 Backend
  └─ Create API Endpoints
    ↓
  🎨 Frontend
  └─ Build UI Components
    ↓
  🔍 QA Specialist
  └─ Write & Run Tests
    ↓
  🚀 DevOps
  └─ Deploy to Staging
```

## 📋 Task Management

### Task Router Interface
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🤖 TaskMaster AI - Human Interface                            │
│  Interactive task routing and agent coordination                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

📊 System Status
● Total Agents: 5
● Available Agents: 3
● Busy Agents: 2

? Select a task to assign: (Use arrow keys)
❯ Task 25 - Create API endpoints... (high)
  Task 26 - Build login form (medium)
  Task 27 - Write unit tests (low)
  ────────────────────────────────────────────────────────────────
  ← Back to main menu
```

## 🎯 Simplified Features

### What's Included
- ✅ Terminal-based interface (no web browser needed)
- ✅ Independent agent processes
- ✅ Real-time monitoring
- ✅ Task assignment and routing
- ✅ Workflow visualization
- ✅ Agent lifecycle management
- ✅ System health monitoring

### What's Simplified
- ❌ Complex web dashboards
- ❌ Multi-user coordination
- ❌ WebSocket real-time updates
- ❌ Complex approval workflows
- ❌ Advanced authentication

## 🚀 Getting Started

1. **Start the system:**
   ```bash
   npm start &
   ```

2. **Launch dashboard:**
   ```bash
   npm run dashboard
   ```

3. **Start some agents:**
   ```bash
   npm run agents:start
   ```

4. **Create a task:**
   ```bash
   task-master add-task --prompt="PROJECT: Test | SUBPROJECT: Demo - Create hello world" --priority="medium"
   ```

5. **Assign task via task router:**
   ```bash
   npm run task-router
   ```

That's it! You now have a fully functional multi-agent system with terminal-based management.

## 🔧 Advanced Usage

### Custom Agent Configuration
Edit agent definitions in `simple-agent-manager.js`:
```javascript
'my-custom-agent': {
    script: 'my-custom-agent.js',
    capabilities: ['custom', 'specialized'],
    mcpTools: ['filesystem', 'custom-tools']
}
```

### Adding New Workflows
Add to `workflow-visualizer.js`:
```javascript
'custom-workflow': {
    name: 'Custom Workflow',
    description: 'My custom process',
    steps: [
        { agent: 'backend-agent', action: 'Custom Action', type: 'development' }
    ]
}
```

### System Monitoring
```bash
# Real-time agent overview
npm run overview

# Individual agent monitoring
npm run details

# Workflow progress tracking
npm run workflow
```

This simplified system gives you all the power of multi-agent coordination with a clean, terminal-based interface perfect for single-user development workflows.