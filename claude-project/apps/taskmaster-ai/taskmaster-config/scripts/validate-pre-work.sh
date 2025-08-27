#!/bin/bash
# Pre-Work Validation Script
# Validates agent readiness before starting task implementation

TASK_ID=$1
AGENT_ROLE=$2
AGENT_ID=$3

if [ -z "$TASK_ID" ] || [ -z "$AGENT_ROLE" ] || [ -z "$AGENT_ID" ]; then
    echo "Usage: $0 <task-id> <agent-role> <agent-id>"
    echo "Example: $0 5.2 qa-specialist agent-qa-001"
    exit 1
fi

echo "🔍 Starting pre-work validation for task $TASK_ID"
echo "Agent: $AGENT_ID ($AGENT_ROLE)"

# 1. Environment checks
echo "📋 Validating environment..."

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Git working directory must be clean before starting work"
    echo "Current status:"
    git status --short
    exit 1
fi

# Check if on correct branch
current_branch=$(git branch --show-current)
echo "✅ Git working directory clean (branch: $current_branch)"

# Update from remote
echo "🔄 Pulling latest changes..."
if ! git pull origin main; then
    echo "❌ Failed to pull latest changes"
    exit 1
fi
echo "✅ Repository updated"

# 2. Dependencies and build
echo "📦 Validating dependencies and build..."

# Install dependencies
if [ -f "package.json" ]; then
    if ! npm install; then
        echo "❌ npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
    
    # Verify build
    if ! npm run build; then
        echo "❌ Build failed - fix errors before starting work"
        exit 1
    fi
    echo "✅ Build successful"
fi

# 3. TaskMaster context validation
echo "🎯 Validating TaskMaster context..."

# Switch to agent role context
if ! task-master use-tag "$AGENT_ROLE"; then
    echo "❌ Failed to switch to agent role context: $AGENT_ROLE"
    exit 1
fi
echo "✅ Switched to agent role context: $AGENT_ROLE"

# Validate task exists and is accessible
if ! task-master show "$TASK_ID" > /dev/null 2>&1; then
    echo "❌ Task $TASK_ID not found or not accessible in current context"
    exit 1
fi
echo "✅ Task $TASK_ID validated and accessible"

# Check task dependencies
echo "🔗 Validating task dependencies..."
if ! task-master validate-dependencies; then
    echo "❌ Task dependencies validation failed"
    exit 1
fi
echo "✅ Task dependencies validated"

# 4. Agent registration
echo "👤 Registering agent..."

# Register agent in coordination system
if [ -f ".taskmaster/agents/coordination-workflow.cjs" ]; then
    if ! node .taskmaster/agents/coordination-workflow.cjs register "$AGENT_ID" "$AGENT_ROLE"; then
        echo "❌ Agent registration failed"
        exit 1
    fi
    echo "✅ Agent registered in coordination system"
fi

# 5. Task claiming
echo "📝 Claiming task..."

# Check if task is in claimable state
task_status=$(task-master show "$TASK_ID" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
if [ "$task_status" != "pending" ] && [ "$task_status" != "deferred" ]; then
    echo "❌ Task $TASK_ID is not in claimable state (current: $task_status)"
    exit 1
fi

# Claim task
if ! task-master set-status --id="$TASK_ID" --status=in-progress; then
    echo "❌ Failed to claim task $TASK_ID"
    exit 1
fi
echo "✅ Task claimed and status set to in-progress"

# 6. Document pre-work completion
echo "📄 Documenting pre-work completion..."

pre_work_log="AGENT: $AGENT_ROLE - Pre-work checklist completed ✅
Agent ID: $AGENT_ID
Environment: Git clean, dependencies installed, build successful
Context: TaskMaster context validated, task accessible
Dependencies: Task dependencies validated
Registration: Agent registered in coordination system
Status: Task claimed and ready for implementation
Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if ! task-master update-subtask --id="$TASK_ID" --prompt="$pre_work_log"; then
    echo "❌ Failed to document pre-work completion"
    exit 1
fi
echo "✅ Pre-work completion documented"

# 7. MCP tool authorization validation
echo "🔍 Validating MCP tool authorization..."

# Define authorized tools for each role
case "$AGENT_ROLE" in
    "frontend-architect")
        authorized_tools="mcp__design-system__* mcp__performance-monitoring__* mcp__accessibility__*"
        restricted_tools="mcp__user-testing__* mcp__puppeteer__* mcp__docker__*"
        ;;
    "ui-developer")
        authorized_tools="mcp__accessibility__* mcp__user-testing__* mcp__design-system__*"
        restricted_tools="mcp__performance-monitoring__* mcp__puppeteer__* mcp__docker__*"
        ;;
    "backend-agent")
        authorized_tools="mcp__task-master-ai__*"
        restricted_tools="mcp__accessibility__* mcp__user-testing__* mcp__design-system__* mcp__puppeteer__* mcp__docker__* mcp__performance-monitoring__*"
        ;;
    "integration-specialist")
        authorized_tools="mcp__task-master-ai__*"
        restricted_tools="mcp__accessibility__* mcp__user-testing__* mcp__design-system__* mcp__puppeteer__* mcp__docker__* mcp__performance-monitoring__*"
        ;;
    "qa-specialist")
        authorized_tools="mcp__accessibility__* mcp__user-testing__* mcp__puppeteer__* mcp__performance-monitoring__*"
        restricted_tools="mcp__design-system__* mcp__docker__*"
        ;;
    "devops-agent")
        authorized_tools="mcp__docker__*"
        restricted_tools="mcp__accessibility__* mcp__user-testing__* mcp__design-system__* mcp__puppeteer__* mcp__performance-monitoring__*"
        ;;
esac

# Create tool authorization file for runtime validation
cat > ".taskmaster/agent-tool-auth.json" <<EOF
{
  "agentRole": "$AGENT_ROLE",
  "agentId": "$AGENT_ID",
  "taskId": "$TASK_ID",
  "authorizedTools": ["$authorized_tools"],
  "restrictedTools": ["$restricted_tools"],
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ MCP tool authorization configured for $AGENT_ROLE"
echo "   Authorized: $authorized_tools"
echo "   Restricted: $restricted_tools"

echo ""
echo "🎉 PRE-WORK VALIDATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Task: $TASK_ID"
echo "Agent: $AGENT_ID ($AGENT_ROLE)"
echo "Status: Ready for implementation"
echo "Time: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Agent is now cleared to begin task implementation"
echo "⚠️  Remember to run post-work validation before marking task as complete"