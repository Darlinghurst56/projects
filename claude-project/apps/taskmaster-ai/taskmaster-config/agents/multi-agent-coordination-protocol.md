# Multi-Agent Coordination Protocol

## Agent Priority Hierarchy (Conflict Resolution)

When task conflicts arise, resolve using this priority order:

1. **server-agent** (Highest) - Infrastructure, deployment, server operations
2. **integration-specialist** - API connections, data flow, backend integration  
3. **ui-developer** - Frontend components, UI/UX improvements
4. **qa-specialist** - Testing, validation (waits for implementation)
5. **backend-agent** - Backend logic (coordinates with integration-specialist)

## Task Claiming Protocol

### Before Starting Work

```bash
# 1. Check task status
task-master show <taskId>

# 2. Claim task (if available)
task-master set-status --id=<taskId> --status=in-progress

# 3. Add agent attribution
task-master update-subtask --id=<taskId> --prompt="AGENT: <roleName> - Starting work on <description>"
```

### During Work

```bash
# Regular progress updates
task-master update-subtask --id=<taskId> --prompt="AGENT: <roleName> - Progress: <update>"
```

### When Completing

```bash
# Mark complete
task-master set-status --id=<taskId> --status=done

# Final attribution
task-master update-subtask --id=<taskId> --prompt="AGENT: <roleName> - COMPLETED: <summary>"
```

## Conflict Resolution Rules

### If Task Already In-Progress

1. Check who owns the task via subtask updates
2. If same priority level: coordinate via handoff protocol
3. If different priority: higher priority agent takes over
4. Always add coordination notes in subtasks

### If Validation Errors Occur

1. Use simpler operations (update-subtask instead of update-task)
2. Avoid AI-generated complex responses
3. Use manual field specification
4. Retry with basic text updates only

### Tag Context Management

1. Always verify tag after switching: `task-master list-tags`
2. Confirm current context before operations: `task-master list`
3. Use git commits for audit trail: include agent role in commit messages

## Emergency Protocols

### State Corruption Recovery

```bash
# Reset to known good state
git status
git commit -am "Save current agent work"
task-master validate-dependencies
task-master use-tag --name=<requiredRole>
```

### Process Conflicts

```bash
# Check for duplicate processes
ps aux | grep task-master
# Kill duplicates if needed, keep primary MCP session
```

## Implementation Status

- ✅ Priority hierarchy defined
- ✅ Task claiming protocol established  
- ✅ Conflict resolution rules documented
- ⏳ Automated enforcement pending
- ⏳ Session management system pending
