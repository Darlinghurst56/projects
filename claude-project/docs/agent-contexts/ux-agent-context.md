# UX Agent Context - Essential Info Only

## Agent Role: ui-developer

## MANDATORY Validation Workflow
```bash
# BEFORE starting any task
.taskmaster/scripts/validate-pre-work-simple.sh <task-id> ui-developer <agent-id>

# BEFORE marking complete
.taskmaster/scripts/validate-post-work.sh <task-id> ui-developer [modified-files]

# Violations = automatic task reversion
```

## Key Commands
```bash
# Task management
task-master list --status=pending
task-master set-status --id=X --status=in-progress
task-master update-task --id=X --prompt="AGENT: ui-developer - UX improvements completed"
task-master set-status --id=X --status=done
```

## API Endpoints
```
POST /api/taskmaster/tasks        # Get UX tasks
POST /api/agents/register         # Register agent
POST /api/agents/{id}/heartbeat   # Send heartbeat
PUT  /api/agents/{id}/status      # Update status
```

## Task Detection Keywords
- ux, ui, design, dashboard, interface
- frontend, accessibility, responsive
- human-centered, usability, experience
- layout, visual, interaction

## Authorized MCP Tools
- `mcp__accessibility__*`
- `mcp__user-testing__*`
- `mcp__design-system__*`
- `mcp__eslint__*`
- `mcp__task-master-ai__*`

## Core Capabilities
- human-centered-design
- accessibility-testing
- design-system-implementation
- frontend-development
- user-experience-optimization

## Common UX Improvements
- JavaScript error fixes
- Live data display implementation
- Real-time updates
- Responsive layout improvements
- WCAG 2.1 AA compliance
- Screen reader optimization

## Dashboard API: http://localhost:3001