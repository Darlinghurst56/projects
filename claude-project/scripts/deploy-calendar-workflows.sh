#!/bin/bash
# Deploy Google Calendar workflows to existing n8n instance
# Target: 192.168.1.74:5678

set -e  # Exit on any error

# Configuration
N8N_HOST="192.168.1.74"
N8N_PORT="5678"
N8N_URL="http://${N8N_HOST}:${N8N_PORT}"
N8N_API="${N8N_URL}/api/v1"
WORKFLOWS_DIR="/mnt/d/Projects/claude-project/workflows"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if n8n instance is accessible
check_n8n_connectivity() {
    log "Checking connectivity to n8n instance at ${N8N_URL}"
    
    if curl -s --connect-timeout 5 "${N8N_URL}/healthz" > /dev/null 2>&1; then
        success "n8n instance is accessible at ${N8N_URL}"
        return 0
    elif curl -s --connect-timeout 5 "${N8N_URL}" > /dev/null 2>&1; then
        success "n8n instance is accessible at ${N8N_URL}"
        return 0
    else
        error "Cannot connect to n8n instance at ${N8N_URL}"
        error "Please ensure:"
        error "  1. n8n Docker container is running"
        error "  2. Network connectivity to ${N8N_HOST}:${N8N_PORT}"
        error "  3. No firewall blocking the connection"
        return 1
    fi
}

# Get n8n credentials
get_credentials() {
    log "Fetching existing credentials from n8n instance"
    
    # Try to get credentials list
    if ! curl -s "${N8N_API}/credentials" > /tmp/n8n_credentials.json 2>/dev/null; then
        warning "Unable to fetch credentials via API (may require authentication)"
        warning "Credentials will need to be manually verified in n8n UI"
        return 1
    fi
    
    # Check for required credentials
    if command -v jq > /dev/null 2>&1; then
        telegram_cred=$(jq -r '.data[] | select(.name == "Gmail Telegram Bot") | .id' /tmp/n8n_credentials.json 2>/dev/null || echo "")
        oauth2_cred=$(jq -r '.data[] | select(.name == "Gmail OAuth2") | .id' /tmp/n8n_credentials.json 2>/dev/null || echo "")
        
        if [[ -n "$telegram_cred" ]]; then
            success "Found existing Telegram credential: Gmail Telegram Bot (ID: $telegram_cred)"
        else
            warning "Telegram credential 'Gmail Telegram Bot' not found"
        fi
        
        if [[ -n "$oauth2_cred" ]]; then
            success "Found existing OAuth2 credential: Gmail OAuth2 (ID: $oauth2_cred)"
        else
            warning "OAuth2 credential 'Gmail OAuth2' not found"
        fi
    fi
    
    rm -f /tmp/n8n_credentials.json
    return 0
}

# Import workflow function
import_workflow() {
    local workflow_file="$1"
    local workflow_name="$2"
    
    log "Importing workflow: ${workflow_name}"
    
    if [[ ! -f "${WORKFLOWS_DIR}/${workflow_file}" ]]; then
        error "Workflow file not found: ${WORKFLOWS_DIR}/${workflow_file}"
        return 1
    fi
    
    # Validate JSON
    if ! jq empty "${WORKFLOWS_DIR}/${workflow_file}" 2>/dev/null; then
        error "Invalid JSON in workflow file: ${workflow_file}"
        return 1
    fi
    
    # Import via API (if available) or provide manual instructions
    if curl -s "${N8N_API}/workflows" > /dev/null 2>&1; then
        # Try API import
        response=$(curl -s -X POST "${N8N_API}/workflows" \
            -H "Content-Type: application/json" \
            -d @"${WORKFLOWS_DIR}/${workflow_file}" \
            2>/dev/null || echo "")
        
        if [[ -n "$response" ]] && echo "$response" | jq -e .id > /dev/null 2>&1; then
            workflow_id=$(echo "$response" | jq -r .id)
            success "Workflow imported successfully via API (ID: ${workflow_id})"
        else
            warning "API import failed, use manual import method below"
            return 1
        fi
    else
        warning "API not accessible, use manual import method"
        return 1
    fi
}

# Manual import instructions
manual_import_instructions() {
    log "Manual Import Instructions:"
    echo
    echo "1. Open n8n in your browser: ${N8N_URL}"
    echo "2. Click 'Import from file' or 'Import from clipboard'"
    echo "3. Import these workflow files in order:"
    echo
    echo "   📅 Calendar Reading Workflow:"
    echo "   File: ${WORKFLOWS_DIR}/telegram-to-google-calendar.json"
    echo
    echo "   📝 Calendar Creation Workflow:"  
    echo "   File: ${WORKFLOWS_DIR}/telegram-to-create-calendar-event.json"
    echo
    echo "   🧪 Test Workflows (optional):"
    echo "   File: ${WORKFLOWS_DIR}/test-google-calendar-workflow.json"
    echo "   File: ${WORKFLOWS_DIR}/test-create-calendar-event.json"
    echo
    echo "4. After import, verify credentials are properly linked:"
    echo "   - Telegram: 'Gmail Telegram Bot'"
    echo "   - Google OAuth2: 'Gmail OAuth2' (with calendar scopes)"
    echo
    echo "5. Activate the main workflows (keep test workflows inactive)"
    echo
}

# Update OAuth2 scopes instructions
oauth2_scope_instructions() {
    log "OAuth2 Scope Update Required:"
    echo
    echo "The existing 'Gmail OAuth2' credential needs calendar scopes added:"
    echo
    echo "1. Go to Google Cloud Console: https://console.cloud.google.com"
    echo "2. Navigate to APIs & Services > Credentials"
    echo "3. Find your OAuth2 client credentials"
    echo "4. Ensure these APIs are enabled:"
    echo "   - Gmail API ✓ (already enabled)"
    echo "   - Google Calendar API (add this)"
    echo
    echo "5. In n8n, update the OAuth2 credential scopes to include:"
    echo "   - https://www.googleapis.com/auth/gmail.readonly ✓"
    echo "   - https://www.googleapis.com/auth/gmail.send ✓"
    echo "   - https://www.googleapis.com/auth/gmail.modify ✓"
    echo "   - https://www.googleapis.com/auth/calendar (add this)"
    echo "   - https://www.googleapis.com/auth/calendar.events (add this)"
    echo
    echo "6. Re-authenticate the credential to get calendar permissions"
    echo
}

# Test connectivity function
test_deployment() {
    log "Testing deployment..."
    
    echo "Available test commands after deployment:"
    echo "  /calendar_today          - View today's calendar events"
    echo "  /calendar_week           - View this week's events"
    echo "  /calendar_upcoming       - View upcoming events (30 days)"
    echo "  /calendar_list [dates]   - Custom date range"
    echo "  /create_event [details]  - Create new calendar event"
    echo
    echo "Example:"
    echo "  /create_event Test Event | today 3pm | 1 hour | Testing calendar integration"
    echo
}

# Main deployment function
main() {
    log "Starting Google Calendar workflow deployment"
    log "Target n8n instance: ${N8N_URL}"
    echo
    
    # Check connectivity
    if ! check_n8n_connectivity; then
        exit 1
    fi
    
    # Get credentials info
    get_credentials
    
    echo
    log "Deployment Methods Available:"
    echo "1. API Import (automatic)"
    echo "2. Manual Import (via n8n UI)"
    echo
    
    # Try API import first
    log "Attempting API import..."
    
    api_success=true
    import_workflow "telegram-to-google-calendar.json" "Calendar Reading Workflow" || api_success=false
    import_workflow "telegram-to-create-calendar-event.json" "Calendar Creation Workflow" || api_success=false
    
    if $api_success; then
        success "All workflows imported successfully via API!"
    else
        warning "API import not available, providing manual instructions"
        manual_import_instructions
    fi
    
    echo
    oauth2_scope_instructions
    echo
    test_deployment
    
    echo
    success "Calendar workflow deployment process complete!"
    log "Next steps:"
    echo "1. Update OAuth2 credential with calendar scopes"
    echo "2. Test calendar commands in Telegram"
    echo "3. Verify integration with existing Gmail workflows"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi