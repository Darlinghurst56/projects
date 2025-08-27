# Agent Role System - Simplified

> All agent/task data in dashboards and tools is always live from the API. No mock data is ever used.

## Overview

TaskMaster uses **isolated workspaces** for different types of work. Each workspace contains its own tasks, preventing conflicts and ensuring clear ownership.

### Active Workspaces

**Current Status**:
- **`qa-specialist`** - Testing and quality assurance (11 tasks, 7 completed)
- **`ui-developer`** - CSS, HTML, visual components (14 tasks, 9 completed)  
- **`backend-agent`** - Server APIs and data management (1 task)
- **`integration-specialist`** - API connections and data flow (4 tasks, 2 completed)
- **`frontend-architect`** - JavaScript architecture (4 tasks, 3 completed)
- **`devops-agent`** - Infrastructure and deployment (1 task)

**How It Works**:
- Switch workspace: `task-master use-tag <workspace>`
- Work in isolation: Only see tasks for your workspace
- No conflicts: Each workspace has separate tasks
- Simple coordination: Use `copy-tag` to share tasks if needed

## Agent Roles

### 🏗️ Frontend Architect
**Workspace**: `frontend-architect`  
**Focus**: JavaScript architecture, performance optimization, design systems
**Current Tasks**: 4 tasks (3 completed)

### 🎨 UI Developer
**Workspace**: `ui-developer`  
**Focus**: CSS, HTML, visual components, responsive design
**Current Tasks**: 14 tasks (9 completed)

### 🔧 Backend Agent
**Workspace**: `backend-agent`  
**Focus**: Server APIs, databases, authentication
**Current Tasks**: 1 task

### 🔌 Integration Specialist
**Workspace**: `integration-specialist`  
**Focus**: API connections, data flow, system coordination
**Current Tasks**: 4 tasks (2 completed)

### 🧪 QA Specialist
**Workspace**: `qa-specialist`  
**Focus**: Testing, validation, quality assurance
**Current Tasks**: 11 tasks (7 completed)

### 🚀 DevOps Agent
**Workspace**: `devops-agent`  
**Focus**: Infrastructure, deployment, containerization
**Current Tasks**: 1 task

## Basic Commands

```bash
# Switch workspaces
task-master use-tag qa-specialist

# List tasks in current workspace
task-master list

# Work on tasks
task-master next
task-master show <id>
task-master set-status --id=<id> --status=done

# Share tasks between workspaces (if needed)
task-master copy-tag --source-name=qa-specialist --target-name=ui-developer
```

## Agent Automation Commands

For autonomous agents, use these commands to claim roles and apply tool restrictions:

```bash
# Claim a role and apply tool restrictions
node .claude/agent-tools/restrict-tools.cjs apply frontend-agent

# Check current role and restrictions
node .claude/agent-tools/restrict-tools.cjs show

# List all available roles
node .claude/agent-tools/restrict-tools.cjs list

# Validate tool usage against restrictions
node .claude/agent-tools/restrict-tools.cjs validate

# Register with coordination system
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>
```

**Tool Restriction Roles:**
- `frontend-agent` - UI development tools (Edit, Puppeteer, ESLint)
- `backend-agent` - Server development tools (Node.js, Docker, ESLint)
- `integration-agent` - API integration tools (HTTP, cURL, WebFetch)
- `devops-agent` - Full infrastructure access (Bash, Docker)
- `qa-agent` - Testing tools only (Puppeteer, ESLint, test runners)
- `visualization-agent` - UI polish tools (Edit, Puppeteer screenshots)

## Projects

All tasks are organized into three main projects:

### 1. House AI - Family Dashboard
- DNS Analytics Widget System
- Authentication System
- Dashboard UI System
- Quality Assurance System

### 2. TaskMaster Agent System
- Agent Coordination
- Task Management

### 3. Development Infrastructure
- MCP Tools
- Build Tools

---

**That's it!** Simple workspaces, clear roles, no conflicts.