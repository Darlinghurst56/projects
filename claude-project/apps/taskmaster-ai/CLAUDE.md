# TaskMaster AI - Developer Tool Guide

> **Primary Instructions**: See `/claude-project/CLAUDE.md` for main development guidelines

## Purpose: Developer Task Coordination System

**TaskMaster AI helps YOU (the developer) coordinate development tasks for building the Home Dashboard family interface.**

This is NOT a family system - it's a developer tool to help you build software efficiently.

## 5-Agent System Overview

This system coordinates 5 specialized agents for DEVELOPMENT tasks:

### Agent Roles (Correct Priority Order)

1. **Frontend Dev** (`frontend-agent`)
   - UI/UX development for family dashboard
   - React, TypeScript, CSS, responsive design
   - MCP Tools: `vite`, `tailwindcss`, `shadcn_ui`, `playwright`, `eslint`, `design-system`, `accessibility-testing`

2. **Backend Dev** (`backend-agent`)
   - APIs, databases, server logic for family dashboard
   - Node.js, Express, authentication, data processing
   - MCP Tools: `filesystem`, `github`, `fetch`, `eslint`, `sourcery`

3. **Orchestrator** (`orchestrator-agent`)
   - Task coordination and developer interface
   - Multi-agent coordination, priority management, conflict resolution
   - MCP Tools: ALL (needs access to coordinate other agents)

4. **QA Agent** (`qa-specialist`)
   - Testing and quality assurance for developed software
   - Testing frameworks, debugging, accessibility testing
   - MCP Tools: `eslint`, `playwright`, `accessibility-testing`, `user-testing`, `sourcery`

5. **Documentation Agent** (`documentation-agent`)
   - Documentation creation and maintenance
   - Technical writing, API documentation, developer guides
   - MCP Tools: `filesystem`, `github`, `memory`, `task-master-ai`

## Agent Workflow Requirements

### Task Management (CRITICAL)

- **ALWAYS** start job before beginning any task
- **ALWAYS** end job when task is complete
- Document task progress throughout
- Agent workflow separate from Claude code

### Basic Agent Workflow

```bash
# 1. Switch to Agent Workspace
task-master use-tag [agent-workspace]

# 2. Get Next Task
task-master next

# 3. Claim Task
task-master set-status --id=X.Y --status=in-progress

# 4. Update Progress
task-master update-task --id=X.Y --prompt="AGENT: [role] - [progress update]"

# 5. Complete Task
task-master set-status --id=X.Y --status=done
```

## System Commands

### Quick Start

```bash
# Start system
./start-taskmaster.sh

# Check health
npm run batch:health-check

# Access developer dashboard  
open http://localhost:3010/developer-interface

# Access agent management
open http://localhost:3010/agent-management
```

### Agent Management

```bash
# Start all agents
npm run agents:start

# Check status
npm run agents:status

# Health check
npm run agents:health-check

# Stop all agents
npm run agents:stop
```

### Task Operations

```bash
# Task router (interactive)
npm run task-router

# Process queue
npm run agents:process-queue

# View tasks
npm run tasks:status
```

## Development Priority

### Current Focus

- **Iterating Agents**: Improve existing agent capabilities
- **New Agent Development**: Add specialized agents as needed
- **Workflow Enhancement**: Refine agent coordination processes

### Agent Enhancement Areas

- Capability-based auto-assignment
- Cross-agent collaboration
- Developer approval workflow
- Batch operations efficiency

## Integration with Home Dashboard

This agent system supports YOUR development of the Home Dashboard (family interface):

- Frontend agents work on React components FOR the family
- Backend agents handle API development FOR the family dashboard
- QA agents ensure family-friendly usability
- Documentation agents create user guides FOR the family

## Agent Configuration (Manual Procedures)

### Edit Agent Tools

To modify which MCP tools an agent can use:

1. **Edit Agent Roles File**:

   ```bash
   # Edit the agent roles configuration
   nano .taskmaster/agents/agent-roles.json
   ```

2. **Update Tools Array**:

   ```json
   {
     "frontend-agent": {
       "tools": ["mcp__vite__*", "mcp__tailwindcss__*", "mcp__playwright__*"]
     }
   }
   ```

3. **Available Tool Categories**:
   - `mcp__vite__*` - Vite build tools
   - `mcp__tailwindcss__*` - Tailwind CSS tools
   - `mcp__playwright__*` - Browser testing
   - `mcp__eslint__*` - Code linting
   - `mcp__filesystem__*` - File operations
   - `mcp__github__*` - Git operations
   - `mcp__memory__*` - Memory management
   - `mcp__task-master-ai__*` - TaskMaster integration

### Edit Agent LLM Models

To change which LLM model an agent uses:

1. **Edit MCP Config** (location depends on your Claude setup):

   ```bash
   # Check your Claude configuration
   ~/.claude/config.json
   # or
   ~/.config/claude/config.json
   ```

2. **Update Agent Model Assignment**:

   ```json
   {
     "mcpServers": {
       "task-master-ai": {
         "agents": {
           "frontend-agent": {
             "model": "claude-3-5-sonnet-20241022"
           }
         }
       }
     }
   }
   ```

### TaskMaster Workspace Management

Common commands for project organization:

```bash
# List all workspaces
task-master tags

# Create new workspace
task-master add-tag project-name

# Switch to workspace
task-master use-tag project-name

# Delete workspace (careful!)
task-master delete-tag project-name
```

## Key Reminders

- **This is a DEVELOPER tool** - helps YOU build software
- **NOT a family system** - the family uses Home Dashboard
- Agent workflow separate from Claude code
- Always start and end jobs for every task
- 5-agent system with future iteration priority
- Supports both dev and live environments (192.168.1.74)
- Timeout optimizations prevent runaway processes

## Target Development

- **You develop with**: TaskMaster AI agents
- **Family uses**: Home Dashboard interface
- **Family gets**: Notice board, calendar, shopping lists, etc.
- **You get**: Coordinated development workflow

> **For complete development guidelines, infrastructure setup, and project context, see `/claude-project/CLAUDE.md`**
