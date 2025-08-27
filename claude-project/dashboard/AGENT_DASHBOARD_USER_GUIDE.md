# 🚀 Agent Dashboard User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard Layout](#dashboard-layout)
4. [Widget Reference](#widget-reference)
5. [Agent Management Workflow](#agent-management-workflow)
6. [TaskMaster Integration](#taskmaster-integration)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [API Integration](#api-integration)
10. [Best Practices](#best-practices)

## Overview

The Agent Dashboard is a comprehensive interface for managing TaskMaster AI agents, coordinating task assignments, and monitoring system performance. It provides a unified view of your entire agent ecosystem with real-time updates and intuitive controls.

### What is the Agent Dashboard?

The Agent Dashboard serves as the central command center for:

- **Agent Registry**: View and manage all active agents
- **Agent Launcher**: Create new specialized agents
- **Task Assignment**: Coordinate work between agents and tasks
- **Status Monitoring**: Real-time agent performance tracking
- **Capability Matrix**: Visualize agent skills and compatibility

## Getting Started

### Prerequisites

Before using the Agent Dashboard, ensure you have:

#### System Requirements

- **Node.js** v16 or higher
- **TaskMaster CLI** installed and configured
- **Dashboard API server** running on port 3001
- **Git repository** initialized in your project

#### Required Services

- ✅ `simple-api-server.js` - Dashboard API server
- ✅ `.taskmaster/agents/coordination-workflow.cjs` - Agent coordination
- ✅ `.taskmaster/tasks/tasks.json` - Task database

### Quick Start

1. **Start the Dashboard Server**

   ```bash
   cd /path/to/your/project/dashboard
   node simple-api-server.js
   ```

2. **Access the Dashboard**
   Open your browser to `http://localhost:3001/agent-dashboard.html`

3. **Verify System Status**
   Look for the green "Agent System Online" indicator in the top-right corner

## Dashboard Layout

The Agent Dashboard uses a responsive grid layout optimized for productivity:

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Agent Coordination Dashboard Header                │
│  [Refresh All] [Auto Mode] [Settings] [DNS Dashboard]  │
├─────────────────────────────────────────────────────────┤
│  📊 Agent Registry        │  📋 Task Assignment        │
│  Active agents & status   │  Drag & drop task mgmt     │
├─────────────────────────────────────────────────────────┤
│  🚀 Agent Launcher        │  📋 Task Assignment (cont.) │
│  Create new agents        │  Status & filters           │
├─────────────────────────────────────────────────────────┤
│  📈 Status Monitor        │  🎯 Capability Matrix      │
│  Real-time metrics       │  Skills visualization       │
├─────────────────────────────────────────────────────────┤
│  🌐 System Integration    │  ⚙️ Agent Configuration     │
│  Example widgets         │  Role management            │
└─────────────────────────────────────────────────────────┘
```

### Responsive Design

The dashboard adapts to different screen sizes:

- **Desktop (1400px+)**: Full 4-column grid layout
- **Tablet (1024px-1400px)**: Compact 4-column layout
- **Mobile (768px-1024px)**: 2-column stacked layout
- **Phone (<768px)**: Single column vertical stack

## Widget Reference

### 📊 Agent Registry Widget

**Purpose**: Central registry of all active agents in your system

**Features**:

- Real-time agent status monitoring
- Agent capability display
- Performance metrics
- Quick agent actions

**Key Information Displayed**:

- Agent name and role
- Current task count
- Completion rate
- Last activity timestamp
- Status indicators (active/idle/error)

**Actions Available**:

- View agent details
- Refresh agent data
- Monitor agent performance

### 🚀 Agent Launcher Widget

**Purpose**: Create and deploy new specialized agents

**Features**:

- 7 predefined agent roles
- Custom agent configuration
- Priority level settings
- Real-time validation

**Available Roles**:

1. **Frontend Architect** (🏗️) - UI/UX architecture and component systems
2. **UI Developer** (🎨) - Visual component implementation
3. **Integration Specialist** (🔗) - API connections and data flows
4. **QA Specialist** (🧪) - Testing and quality assurance
5. **Server Agent** (🖥️) - Server operations and infrastructure
6. **Backend Agent** (⚙️) - Server-side logic and databases
7. **DevOps Agent** (🚀) - CI/CD and deployment automation

**Configuration Options**:

- Agent name (auto-generated or custom)
- Description (role-based or custom)
- Priority level (1-5, where 1 is highest)

### 📋 Task Assignment Widget

**Purpose**: Coordinate task distribution between agents

**Features**:

- Context-based task filtering
- Real-time task statistics
- Task progress visualization
- Auto-assignment capabilities

**Task Information**:

- Total tasks across all contexts
- Completed tasks count
- In-progress tasks
- Pending tasks waiting for assignment

**Context Filtering**:

- Filter by tag/context (e.g., `integration-specialist`, `server-agent`)
- View all contexts at once
- Dynamic task counts per context

### 📈 Agent Status Monitor Widget

**Purpose**: Real-time monitoring of agent performance and health

**Features** (Planned):

- Live performance metrics
- Alert notifications
- Resource utilization
- Error tracking

### 🎯 Capability Matrix Widget

**Purpose**: Visualize agent capabilities and task compatibility

**Features** (Planned):

- Skills mapping visualization
- Task-agent compatibility matrix
- Capability gap analysis
- Resource allocation recommendations

## Agent Management Workflow

### Creating a New Agent

1. **Navigate to Agent Launcher**
   - Located in the second row of the dashboard
   - Click on the widget to focus

2. **Configure Agent Details**

   ```
   Agent Name: frontend-specialist-2024
   Description: Specialized in React component development
   ```

3. **Select Agent Role**
   - Click on the appropriate role card
   - Card will highlight when selected
   - Description auto-fills based on role

4. **Set Priority Level**
   - Priority 1: Critical agents (get tasks first)
   - Priority 3: Standard agents (default)
   - Priority 5: Background agents (get tasks last)

5. **Launch Agent**
   - Click "🚀 Launch Agent"
   - Wait for success confirmation
   - New agent appears in Agent Registry

### Monitoring Agent Activity

1. **Check Agent Registry**
   - View all active agents
   - Monitor task counts and completion rates
   - Check last activity timestamps

2. **Use Status Monitor**
   - Real-time performance updates
   - Alert notifications for issues
   - Resource utilization tracking

3. **Review Task Assignment**
   - See which tasks are assigned to which agents
   - Monitor task progress
   - Use filters to focus on specific contexts

### Managing Agent Workload

1. **Use Auto Mode**
   - Click "Auto Mode" button in header
   - System automatically assigns tasks to best-suited agents
   - Toggle to "Manual Mode" for manual control

2. **Context-Based Assignment**
   - Use task context filter in Task Assignment widget
   - Assign tasks based on agent specialization
   - Monitor completion rates per context

## TaskMaster Integration

### Real-Time Data Sync

The dashboard integrates directly with TaskMaster:

- **Tasks**: Live sync with `.taskmaster/tasks/tasks.json`
- **Agents**: Real-time agent registry updates
- **Status**: Automatic status propagation between systems

### API Endpoints

The dashboard communicates through these endpoints:

```bash
# Health check
GET http://localhost:3001/api/health

# Agent management
GET http://localhost:3001/api/agents
POST http://localhost:3001/api/agents
PUT http://localhost:3001/api/agents/:name

# Task integration
GET http://localhost:3001/api/tasks
```

### TaskMaster CLI Integration

Dashboard actions automatically sync with TaskMaster CLI:

```bash
# Dashboard agent launches register with TaskMaster
task-master list-tags  # Shows dashboard-created agents

# CLI agent creation appears in dashboard
task-master add-task --agent=frontend-specialist

# Status changes sync both ways
task-master set-status --id=1.2 --status=done
```

## Advanced Features

### Header Navigation

**Refresh All Button**

- Refreshes all widget data from TaskMaster API
- Shows "🔄 Refreshing..." during update
- Keyboard shortcut: `Ctrl+R`

**Auto Mode Toggle**

- Switches between automatic and manual task assignment
- Auto mode: System assigns tasks to best agents
- Manual mode: Manual task assignment required
- Keyboard shortcut: `Ctrl+A`

**Settings Menu**

- Restart guided tour
- Hide/show tooltips
- Disable/enable help hints
- Reset hint system

**DNS Dashboard Link**

- Quick access to original DNS monitoring dashboard
- Demonstrates integration with existing systems

### Interactive Features

**Tooltips**

- Hover over widgets for detailed descriptions
- Contextual help for all interface elements
- Keyboard navigation support

**Guided Tour**

- First-time user walkthrough
- Interactive feature highlights
- Restart available in settings

**Status Indicators**

- Real-time system status in top-right corner
- Color-coded agent status indicators
- Visual feedback for all actions

### Event System

The dashboard uses a sophisticated event bus for widget communication:

```javascript
// Listen for agent launches
window.eventBus.on('agent:launched', function(agent) {
    // Update displays, refresh registries
});

// Trigger dashboard refresh
window.eventBus.emit('dashboard:refresh:all');

// Agent status changes
window.eventBus.on('agent:status:changed', function(data) {
    // Update monitoring displays
});
```

## Troubleshooting

### Common Issues

#### 🔴 "Agent System Offline" Status

**Problem**: Dashboard can't connect to API server
**Solution**:

```bash
# Check if server is running
ps aux | grep simple-api-server

# Start server if needed
cd dashboard
node simple-api-server.js
```

#### 🔴 "No Agents Found" in Registry

**Problem**: Agent registry shows no agents
**Solutions**:

1. Check TaskMaster integration:

   ```bash
   task-master list-tags
   ```

2. Verify API endpoint:

   ```bash
   curl http://localhost:3001/api/agents
   ```

3. Check coordination workflow:

   ```bash
   node .taskmaster/agents/coordination-workflow.cjs status
   ```

#### 🔴 "Failed to Load Tasks" in Assignment Widget

**Problem**: Task assignment widget shows error
**Solutions**:

1. Verify TaskMaster database:

   ```bash
   ls .taskmaster/tasks/tasks.json
   ```

2. Check API server logs
3. Refresh dashboard with "Refresh All" button

#### 🔴 Agent Launch Fails

**Problem**: New agent creation fails
**Solutions**:

1. Check required fields (name and role)
2. Ensure unique agent name
3. Verify coordination workflow script
4. Check API server logs for errors

#### 🔴 Dashboard Layout Issues

**Problem**: Widgets not displaying correctly
**Solutions**:

1. Check browser compatibility (modern browsers required)
2. Clear browser cache and reload
3. Verify CSS files are loading
4. Check browser console for JavaScript errors

### Debug Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors in Console tab
   - Check Network tab for failed API calls

2. **Verify API Server**

   ```bash
   # Test API endpoints directly
   curl http://localhost:3001/api/health
   curl http://localhost:3001/api/agents
   ```

3. **Check TaskMaster Integration**

   ```bash
   # Verify TaskMaster is working
   task-master list
   task-master next
   ```

4. **Test Widget Functionality**
   - Try the test interface: `http://localhost:3001/test-agent-launcher.html`
   - Run environment tests in test interface
   - Check individual widget components

### Getting Help

If issues persist:

1. **Review Error Messages**: Check both browser console and server logs
2. **Test Isolated Components**: Use dedicated test pages
3. **Verify Prerequisites**: Ensure all required services are running
4. **Check Documentation**: Review TaskMaster CLI documentation

## API Integration

### REST API Reference

The dashboard provides a comprehensive REST API for programmatic access:

#### Agent Management

**Get All Agents**

```bash
GET /api/agents

Response:
{
  "agents": [
    {
      "name": "integration-specialist",
      "description": "MCP server integration and API connections",
      "priority": 2,
      "taskCount": 3,
      "completedTasks": 1,
      "statusBreakdown": {
        "in-progress": 2,
        "done": 1
      },
      "isCurrent": true,
      "role": "integration-specialist",
      "agentId": "integration-specialist-1752049392838",
      "createdAt": "2025-07-09T08:23:12.844Z",
      "status": "active"
    }
  ],
  "currentAgent": "integration-specialist",
  "totalAgents": 4,
  "lastUpdate": "2025-07-09T08:16:20.674Z"
}
```

**Create New Agent**

```bash
POST /api/agents
Content-Type: application/json

{
  "name": "frontend-specialist-v2",
  "description": "React component development specialist",
  "role": "ui-developer",
  "priority": 3
}

Response:
{
  "success": true,
  "message": "Agent frontend-specialist-v2 created successfully",
  "agent": {
    "name": "frontend-specialist-v2",
    "description": "React component development specialist",
    "priority": 3,
    "role": "ui-developer",
    "agentId": "frontend-specialist-v2-1752049392838",
    "createdAt": "2025-07-09T08:23:12.844Z",
    "status": "active"
  }
}
```

**Update Agent**

```bash
PUT /api/agents/:name
Content-Type: application/json

{
  "status": "active",
  "isCurrent": true,
  "description": "Updated description"
}
```

#### System Health

**Health Check**

```bash
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-07-09T08:16:16.479Z",
  "message": "TaskMaster Dashboard API - Simple Version",
  "agents": 4,
  "tasks": 79
}
```

### JavaScript Integration

**Using the Dashboard API in Custom Scripts**

```javascript
// Fetch all agents
const response = await fetch('http://localhost:3001/api/agents');
const data = await response.json();
console.log('Active agents:', data.agents);

// Create a new agent
const newAgent = await fetch('http://localhost:3001/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'custom-qa-agent',
        description: 'Specialized QA agent for testing workflows',
        role: 'qa-specialist',
        priority: 2
    })
});

const result = await newAgent.json();
if (result.success) {
    console.log('Agent created:', result.agent);
}
```

### Widget Event System

**Listening to Dashboard Events**

```javascript
// Agent registration events
window.eventBus.on('agent:launched', function(agent) {
    console.log('New agent launched:', agent.name);
    // Update your custom UI
});

// Task assignment events
window.eventBus.on('task:assigned', function(data) {
    console.log(`Task ${data.taskId} assigned to ${data.agent}`);
});

// Dashboard mode changes
window.eventBus.on('dashboard:mode:auto', function() {
    console.log('Auto assignment mode enabled');
});
```

**Triggering Dashboard Actions**

```javascript
// Refresh all widgets
window.eventBus.emit('dashboard:refresh:all');

// Notify of agent status change
window.eventBus.emit('agent:status:changed', {
    agentId: 'frontend-specialist',
    status: 'busy'
});

// Request agents refresh
window.eventBus.emit('agents:refresh');
```

## Best Practices

### Agent Management

**Naming Conventions**

- ✅ **Use descriptive names**: `ecommerce-frontend-specialist`
- ✅ **Include project context**: `blog-api-integration-agent`
- ✅ **Be consistent**: Follow team naming standards
- ✅ **Add version/date if needed**: `ui-developer-v2`
- ❌ **Avoid generic names**: `agent1`, `test-agent`

**Role Assignment**

- ✅ **Match role to work**: Frontend Architect for UI planning
- ✅ **Consider dependencies**: QA agents after development agents
- ✅ **Plan for scale**: Multiple agents for large projects
- ✅ **Avoid overlap**: Clear responsibility boundaries
- ❌ **Don't create redundant agents**: Check existing agents first

**Priority Management**

- ✅ **Reserve Priority 1**: Critical production agents only
- ✅ **Use Priority 3**: Default for most standard agents
- ✅ **Plan dependencies**: High priority for prerequisite work
- ✅ **Monitor workload**: Adjust priorities based on performance
- ❌ **Don't make everything high priority**: Defeats the purpose

### Dashboard Usage

**Navigation Efficiency**

- ✅ **Use keyboard shortcuts**: `Ctrl+R` for refresh, `Ctrl+A` for auto mode
- ✅ **Leverage tooltips**: Hover for quick help without leaving context
- ✅ **Monitor status indicators**: Real-time feedback prevents issues
- ✅ **Use context filters**: Focus on relevant tasks and agents

**Workflow Optimization**

- ✅ **Start with Agent Registry**: Understand current agent landscape
- ✅ **Check Task Assignment**: See what work is pending
- ✅ **Create targeted agents**: Launch agents for specific needs
- ✅ **Monitor performance**: Use Status Monitor for optimization

**Team Coordination**

- ✅ **Document agent purposes**: Keep team informed of agent roles
- ✅ **Coordinate launches**: Avoid conflicting agent creation
- ✅ **Share naming conventions**: Ensure team consistency
- ✅ **Regular reviews**: Discuss agent effectiveness in meetings
- ✅ **Use settings**: Configure dashboard for team preferences

### System Maintenance

**Regular Tasks**

- ✅ **Monitor system status**: Check green indicator regularly
- ✅ **Refresh data**: Use "Refresh All" to get latest information
- ✅ **Review agent performance**: Check completion rates and activity
- ✅ **Clean up inactive agents**: Remove agents no longer needed

**Performance Optimization**

- ✅ **Use auto-refresh wisely**: Balance real-time data with performance
- ✅ **Filter effectively**: Use context filters to reduce data load
- ✅ **Monitor browser performance**: Check console for errors
- ✅ **Keep API server healthy**: Monitor server logs and restart if needed

**Integration Maintenance**

- ✅ **Sync with TaskMaster**: Ensure CLI and dashboard stay in sync
- ✅ **Backup configurations**: Save agent configurations and priorities
- ✅ **Version control**: Track dashboard configuration changes
- ✅ **Test after updates**: Verify functionality after system updates

## Testing Your Setup

### Quick Validation Checklist

1. **✅ Dashboard Loads**: Agent dashboard accessible at correct URL
2. **✅ Agent Registry**: Shows existing agents with accurate data
3. **✅ Agent Launcher**: All 7 roles available and functional
4. **✅ Task Assignment**: TaskMaster integration working correctly
5. **✅ Status Monitor**: Real-time updates functioning
6. **✅ API Integration**: All endpoints responding correctly
7. **✅ Event System**: Widgets communicating properly

### Full System Test

**Step 1: Verify Dashboard Access**

```bash
# Open browser to dashboard
open http://localhost:3001/agent-dashboard.html

# Check system status indicator (should be green)
# Verify all widgets load without errors
```

**Step 2: Test Agent Registry**

```bash
# Should show existing agents
# Verify agent counts and status indicators
# Test refresh functionality
```

**Step 3: Test Agent Launcher**

```bash
# Create test agent:
# Name: dashboard-test-agent
# Role: QA Specialist
# Priority: 3

# Verify success message
# Check agent appears in registry
```

**Step 4: Test Task Assignment**

```bash
# Check task counts and contexts
# Test context filter functionality
# Verify TaskMaster integration
```

**Step 5: Test API Integration**

```bash
# Direct API test
curl http://localhost:3001/api/agents

# Should return JSON with agent list
# Verify all agents from dashboard appear
```

### Performance Validation

**Browser Performance**

- Open Developer Tools
- Check Console for errors
- Monitor Network tab for failed requests
- Verify CSS and JavaScript files load correctly

**Server Performance**

- Monitor server console output
- Check for error messages or warnings
- Verify API response times are reasonable
- Test concurrent user access

**TaskMaster Integration**

- Verify sync between dashboard and CLI
- Test agent creation from both interfaces
- Check task assignment consistency
- Validate status updates propagate correctly

---

## Need Help?

If you encounter any issues or need assistance:

1. **Check the troubleshooting section** above for common solutions
2. **Use the test interface** at `/test-agent-launcher.html` for isolated testing
3. **Review server logs** for detailed error messages  
4. **Test API endpoints** directly with curl or browser
5. **Check TaskMaster CLI** integration and status
6. **Verify prerequisites** are installed and configured correctly

The Agent Dashboard is designed to provide a comprehensive, user-friendly interface for managing your TaskMaster agent ecosystem. With proper setup and following these best practices, you'll have a powerful tool for coordinating complex multi-agent workflows.

**Happy Agent Management! 🚀**
