#!/bin/bash

# Dashboard Widget Workflow Script
# Specialized TaskMaster operations for widget development and management
# Task 18.1: Basic Shell Script Structure - Integration Specialist

# Exit on any error
set -e

# Set script directory for relative operations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Color definitions (compatible with taskmaster-cli.sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Import common functions from taskmaster-cli.sh if available
if [[ -f "taskmaster-cli.sh" ]]; then
    echo -e "${BLUE}[INFO]${NC} Found taskmaster-cli.sh - compatible mode enabled"
    TASKMASTER_CLI_AVAILABLE=true
else
    echo -e "${YELLOW}[WARNING]${NC} taskmaster-cli.sh not found, using standalone mode"
    TASKMASTER_CLI_AVAILABLE=false
fi

# Script metadata
SCRIPT_NAME="dashboard-workflow.sh"
SCRIPT_VERSION="1.0.0"
SCRIPT_DESCRIPTION="Specialized TaskMaster operations for widget development"

# Configuration
TASKMASTER_CMD="task-master"
WIDGET_FILTER="widget"
CACHE_DIR=".taskmaster/cache"
CACHE_FILE="$CACHE_DIR/widget-tasks.json"

# Error handling function
handle_error() {
    local exit_code=$?
    local line_number=$1
    echo -e "${RED}[ERROR]${NC} Script failed at line $line_number with exit code $exit_code"
    echo -e "${YELLOW}[CONTEXT]${NC} Command: $BASH_COMMAND"
    exit $exit_code
}

# Set error trap
trap 'handle_error $LINENO' ERR

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            if [[ "${DEBUG:-}" == "1" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message"
            fi
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    # Check if TaskMaster is available
    if ! command -v "$TASKMASTER_CMD" &> /dev/null; then
        log "ERROR" "TaskMaster CLI not found. Please ensure task-master is available."
        log "INFO" "TaskMaster should be available in the project"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log "WARNING" "Git not found. Git synchronization features will be disabled."
        GIT_AVAILABLE=false
    else
        GIT_AVAILABLE=true
    fi
    
    # Check if we're in a TaskMaster project
    if [[ ! -f ".taskmaster/config.json" ]]; then
        log "WARNING" "Not in a TaskMaster project directory"
        log "INFO" "Run 'task-master init' to initialize TaskMaster in this directory"
    fi
    
    # Create cache directory if it doesn't exist
    mkdir -p "$CACHE_DIR"
    
    log "SUCCESS" "Dependency check completed"
}

# Display script usage
show_usage() {
    cat << EOF
${GREEN}$SCRIPT_NAME v$SCRIPT_VERSION${NC}
$SCRIPT_DESCRIPTION

${YELLOW}USAGE:${NC}
    $SCRIPT_NAME <command> [options]

${YELLOW}COMMANDS:${NC}
    ${BLUE}widget-status${NC}     Show progress across all widget-related tasks
    ${BLUE}next-widget${NC}       Find the next pending widget task to work on
    ${BLUE}widget-research${NC}   Launch research mode for widget implementation
    ${BLUE}widget-list${NC}       List all widget tasks with detailed status
    ${BLUE}widget-sync${NC}       Synchronize widget tasks with git repository
    ${BLUE}help${NC}              Show this help message

${YELLOW}OPTIONS:${NC}
    --debug               Enable debug logging
    --no-git             Disable git synchronization
    --cache-refresh      Force refresh of widget task cache

${YELLOW}EXAMPLES:${NC}
    $SCRIPT_NAME widget-status
    $SCRIPT_NAME next-widget
    $SCRIPT_NAME widget-research "dashboard component patterns"
    $SCRIPT_NAME widget-list --status=pending
    $SCRIPT_NAME widget-sync

${YELLOW}INTEGRATION:${NC}
    This script integrates with taskmaster-cli.sh and supports the same
    configuration and environment variables. It focuses specifically on
    widget-related TaskMaster operations for dashboard development.

${YELLOW}ENVIRONMENT VARIABLES:${NC}
    DEBUG=1              Enable debug output
    TASKMASTER_TAG       Override default tag context
    NO_COLOR=1           Disable colored output

For more information, see: ${BLUE}https://github.com/task-master-ai${NC}
EOF
}

# Display script version
show_version() {
    echo "$SCRIPT_NAME version $SCRIPT_VERSION"
    echo "TaskMaster Dashboard Widget Workflow Script"
    echo "Integration Specialist Implementation - Task 18.1"
}

# Parse command line arguments
parse_arguments() {
    # Initialize variables
    COMMAND=""
    DEBUG="${DEBUG:-0}"
    NO_GIT="${NO_GIT:-0}"
    CACHE_REFRESH="${CACHE_REFRESH:-0}"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug)
                DEBUG=1
                shift
                ;;
            --no-git)
                NO_GIT=1
                shift
                ;;
            --cache-refresh)
                CACHE_REFRESH=1
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            --version|-v)
                show_version
                exit 0
                ;;
            widget-status|next-widget|widget-research|widget-list|widget-sync|help)
                if [[ -n "$COMMAND" ]]; then
                    log "ERROR" "Multiple commands specified. Use --help for usage."
                    exit 1
                fi
                COMMAND="$1"
                shift
                ;;
            *)
                # Store additional arguments for commands that need them
                COMMAND_ARGS+=("$1")
                shift
                ;;
        esac
    done
    
    # Default command if none specified
    if [[ -z "$COMMAND" ]]; then
        COMMAND="help"
    fi
    
    log "DEBUG" "Parsed command: $COMMAND"
    log "DEBUG" "Command arguments: ${COMMAND_ARGS[*]:-none}"
    log "DEBUG" "Debug mode: $DEBUG"
    log "DEBUG" "Git disabled: $NO_GIT"
    log "DEBUG" "Cache refresh: $CACHE_REFRESH"
}

# Main script execution
main() {
    log "INFO" "Starting $SCRIPT_NAME v$SCRIPT_VERSION"
    log "INFO" "Task 18.1: Basic Shell Script Structure"
    
    # Parse command line arguments
    declare -a COMMAND_ARGS=()
    parse_arguments "$@"
    
    # Check dependencies
    check_dependencies
    
    # Execute the requested command
    case "$COMMAND" in
        "widget-status")
            log "INFO" "Widget status command selected"
            log "INFO" "This will show progress across all widget-related tasks"
            # Implementation will be added in subsequent tasks
            ;;
        "next-widget")
            log "INFO" "Next widget command selected"
            log "INFO" "This will find the next pending widget task to work on"
            # Implementation will be added in subsequent tasks
            ;;
        "widget-research")
            log "INFO" "Widget research command selected"
            log "INFO" "Research query: ${COMMAND_ARGS[*]:-none provided}"
            # Implementation will be added in subsequent tasks
            ;;
        "widget-list")
            log "INFO" "Widget list command selected"
            log "INFO" "This will list all widget tasks with detailed status"
            # Implementation will be added in subsequent tasks
            ;;
        "widget-sync")
            log "INFO" "Widget sync command selected"
            log "INFO" "This will synchronize widget tasks with git repository"
            # Implementation will be added in subsequent tasks
            ;;
        "help")
            show_usage
            ;;
        *)
            log "ERROR" "Unknown command: $COMMAND"
            log "INFO" "Use '$SCRIPT_NAME help' for usage information"
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Dashboard workflow script structure initialized successfully"
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi