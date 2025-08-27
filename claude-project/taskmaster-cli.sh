#!/bin/bash

# TaskMaster CLI Workflow Script
# Provides convenient commands for TaskMaster operations

# Set script directory for relative operations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to sync tasks with git
sync_tasks() {
    local commit_msg="${1:-Update tasks}"
    echo -e "${BLUE}Syncing with remote...${NC}"
    
    # Pull latest changes
    if ! git pull origin main --rebase; then
        echo -e "${YELLOW}Warning: Could not pull from remote. Continuing with local changes...${NC}"
    fi
    
    # Add task changes
    git add .taskmaster/tasks/
    
    # Commit if there are changes
    if git diff --cached --quiet; then
        echo -e "${GREEN}No changes to commit${NC}"
    else
        git commit -m "chore: $commit_msg" || echo -e "${RED}Commit failed${NC}"
        
        # Push to remote
        if ! git push origin main; then
            echo -e "${YELLOW}Warning: Could not push to remote. Changes committed locally.${NC}"
        else
            echo -e "${GREEN}✓ Changes pushed successfully${NC}"
        fi
    fi
}

# Complexity analysis command
complexity() {
    echo -e "${BLUE}Running task complexity analysis...${NC}"
    if task-master analyze-complexity --research; then
        echo -e "${GREEN}✓ Analysis complete${NC}"
        echo -e "${BLUE}Generating complexity report...${NC}"
        task-master complexity-report
    else
        echo -e "${RED}✗ Complexity analysis failed${NC}"
        return 1
    fi
}

# Expand all pending tasks
expand_all() {
    echo -e "${BLUE}Expanding all pending tasks...${NC}"
    if task-master expand --all --research; then
        echo -e "${GREEN}✓ Task expansion complete${NC}"
        sync_tasks "Auto-expanded pending tasks"
    else
        echo -e "${RED}✗ Task expansion failed${NC}"
        return 1
    fi
}

# Research-backed update for specific task
research() {
    local task_id=$1
    if [ -z "$task_id" ]; then
        echo -e "${RED}Error: Task ID required${NC}"
        echo "Usage: tm research <id>"
        return 1
    fi
    
    echo -e "${BLUE}Performing research-backed update for task $task_id...${NC}"
    if task-master update-task --id="$task_id" --research --prompt="Update with latest best practices and implementation approaches"; then
        echo -e "${GREEN}✓ Research update complete${NC}"
        sync_tasks "Research update for task $task_id"
    else
        echo -e "${RED}✗ Research update failed${NC}"
        return 1
    fi
}

# Validate task dependencies
validate() {
    echo -e "${BLUE}Validating task dependencies...${NC}"
    if task-master validate-dependencies; then
        echo -e "${GREEN}✓ All dependencies valid${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Dependency issues found. Run 'tm fix-deps' to resolve.${NC}"
        return 1
    fi
}

# Fix invalid dependencies
fix_deps() {
    echo -e "${BLUE}Fixing invalid dependencies...${NC}"
    if task-master fix-dependencies; then
        echo -e "${GREEN}✓ Dependencies fixed${NC}"
        sync_tasks "Fixed task dependencies"
    else
        echo -e "${RED}✗ Dependency fix failed${NC}"
        return 1
    fi
}

# Quick task listing
list() {
    echo -e "${BLUE}Current tasks:${NC}"
    task-master list
}

# Get next available task
next() {
    echo -e "${BLUE}Finding next available task...${NC}"
    task-master next
}

# Show specific task details
show() {
    local task_id=$1
    if [ -z "$task_id" ]; then
        echo -e "${RED}Error: Task ID required${NC}"
        echo "Usage: tm show <id>"
        return 1
    fi
    task-master show "$task_id"
}

# Set task status
status() {
    local task_id=$1
    local new_status=$2
    if [ -z "$task_id" ] || [ -z "$new_status" ]; then
        echo -e "${RED}Error: Task ID and status required${NC}"
        echo "Usage: tm status <id> <status>"
        echo "Status options: pending, in-progress, done, review, deferred, cancelled"
        return 1
    fi
    
    if task-master set-status --id="$task_id" --status="$new_status"; then
        echo -e "${GREEN}✓ Status updated${NC}"
        sync_tasks "Updated task $task_id status to $new_status"
    else
        echo -e "${RED}✗ Status update failed${NC}"
        return 1
    fi
}

# Add a new task
add() {
    local prompt="$*"
    if [ -z "$prompt" ]; then
        echo -e "${RED}Error: Task description required${NC}"
        echo "Usage: tm add <description>"
        return 1
    fi
    
    echo -e "${BLUE}Adding new task...${NC}"
    if task-master add-task --prompt="$prompt" --research; then
        echo -e "${GREEN}✓ Task added${NC}"
        sync_tasks "Added new task: $prompt"
    else
        echo -e "${RED}✗ Failed to add task${NC}"
        return 1
    fi
}

# Update a specific task
update() {
    local task_id=$1
    shift
    local prompt="$*"
    
    if [ -z "$task_id" ] || [ -z "$prompt" ]; then
        echo -e "${RED}Error: Task ID and update description required${NC}"
        echo "Usage: tm update <id> <description>"
        return 1
    fi
    
    echo -e "${BLUE}Updating task $task_id...${NC}"
    if task-master update-task --id="$task_id" --prompt="$prompt"; then
        echo -e "${GREEN}✓ Task updated${NC}"
        sync_tasks "Updated task $task_id"
    else
        echo -e "${RED}✗ Task update failed${NC}"
        return 1
    fi
}

# Expand a specific task
expand() {
    local task_id=$1
    if [ -z "$task_id" ]; then
        echo -e "${RED}Error: Task ID required${NC}"
        echo "Usage: tm expand <id>"
        return 1
    fi
    
    echo -e "${BLUE}Expanding task $task_id...${NC}"
    if task-master expand --id="$task_id" --research; then
        echo -e "${GREEN}✓ Task expanded${NC}"
        sync_tasks "Expanded task $task_id"
    else
        echo -e "${RED}✗ Task expansion failed${NC}"
        return 1
    fi
}

# Help function
help() {
    cat << EOF
${BLUE}TaskMaster CLI Workflow Commands:${NC}

${GREEN}Analysis & Planning:${NC}
  tm complexity      - Analyze task complexity
  tm expand-all      - Expand all pending tasks
  tm research <id>   - Research-backed task update

${GREEN}Validation:${NC}
  tm validate        - Check dependency validity
  tm fix-deps        - Fix invalid dependencies

${GREEN}Task Management:${NC}
  tm list           - List all tasks
  tm next           - Get next available task
  tm show <id>      - Show task details
  tm status <id> <status> - Update task status
  tm add <desc>     - Add new task
  tm update <id> <desc> - Update existing task
  tm expand <id>    - Expand task into subtasks

${GREEN}Git Integration:${NC}
  tm sync           - Sync tasks with git remote

${GREEN}Utilities:${NC}
  tm help           - Show this help message

${YELLOW}Note:${NC} This script assumes you're in a git repository with TaskMaster initialized.
      Most commands will automatically sync changes with git.

${YELLOW}Status options:${NC} pending, in-progress, done, review, deferred, cancelled

EOF
}

# Manual sync command
sync() {
    sync_tasks "Manual task sync"
}

# Main command router
case "${1:-help}" in
    # Analysis & Planning
    complexity) complexity ;;
    expand-all) expand_all ;;
    research) research "$2" ;;
    
    # Validation
    validate) validate ;;
    fix-deps) fix_deps ;;
    
    # Task Management
    list|ls) list ;;
    next) next ;;
    show) show "$2" ;;
    status) status "$2" "$3" ;;
    add) shift; add "$@" ;;
    update) update "$2" "${@:3}" ;;
    expand) expand "$2" ;;
    
    # Git Integration
    sync) sync ;;
    
    # Help
    help|--help|-h|"") help ;;
    
    # Unknown command
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run 'tm help' for available commands"
        exit 1
        ;;
esac

# Exit with the last command's exit code
exit $?