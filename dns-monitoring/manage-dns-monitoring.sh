#!/bin/bash
# DNS Monitoring Management Script
# Manages Control D DNS monitoring with device routing table

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        return 1
    fi
    
    # Check Python3
    if ! command -v python3 &> /dev/null; then
        error "Python3 is not installed"
        return 1
    fi
    
    # Check PM2 (optional)
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 is not installed - install with: npm install -g pm2"
    fi
    
    # Check Control D log file
    if [[ ! -f "/mnt/c/ctrld.log" ]]; then
        warn "Control D log file not found at /mnt/c/ctrld.log"
        warn "Make sure Control D is running on Windows and enhanced config is applied"
    fi
    
    log "Dependencies check completed"
}

setup_environment() {
    log "Setting up DNS monitoring environment..."
    
    # Create necessary directories
    mkdir -p dns_logs logs
    
    # Check for device map
    if [[ ! -f "device-map.json" ]]; then
        warn "Device map not found, creating empty one"
        python3 device-mapper.py --analyze /mnt/c/ctrld.log 2>/dev/null || true
    fi
    
    # Install Node dependencies if needed
    if [[ ! -f "node_modules/dotenv/package.json" ]]; then
        log "Installing Node.js dependencies..."
        npm install dotenv
    fi
    
    log "Environment setup completed"
}

status_check() {
    echo
    echo "============================="
    echo "DNS Monitoring System Status"
    echo "============================="
    
    # Control D status (Windows)
    info "Control D Configuration:"
    if [[ -f "/mnt/c/ControlD/ctrld.toml" ]]; then
        echo "  ✅ Configuration file exists"
        if grep -q "0.0.0.0" /mnt/c/ControlD/ctrld.toml 2>/dev/null; then
            echo "  ✅ Enhanced config (network-wide monitoring)"
        else
            echo "  ⚠️  Basic config (localhost only)"
        fi
    else
        echo "  ❌ Configuration file not found"
    fi
    
    # Log file status
    info "DNS Logs:"
    if [[ -f "/mnt/c/ctrld.log" ]]; then
        local log_size=$(stat -f%z /mnt/c/ctrld.log 2>/dev/null || stat -c%s /mnt/c/ctrld.log 2>/dev/null || echo "0")
        local log_modified=$(stat -f%Sm /mnt/c/ctrld.log 2>/dev/null || stat -c%y /mnt/c/ctrld.log 2>/dev/null || echo "Unknown")
        echo "  ✅ Log file exists ($(( log_size / 1024 ))KB)"
        echo "  📅 Last modified: $log_modified"
    else
        echo "  ❌ DNS log file not found"
    fi
    
    # Device mapping status
    info "Device Mapping:"
    if [[ -f "device-map.json" ]]; then
        local device_count=$(python3 -c "import json; print(len(json.load(open('device-map.json'))['devices']))" 2>/dev/null || echo "0")
        echo "  ✅ Device map exists ($device_count devices)"
    else
        echo "  ❌ Device map not found"
    fi
    
    # Process status (PM2)
    info "Process Status:"
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "dns-log-collector"; then
            echo "  ✅ DNS collector running (PM2)"
        else
            echo "  ⚠️  DNS collector not running"
        fi
    else
        echo "  ⚠️  PM2 not installed"
    fi
    
    # Recent activity
    info "Recent Activity:"
    if [[ -f "dns_logs/summary-$(date +%Y-%m-%d).json" ]]; then
        echo "  ✅ Today's summary exists"
        local query_count=$(python3 -c "import json; print(json.load(open('dns_logs/summary-$(date +%Y-%m-%d).json'))['session']['totalQueries'])" 2>/dev/null || echo "0")
        echo "  📊 Queries processed today: $query_count"
    else
        echo "  ⚠️  No activity today"
    fi
}

analyze_network() {
    log "Analyzing network devices..."
    
    # Update device mapping with latest data
    python3 device-mapper.py --analyze /mnt/c/ctrld.log
    
    # Generate routing table
    python3 device-mapper.py --export device-routing-table.json
    
    # Show device summary
    echo
    echo "=============================="
    echo "Network Device Analysis"
    echo "=============================="
    python3 device-mapper.py --list
    
    echo
    info "Routing table exported to: device-routing-table.json"
}

start_monitoring() {
    log "Starting DNS monitoring..."
    
    setup_environment
    
    if command -v pm2 &> /dev/null; then
        # Use PM2 for process management
        log "Starting with PM2 process manager..."
        pm2 start dns-ecosystem.config.js
        pm2 save
        log "DNS monitoring started with PM2"
        log "Use 'pm2 status' to check status, 'pm2 logs' to view logs"
    else
        # Fallback to direct execution
        log "Starting DNS collector directly..."
        nohup node dns-log-collector.js > logs/dns-collector.log 2>&1 &
        echo $! > dns-collector.pid
        log "DNS collector started (PID: $(cat dns-collector.pid))"
        log "Use 'tail -f logs/dns-collector.log' to view logs"
    fi
}

stop_monitoring() {
    log "Stopping DNS monitoring..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop dns-ecosystem.config.js
        pm2 delete dns-ecosystem.config.js
        log "PM2 processes stopped"
    fi
    
    if [[ -f "dns-collector.pid" ]]; then
        local pid=$(cat dns-collector.pid)
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm dns-collector.pid
            log "DNS collector stopped"
        fi
    fi
}

generate_report() {
    log "Generating network monitoring report..."
    
    # Run analysis
    analyze_network
    
    # Generate comprehensive report using our tools
    echo
    echo "=============================="
    echo "DNS Traffic Analysis Report"
    echo "=============================="
    python3 dns-traffic-analyzer.py /mnt/c/ctrld.log
    
    echo
    info "Report generation completed"
}

show_help() {
    cat << EOF
DNS Monitoring Management Script

Usage: $0 [COMMAND]

Commands:
    status      Show system status and configuration
    start       Start DNS monitoring with PM2 or direct execution
    stop        Stop all DNS monitoring processes
    analyze     Analyze network devices and update routing table
    report      Generate comprehensive network monitoring report
    setup       Setup environment and dependencies
    help        Show this help message

Examples:
    $0 status          # Check system status
    $0 start           # Start monitoring
    $0 analyze         # Update device analysis
    $0 report          # Generate full report

Files created:
    device-map.json           # Device identification database
    device-routing-table.json # Network routing table export
    dns_logs/                 # DNS log storage directory
    logs/                     # Process and application logs

For manual device management:
    python3 device-mapper.py --help

For manual DNS analysis:
    python3 dns-traffic-analyzer.py /mnt/c/ctrld.log
EOF
}

main() {
    case "${1:-help}" in
        "status")
            check_dependencies
            status_check
            ;;
        "start")
            check_dependencies
            start_monitoring
            ;;
        "stop")
            stop_monitoring
            ;;
        "analyze")
            analyze_network
            ;;
        "report")
            generate_report
            ;;
        "setup")
            check_dependencies
            setup_environment
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"