#!/bin/bash
# MCP Tool Authorization Validator
# Validates that agent is authorized to use specific MCP tools

TOOL_NAME=$1
AGENT_ROLE=${2:-""}
TASK_ID=${3:-""}

if [ -z "$TOOL_NAME" ]; then
    echo "Usage: $0 <tool-name> [agent-role] [task-id]"
    echo "Example: $0 mcp__accessibility__validate_page qa-specialist 5.2"
    exit 1
fi

# Load authorization configuration
AUTH_FILE=".taskmaster/agent-tool-auth.json"
if [ ! -f "$AUTH_FILE" ]; then
    echo "❌ No tool authorization file found. Run pre-work validation first."
    exit 1
fi

# Extract current agent role if not provided
if [ -z "$AGENT_ROLE" ]; then
    AGENT_ROLE=$(grep -o '"agentRole": "[^"]*"' "$AUTH_FILE" | cut -d'"' -f4)
fi

echo "🔍 Validating MCP tool authorization"
echo "Tool: $TOOL_NAME"
echo "Agent Role: $AGENT_ROLE"

# Define tool authorization matrix
validate_tool_access() {
    local tool=$1
    local role=$2
    
    case "$role" in
        "frontend-architect")
            case "$tool" in
                mcp__design-system__*|mcp__performance-monitoring__*|mcp__accessibility__*)
                    return 0 ;;
                mcp__user-testing__*)
                    echo "❌ $tool is restricted. Use UI Developer for user testing."
                    return 1 ;;
                mcp__puppeteer__*)
                    echo "❌ $tool is restricted. Use QA Specialist for browser automation."
                    return 1 ;;
                mcp__docker__*)
                    echo "❌ $tool is restricted. Use DevOps Agent for containerization."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        "ui-developer")
            case "$tool" in
                mcp__accessibility__*|mcp__user-testing__*|mcp__design-system__*)
                    return 0 ;;
                mcp__performance-monitoring__*)
                    echo "❌ $tool is restricted. Use Frontend Architect for performance architecture."
                    return 1 ;;
                mcp__puppeteer__*)
                    echo "❌ $tool is restricted. Use QA Specialist for comprehensive browser testing."
                    return 1 ;;
                mcp__docker__*)
                    echo "❌ $tool is restricted. Use DevOps Agent for containerization."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        "backend-agent")
            case "$tool" in
                mcp__task-master-ai__*)
                    return 0 ;;
                mcp__accessibility__*|mcp__user-testing__*|mcp__design-system__*)
                    echo "❌ $tool is restricted. Use Frontend agents for frontend tools."
                    return 1 ;;
                mcp__puppeteer__*)
                    echo "❌ $tool is restricted. Use QA Specialist for browser testing."
                    return 1 ;;
                mcp__docker__*)
                    echo "❌ $tool is restricted. Use DevOps Agent for containerization."
                    return 1 ;;
                mcp__performance-monitoring__*)
                    echo "❌ $tool is restricted. Use Frontend Architect for performance architecture."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        "integration-specialist")
            case "$tool" in
                mcp__task-master-ai__*)
                    return 0 ;;
                mcp__accessibility__*|mcp__user-testing__*|mcp__design-system__*)
                    echo "❌ $tool is restricted. Use Frontend agents for frontend tools."
                    return 1 ;;
                mcp__puppeteer__*)
                    echo "❌ $tool is restricted. Use QA Specialist for browser testing."
                    return 1 ;;
                mcp__docker__*)
                    echo "❌ $tool is restricted. Use DevOps Agent for containerization."
                    return 1 ;;
                mcp__performance-monitoring__*)
                    echo "❌ $tool is restricted. Use Frontend Architect for performance architecture."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        "qa-specialist")
            case "$tool" in
                mcp__accessibility__*|mcp__user-testing__*|mcp__puppeteer__*|mcp__performance-monitoring__*)
                    return 0 ;;
                mcp__design-system__*)
                    echo "❌ $tool is restricted. Use Frontend agents for design system management."
                    return 1 ;;
                mcp__docker__*)
                    echo "❌ $tool is restricted. Use DevOps Agent for containerization."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        "devops-agent")
            case "$tool" in
                mcp__docker__*)
                    return 0 ;;
                mcp__accessibility__*|mcp__user-testing__*|mcp__design-system__*)
                    echo "❌ $tool is restricted. Use Frontend agents for frontend tools."
                    return 1 ;;
                mcp__puppeteer__*)
                    echo "❌ $tool is restricted. Use QA Specialist for browser testing."
                    return 1 ;;
                mcp__performance-monitoring__*)
                    echo "❌ $tool is restricted. Use Frontend Architect for performance architecture."
                    return 1 ;;
                *)
                    return 0 ;;
            esac
            ;;
        *)
            echo "❌ Unknown agent role: $role"
            return 1 ;;
    esac
}

# Validate tool access
if validate_tool_access "$TOOL_NAME" "$AGENT_ROLE"; then
    echo "✅ Tool authorization validated"
    echo "Agent $AGENT_ROLE is authorized to use $TOOL_NAME"
    
    # Log successful tool usage
    if [ -n "$TASK_ID" ]; then
        echo "📝 Logging tool usage..."
        usage_log="TOOL USAGE: $TOOL_NAME
Agent: $AGENT_ROLE
Task: $TASK_ID
Status: Authorized
Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        
        # Note: In actual implementation, this would log to TaskMaster
        # task-master update-subtask --id="$TASK_ID" --prompt="$usage_log"
    fi
    
    exit 0
else
    echo "❌ Tool authorization failed"
    
    # Log tool violation
    if [ -n "$TASK_ID" ]; then
        echo "📝 Logging tool violation..."
        violation_log="TOOL VIOLATION: $TOOL_NAME
Agent: $AGENT_ROLE
Task: $TASK_ID
Status: Unauthorized access attempt
Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Action: Tool usage blocked"
        
        # Note: In actual implementation, this would log to TaskMaster
        # task-master update-task --id="$TASK_ID" --prompt="$violation_log"
    fi
    
    exit 1
fi