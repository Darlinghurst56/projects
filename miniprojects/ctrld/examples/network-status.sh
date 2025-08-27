#!/bin/bash
# network-status.sh - Network Infrastructure Status Dashboard
# Part of the Network Enhancement Plan - Phase 1
# 
# Provides unified status checking for all network infrastructure components
# Uses existing tools with minimal custom code following MVP principles

# Version and metadata
VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
RESOLVER_ID="1o6nbq1u58h"
WSL_IP="172.22.150.21"
HOST_IP="192.168.1.74"
LOG_PATH="/tmp/network-status.log"

# Utility functions
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_PATH" 2>/dev/null || true
}

print_status() {
    local status="$1"
    local component="$2"
    local message="$3"
    local details="${4:-}"
    
    case $status in
        "OK"|"RUNNING"|"ACTIVE")
            printf "${GREEN}✅ %-20s${NC} %s" "$component" "$message"
            ;;
        "WARNING"|"SLOW")
            printf "${YELLOW}⚠️  %-20s${NC} %s" "$component" "$message"
            ;;
        "ERROR"|"FAILED"|"STOPPED")
            printf "${RED}❌ %-20s${NC} %s" "$component" "$message"
            ;;
        "INFO")
            printf "${BLUE}ℹ️  %-20s${NC} %s" "$component" "$message"
            ;;
        *)
            printf "   %-20s %s" "$component" "$message"
            ;;
    esac
    
    if [[ -n "$details" ]]; then
        printf " ${details}"
    fi
    echo
    
    log_message "[$status] $component: $message $details"
}

print_header() {
    echo
    echo -e "${BOLD}${BLUE}╭─────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}${BLUE}│     Network Infrastructure Status Dashboard │${NC}"
    echo -e "${BOLD}${BLUE}│     $(date '+%Y-%m-%d %H:%M:%S')                    │${NC}"
    echo -e "${BOLD}${BLUE}╰─────────────────────────────────────────────╯${NC}"
    echo
}

print_section() {
    local title="$1"
    echo
    echo -e "${BOLD}🔧 $title${NC}"
    echo "═══════════════════════════════════════════"
}

# Component check functions
check_ctrld_service() {
    print_section "DNS Service (Control D)"
    
    # Check if ctrld command exists
    if ! command -v ctrld >/dev/null 2>&1; then
        print_status "ERROR" "ctrld Binary" "Not found in PATH"
        return 1
    fi
    
    # Check service status
    local status_output
    if status_output=$(sudo ctrld status 2>/dev/null); then
        if echo "$status_output" | grep -q "Service is running"; then
            print_status "OK" "ctrld Service" "Running"
            
            # Check resolver configuration
            if grep -q "$RESOLVER_ID" /etc/controld/ctrld.toml 2>/dev/null; then
                print_status "OK" "Resolver Config" "$RESOLVER_ID"
            else
                print_status "WARNING" "Resolver Config" "ID mismatch or config not found"
            fi
        else
            print_status "ERROR" "ctrld Service" "Not running"
            return 1
        fi
    else
        print_status "ERROR" "ctrld Service" "Cannot determine status"
        return 1
    fi
    
    # Check port binding
    if ss -tunlp 2>/dev/null | grep -q ":53.*ctrld"; then
        local binding_info=$(ss -tunlp 2>/dev/null | grep ":53.*ctrld" | head -1 | awk '{print $5}')
        print_status "OK" "Port Binding" "Active on $binding_info"
    else
        print_status "WARNING" "Port Binding" "Port 53 not bound to ctrld"
    fi
}

check_dns_resolution() {
    print_section "DNS Resolution Tests"
    
    # Test local DNS resolution
    local start_time=$(date +%s%N)
    if dig +short @127.0.0.1 google.com >/dev/null 2>&1; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        if [ $duration -lt 100 ]; then
            print_status "OK" "Local DNS" "Fast response (${duration}ms)"
        elif [ $duration -lt 500 ]; then
            print_status "WARNING" "Local DNS" "Slow response (${duration}ms)"
        else
            print_status "ERROR" "Local DNS" "Very slow (${duration}ms)"
        fi
    else
        print_status "ERROR" "Local DNS" "Resolution failed"
    fi
    
    # Test Control D verification
    if local verify_result=$(dig +short @127.0.0.1 verify.controld.com 2>/dev/null); then
        if echo "$verify_result" | grep -q "147.185.34.1"; then
            print_status "OK" "Control D" "Verification successful"
        else
            print_status "WARNING" "Control D" "Unexpected response: $verify_result"
        fi
    else
        print_status "ERROR" "Control D" "Verification failed"
    fi
    
    # Test external DNS access (if applicable)
    if [[ "$HOST_IP" != "127.0.0.1" ]] && [[ "$HOST_IP" != "$WSL_IP" ]]; then
        if dig +short @"$HOST_IP" google.com >/dev/null 2>&1; then
            print_status "OK" "External DNS" "Accessible via $HOST_IP"
        else
            print_status "WARNING" "External DNS" "Not accessible via $HOST_IP (port forwarding may be needed)"
        fi
    fi
}

check_related_services() {
    print_section "Related Network Services"
    
    # Check ctrld-sync status
    local sync_dir="/home/darlinghurstlinux/projects/miniprojects/ctrld-sync"
    if [[ -d "$sync_dir" ]]; then
        if [[ -f "$sync_dir/.env" ]]; then
            print_status "OK" "ctrld-sync" "Configuration found"
            
            # Check last run (look for log files or timestamps)
            if [[ -f "/tmp/ctrld-sync.log" ]]; then
                local last_run=$(stat -c %Y /tmp/ctrld-sync.log 2>/dev/null || echo "0")
                local current_time=$(date +%s)
                local age=$(( (current_time - last_run) / 3600 ))
                
                if [ $age -lt 24 ]; then
                    print_status "OK" "Sync Status" "Last run ${age}h ago"
                elif [ $age -lt 168 ]; then
                    print_status "WARNING" "Sync Status" "Last run ${age}h ago (consider running)"
                else
                    print_status "WARNING" "Sync Status" "Last run >1 week ago"
                fi
            else
                print_status "INFO" "Sync Status" "No recent run detected"
            fi
        else
            print_status "WARNING" "ctrld-sync" "Configuration missing (.env file)"
        fi
    else
        print_status "INFO" "ctrld-sync" "Not installed"
    fi
    
    # Check router_logs status
    local router_logs_dir="/home/darlinghurstlinux/projects/miniprojects/router_logs"
    if [[ -d "$router_logs_dir" ]]; then
        if pgrep -f "continuous-log-collector" >/dev/null; then
            print_status "OK" "router_logs" "Collector running"
        else
            print_status "WARNING" "router_logs" "Collector not running"
        fi
        
        # Check recent logs
        if [[ -f "$router_logs_dir/continuous_logs/current_session.json" ]]; then
            local log_age=$(( ($(date +%s) - $(stat -c %Y "$router_logs_dir/continuous_logs/current_session.json")) / 60 ))
            if [ $log_age -lt 30 ]; then
                print_status "OK" "Log Collection" "Active (${log_age}m ago)"
            else
                print_status "WARNING" "Log Collection" "Stale (${log_age}m ago)"
            fi
        else
            print_status "INFO" "Log Collection" "No session file found"
        fi
    else
        print_status "INFO" "router_logs" "Not installed"
    fi
}

check_network_connectivity() {
    print_section "Network Connectivity"
    
    # Check local connectivity
    if ping -c 1 -W 2 127.0.0.1 >/dev/null 2>&1; then
        print_status "OK" "Localhost" "Reachable"
    else
        print_status "ERROR" "Localhost" "Unreachable"
    fi
    
    # Check WSL connectivity (if different from localhost)
    if [[ "$WSL_IP" != "127.0.0.1" ]]; then
        if ping -c 1 -W 2 "$WSL_IP" >/dev/null 2>&1; then
            print_status "OK" "WSL Network" "Reachable ($WSL_IP)"
        else
            print_status "WARNING" "WSL Network" "Unreachable ($WSL_IP)"
        fi
    fi
    
    # Check internet connectivity
    if ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1; then
        print_status "OK" "Internet" "Reachable"
    else
        print_status "ERROR" "Internet" "Unreachable"
    fi
    
    # Check DNS upstream connectivity
    if curl -s --max-time 5 "https://dns.controld.com/$RESOLVER_ID" >/dev/null 2>&1; then
        print_status "OK" "Control D API" "Reachable"
    else
        print_status "WARNING" "Control D API" "Unreachable (may be normal)"
    fi
}

check_system_resources() {
    print_section "System Resources"
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        print_status "OK" "Disk Space" "${disk_usage}% used"
    elif [ "$disk_usage" -lt 90 ]; then
        print_status "WARNING" "Disk Space" "${disk_usage}% used"
    else
        print_status "ERROR" "Disk Space" "${disk_usage}% used (critical)"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -lt 80 ]; then
        print_status "OK" "Memory" "${mem_usage}% used"
    elif [ "$mem_usage" -lt 90 ]; then
        print_status "WARNING" "Memory" "${mem_usage}% used"
    else
        print_status "ERROR" "Memory" "${mem_usage}% used (high)"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    local load_percent=$(echo "$load_avg $cpu_count" | awk '{printf "%.0f", ($1/$2)*100}')
    
    if [ "$load_percent" -lt 70 ]; then
        print_status "OK" "System Load" "${load_percent}% (${load_avg})"
    elif [ "$load_percent" -lt 90 ]; then
        print_status "WARNING" "System Load" "${load_percent}% (${load_avg})"
    else
        print_status "ERROR" "System Load" "${load_percent}% (${load_avg})"
    fi
}

show_summary() {
    print_section "Quick Actions"
    
    echo "🔧 Common Commands:"
    echo "   ./ctrld-manager.sh status          # Detailed ctrld status"
    echo "   ./network-tasks.sh test-dns        # Comprehensive DNS testing"
    echo "   ./network-tasks.sh sync-blocklists # Run ctrld-sync manually"
    echo "   ./EMERGENCY_DNS_RECOVERY.ps1       # Emergency DNS recovery"
    echo
    echo "📊 Monitoring:"
    echo "   ./ctrld-manager.sh monitor          # Continuous monitoring"
    echo "   ./network-status.sh --watch         # Auto-refresh this status"
    echo
    echo "📝 Logs:"
    echo "   tail -f /var/log/ctrld.log         # ctrld service logs"
    echo "   tail -f $LOG_PATH                  # Network status logs"
    echo
}

# Main execution
main() {
    local watch_mode=false
    local verbose=false
    local json_output=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --watch|-w)
                watch_mode=true
                shift
                ;;
            --verbose|-v)
                verbose=true
                shift
                ;;
            --json|-j)
                json_output=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --watch, -w     Auto-refresh status every 30 seconds"
                echo "  --verbose, -v   Show detailed information"
                echo "  --json, -j      Output in JSON format"
                echo "  --help, -h      Show this help message"
                echo ""
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    if [[ "$json_output" == "true" ]]; then
        # JSON output mode (for machine processing)
        echo '{"timestamp":"'$(date -Iseconds)'","status":{"ctrld":"unknown","dns":"unknown","connectivity":"unknown"}}'
        return 0
    fi
    
    if [[ "$watch_mode" == "true" ]]; then
        # Watch mode - refresh every 30 seconds
        while true; do
            clear
            print_header
            check_ctrld_service
            check_dns_resolution
            check_related_services
            check_network_connectivity
            if [[ "$verbose" == "true" ]]; then
                check_system_resources
            fi
            show_summary
            echo
            echo -e "${BLUE}Refreshing in 30 seconds... (Ctrl+C to exit)${NC}"
            sleep 30
        done
    else
        # Single run mode
        print_header
        check_ctrld_service
        check_dns_resolution
        check_related_services
        check_network_connectivity
        if [[ "$verbose" == "true" ]]; then
            check_system_resources
        fi
        show_summary
    fi
}

# Error handling
set -euo pipefail
trap 'echo -e "\n${RED}Script interrupted${NC}"' INT TERM

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_PATH")" 2>/dev/null || true

# Run main function
main "$@"