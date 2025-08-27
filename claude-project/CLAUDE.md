🚨 Claude Project - Project-Specific Instructions
For main development guidelines, see `/projects/CLAUDE.md`
This file contains claude-project specific information

# Claude Project - Main Development Hub

This is the primary development project containing family automation applications and developer tools.

## Current Apps in This Project

### 1. Home Dashboard (MOVED TO MAIN PROJECT)
- **Old Path**: `./apps/home-dashboard/` (REMOVED)
- **Active Path**: `/projects/home-dashboard/`
- **Status**: ✅ MOVED TO MAIN PROJECT
- **IMPORTANT**: Use `/projects/home-dashboard/` for all family dashboard work
- **Features**: Complete browser testing infrastructure, backend/frontend separation, comprehensive testing suite

### 2. TaskMaster AI - SECONDARY (DEVELOPER TOOL)
- **Path**: `./apps/taskmaster-ai/` (within claude-project)
- **Full Path**: `/projects/claude-project/apps/taskmaster-ai/`
- **Purpose**: DEVELOPER task coordination system (helps YOU develop)
- **5 Agents**: Frontend Dev, Backend Dev, Orchestrator, QA Agent, Documentation Agent
- **Target User**: YOU (the developer) - NOT the family
- **Function**: Helps coordinate development tasks for building Home Dashboard

## TaskMaster AI Agent System (DEVELOPER TOOL)
- **Location**: `./apps/taskmaster-ai/`
- **Purpose**: Developer task coordination and automation
- **Workflow Separation**: Agent workflow and tools separate from Claude code
- **Agent Roles** (for development tasks):
  - Frontend Dev: UI/UX development
  - Backend Dev: API and server development
  - Orchestrator: Task coordination and management
  - QA Agent: Testing and quality assurance
  - Documentation Agent: Documentation creation and maintenance

## Home Dashboard Development (MOVED TO MAIN PROJECT)

### ✅ COMPLETED: Home Dashboard Migration
- **Old Location**: `./apps/home-dashboard/` (REMOVED - 2025-08-01)
- **Active Location**: `/projects/home-dashboard/` (ACTIVE)
- **Migration Status**: Complete - deprecated copy removed
- **Action Required**: Always use `/projects/home-dashboard/` for family dashboard work

## TaskMaster AI Development (DEVELOPER TOOL)

### Current 5 Agents (HELP YOU DEVELOP)
1. **Frontend Dev**: UI/UX development and components
2. **Backend Dev**: APIs, databases, server logic
3. **Orchestrator**: Task coordination and human interface
4. **QA Agent**: Testing and quality assurance
5. **Documentation Agent**: Documentation creation and maintenance

### Next Priority
- **Iterating Agents**: Improve existing agent capabilities
- **New Agent Development**: Add specialized agents as needed
- **Workflow Enhancement**: Refine agent coordination processes


## TaskMaster AI (when available)
```bash
# Basic task management
task-master list                    # Show all tasks
task-master next                    # Get next task
task-master show <id>               # View task details

# Workspaces
task-master tags                    # List workspaces
task-master use-tag <workspace>     # Switch workspace
```

## Project Structure
```
/home/darlinghurstlinux/projects/claude-project/   # This project directory
├── apps/                                          # Applications within this project
│   ├── home-dashboard/                           # DEPRECATED - Use /projects/home-dashboard/
│   └── taskmaster-ai/                           # Developer tool (PRIMARY APP)
├── CLAUDE.md                                     # This file - project instructions
├── dashboard/                                    # Legacy dashboard experiments
├── [removed litellm/ - use /shared/config/litellm/]
├── mcp-servers/                                  # MCP server implementations
└── [other project files]
```

## Location Context
- **This Project**: `/home/darlinghurstlinux/projects/claude-project/`
- **Projects Root**: `/home/darlinghurstlinux/projects/`
- **Other Projects**: CrewAI, CrewAI Studio, home-dashboard (deprecated), etc.

## Project-Specific Reminders
- **Main Guidelines**: See `/projects/CLAUDE.md` for core development principles
- **TaskMaster AI** = Developer tool within this project to help build software
- **Home Dashboard** = MOVED to `/projects/home-dashboard/` (standalone project)
- **Active Apps**: TaskMaster AI is the primary app in this project
- **Cleanup Needed**: Remove the deprecated home-dashboard copy from apps/
- TaskMaster AI helps coordinate development tasks