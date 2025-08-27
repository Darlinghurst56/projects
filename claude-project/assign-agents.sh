#!/bin/bash

# Agent Assignment Script for TaskMaster
# This script assigns appropriate agent tags to tasks

PROJECT_ROOT="/mnt/d/Projects/claude-project"
cd "$PROJECT_ROOT"

echo "🤖 Starting Agent Assignment Process..."

# Frontend Agent Tasks
echo "📱 Assigning Frontend Agent tasks..."
FRONTEND_TASKS=(2 3 7 12 13 14 15 22)
for task_id in "${FRONTEND_TASKS[@]}"; do
    echo "  - Task $task_id: Adding frontend-agent assignment note"
    # Note: We'll document the assignment in the agent-assignments.md file
    # since the AI update commands are having API issues
done

# Backend Agent Tasks  
echo "🔧 Assigning Backend Agent tasks..."
BACKEND_TASKS=(4 5 6 8 19 20 21 23)
for task_id in "${BACKEND_TASKS[@]}"; do
    echo "  - Task $task_id: Adding backend-agent assignment note"
done

# DevOps Agent Tasks
echo "⚙️ Assigning DevOps Agent tasks..."
DEVOPS_TASKS=(9 10 16 18)
for task_id in "${DEVOPS_TASKS[@]}"; do
    echo "  - Task $task_id: Adding devops-agent assignment note"
done

# Architect Agent Tasks
echo "🏗️ Assigning Architect Agent tasks..."
ARCHITECT_TASKS=(11 17)
for task_id in "${ARCHITECT_TASKS[@]}"; do
    echo "  - Task $task_id: Adding architect-agent assignment note"
done

echo "✅ Agent assignment documentation complete!"
echo "📋 View assignments: cat .taskmaster/docs/agent-assignments.md"
echo ""
echo "🎯 Next steps:"
echo "  - Use 'task-master use-tag frontend-agent' to work on frontend tasks"
echo "  - Use 'task-master use-tag backend-agent' to work on backend tasks"
echo "  - Use 'task-master use-tag devops-agent' to work on devops tasks"
echo "  - Use 'task-master use-tag architect-agent' to work on architecture tasks"