#!/bin/bash

# TaskMaster AI Starting Script
# Based on developer-interface README and existing server patterns

echo "🤖 TaskMaster AI - Smart Starting Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "CLAUDE.md" ]; then
    print_error "Not in TaskMaster AI directory. Please run from /mnt/d/Projects/y/claude-project/apps/taskmaster-ai/"
    exit 1
fi

# Function to run simple tests
run_simple_tests() {
    print_status "Running simple system tests..."
    
    # Check if test script exists
    if [ -f ".taskmaster/agents/__tests__/run-tests.cjs" ]; then
        # Run tests but don't fail launch if tests fail
        npm test 2>&1 | grep -E "(✅|❌|Test Results)" || true
        print_status "Test run completed"
    else
        print_warning "Test file not found - skipping tests"
    fi
}

# Function to check if server is running
check_server_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/api/health 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to get server status
get_server_status() {
    if check_server_health; then
        curl -s http://localhost:3010/api/health 2>/dev/null | jq -r '.status // "unknown"' 2>/dev/null || echo "healthy"
    else
        echo "not running"
    fi
}

# Function to hot swap server
hot_swap_server() {
    print_status "Performing hot swap of TaskMaster server..."
    
    # Stop current server
    npm run system:stop >/dev/null 2>&1
    sleep 2
    
    # Start new server
    npm run system:start >/dev/null 2>&1
    sleep 3
    
    # Check if new server is healthy
    if check_server_health; then
        print_success "Hot swap completed successfully"
        return 0
    else
        print_error "Hot swap failed - server not responding"
        return 1
    fi
}

# Function to start fresh server
start_fresh_server() {
    print_status "Starting TaskMaster API server..."
    
    # Ensure no lingering processes
    pkill -f taskmaster-api-server.js >/dev/null 2>&1
    sleep 1
    
    # Start server
    npm start >/dev/null 2>&1 &
    sleep 3
    
    # Check if server started successfully
    if check_server_health; then
        print_success "TaskMaster API server started successfully"
        return 0
    else
        print_error "Failed to start TaskMaster API server"
        return 1
    fi
}

# Main execution
print_status "Checking TaskMaster system status..."

# Run simple tests first
run_simple_tests
echo ""

# Check current server status
server_status=$(get_server_status)
print_status "Current server status: $server_status"

case $server_status in
    "healthy")
        print_success "TaskMaster API server is already running and healthy"
        echo ""
        print_status "Available interfaces:"
        echo "  • Web Dashboard: http://localhost:3010/"
        echo "  • Developer Interface: http://localhost:3010/developer-interface"
        echo "  • API Health: http://localhost:3010/api/health"
        echo ""
        read -p "Do you want to hot swap the server? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            hot_swap_server
        else
            print_status "Server already running - no action needed"
        fi
        ;;
    "not running")
        print_warning "TaskMaster API server is not running"
        if start_fresh_server; then
            print_success "System ready!"
        else
            print_error "Failed to start system"
            exit 1
        fi
        ;;
    *)
        print_warning "Server status unclear: $server_status"
        read -p "Attempt to restart server? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_status "Skipping server restart"
        else
            hot_swap_server
        fi
        ;;
esac

# Final status check
echo ""
print_status "Final system status check..."
final_status=$(get_server_status)

if [ "$final_status" = "healthy" ]; then
    print_success "TaskMaster AI system is ready! 🚀"
    echo ""
    echo "🎯 Quick Access:"
    echo "  • Main Dashboard: http://localhost:3010/"
    echo "  • Developer Interface: http://localhost:3010/developer-interface"
    echo "  • Interactive Task Router: npm run task-router"
    echo "  • Agent Manager: npm run agent-manager"
    echo ""
    echo "🔧 Common Commands:"
    echo "  • npm run agents:status          - Check agent status"
    echo "  • npm run batch:health-check     - System health check"
    echo "  • npm run task-router            - Interactive task routing"
    echo "  • npm run workflow:morning       - Morning workflow"
    echo ""
    echo "📋 Agent Workflow (remember to start/end jobs):"
    echo "  • task-master use-tag <workspace>  - Switch workspace"
    echo "  • task-master next                 - Get next task"
    echo "  • task-master set-status --id=X.Y --status=in-progress"
    echo "  • task-master set-status --id=X.Y --status=done"
    echo ""
    echo "💡 Developer Interface Features:"
    echo "  • Visual task routing with approval workflow"
    echo "  • Real-time agent monitoring"
    echo "  • Claude integration for natural language commands"
    echo "  • System health indicators"
else
    print_error "System not ready - server status: $final_status"
    exit 1
fi