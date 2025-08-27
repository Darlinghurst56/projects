# Standardized Agent Workflow System

## Overview
This document defines the mandatory workflow that ALL agents must follow when starting and completing tasks. This ensures consistency, quality, and proper coordination across the multi-agent system.

## 🔄 Complete Agent Workflow

### Phase 1: Pre-Work Validation (MANDATORY)
**Status**: Task must be `pending` or `deferred`
**Duration**: 5-10 minutes
**Checklist**: `agent-pre-work-checklist.md`

```bash
# 1. Environment validation
./scripts/validate-environment.sh

# 2. TaskMaster context setup
task-master use-tag --name=<agent-role>
task-master show <task-id>
task-master validate-dependencies

# 3. Agent registration and task claiming
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>
task-master set-status --id=<task-id> --status=in-progress

# 4. Pre-work documentation
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Pre-work checklist completed ✅"
```

**Failure Action**: If any pre-work check fails, task cannot proceed to implementation phase.

### Phase 2: Implementation (AGENT-SPECIFIC)
**Status**: Task must be `in-progress`
**Duration**: Variable based on task complexity
**Requirements**: Follow role-specific implementation guidelines

```bash
# Implementation work using role-specific tools and patterns
# Regular progress updates required
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - <progress update>"
```

### Phase 3: Post-Work Validation (MANDATORY)
**Status**: Task implementation complete, ready for validation
**Duration**: 10-15 minutes
**Checklist**: `agent-completion-checklist.md`

```bash
# 1. Code quality validation
mcp__eslint__lint-files [modified-files]
npm test
npm run build

# 2. Git workflow compliance
git add .
git commit -m "feat: <description> (task <task-id>)"

# 3. Final task documentation
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Task completed. Post-work checklist completed ✅"

# 4. Task completion (only after all checks pass)
task-master set-status --id=<task-id> --status=done
```

**Failure Action**: If any post-work check fails, task cannot be marked as complete.

---

## 🛠️ Workflow Enforcement Scripts

### Pre-Work Validation Script
```bash
#!/bin/bash
# File: .taskmaster/scripts/validate-pre-work.sh

TASK_ID=$1
AGENT_ROLE=$2
AGENT_ID=$3

echo "🔍 Starting pre-work validation for task $TASK_ID"

# 1. Environment checks
if ! git status --porcelain | grep -q "^??" ; then
    echo "❌ Clean git status required"
    exit 1
fi

if ! npm run build > /dev/null 2>&1 ; then
    echo "❌ Build must succeed before starting work"
    exit 1
fi

# 2. TaskMaster context
if ! task-master use-tag --name=$AGENT_ROLE ; then
    echo "❌ Failed to switch to agent role context"
    exit 1
fi

if ! task-master show $TASK_ID > /dev/null ; then
    echo "❌ Task not found or not accessible"
    exit 1
fi

# 3. Agent registration
if ! node .taskmaster/agents/coordination-workflow.cjs register $AGENT_ID $AGENT_ROLE ; then
    echo "❌ Agent registration failed"
    exit 1
fi

# 4. Task claiming
if ! task-master set-status --id=$TASK_ID --status=in-progress ; then
    echo "❌ Failed to claim task"
    exit 1
fi

echo "✅ Pre-work validation complete - Agent cleared to begin implementation"
```

### Post-Work Validation Script
```bash
#!/bin/bash
# File: .taskmaster/scripts/validate-post-work.sh

TASK_ID=$1
AGENT_ROLE=$2
MODIFIED_FILES=${3:-""}

echo "🔍 Starting post-work validation for task $TASK_ID"

# 1. Code quality validation
if [ -n "$MODIFIED_FILES" ]; then
    echo "Running ESLint on modified files..."
    if ! mcp__eslint__lint-files $MODIFIED_FILES ; then
        echo "❌ ESLint validation failed"
        exit 1
    fi
fi

# 2. Test execution
if ! npm test ; then
    echo "❌ Tests failed"
    exit 1
fi

# 3. Build verification
if ! npm run build ; then
    echo "❌ Build failed"
    exit 1
fi

# 4. Git workflow
if ! git status --porcelain | grep -q "^M\|^A\|^D" ; then
    echo "❌ No changes to commit"
    exit 1
fi

# 5. Documentation requirement
if ! task-master show $TASK_ID | grep -q "Post-work checklist completed" ; then
    echo "❌ Post-work documentation required"
    exit 1
fi

echo "✅ Post-work validation complete - Agent cleared to mark task as done"
```

---

## 🔒 Workflow State Management

### Task State Transitions
```
pending → [pre-work validation] → in-progress → [implementation] → [post-work validation] → done
```

### State Validation Rules
- **pending → in-progress**: Requires pre-work checklist completion
- **in-progress → done**: Requires post-work checklist completion
- **Any state → blocked**: Allowed with proper documentation
- **done → in-progress**: Requires manager approval

### Automated State Enforcement
```javascript
// TaskMaster hook for state validation
function validateStateTransition(taskId, fromStatus, toStatus, agentRole) {
    if (fromStatus === 'pending' && toStatus === 'in-progress') {
        return validatePreWorkCompleted(taskId, agentRole);
    }
    
    if (fromStatus === 'in-progress' && toStatus === 'done') {
        return validatePostWorkCompleted(taskId, agentRole);
    }
    
    return true; // Allow other transitions
}
```

---

## 📋 Standardized Checklists by Role

### Universal Checklist Items (All Agents)
- [ ] Git repository clean and synced
- [ ] Dependencies installed and build successful
- [ ] TaskMaster context properly configured
- [ ] Agent registered in coordination system
- [ ] Task claimed and status updated
- [ ] Required tools accessible and functional

### Role-Specific Additions

#### Frontend Architect
- [ ] Design system tools accessible
- [ ] Performance monitoring configured
- [ ] Architecture documentation reviewed

#### UI Developer
- [ ] Accessibility testing tools ready
- [ ] User testing framework configured
- [ ] Design system components accessible

#### Backend Agent
- [ ] Database connections verified
- [ ] API testing tools configured
- [ ] Server monitoring setup

#### Integration Specialist
- [ ] API integration tools ready
- [ ] Data validation tools configured
- [ ] Service coordination setup

#### QA Specialist
- [ ] All testing tools accessible
- [ ] Browser automation configured
- [ ] Performance testing ready

#### DevOps Agent
- [ ] Container management tools ready
- [ ] Infrastructure tools configured
- [ ] Deployment pipelines accessible

---

## 🚨 Workflow Violation Handling

### Violation Types
1. **Pre-work bypass**: Starting work without completing pre-work checklist
2. **Post-work bypass**: Marking task complete without post-work validation
3. **Tool misuse**: Using tools outside of allowed role permissions
4. **State violation**: Invalid task state transitions

### Violation Response
```bash
# Automatic violation detection
task-master validate-workflow --task-id=<task-id> --agent-role=<role>

# Violation documentation
task-master update-task --id=<task-id> --prompt="WORKFLOW VIOLATION: <violation-type>
Agent: <agent-id>
Time: <timestamp>
Details: <violation-details>
Action: <corrective-action>
Status: Task returned to previous valid state"
```

### Violation Recovery
1. **Immediate**: Revert task to previous valid state
2. **Documentation**: Log violation details and corrective action
3. **Notification**: Alert team of workflow violation
4. **Remediation**: Complete proper workflow steps
5. **Review**: Analyze violation for process improvement

---

## 📊 Workflow Metrics and Monitoring

### Key Performance Indicators
- **Pre-work compliance rate**: % of tasks with completed pre-work checklist
- **Post-work compliance rate**: % of tasks with completed post-work validation
- **Average workflow time**: Time from task start to completion
- **Violation rate**: Number of workflow violations per 100 tasks
- **Quality metrics**: Defect rate, rework rate, customer satisfaction

### Monthly Reporting
```bash
# Generate workflow compliance report
task-master generate-workflow-report --month=<month> --year=<year>

# Metrics include:
# - Compliance rates by agent role
# - Common workflow violations
# - Average completion times
# - Quality metrics by workflow phase
```

---

## 🔄 Continuous Improvement

### Regular Review Process
- **Weekly**: Review workflow violations and quick fixes
- **Monthly**: Analyze workflow metrics and identify improvements
- **Quarterly**: Major workflow updates and training
- **Annually**: Complete workflow system review and redesign

### Feedback Integration
- Agent feedback on workflow efficiency
- Task completion quality correlation
- Tool usage patterns and optimization
- Process bottleneck identification

---

**Version**: 1.0  
**Effective Date**: January 2025  
**Mandatory For**: All Claude Code agents  
**Review Cycle**: Monthly  
**Maintained By**: Task Management Team