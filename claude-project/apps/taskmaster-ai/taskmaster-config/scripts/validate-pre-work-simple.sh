#!/bin/bash
# Simplified Pre-Work Validation Script (for agent testing)
# Validates agent readiness without git pull issues

TASK_ID=$1
AGENT_ROLE=$2
AGENT_ID=$3

if [ -z "$TASK_ID" ] || [ -z "$AGENT_ROLE" ] || [ -z "$AGENT_ID" ]; then
    echo "Usage: $0 <task-id> <agent-role> <agent-id>"
    echo "Example: $0 19 qa-specialist family-dashboard-qa-001"
    exit 1
fi

echo "🔍 Starting simplified pre-work validation for task $TASK_ID"
echo "Agent: $AGENT_ID ($AGENT_ROLE)"

# 1. Basic environment checks
echo "📋 Validating environment..."

# Check if task exists
if ! task-master show $TASK_ID >/dev/null 2>&1; then
    echo "❌ Task $TASK_ID not found"
    exit 1
fi
echo "✅ Task $TASK_ID exists"

# Check if agent role is valid
case $AGENT_ROLE in
    qa-specialist|ui-developer|integration-specialist|backend-agent|devops-agent|frontend-architect)
        echo "✅ Agent role '$AGENT_ROLE' is valid"
        ;;
    *)
        echo "❌ Invalid agent role '$AGENT_ROLE'"
        exit 1
        ;;
esac

# Check basic dependencies
if ! command -v task-master >/dev/null 2>&1; then
    echo "❌ task-master CLI not found"
    exit 1
fi
echo "✅ task-master CLI available"

# Check if task is available for this agent
echo "🎯 Checking task assignment..."
TASK_SHOW_OUTPUT=$(task-master show $TASK_ID 2>&1)
if echo "$TASK_SHOW_OUTPUT" | grep -q "not found"; then
    echo "❌ Task $TASK_ID not found"
    exit 1
elif echo "$TASK_SHOW_OUTPUT" | grep -q "○ pending"; then
    echo "✅ Task $TASK_ID is available for assignment"
elif echo "$TASK_SHOW_OUTPUT" | grep -q "● in-progress"; then
    echo "❌ Task $TASK_ID is already in progress"
    exit 1
elif echo "$TASK_SHOW_OUTPUT" | grep -q "✓ done"; then
    echo "❌ Task $TASK_ID is already completed"
    exit 1
else
    echo "❌ Task $TASK_ID is not in a valid state for assignment"
    exit 1
fi

echo "✅ Pre-work validation passed for agent $AGENT_ID"
echo "🚀 Agent is ready to start task $TASK_ID"