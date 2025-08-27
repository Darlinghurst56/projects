# TaskMaster AI - Developer Interface

A comprehensive developer-friendly interface for the TaskMaster AI multi-agent coordination system, featuring interactive CLI tools, web dashboard, and Claude integration points.

## 🚀 Quick Start

### CLI Tools

```bash
# Interactive task routing
npm run task-router

# Agent management interface  
npm run agent-manager

# Or use directly
node developer-interface/cli/task-router.js
node developer-interface/cli/agent-manager.js
```

### Web Dashboard

```bash
# Start the API server (includes human interface)
npm start

# Access enhanced dashboard
open http://localhost:3001/developer-interface
```

## 🎯 Features

### 1. Interactive CLI Task Router

**File**: `developer-interface/cli/task-router.js`

**Features**:
- 📋 Visual task selection with priority indicators
- 🤖 Agent capability matching and recommendations
- 💭 Reasoning prompts for assignment decisions
- 🔔 Developer approval workflow integration
- ✅ Assignment confirmation with summary

**Usage**:
```bash
npm run task-router
```

**Navigation**:
- Select tasks from pending queue
- Choose appropriate agents with status indicators
- Provide reasoning for assignment decisions
- Review and approve/reject orchestrator suggestions

### 2. Agent Manager CLI

**File**: `developer-interface/cli/agent-manager.js`

**Features**:
- 👀 Comprehensive agent overview with real-time status
- 🤖 Individual agent management (start/stop/configure)
- 📊 Agent performance metrics and activity logs
- 🔄 Status management (available/busy/cooldown)
- 📈 System coordination statistics

**Usage**:
```bash
npm run agent-manager
```

**Capabilities**:
- Register/unregister agents
- View detailed agent information
- Monitor resource usage and task assignments
- Access agent-specific logs and metrics

### 3. Enhanced Web Dashboard

**File**: `developer-interface/web/enhanced-dashboard.html`

**Features**:
- 🤖 **Agent Status Cards**: Real-time agent monitoring with color-coded status
- 🔔 **Approval Workflow**: Visual interface for task assignment approvals
- 💬 **Claude Integration**: Natural language task management
- 📊 **System Health**: Live metrics and coordination statistics
- 🔄 **Auto-refresh**: Real-time updates via WebSocket

**Access**: `http://localhost:3001/developer-interface`

### 4. Human Approval API

**File**: `developer-interface/api/human-approval-endpoints.js`

**Endpoints**:
```http
GET    /api/human-approval/suggestions/pending     # Get pending approvals
POST   /api/human-approval/suggestions             # Create suggestion
POST   /api/human-approval/suggestions/:id/approve # Approve assignment
POST   /api/human-approval/suggestions/:id/reject  # Reject assignment
GET    /api/human-approval/stats                   # Approval statistics
```

### 5. Claude Chat Integration

**Endpoint**: `POST /api/claude-chat`

**Features**:
- Natural language task management
- Contextual agent interactions
- Behind-the-scenes task editing
- Quasi-interactive task routing

**Example Usage**:
```javascript
// Send natural language command
fetch('/api/claude-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Assign the authentication task to the backend agent because it needs database integration",
    context: "task_assignment"
  })
});
```

## 🏗️ Architecture

### Directory Structure

```
developer-interface/
├── cli/
│   ├── task-router.js         # Interactive task routing CLI
│   ├── agent-manager.js       # Agent management CLI
│   └── README.md
├── web/
│   ├── enhanced-dashboard.html # Enhanced web dashboard
│   └── assets/
├── api/
│   ├── human-approval-endpoints.js # Developer approval API
│   └── claude-integration.js
└── README.md
```

### Integration Points

1. **TaskMaster CLI Integration**: Direct integration with existing TaskMaster commands
2. **Agent Coordination**: Works with `.taskmaster/agents/coordination-workflow.cjs`
3. **WebSocket Updates**: Real-time dashboard updates via existing WebSocket server
4. **API Server**: Integrated into `taskmaster-api-server.js`

## 📋 MVP Features Implemented

### ✅ Terminal Interface (MVP)
- **Interactive task router** with visual confirmation
- **Agent manager** with status monitoring
- **Developer approval workflow** for orchestrator suggestions
- **Color-coded indicators** and progress feedback

### ✅ Web Dashboard Enhancement
- **Agent status cards** with real-time updates
- **System health indicators** (CPU/RAM/coordination metrics)
- **Approval workflow panel** with action buttons
- **Responsive design** for mobile/desktop

### ✅ Claude Integration Points
- **Natural language API** for task management
- **System context prompts** for agent interactions
- **Behind-the-scenes editing** via chat interface
- **Quasi-interactive** task routing

## 🔧 Configuration

### Agent Roles Integration

The human interface automatically loads agent configurations from:
```
.taskmaster/agents/agent-roles.json
```

### Coordination Workflow

Integrates with the existing coordination system:
```
.taskmaster/agents/coordination-workflow.cjs
```

### API Server Configuration

Human interface routes are automatically added to the main API server when it starts.

## 🎮 Usage Examples

### Example 1: Route a Task via CLI

```bash
npm run task-router

# Interactive flow:
# 1. Select task: "Implement user authentication"
# 2. Choose agent: "Backend Agent" 
# 3. Reasoning: "Requires database and API development skills"
# 4. Confirm assignment
# 5. Task suggested to orchestrator for approval
```

### Example 2: Approve via Web Dashboard

1. Open `http://localhost:3001/developer-interface`
2. View pending approvals in the approval panel
3. Click "✅ Approve" or "❌ Reject"
4. Task automatically assigned to selected agent

### Example 3: Natural Language via Claude

```javascript
// In the web dashboard chat box:
"Create a new task for implementing OAuth integration and assign it to the backend agent since it requires API and security expertise"

// Claude processes and suggests:
// - Create task: "Implement OAuth integration"
// - Assign to: backend-agent
// - Reasoning: "Requires API and security expertise"
```

## 🚀 Future Enhancements (V2)

### Visual Workflow Builder
- Drag-and-drop canvas with React Flow
- Visual agent nodes and task dependencies
- Real-time execution visualization
- Conditional logic and looping constructs

### Advanced Agent Details
- Tabbed interface with activity logs
- Resource monitoring graphs
- Tool configuration panels
- Knowledge base integration

### Notifications Center
- Centralized alert management
- Severity-based filtering
- External integrations (Slack, email)
- Custom notification rules

## 🔍 Troubleshooting

### CLI Tools Not Working
```bash
# Ensure dependencies are installed
npm install

# Check if coordination workflow is available
ls .taskmaster/agents/coordination-workflow.cjs

# Verify agent roles configuration
cat .taskmaster/agents/agent-roles.json
```

### Web Dashboard Issues
```bash
# Ensure API server is running
npm start

# Check dashboard accessibility
curl http://localhost:3001/developer-interface

# Verify WebSocket connection
curl http://localhost:3001/api/health
```

### Human Approval API Issues
```bash
# Test approval endpoints
curl http://localhost:3001/api/human-approval/health

# Check pending suggestions
curl http://localhost:3001/api/human-approval/suggestions/pending
```

## 📚 Related Documentation

- [TaskMaster Agent System](../README.md)
- [Agent Configuration](../.taskmaster/agents/agent-roles.json)
- [Coordination Workflow](../.taskmaster/agents/coordination-workflow.cjs)
- [API Documentation](../api-design.md)

---

**Built with**: Inquirer.js, Chalk, Boxen, Express.js, WebSockets
**Compatible with**: TaskMaster CLI, Claude Code, MCP Tools