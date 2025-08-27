#!/bin/bash
# Test Google Calendar integration remotely via n8n API
# This script provides remote testing capabilities for the calendar workflows

set -e

# Configuration
N8N_HOST="192.168.1.74"
N8N_PORT="5678"
N8N_URL="http://${N8N_HOST}:${N8N_PORT}"
N8N_API="${N8N_URL}/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Test n8n connectivity
test_n8n_connectivity() {
    log "Testing n8n connectivity..."
    
    if curl -s --connect-timeout 10 "${N8N_URL}" > /dev/null; then
        success "n8n instance is accessible"
        return 0
    else
        error "Cannot connect to n8n instance at ${N8N_URL}"
        return 1
    fi
}

# Get workflow information
get_workflow_info() {
    log "Fetching workflow information..."
    
    if curl -s "${N8N_API}/workflows" > /tmp/workflows_info.json 2>/dev/null; then
        if command -v jq > /dev/null 2>&1; then
            echo "Available workflows:"
            jq -r '.data[] | "- \(.name) (ID: \(.id), Active: \(.active))"' /tmp/workflows_info.json 2>/dev/null | grep -i calendar || echo "No calendar workflows found"
        else
            warning "jq not available, cannot parse workflow data"
        fi
        rm -f /tmp/workflows_info.json
    else
        warning "Cannot access workflows API"
    fi
}

# Execute workflow manually (if API allows)
test_workflow_execution() {
    local workflow_name="$1"
    log "Testing workflow execution: ${workflow_name}"
    
    # Note: This requires proper authentication and may not work without n8n API key
    warning "Manual workflow execution requires n8n authentication"
    log "Use Telegram bot commands for testing instead"
}

# Test Google Calendar API directly
test_google_calendar_direct() {
    log "Testing Google Calendar API accessibility..."
    
    # Test public calendar API endpoint
    if curl -s --connect-timeout 5 "https://www.googleapis.com/calendar/v3/" > /dev/null; then
        success "Google Calendar API is accessible"
    else
        warning "Google Calendar API connection failed"
    fi
    
    # Note: Testing authenticated endpoints requires OAuth2 tokens
    log "Authenticated calendar operations require OAuth2 tokens from n8n"
}

# Simulate Telegram bot commands
simulate_telegram_commands() {
    log "Telegram Bot Command Simulation"
    echo
    echo "To test calendar integration, use these commands in your Telegram bot:"
    echo
    
    # Calendar reading commands
    echo "📅 CALENDAR READING COMMANDS:"
    echo "  /calendar_today"
    echo "  /calendar_week"
    echo "  /calendar_upcoming"
    echo "  /calendar_list 2024-01-15 to 2024-01-20"
    echo
    
    # Calendar creation commands  
    echo "📝 CALENDAR CREATION COMMANDS:"
    echo "  /create_event Test Meeting | today 3pm | 1 hour"
    echo "  /create_event Quick Call | tomorrow 2pm | 30 minutes"
    echo "  /create_event Doctor Visit | 2024-01-20 14:30 | 1 hour | Medical Center"
    echo "  /create_event Team Standup | today 9am | 30 minutes | Conference Room | Weekly meeting"
    echo
    
    echo "Expected responses:"
    echo "  ✅ Rich formatted calendar event lists"
    echo "  ✅ Event creation confirmations with links"
    echo "  ❌ Helpful error messages for invalid formats"
    echo
}

# Create API test payload
create_test_payload() {
    local command="$1"
    local chat_id="${2:-123456789}"
    local user_id="${3:-123456789}"
    
    cat > /tmp/telegram_test_payload.json << EOF
{
  "message": {
    "message_id": 123,
    "from": {
      "id": ${user_id},
      "is_bot": false,
      "first_name": "Test",
      "username": "testuser"
    },
    "chat": {
      "id": ${chat_id},
      "first_name": "Test",
      "username": "testuser",
      "type": "private"
    },
    "date": $(date +%s),
    "text": "${command}"
  }
}
EOF
    
    echo "/tmp/telegram_test_payload.json"
}

# Test webhook endpoints (if available)
test_webhook_endpoints() {
    log "Testing webhook endpoints..."
    
    # Calendar reading webhook test
    local payload_file=$(create_test_payload "/calendar_today")
    
    if curl -s -X POST "${N8N_URL}/webhook/calendar-read" \
        -H "Content-Type: application/json" \
        -d @"$payload_file" > /tmp/webhook_response.json 2>/dev/null; then
        
        success "Calendar reading webhook responded"
        if command -v jq > /dev/null 2>&1; then
            jq . /tmp/webhook_response.json 2>/dev/null || cat /tmp/webhook_response.json
        fi
    else
        warning "Calendar reading webhook not accessible or not configured"
    fi
    
    # Calendar creation webhook test
    payload_file=$(create_test_payload "/create_event Test Event | today 3pm | 1 hour")
    
    if curl -s -X POST "${N8N_URL}/webhook/calendar-create" \
        -H "Content-Type: application/json" \
        -d @"$payload_file" > /tmp/webhook_response.json 2>/dev/null; then
        
        success "Calendar creation webhook responded"
        if command -v jq > /dev/null 2>&1; then
            jq . /tmp/webhook_response.json 2>/dev/null || cat /tmp/webhook_response.json
        fi
    else
        warning "Calendar creation webhook not accessible or not configured"
    fi
    
    rm -f /tmp/telegram_test_payload.json /tmp/webhook_response.json
}

# Monitor n8n execution logs (if accessible)
monitor_executions() {
    log "Monitoring workflow executions..."
    
    if curl -s "${N8N_API}/executions" > /tmp/executions.json 2>/dev/null; then
        if command -v jq > /dev/null 2>&1; then
            echo "Recent executions:"
            jq -r '.data[0:5][] | "- \(.workflowData.name): \(.finished ? "✅" : "❌") (\(.mode)) - \(.startedAt)"' /tmp/executions.json 2>/dev/null || echo "No execution data available"
        fi
        rm -f /tmp/executions.json
    else
        warning "Cannot access executions API"
    fi
}

# Generate test report
generate_test_report() {
    local report_file="/tmp/calendar_api_test_report.txt"
    
    cat > "$report_file" << EOF
Google Calendar API Integration Test Report
==========================================
Generated: $(date)
Target n8n Instance: ${N8N_URL}

CONNECTIVITY TESTS:
EOF
    
    if test_n8n_connectivity; then
        echo "✅ n8n Instance: Accessible" >> "$report_file"
    else
        echo "❌ n8n Instance: Not accessible" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "WORKFLOW STATUS:" >> "$report_file"
    get_workflow_info >> "$report_file" 2>&1
    
    echo "" >> "$report_file"
    echo "API TESTS:" >> "$report_file"
    test_google_calendar_direct >> "$report_file" 2>&1
    
    echo "" >> "$report_file"
    echo "WEBHOOK TESTS:" >> "$report_file"
    test_webhook_endpoints >> "$report_file" 2>&1
    
    echo "" >> "$report_file"
    echo "EXECUTION MONITORING:" >> "$report_file"
    monitor_executions >> "$report_file" 2>&1
    
    cat "$report_file"
    rm -f "$report_file"
}

# Usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --connectivity    Test n8n connectivity only"
    echo "  --workflows       Check workflow status"
    echo "  --webhooks        Test webhook endpoints"
    echo "  --monitor         Monitor recent executions"
    echo "  --report          Generate full test report"
    echo "  --simulate        Show Telegram command examples"
    echo "  --help            Show this help message"
    echo
}

# Main function
main() {
    local mode="${1:-report}"
    
    case "$mode" in
        --connectivity)
            test_n8n_connectivity
            ;;
        --workflows)
            get_workflow_info
            ;;
        --webhooks)
            test_webhook_endpoints
            ;;
        --monitor)
            monitor_executions
            ;;
        --simulate)
            simulate_telegram_commands
            ;;
        --report)
            generate_test_report
            ;;
        --help)
            usage
            ;;
        *)
            log "Google Calendar API Integration Testing"
            echo
            generate_test_report
            echo
            simulate_telegram_commands
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi