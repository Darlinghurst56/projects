#!/bin/bash
# Verify Google Calendar integration with existing n8n instance
# This script checks deployment status and tests connectivity

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

# Check n8n accessibility
check_n8n_access() {
    log "Checking n8n instance accessibility..."
    
    if curl -s --connect-timeout 10 "${N8N_URL}" > /dev/null; then
        success "n8n instance is accessible at ${N8N_URL}"
        return 0
    else
        error "Cannot access n8n instance at ${N8N_URL}"
        return 1
    fi
}

# Check if workflows exist
check_workflows() {
    log "Checking for calendar workflows..."
    
    # Try to get workflows list
    if curl -s "${N8N_API}/workflows" > /tmp/workflows.json 2>/dev/null; then
        if command -v jq > /dev/null 2>&1; then
            calendar_read=$(jq -r '.data[] | select(.name | contains("Calendar")) | .name' /tmp/workflows.json 2>/dev/null | head -1)
            calendar_create=$(jq -r '.data[] | select(.name | contains("Create Calendar")) | .name' /tmp/workflows.json 2>/dev/null | head -1)
            
            if [[ -n "$calendar_read" ]]; then
                success "Found calendar reading workflow: $calendar_read"
            else
                warning "Calendar reading workflow not found"
            fi
            
            if [[ -n "$calendar_create" ]]; then
                success "Found calendar creation workflow: $calendar_create"
            else
                warning "Calendar creation workflow not found"
            fi
        else
            warning "jq not available, cannot parse workflow data"
        fi
        rm -f /tmp/workflows.json
    else
        warning "Cannot access workflows API (may require authentication)"
    fi
}

# Check credentials
check_credentials() {
    log "Checking for required credentials..."
    
    if curl -s "${N8N_API}/credentials" > /tmp/credentials.json 2>/dev/null; then
        if command -v jq > /dev/null 2>&1; then
            telegram_bot=$(jq -r '.data[] | select(.name == "Gmail Telegram Bot") | .name' /tmp/credentials.json 2>/dev/null)
            oauth2_cred=$(jq -r '.data[] | select(.name == "Gmail OAuth2") | .name' /tmp/credentials.json 2>/dev/null)
            
            if [[ -n "$telegram_bot" ]]; then
                success "Found Telegram credential: Gmail Telegram Bot"
            else
                error "Missing Telegram credential: Gmail Telegram Bot"
            fi
            
            if [[ -n "$oauth2_cred" ]]; then
                success "Found OAuth2 credential: Gmail OAuth2"
                warning "Verify this credential includes calendar scopes"
            else
                error "Missing OAuth2 credential: Gmail OAuth2"
            fi
        fi
        rm -f /tmp/credentials.json
    else
        warning "Cannot access credentials API (may require authentication)"
    fi
}

# Test Google Calendar API access
test_calendar_api() {
    log "Testing Google Calendar API accessibility..."
    
    # Test if Google Calendar API is reachable
    if curl -s --connect-timeout 5 "https://www.googleapis.com/calendar/v3/" > /dev/null; then
        success "Google Calendar API is accessible"
    else
        warning "Google Calendar API connection test failed"
    fi
}

# Provide testing instructions
testing_instructions() {
    log "Manual Testing Instructions:"
    echo
    echo "Test these commands in your Telegram bot:"
    echo
    echo "📅 Calendar Reading Commands:"
    echo "  /calendar_today"
    echo "  /calendar_week" 
    echo "  /calendar_upcoming"
    echo "  /calendar_list 2024-01-15 to 2024-01-20"
    echo
    echo "📝 Calendar Creation Commands:"
    echo "  /create_event Test Meeting | today 3pm | 1 hour"
    echo "  /create_event Doctor Appointment | tomorrow 2pm | 30 minutes | Medical Center"
    echo "  /create_event Team Standup | 2024-01-15 09:00 | 30 minutes | Conference Room | Weekly meeting"
    echo
    echo "Expected responses:"
    echo "  ✅ Calendar events displayed with rich formatting"
    echo "  ✅ Event creation confirmation with calendar link"
    echo "  ❌ Error messages for invalid formats or permissions"
    echo
}

# Check deployment status
deployment_status() {
    log "Calendar Integration Deployment Status:"
    echo
    
    local status_file="/tmp/calendar_deployment_status.txt"
    cat > "$status_file" << EOF
Google Calendar Integration Status Report
Generated: $(date)
Target: ${N8N_URL}

INFRASTRUCTURE:
EOF
    
    if check_n8n_access; then
        echo "✅ n8n Instance: Accessible" >> "$status_file"
    else
        echo "❌ n8n Instance: Not accessible" >> "$status_file"
    fi
    
    echo "" >> "$status_file"
    echo "WORKFLOWS:" >> "$status_file"
    check_workflows >> "$status_file" 2>&1
    
    echo "" >> "$status_file"
    echo "CREDENTIALS:" >> "$status_file"
    check_credentials >> "$status_file" 2>&1
    
    echo "" >> "$status_file"
    echo "EXTERNAL APIS:" >> "$status_file"
    test_calendar_api >> "$status_file" 2>&1
    
    cat "$status_file"
    rm -f "$status_file"
}

# Main verification function
main() {
    log "Google Calendar Integration Verification"
    log "Target: ${N8N_URL}"
    echo
    
    deployment_status
    echo
    testing_instructions
    
    echo
    success "Verification complete!"
    log "If issues found, run deploy-calendar-workflows.sh to redeploy"
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi