#!/bin/bash
# Pre-Work Validation Script (Test Version)
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

# Skip git pull for test
echo "⏭️ Skipping git pull for test"

# 2. Dependencies and build
echo "📦 Validating dependencies and build..."

# Install dependencies
if [ -f "package.json" ]; then
    echo "✅ Dependencies validation skipped for test"
else
    echo "ℹ️ No package.json found"
fi

# 3. TaskMaster context validation
echo "🎯 Validating TaskMaster context..."

# Check if task-master command is available
if ! command -v task-master &> /dev/null; then
    echo "❌ task-master command not found"
    exit 1
fi
echo "✅ TaskMaster CLI available"

# Switch to agent role context
echo "🔀 Switching to agent role context..."
if ! task-master use-tag $AGENT_ROLE 2>/dev/null; then
    echo "⚠️ Warning: Failed to switch to agent role context (continuing anyway)"
else
    echo "✅ Switched to $AGENT_ROLE context"
fi

# Validate task exists and is accessible
echo "📋 Validating task accessibility..."
if ! task-master show $TASK_ID 2>/dev/null; then
    echo "❌ Task $TASK_ID not found or not accessible in current context"
    exit 1
fi
echo "✅ Task $TASK_ID is accessible"

# 4. Agent registration simulation
echo "👤 Simulating agent registration..."
echo "✅ Agent $AGENT_ID would be registered as $AGENT_ROLE"

# 5. Task claiming simulation
echo "📌 Simulating task claiming..."
echo "✅ Task $TASK_ID would be claimed by $AGENT_ID"

# 6. Tool access validation
echo "🔧 Validating tool access..."

# Check role-specific tool restrictions
if [ -f ".claude/agent-tools/tool-restrictions.json" ]; then
    echo "✅ Tool restrictions configuration found"
    if [ -f ".claude/agent-tools/restrict-tools.cjs" ]; then
        echo "✅ Tool restriction manager available"
    else
        echo "⚠️ Warning: Tool restriction manager not found"
    fi
else
    echo "⚠️ Warning: Tool restrictions not configured"
fi

echo ""
echo "✅ PRE-WORK VALIDATION COMPLETE"
echo "Agent $AGENT_ID is cleared to begin implementation of task $TASK_ID"
echo ""
echo "Next steps:"
echo "1. Set task status to in-progress: task-master set-status --id=$TASK_ID --status=in-progress"
echo "2. Document start of work: task-master update-subtask --id=$TASK_ID --prompt=\"AGENT: $AGENT_ROLE - Pre-work checklist completed ✅\""
echo "3. Begin implementation following role-specific guidelines"