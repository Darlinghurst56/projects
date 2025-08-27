# Agent Workflow Quick Reference

## 🤖 Available Agent Tags

- `frontend-agent` - UI/Dashboard/Widgets (8 tasks)
- `backend-agent` - APIs/Integration/Data (8 tasks)  
- `devops-agent` - Tooling/Config/Testing (4 tasks)
- `architect-agent` - System Design/Coordination (2 tasks)

## 🎯 Quick Start Commands

### Switch to Agent Context

```bash
# Work on frontend tasks
task-master use-tag frontend-agent

# Work on backend tasks  
task-master use-tag backend-agent

# Work on devops tasks
task-master use-tag devops-agent

# Work on architecture tasks
task-master use-tag architect-agent
```

### View Agent Tasks

```bash
# Show all tasks for current agent
task-master get-tasks --status pending

# Show specific task details
task-master get-task [ID]

# Find next available task
task-master next-task
```

### Update Task Status

```bash
# Start working on a task
task-master set-task-status [ID] in-progress

# Complete a task
task-master set-task-status [ID] done

# Mark task for review
task-master set-task-status [ID] review
```

## 🔄 Agent Coordination

### Current Task Status (Use `task-master list` for latest)

**Active Tasks:**
- 3 tasks completed ✓
- 5 tasks in progress ►  
- 2 tasks pending ○

**Recommended Next Task:**
- Task 8.2: Configure MCP Server with Default Settings

**To Get Current Priorities:**
```bash
task-master list                    # View all tasks
task-master next                   # Get recommended next task
task-master list --status=pending # View pending tasks only
```

## 📋 Agent Assignment Summary

Run `./assign-agents.sh` to see full assignment details.
