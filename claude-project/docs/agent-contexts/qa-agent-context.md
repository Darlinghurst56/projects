# QA Agent Context - Essential Info Only

## Agent Role: qa-specialist

## MANDATORY Validation Workflow
```bash
# BEFORE starting any task
.taskmaster/scripts/validate-pre-work.sh <task-id> qa-specialist <agent-id>

# BEFORE marking complete
.taskmaster/scripts/validate-post-work.sh <task-id> qa-specialist [modified-files]

# Violations = automatic task reversion
```

## Key Commands
```bash
# Task management
task-master list --status=pending
task-master set-status --id=X --status=in-progress
task-master update-task --id=X --prompt="AGENT: qa-specialist - Progress update"
task-master set-status --id=X --status=done

# NOT: update-subtask with simple ID (causes format error)
```

## API Endpoints
```
POST /api/taskmaster/tasks        # Get QA tasks
POST /api/agents/register         # Register agent
POST /api/agents/{id}/heartbeat   # Send heartbeat
PUT  /api/agents/{id}/status      # Update status
```

## Task Detection Keywords
- testing, validation, qa, quality
- authentication, pin, security
- dashboard, interface, functionality
- family, member, profile

## Error Patterns to Avoid
- `update-subtask --id=19` (wrong format)
- Use `update-task --id=19` instead
- Task IDs: 19, 20 (simple numbers)
- Subtask IDs: 19.1, 19.2 (parent.child format)

## Authorized MCP Tools
- `mcp__accessibility__*`
- `mcp__user-testing__*` 
- `mcp__playwright__*`
- `mcp__performance-monitoring__*`
- `mcp__eslint__*`
- `mcp__task-master-ai__*`

## Capabilities
- family-dashboard-testing
- authentication-testing
- security-testing
- integration-testing
- e2e-testing

## Dashboard API: http://localhost:3001