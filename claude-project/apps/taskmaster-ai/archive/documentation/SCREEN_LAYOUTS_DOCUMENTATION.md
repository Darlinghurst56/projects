# TaskMaster AI - Screen Layouts Documentation

## 📋 Overview

This document provides comprehensive documentation of all terminal-based interface screen layouts for the TaskMaster AI system. Each interface is designed for single-user operation with clean, ASCII-based visual elements.

---

## 🖥️ Screen Layout Catalog

### 1. Main Dashboard (`main-dashboard.js`)

**Purpose**: Central control hub for all system operations  
**Command**: `npm run dashboard` or `node main-dashboard.js`

**Screen Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  🤖 TaskMaster AI - Control Center                            │
│  Single-user multi-agent coordination system                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

? Select an option: (Use arrow keys)
❯ 📊 Agent Overview
  🤖 Agent Details
  🔄 Workflow Builder
  📋 Task Router
  ⚙️ Agent Manager
  ──────────────────────────────────────────────────────────────────
  🚀 Start All Agents
  🛑 Stop All Agents
  📈 System Status
  ──────────────────────────────────────────────────────────────────
  Exit
```

**Interactive Elements**:
- Arrow keys: Navigate menu options
- Enter: Select menu item
- Ctrl+C: Exit application

**Features**:
- Menu-driven interface
- Service integration
- Agent management shortcuts
- System control options

---

### 2. Agent Overview (`agent-overview.js`)

**Purpose**: Live monitoring of all 5 agents with real-time status updates  
**Command**: `npm run overview` or `node agent-overview.js`

**Screen Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🤖 TaskMaster AI - Agent Overview                          │
│  System Status Monitor | Single User Mode                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

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
CPU Load: 0.39 | Memory: 7.98GB / 9.46GB free

⚡ Quick Actions
Press [S] to start an agent | [X] to stop an agent | [T] to view tasks | [Q] to quit
```

**Interactive Elements**:
- [S] key: Start agent manager
- [X] key: Stop all agents
- [T] key: Open task router
- [Q] key: Quit application
- Ctrl+C: Force exit

**Features**:
- Real-time agent status monitoring
- Process memory and CPU tracking
- Current task display
- System health indicators
- Auto-refresh every 5 seconds

---

### 3. Agent Details (`agent-details.js`)

**Purpose**: Detailed view of individual agent with tabbed interface  
**Command**: `npm run details` or `node agent-details.js <agent-id>`

**Screen Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🤖 Backend Agent                                          │
│  Manages backend and API development                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

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
┌─────────────────────────────────────────────────────────────┐
│ ID: #25                                                     │
│ Title: Create API endpoints for user authentication         │
│ Status: in-progress                                         │
│ Priority: high                                              │
└─────────────────────────────────────────────────────────────┘

⚡ Quick Actions
[P] Pause | [S] Stop | [R] Restart | [L] View Logs

Press [Tab] to switch tabs | [Q] to quit
```

**Tab Views**:

**Activity Tab**:
```
 overview   ACTIVITY   tools   config 

📝 Recent Activity
┌─────────────┬──────────────────────────────────────────────────┐
│ Time        │ Action                                           │
├─────────────┼──────────────────────────────────────────────────┤
│ 14:30:45    │ Started task #25 - Create API endpoints         │
│ 14:28:12    │ Completed task #24 - Database schema update     │
│ 14:25:33    │ Agent started and registered                     │
│ 14:20:01    │ System initialization                            │
└─────────────┴──────────────────────────────────────────────────┘
```

**Tools Tab**:
```
 overview   activity   TOOLS   config 

🔧 Available Tools
┌─────────────────────┬──────────┬─────────────────────────────────┐
│ Tool                │ Status   │ Description                     │
├─────────────────────┼──────────┼─────────────────────────────────┤
│ filesystem          │ ✅ Active │ File system operations          │
│ memory              │ ✅ Active │ Memory management               │
│ task-master-ai      │ ✅ Active │ Task management integration     │
│ puppeteer           │ ⚠️ Limited│ Web automation (restricted)     │
│ playwright          │ ⚠️ Limited│ Browser testing (restricted)    │
└─────────────────────┴──────────┴─────────────────────────────────┘
```

**Config Tab**:
```
 overview   activity   tools   CONFIG 

⚙️ Agent Configuration
┌─────────────────────┬─────────────────────────────────────────┐
│ Setting             │ Value                                   │
├─────────────────────┼─────────────────────────────────────────┤
│ Agent Role          │ backend-agent                           │
│ Capabilities        │ nodejs, api, database, server-logic    │
│ Work Directory      │ /workspace/backend-agent/               │
│ Max Memory          │ 512MB                                   │
│ Timeout             │ 300000ms (5 minutes)                    │
│ Hot Reload          │ ✅ Enabled                              │
└─────────────────────┴─────────────────────────────────────────┘
```

**Interactive Elements**:
- [Tab] key: Switch between tabs
- [P] key: Pause agent
- [S] key: Stop agent
- [R] key: Restart agent
- [L] key: View logs
- [Q] key: Quit to main menu

---

### 4. Workflow Visualizer (`workflow-visualizer.js`)

**Purpose**: ASCII-based workflow visualization and builder  
**Command**: `npm run workflow` or `node workflow-visualizer.js`

**Screen Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🔄 TaskMaster AI - Workflow Builder                       │
│  Visual workflow creation and management                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

? Select workflow to visualize: (Use arrow keys)
❯ Feature Development
  Bug Fix Workflow
  Code Review Process
  Deployment Pipeline
  ──────────────────────────────────────────────────────────────
  Create New Workflow
  ← Back to main menu
```

**Workflow Visualization Example**:
```
🔄 Feature Development Workflow

  📋 Step 1: Requirements Analysis
  🎯 Orchestrator Agent
  └─ Analyze Requirements
  └─ Break down into tasks
  └─ Assign priorities
    ↓
  📝 Step 2: Backend Development
  🔧 Backend Agent
  └─ Create API Endpoints
  └─ Database schema updates
  └─ Server logic implementation
    ↓
  🎨 Step 3: Frontend Development
  🎨 Frontend Agent
  └─ Build UI Components
  └─ Integrate with APIs
  └─ Responsive design
    ↓
  🧪 Step 4: Quality Assurance
  🔍 QA Specialist
  └─ Write & Run Tests
  └─ Integration testing
  └─ Performance validation
    ↓
  🚀 Step 5: Deployment
  🚀 DevOps Agent
  └─ Deploy to Staging
  └─ Production deployment
  └─ Monitor system health

📊 Workflow Statistics
├── Total Steps: 5
├── Estimated Time: 4-6 hours
├── Agents Required: 5
└── Success Rate: 95%

⚡ Actions
[E] Edit workflow | [D] Delete workflow | [R] Run workflow | [B] Back to list
```

**Interactive Elements**:
- Arrow keys: Navigate workflows
- Enter: Select workflow to visualize
- [E] key: Edit workflow
- [D] key: Delete workflow
- [R] key: Run workflow
- [B] key: Back to workflow list

---

### 5. Task Router (`task-router.js`)

**Purpose**: Human-friendly task assignment interface  
**Command**: `npm run task-router` or `node human-interface/cli/task-router.js`

**Screen Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🤖 TaskMaster AI - Human Interface                        │
│  Interactive task routing and agent coordination            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

📊 System Status
● Total Agents: 5
● Available Agents: 3
● Busy Agents: 2
● Pending Tasks: 4

📋 Available Tasks
? Select a task to assign: (Use arrow keys)
❯ Task #25 - Create API endpoints for auth (high priority)
  Task #26 - Build login form component (medium priority)
  Task #27 - Write unit tests for API (low priority)
  Task #28 - Deploy to staging environment (medium priority)
  ─────────────────────────────────────────────────────────────
  🔄 Refresh task list
  📝 Create new task
  ← Back to main menu
```

**Task Assignment Flow**:
```
📋 Task Details
┌─────────────────────────────────────────────────────────────┐
│ Task ID: #25                                                │
│ Title: Create API endpoints for user authentication         │
│ Priority: high                                              │
│ Status: pending                                             │
│ Project: Authentication System                              │
│ Estimated Time: 2-3 hours                                   │
└─────────────────────────────────────────────────────────────┘

🤖 Suitable Agents
? Select agent to assign task: (Use arrow keys)
❯ 🔧 Backend Agent (nodejs, api, database) - ✅ Available
  🎯 Orchestrator Agent (coordination) - ⚠️ Busy
  🎨 Frontend Agent (react, typescript) - ❌ Not suitable
  🚀 DevOps Agent (deployment) - ❌ Not suitable
  🔍 QA Specialist (testing) - ❌ Not suitable

⚡ Assignment Actions
[A] Assign to selected agent | [S] Skip task | [E] Edit task | [B] Back to task list
```

**Interactive Elements**:
- Arrow keys: Navigate tasks and agents
- Enter: Select task or agent
- [A] key: Assign task
- [S] key: Skip task
- [E] key: Edit task
- [B] key: Back to list

---

### 6. Agent Manager (`agent-manager.js`)

**Purpose**: Interactive CLI for agent control and monitoring  
**Command**: `npm run agent-manager` or `node human-interface/cli/agent-manager.js`

**Screen Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚙️ TaskMaster AI - Agent Manager                          │
│  Agent lifecycle control and monitoring                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

📊 Agent Fleet Status
┌─────────────────┬──────────┬──────┬────────┬─────────────────┐
│ Agent           │ Status   │ PID  │ Memory │ Actions         │
├─────────────────┼──────────┼──────┼────────┼─────────────────┤
│ 🎯 Orchestrator │ ● Running│ 1234 │ 45MB   │ [Stop] [Restart]│
│ 🎨 Frontend Dev │ ● Running│ 1235 │ 67MB   │ [Stop] [Restart]│
│ 🔧 Backend Dev  │ ○ Stopped│ -    │ -      │ [Start]         │
│ 🚀 DevOps       │ ● Running│ 1236 │ 52MB   │ [Stop] [Restart]│
│ 🔍 QA Specialist│ ● Running│ 1237 │ 38MB   │ [Stop] [Restart]│
└─────────────────┴──────────┴──────┴────────┴─────────────────┘

? Select an action: (Use arrow keys)
❯ Start specific agent
  Stop specific agent
  Restart specific agent
  Start all agents
  Stop all agents
  View agent logs
  ──────────────────────────────────────────────────────────────
  System diagnostics
  ← Back to main menu
```

**Agent Action Flow**:
```
? Select agent to start: (Use arrow keys)
❯ 🔧 Backend Agent (stopped)
  ← Back to actions menu

⏳ Starting Backend Agent...
✅ Backend Agent started successfully
   PID: 1238
   Port: 3102
   Status: Running
   Memory: 12MB

📋 Agent Details
┌─────────────────────────────────────────────────────────────┐
│ Agent Role: backend-agent                                   │
│ Capabilities: nodejs, api, database, server-logic          │
│ MCP Tools: filesystem, memory, task-master-ai              │
│ Work Directory: /workspace/backend-agent/                   │
│ Hot Reload: ✅ Enabled                                      │
└─────────────────────────────────────────────────────────────┘

Press any key to continue...
```

**Interactive Elements**:
- Arrow keys: Navigate actions and agents
- Enter: Select action
- Space: Toggle agent selection
- [L] key: View logs
- [R] key: Restart agent
- [S] key: Stop agent

---

## 🎨 Visual Design Elements

### Color Scheme

```
Primary Colors:
├── 🟢 Green (chalk.green): Success states, running agents
├── 🔴 Red (chalk.red): Error states, stopped agents
├── 🟡 Yellow (chalk.yellow): Warning states, busy agents
├── 🔵 Blue (chalk.blue): Information, headers
├── 🟣 Magenta (chalk.magenta): Highlights, special actions
└── ⚫ Gray (chalk.gray): Disabled states, secondary text
```

### Typography

```
Headers:
├── chalk.bold.cyan: Main application titles
├── chalk.bold.white: Section headers
├── chalk.bold: Important labels
└── chalk.gray: Subtitle and help text

Status Indicators:
├── ● (green): Active/Running
├── ○ (gray): Stopped/Inactive
├── ⚠️ (yellow): Warning/Busy
└── ❌ (red): Error/Failed
```

### Box Drawing Characters

```
Box Elements:
├── ┌─┐ └─┘: Simple boxes (fallback)
├── ┏━┓ ┗━┛: Emphasis boxes
├── ╔═╗ ╚═╝: Important sections
└── ┃ │ ║: Vertical separators

Table Elements:
├── ┌─┬─┐: Table headers
├── ├─┼─┤: Table separators
├── └─┴─┘: Table footers
└── │ │ │: Column separators
```

### Layout Patterns

```
Standard Layout:
┌─ Header (with title and description)
├─ Status Section (system info)
├─ Main Content Area (tables, forms, lists)
├─ Action Section (buttons, shortcuts)
└─ Footer (help text, navigation)

Responsive Behavior:
├── Minimum width: 80 columns
├── Preferred width: 100 columns
├── Maximum width: 120 columns
└── Height: Adapts to content
```

---

## 🔧 Technical Implementation

### Screen Update Patterns

```javascript
// Refresh Pattern
while (this.isRunning) {
    this.displayHeader();
    this.displayContent();
    this.displayFooter();
    
    await new Promise(resolve => setTimeout(resolve, this.refreshInterval));
}
```

### Input Handling

```javascript
// Keypress Handling
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    }
    
    switch(key.name) {
        case 'up':
        case 'down':
            this.navigateMenu(key.name);
            break;
        case 'return':
            this.selectCurrentItem();
            break;
    }
});
```

### Error Handling

```javascript
// Graceful Error Display
try {
    // Interface logic
} catch (error) {
    console.error(chalk.red('Error: ') + error.message);
    console.log(chalk.gray('Press any key to continue...'));
    await this.waitForKeypress();
}
```

---

## 📱 Responsive Design

### Screen Size Adaptation

```
Minimum Requirements:
├── Terminal width: 80 columns
├── Terminal height: 24 rows
├── Color support: 256 colors
└── Unicode support: UTF-8

Optimal Experience:
├── Terminal width: 100+ columns
├── Terminal height: 30+ rows
├── Color support: True color
└── Font: Monospace with good Unicode support
```

### Mobile Terminal Support

```
Adjustments for small screens:
├── Table column reduction
├── Simplified status indicators
├── Compressed spacing
└── Abbreviated text labels
```

---

## 🎯 Accessibility Features

### Keyboard Navigation

```
Universal Controls:
├── Arrow keys: Navigation
├── Enter: Select/Confirm
├── Space: Toggle/Select
├── Tab: Switch sections
├── Escape: Cancel/Back
├── Ctrl+C: Force exit
└── Q: Quit (where applicable)
```

### Screen Reader Support

```
Accessibility Features:
├── Alt text for symbols
├── Descriptive labels
├── Status announcements
├── Progress indicators
└── Error descriptions
```

### High Contrast Mode

```
High Contrast Support:
├── Bold text emphasis
├── Clear status indicators
├── Simplified color scheme
└── Enhanced borders
```

---

## 🔍 Testing Coverage

### Screen Layout Tests

```bash
# All layouts tested with:
├── Various terminal sizes
├── Different color support levels
├── Keyboard navigation
├── Error conditions
└── Edge cases
```

### Compatibility Matrix

```
Tested Environments:
├── ✅ Windows Terminal
├── ✅ macOS Terminal
├── ✅ Linux Terminal
├── ✅ WSL
├── ✅ VS Code Terminal
└── ✅ SSH connections
```

---

## 📚 Usage Examples

### Complete User Flow

```bash
# 1. Start system
npm start &

# 2. Launch main dashboard
npm run dashboard

# 3. Navigate to Agent Overview
# (Select "📊 Agent Overview" from menu)

# 4. Start agents using quick action
# (Press 'S' key)

# 5. Monitor agent status
# (View real-time updates)

# 6. Open Task Router
# (Press 'T' key)

# 7. Assign tasks to agents
# (Follow task selection flow)

# 8. Monitor progress
# (Return to Agent Overview)
```

### Power User Shortcuts

```bash
# Direct interface access
npm run overview    # Agent monitoring
npm run details     # Agent details
npm run workflow    # Workflow builder
npm run task-router # Task assignment

# Agent management
npm run agents:start  # Start all agents
npm run agents:stop   # Stop all agents
npm run agents:status # Check status
```

---

## 🎯 Summary

The TaskMaster AI terminal interface system provides:

1. **6 Comprehensive Interfaces** - Each optimized for specific tasks
2. **Consistent Visual Design** - Unified color scheme and typography
3. **Responsive Layout** - Adapts to different terminal sizes
4. **Accessible Controls** - Full keyboard navigation support
5. **Real-time Updates** - Live monitoring and status updates
6. **Error Handling** - Graceful degradation and recovery

All interfaces are production-ready and provide a complete terminal-based experience for managing the multi-agent TaskMaster AI system.

---

*Documentation generated by TaskMaster AI System*  
*Last updated: July 15, 2025*  
*Version: 1.0*