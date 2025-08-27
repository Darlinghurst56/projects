#!/bin/bash
# network-tasks.sh - Network Infrastructure Task Runner
# Part of the Network Enhancement Plan - Phase 2
# 
# Provides unified task execution for all network infrastructure components
# Uses existing tools with minimal custom code following MVP principles

# Version and metadata
VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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
LOG_PATH="/tmp/network-tasks.log"
BACKUP_DIR="/tmp/network-backups"

# Project paths
CTRLD_SYNC_DIR="/home/darlinghurstlinux/projects/miniprojects/ctrld-sync"
ROUTER_LOGS_DIR="/home/darlinghurstlinux/projects/miniprojects/router_logs"
CONFIG_PATH="/etc/controld/ctrld.toml"

# Utility functions
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_PATH" 2>/dev/null || true
}

print_status() {
    local status="$1"
    local message="$2"
    local details="${3:-}"
    
    case $status in
        "SUCCESS"|"OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING"|"WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR"|"FAIL")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "PROGRESS")
            echo -e "${BLUE}🔄 $message${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
    
    if [[ -n "$details" ]]; then
        echo "   $details"
    fi
    
    log_message "[$status] $message $details"
}

print_header() {
    echo
    echo -e "${BOLD}${BLUE}╭─────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}${BLUE}│       Network Infrastructure Task Runner    │${NC}"
    echo -e "${BOLD}${BLUE}│       $(date '+%Y-%m-%d %H:%M:%S')                    │${NC}"
    echo -e "${BOLD}${BLUE}╰─────────────────────────────────────────────╯${NC}"
    echo
}

# Task implementations
task_dns_backup() {
    print_status "PROGRESS" "Creating DNS configuration backup"
    
    # Create backup directory
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/dns_backup_$backup_timestamp"
    mkdir -p "$backup_path"
    
    # Backup ctrld configuration
    if [[ -f "$CONFIG_PATH" ]]; then
        sudo cp "$CONFIG_PATH" "$backup_path/ctrld.toml" 2>/dev/null || {
            print_status "WARNING" "Cannot backup $CONFIG_PATH (permission denied)"
        }
    else
        print_status "WARNING" "ctrld configuration not found at $CONFIG_PATH"
    fi
    
    # Backup our management scripts
    cp "$SCRIPT_DIR"/*.sh "$backup_path/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/*.ps1 "$backup_path/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/*.md "$backup_path/" 2>/dev/null || true
    
    # Backup DNS records (if accessible)
    dig @127.0.0.1 axfr home.local > "$backup_path/dns_records.txt" 2>/dev/null || true
    
    # Export current settings
    cat > "$backup_path/settings.env" << EOF
RESOLVER_ID="$RESOLVER_ID"
WSL_IP="$WSL_IP"
HOST_IP="$HOST_IP"
BACKUP_DATE="$(date)"
SCRIPT_VERSION="$VERSION"
EOF
    
    # Create archive
    local archive_name="dns_backup_$backup_timestamp.tar.gz"
    tar -czf "$BACKUP_DIR/$archive_name" -C "$BACKUP_DIR" "$(basename "$backup_path")" 2>/dev/null
    
    if [[ -f "$BACKUP_DIR/$archive_name" ]]; then
        print_status "SUCCESS" "DNS backup created: $archive_name"
        print_status "INFO" "Backup location: $BACKUP_DIR/$archive_name"
        
        # Cleanup old backups (keep last 10)
        find "$BACKUP_DIR" -name "dns_backup_*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
    else
        print_status "ERROR" "Failed to create backup archive"
        return 1
    fi
}

task_sync_blocklists() {
    print_status "PROGRESS" "Running ctrld-sync to update block-lists"
    
    if [[ ! -d "$CTRLD_SYNC_DIR" ]]; then
        print_status "ERROR" "ctrld-sync not found at $CTRLD_SYNC_DIR"
        print_status "INFO" "Install ctrld-sync first or check the path"
        return 1
    fi
    
    # Check for configuration
    if [[ ! -f "$CTRLD_SYNC_DIR/.env" ]]; then
        print_status "ERROR" "ctrld-sync configuration missing (.env file)"
        print_status "INFO" "Create .env file with TOKEN and PROFILE settings"
        return 1
    fi
    
    # Change to ctrld-sync directory and run
    cd "$CTRLD_SYNC_DIR" || {
        print_status "ERROR" "Cannot change to ctrld-sync directory"
        return 1
    }
    
    print_status "INFO" "Running uv run python main.py..."
    
    # Run ctrld-sync with output capture
    if uv run python main.py 2>&1 | tee "/tmp/ctrld-sync.log"; then
        print_status "SUCCESS" "Block-list sync completed"
        
        # Check the output for success indicators
        if grep -q "successfully" "/tmp/ctrld-sync.log" 2>/dev/null; then
            print_status "INFO" "Sync appears successful based on output"
        elif grep -q "error\|failed" "/tmp/ctrld-sync.log" 2>/dev/null; then
            print_status "WARNING" "Sync completed but errors detected in output"
        fi
    else
        print_status "ERROR" "Block-list sync failed"
        print_status "INFO" "Check /tmp/ctrld-sync.log for details"
        return 1
    fi
    
    # Return to original directory
    cd "$SCRIPT_DIR" || true
}

task_check_logs() {
    print_status "PROGRESS" "Reviewing recent network service logs"
    
    echo
    echo -e "${BOLD}📝 ctrld Service Logs (last 10 lines):${NC}"
    if [[ -f "/var/log/ctrld.log" ]]; then
        tail -n 10 /var/log/ctrld.log | while read -r line; do
            echo "   $line"
        done
    else
        print_status "WARNING" "ctrld log file not found at /var/log/ctrld.log"
    fi
    
    echo
    echo -e "${BOLD}📝 Network Tasks Logs (last 10 lines):${NC}"
    if [[ -f "$LOG_PATH" ]]; then
        tail -n 10 "$LOG_PATH" | while read -r line; do
            echo "   $line"
        done
    else
        print_status "INFO" "No network tasks log file yet"
    fi
    
    echo
    echo -e "${BOLD}📝 ctrld-sync Logs (last 10 lines):${NC}"
    if [[ -f "/tmp/ctrld-sync.log" ]]; then
        tail -n 10 /tmp/ctrld-sync.log | while read -r line; do
            echo "   $line"
        done
    else
        print_status "INFO" "No ctrld-sync logs found"
    fi
    
    echo
    echo -e "${BOLD}📝 Router Logs Status:${NC}"
    if [[ -d "$ROUTER_LOGS_DIR" ]]; then
        if [[ -f "$ROUTER_LOGS_DIR/continuous_logs/current_session.json" ]]; then
            local log_age=$(( ($(date +%s) - $(stat -c %Y "$ROUTER_LOGS_DIR/continuous_logs/current_session.json")) / 60 ))
            print_status "INFO" "Router logs last updated ${log_age} minutes ago"
            
            # Show recent router log entries if available
            if [[ -f "$ROUTER_LOGS_DIR/continuous_logs/logs-$(date +%Y-%m-%d).jsonl" ]]; then
                echo "   Recent entries:"
                tail -n 3 "$ROUTER_LOGS_DIR/continuous_logs/logs-$(date +%Y-%m-%d).jsonl" | while read -r line; do
                    echo "   $line"
                done
            fi
        else
            print_status "WARNING" "No router log session file found"
        fi
    else
        print_status "INFO" "Router logs not installed"
    fi
}

task_test_dns() {
    print_status "PROGRESS" "Running comprehensive DNS tests"
    
    # Basic DNS resolution test
    echo
    echo -e "${BOLD}🧪 Basic DNS Resolution:${NC}"
    
    local test_domains=("google.com" "cloudflare.com" "github.com")
    for domain in "${test_domains[@]}"; do
        local start_time=$(date +%s%N)
        if local result=$(dig +short @127.0.0.1 "$domain" 2>/dev/null); then
            local end_time=$(date +%s%N)
            local duration=$(( (end_time - start_time) / 1000000 ))
            
            if [[ -n "$result" ]]; then
                print_status "SUCCESS" "$domain resolved in ${duration}ms"
                echo "   Result: $result"
            else
                print_status "WARNING" "$domain - empty response"
            fi
        else
            print_status "ERROR" "$domain - resolution failed"
        fi
    done
    
    # Control D verification
    echo
    echo -e "${BOLD}🧪 Control D Verification:${NC}"
    if local verify_result=$(dig +short @127.0.0.1 verify.controld.com 2>/dev/null); then
        if echo "$verify_result" | grep -q "147.185.34.1"; then
            print_status "SUCCESS" "Control D verification passed"
            echo "   Result: $verify_result"
        else
            print_status "WARNING" "Unexpected Control D response: $verify_result"
        fi
    else
        print_status "ERROR" "Control D verification failed"
    fi
    
    # DNS over external IP (if configured)
    if [[ "$HOST_IP" != "127.0.0.1" ]] && [[ "$HOST_IP" != "$WSL_IP" ]]; then
        echo
        echo -e "${BOLD}🧪 External DNS Access:${NC}"
        if dig +short @"$HOST_IP" google.com >/dev/null 2>&1; then
            print_status "SUCCESS" "DNS accessible via $HOST_IP"
        else
            print_status "WARNING" "DNS not accessible via $HOST_IP (port forwarding needed)"
        fi
    fi
    
    # DNS server comparison
    echo
    echo -e "${BOLD}🧪 DNS Server Comparison:${NC}"
    local test_domain="github.com"
    
    echo "   Testing $test_domain via different servers:"
    
    # Our DNS server
    local our_result=$(dig +short @127.0.0.1 "$test_domain" 2>/dev/null | head -1)
    echo "   Local (127.0.0.1):  $our_result"
    
    # Google DNS
    local google_result=$(dig +short @8.8.8.8 "$test_domain" 2>/dev/null | head -1)
    echo "   Google (8.8.8.8):   $google_result"
    
    # Cloudflare DNS
    local cf_result=$(dig +short @1.1.1.1 "$test_domain" 2>/dev/null | head -1)
    echo "   Cloudflare (1.1.1.1): $cf_result"
    
    if [[ "$our_result" == "$google_result" ]] || [[ "$our_result" == "$cf_result" ]]; then
        print_status "SUCCESS" "DNS responses consistent with major providers"
    else
        print_status "WARNING" "DNS responses differ from major providers"
    fi
}

task_emergency_dns() {
    print_status "PROGRESS" "Accessing emergency DNS recovery"
    
    if [[ -f "$SCRIPT_DIR/EMERGENCY_DNS_RECOVERY.ps1" ]]; then
        print_status "INFO" "Emergency DNS recovery script found"
        echo
        echo -e "${BOLD}🚨 Emergency DNS Recovery Options:${NC}"
        echo
        echo "1. Run PowerShell script (Windows):"
        echo "   powershell.exe -ExecutionPolicy Bypass -File '$SCRIPT_DIR/EMERGENCY_DNS_RECOVERY.ps1'"
        echo
        echo "2. Quick Linux recovery:"
        echo "   # Stop ctrld service"
        echo "   sudo systemctl stop ctrld"
        echo "   # Reset DNS to Google"
        echo "   echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf"
        echo
        echo "3. Router DNS reset:"
        echo "   # Access router (usually http://192.168.1.1)"
        echo "   # Set DNS to 8.8.8.8 and 8.8.4.4"
        echo
        print_status "WARNING" "Use emergency recovery only if normal DNS is failing"
    else
        print_status "ERROR" "Emergency DNS recovery script not found"
        print_status "INFO" "Manual recovery: Set DNS to 8.8.8.8 on router or individual devices"
    fi
}

task_restart_all() {
    print_status "PROGRESS" "Restarting all network services"
    
    # Restart ctrld service
    echo
    echo -e "${BOLD}🔄 Restarting ctrld service:${NC}"
    if sudo ctrld reload 2>/dev/null; then
        print_status "SUCCESS" "ctrld service reloaded"
    else
        print_status "WARNING" "ctrld reload failed, trying restart"
        if sudo ctrld restart 2>/dev/null; then
            print_status "SUCCESS" "ctrld service restarted"
        else
            print_status "ERROR" "ctrld restart failed"
        fi
    fi
    
    # Restart router logs if running
    echo
    echo -e "${BOLD}🔄 Router logs service:${NC}"
    if pgrep -f "continuous-log-collector" >/dev/null; then
        print_status "INFO" "Stopping router log collector"
        pkill -f "continuous-log-collector" 2>/dev/null || true
        sleep 2
        
        if [[ -d "$ROUTER_LOGS_DIR" ]]; then
            print_status "INFO" "Starting router log collector"
            cd "$ROUTER_LOGS_DIR" && nohup node continuous-log-collector.js >/dev/null 2>&1 &
            cd "$SCRIPT_DIR"
            sleep 2
            
            if pgrep -f "continuous-log-collector" >/dev/null; then
                print_status "SUCCESS" "Router log collector restarted"
            else
                print_status "ERROR" "Failed to restart router log collector"
            fi
        fi
    else
        print_status "INFO" "Router log collector not running"
    fi
    
    # Flush DNS cache
    echo
    echo -e "${BOLD}🔄 Flushing DNS cache:${NC}"
    if command -v systemd-resolve >/dev/null 2>&1; then
        sudo systemd-resolve --flush-caches 2>/dev/null && print_status "SUCCESS" "systemd DNS cache flushed" || true
    fi
    
    print_status "INFO" "Service restart sequence completed"
}

task_show_status() {
    print_status "PROGRESS" "Showing network status"
    
    if [[ -x "$SCRIPT_DIR/network-status.sh" ]]; then
        "$SCRIPT_DIR/network-status.sh"
    else
        print_status "ERROR" "network-status.sh not found or not executable"
    fi
}

# Help and usage
show_usage() {
    echo "Usage: $0 <task> [options]"
    echo
    echo "Available tasks:"
    echo "  dns-backup      Create backup of DNS configuration"
    echo "  sync-blocklists Run ctrld-sync to update block-lists"
    echo "  check-logs      Review recent service logs"
    echo "  test-dns        Run comprehensive DNS tests"
    echo "  emergency-dns   Access emergency DNS recovery procedures"
    echo "  restart-all     Restart all network services"
    echo "  status          Show current network status"
    echo
    echo "Options:"
    echo "  --verbose, -v   Show detailed output"
    echo "  --help, -h      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 status                    # Quick status check"
    echo "  $0 test-dns                  # Test DNS resolution"
    echo "  $0 sync-blocklists           # Update block-lists"
    echo "  $0 dns-backup                # Create configuration backup"
    echo
}

show_task_list() {
    echo -e "${BOLD}Available Network Tasks:${NC}"
    echo
    echo "🔍 Monitoring & Status:"
    echo "   status          - Show comprehensive network status"
    echo "   check-logs      - Review recent service logs"
    echo "   test-dns        - Run comprehensive DNS tests"
    echo
    echo "🔧 Maintenance:"
    echo "   sync-blocklists - Update Control D block-lists"
    echo "   restart-all     - Restart all network services"
    echo "   dns-backup      - Backup DNS configuration"
    echo
    echo "🚨 Emergency:"
    echo "   emergency-dns   - Access emergency DNS recovery"
    echo
    echo "Use '$0 <task>' to run a specific task"
    echo "Use '$0 --help' for detailed usage information"
}

# Main execution
main() {
    local task=""
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            dns-backup|sync-blocklists|check-logs|test-dns|emergency-dns|restart-all|status)
                task="$1"
                shift
                ;;
            --verbose|-v)
                verbose=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            list)
                show_task_list
                exit 0
                ;;
            *)
                if [[ -z "$task" ]]; then
                    echo "Unknown task: $1"
                    echo "Use '$0 list' to see available tasks"
                    echo "Use '$0 --help' for usage information"
                    exit 1
                else
                    echo "Unknown option: $1"
                    exit 1
                fi
                ;;
        esac
    done
    
    # If no task specified, show task list
    if [[ -z "$task" ]]; then
        show_task_list
        exit 0
    fi
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_PATH")" "$BACKUP_DIR" 2>/dev/null || true
    
    print_header
    
    # Execute the requested task
    case $task in
        dns-backup)
            task_dns_backup
            ;;
        sync-blocklists)
            task_sync_blocklists
            ;;
        check-logs)
            task_check_logs
            ;;
        test-dns)
            task_test_dns
            ;;
        emergency-dns)
            task_emergency_dns
            ;;
        restart-all)
            task_restart_all
            ;;
        status)
            task_show_status
            ;;
        *)
            print_status "ERROR" "Unknown task: $task"
            exit 1
            ;;
    esac
    
    echo
    print_status "INFO" "Task '$task' completed at $(date)"
}

# Error handling
set -euo pipefail
trap 'echo -e "\n${RED}Task interrupted${NC}"' INT TERM

# Run main function
main "$@"