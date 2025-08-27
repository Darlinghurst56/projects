# 🚀 Agent Launcher User Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Using the Agent Launcher](#using-the-agent-launcher)
5. [Agent Roles Explained](#agent-roles-explained)
6. [Step-by-Step Agent Creation](#step-by-step-agent-creation)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [API Integration](#api-integration)
10. [Best Practices](#best-practices)

## Overview

The Agent Launcher is a comprehensive dashboard interface that enables you to create and deploy specialized AI agents for task automation and coordination within the TaskMaster ecosystem. Each agent is designed to handle specific types of work and can be customized based on your project needs.

### What is an Agent?

An agent is an autonomous AI system that:
- **Specializes** in specific roles (frontend, backend, QA, etc.)
- **Executes tasks** automatically based on its capabilities
- **Coordinates** with other agents through the TaskMaster system
- **Maintains context** within its assigned role and responsibilities

## Prerequisites

Before using the Agent Launcher, ensure you have:

### System Requirements
- **Node.js** v16 or higher
- **TaskMaster CLI** installed and configured
- **Dashboard server** running on port 3001
- **Git repository** initialized in your project

### Required Files
- `✅ simple-api-server.js` - Dashboard API server
- `✅ coordination-workflow.cjs` - Agent coordination system
- `✅ tasks.json` - TaskMaster task database

### Environment Setup
```bash
# 1. Start the dashboard server
cd /path/to/your/project/dashboard
node simple-api-server.js

# 2. Verify TaskMaster is working
task-master list

# 3. Check agent coordination system
node .taskmaster/agents/coordination-workflow.cjs status
```

## Getting Started

### 1. Access the Agent Launcher

**Option A: Via Main Dashboard**
1. Open your browser to `http://localhost:3001`
2. Navigate to the Agent Dashboard
3. Look for the "Agent Launcher" widget

**Option B: Direct Test Interface**
1. Open `http://localhost:3001/test-agent-launcher.html`
2. This provides a dedicated testing environment

**Option C: Integration into Existing Page**
```html
<!-- Add to your HTML -->
<link rel="stylesheet" href="widgets/agent-launcher/agent-launcher.css">
<script src="widgets/agent-launcher/agent-launcher.js"></script>

<div id="agent-launcher-container"></div>

<script>
const launcher = new AgentLauncherWidget(
    document.getElementById('agent-launcher-container')
);
</script>
```

### 2. Verify System Status

Before launching agents, check that all systems are operational:

1. **API Server Status**: Look for the green status indicator
2. **TaskMaster Integration**: Verify task count is visible
3. **Role Options**: Ensure all 7 agent roles are available

## Using the Agent Launcher

### The Interface

The Agent Launcher consists of four main sections:

```
┌─────────────────────────────────────┐
│           🚀 Launch New Agent       │
│     Create specialized agents       │
├─────────────────────────────────────┤
│  AGENT DETAILS                      │
│  • Agent Name (required)            │
│  • Description (optional)           │
├─────────────────────────────────────┤
│  ROLE SELECTION (required)          │
│  [Frontend] [Backend] [QA] [DevOps] │
│  [UI Dev] [Integration] [Server]    │
├─────────────────────────────────────┤
│  ADVANCED OPTIONS                   │
│  • Priority Level (1-5)             │
├─────────────────────────────────────┤
│  [🚀 Launch Agent] [Cancel]         │
└─────────────────────────────────────┘
```

## Agent Roles Explained

### 🏗️ Frontend Architect
- **Purpose**: Designs UI/UX architecture and component systems
- **Responsibilities**: React/Vue architecture, component design, state management
- **Best For**: Large-scale frontend planning and architectural decisions
- **Example Tasks**: Design component library, plan state management, create UI wireframes

### 🎨 UI Developer  
- **Purpose**: Implements visual components and responsive layouts
- **Responsibilities**: HTML/CSS/JS implementation, responsive design, visual debugging
- **Best For**: Day-to-day frontend development and styling work
- **Example Tasks**: Build React components, implement designs, fix CSS issues

### 🔗 Integration Specialist
- **Purpose**: Handles API connections and third-party integrations  
- **Responsibilities**: API integration, MCP servers, database connections, external services
- **Best For**: Connecting systems and managing data flows
- **Example Tasks**: Integrate payment APIs, set up database connections, configure MCP servers

### 🧪 QA Specialist
- **Purpose**: Performs testing, validation, and quality assurance
- **Responsibilities**: Automated testing, manual QA, bug tracking, performance testing
- **Best For**: Ensuring code quality and catching issues before deployment
- **Example Tasks**: Write test suites, perform manual testing, validate functionality

### 🖥️ Server Agent
- **Purpose**: Manages server operations and infrastructure
- **Responsibilities**: Server management, deployment pipelines, infrastructure, DevOps tasks
- **Best For**: Production deployments and server maintenance
- **Example Tasks**: Deploy applications, manage server configs, monitor uptime

### ⚙️ Backend Agent
- **Purpose**: Develops server-side logic and backend services
- **Responsibilities**: API development, database design, backend logic, security
- **Best For**: Building APIs and server-side functionality
- **Example Tasks**: Create REST APIs, design databases, implement authentication

### 🚀 DevOps Agent
- **Purpose**: Handles CI/CD and deployment automation
- **Responsibilities**: CI/CD pipelines, monitoring setup, automation scripts, cloud services
- **Best For**: Automating deployment and monitoring workflows
- **Example Tasks**: Set up GitHub Actions, configure monitoring, automate deployments

## Step-by-Step Agent Creation

### Step 1: Choose Your Agent Type

Consider what kind of work you need done:

- **Building a new feature?** → Start with Frontend Architect or Backend Agent
- **Fixing bugs or styling?** → Use UI Developer or QA Specialist  
- **Adding integrations?** → Choose Integration Specialist
- **Deploying to production?** → Use Server Agent or DevOps Agent

### Step 2: Fill Out Agent Details

```
Agent Name: my-frontend-specialist-2024
Description: Specialized agent for building the user dashboard interface
```

**Naming Conventions:**
- Use lowercase with hyphens: `frontend-specialist-dashboard`
- Include project context: `ecommerce-ui-developer`
- Add date/version if needed: `api-integration-v2`

### Step 3: Select Role and Priority

**Role Selection:**
Click on the role card that matches your needs. The card will highlight and show capabilities.

**Priority Levels:**
- **Priority 1 (High)**: Critical agents that get tasks first
- **Priority 2-3 (Medium)**: Standard workflow agents  
- **Priority 4-5 (Low)**: Background or experimental agents

### Step 4: Launch the Agent

1. Click "🚀 Launch Agent"
2. Wait for the success confirmation
3. Check the "Recent Launches" section
4. Verify the agent appears in the Agent Registry

### Step 5: Verify Agent is Working

```bash
# Check agent registration
node .taskmaster/agents/coordination-workflow.cjs status

# Verify agent appears in TaskMaster
task-master list-tags

# Check API endpoint
curl http://localhost:3001/api/agents
```

## Advanced Features

### Auto-Name Generation

When you select a role, the agent name field will auto-populate if empty:
- **Pattern**: `{role}-{date}`
- **Example**: `integration-specialist-2024-01-15`

### Description Auto-Fill

Selecting a role automatically fills the description field with the role's default description. You can customize this as needed.

### Recent Launches Tracking

The launcher keeps track of your recent agent launches:
- **Shows last 5 agents** created
- **Displays status** (active/inactive/error)
- **Includes timestamps** for audit trail

### Priority Management

Priority affects task assignment order:
```
Priority 1: [Critical Agent] ← Gets tasks first
Priority 2: [High Priority Agent]
Priority 3: [Standard Agent] ← Default
Priority 4: [Low Priority Agent]  
Priority 5: [Background Agent] ← Gets tasks last
```

## Troubleshooting

### Common Issues

#### 🔴 "Cannot connect to server"
**Problem**: Dashboard API server is not running
**Solution**:
```bash
cd dashboard
node simple-api-server.js
```

#### 🔴 "Agent name already exists"
**Problem**: Duplicate agent name
**Solution**: Choose a unique name or add a suffix like `-v2`

#### 🔴 "Invalid role selected"
**Problem**: Role validation failed
**Solution**: Ensure you clicked on a role card (it should be highlighted)

#### 🔴 "Agent registration failed"
**Problem**: Coordination workflow script issues
**Solution**:
```bash
# Check if coordination script exists
ls .taskmaster/agents/coordination-workflow.cjs

# Test coordination script
node .taskmaster/agents/coordination-workflow.cjs status
```

#### 🔴 Form won't submit
**Problem**: Required fields missing
**Solution**: Ensure agent name and role are filled out

### Debug Steps

1. **Check Console**: Open browser developer tools for error messages
2. **Verify API**: Test `http://localhost:3001/api/agents` directly  
3. **Check Logs**: Look at server console for error messages
4. **Test Coordination**: Run coordination workflow manually

### Getting Help

If you encounter issues:

1. **Check the test page**: `http://localhost:3001/test-agent-launcher.html`
2. **Run environment tests**: Click "Run Environment Tests"
3. **Check API status**: Click "Run API Tests"  
4. **Review server logs**: Check the terminal running the server

## API Integration

### Programmatic Agent Creation

You can create agents programmatically using the API:

```javascript
// Create a new agent via API
const response = await fetch('http://localhost:3001/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'my-custom-agent',
        description: 'Agent for specific task automation',
        role: 'integration-specialist',
        priority: 2
    })
});

const result = await response.json();
console.log('Agent created:', result.agent);
```

### Available API Endpoints

```bash
# Get all agents
GET /api/agents

# Create new agent  
POST /api/agents
{
  "name": "agent-name",
  "description": "Agent description", 
  "role": "role-name",
  "priority": 3
}

# Update agent
PUT /api/agents/:name
{
  "status": "active",
  "isCurrent": true,
  "description": "Updated description"
}
```

### Integration with TaskMaster

Created agents automatically:
- **Register with coordination workflow**
- **Get assigned to appropriate task tags**  
- **Appear in TaskMaster CLI tools**
- **Integrate with existing task assignments**

## Best Practices

### Agent Naming
- ✅ **Use descriptive names**: `ecommerce-frontend-specialist`
- ✅ **Include project context**: `blog-api-integration-agent`
- ✅ **Be consistent**: Follow your team's naming conventions
- ❌ **Avoid generic names**: `agent1`, `test-agent`

### Role Selection
- ✅ **Match role to work**: Use Frontend Architect for UI planning
- ✅ **Consider workflow**: QA agents should come after development agents
- ✅ **Think about scale**: Use multiple agents for large projects
- ❌ **Don't overlap roles**: Avoid multiple agents with same responsibilities

### Priority Management
- ✅ **Reserve Priority 1**: For critical production agents only
- ✅ **Use Priority 3**: As default for most agents
- ✅ **Plan dependencies**: Higher priority agents should handle prerequisites
- ❌ **Don't make everything high priority**: This defeats the purpose

### Lifecycle Management
- ✅ **Monitor agent activity**: Check agent registry regularly
- ✅ **Update descriptions**: Keep agent purposes current
- ✅ **Retire unused agents**: Remove agents that are no longer needed
- ✅ **Track performance**: Monitor which agents are most effective

### Team Coordination
- ✅ **Document agent purposes**: Keep team informed of what each agent does
- ✅ **Coordinate launches**: Avoid creating conflicting agents
- ✅ **Share naming conventions**: Ensure team consistency
- ✅ **Review regularly**: Discuss agent effectiveness in team meetings

## Testing Your Setup

### Quick Validation Checklist

1. **✅ Dashboard loads**: Can access the agent launcher interface
2. **✅ Roles visible**: All 7 agent roles are displayed with descriptions
3. **✅ Form works**: Can fill out agent details and select role
4. **✅ API responds**: Server returns success when creating agent
5. **✅ Integration works**: Agent appears in TaskMaster and coordination system
6. **✅ Recent launches**: New agents show up in the recent launches list

### Test Agent Creation

Try creating a test agent:

```
Name: test-integration-agent-demo
Role: Integration Specialist  
Description: Demo agent for testing the launcher functionality
Priority: 3 (Medium)
```

After clicking "Launch Agent", you should see:
- ✅ Success message appears
- ✅ Agent shows in recent launches
- ✅ Server logs show registration
- ✅ Agent appears when calling `/api/agents`

---

## Need Help?

If you encounter any issues or need assistance:

1. **Check the troubleshooting section** above
2. **Use the test interface** at `/test-agent-launcher.html`  
3. **Review server logs** for detailed error messages
4. **Test API endpoints** directly with curl or Postman

The Agent Launcher is designed to be intuitive and robust. With this guide, you should be able to successfully create and manage agents for your TaskMaster workflow automation needs.

**Happy Agent Launching! 🚀**