#!/bin/bash
# Network Monitor Script for Control D DNS Server
# Provides real-time monitoring and analysis tools

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CTRLD_LOG="/mnt/c/ctrld.log"
CTRLD_CONFIG="/mnt/c/ControlD/ctrld.toml"

echo -e "${GREEN}Control D Network Monitor${NC}"
echo "=========================="

# Function to check if Control D is running
check_ctrld_status() {
    echo -e "\n${BLUE}Control D Status:${NC}"
    if pgrep -f "ctrld" > /dev/null; then
        echo -e "${GREEN}✓ Control D is running${NC}"
        
        # Check if DNS port 53 is listening
        if netstat -ln 2>/dev/null | grep ":53 " > /dev/null; then
            echo -e "${GREEN}✓ DNS server listening on port 53${NC}"
        else
            echo -e "${YELLOW}⚠ DNS port 53 not detected${NC}"
        fi
    else
        echo -e "${RED}✗ Control D is not running${NC}"
    fi
}

# Function to show recent DNS queries
show_recent_queries() {
    echo -e "\n${BLUE}Recent DNS Queries (Last 10):${NC}"
    echo "----------------------------------------"
    if [ -f "$CTRLD_LOG" ]; then
        tail -20 "$CTRLD_LOG" | grep "QUERY" | tail -10 | while read line; do
            # Extract timestamp, client IP, and domain from JSON log
            timestamp=$(echo "$line" | jq -r '.time' 2>/dev/null | cut -c1-19)
            message=$(echo "$line" | jq -r '.message' 2>/dev/null)
            
            if [[ $message == *"QUERY"* ]]; then
                # Extract client IP and domain using regex
                client_ip=$(echo "$message" | sed -n 's/.*QUERY: \([0-9.]*\):[0-9]*.*/\1/p')
                domain=$(echo "$message" | sed -n 's/.*-> listener\.[0-9]*: [A-Z]* \(.*\)/\1/p')
                query_type=$(echo "$message" | sed -n 's/.*-> listener\.[0-9]*: \([A-Z]*\) .*/\1/p')
                
                printf "%-19s %-15s %-6s %s\n" "$timestamp" "$client_ip" "$query_type" "$domain"
            fi
        done
    else
        echo -e "${RED}Log file not found: $CTRLD_LOG${NC}"
    fi
}

# Function to monitor live traffic
monitor_live_traffic() {
    echo -e "\n${BLUE}Live DNS Traffic Monitor (Press Ctrl+C to stop):${NC}"
    echo "=================================================="
    if [ -f "$CTRLD_LOG" ]; then
        tail -f "$CTRLD_LOG" | while read line; do
            if echo "$line" | grep -q "QUERY"; then
                timestamp=$(echo "$line" | jq -r '.time' 2>/dev/null | cut -c12-19)
                message=$(echo "$line" | jq -r '.message' 2>/dev/null)
                
                client_ip=$(echo "$message" | sed -n 's/.*QUERY: \([0-9.]*\):[0-9]*.*/\1/p')
                domain=$(echo "$message" | sed -n 's/.*-> listener\.[0-9]*: [A-Z]* \(.*\)/\1/p')
                query_type=$(echo "$message" | sed -n 's/.*-> listener\.[0-9]*: \([A-Z]*\) .*/\1/p')
                
                printf "${GREEN}%s${NC} %-15s ${YELLOW}%-6s${NC} %s\n" "$timestamp" "$client_ip" "$query_type" "$domain"
            fi
        done
    else
        echo -e "${RED}Log file not found: $CTRLD_LOG${NC}"
    fi
}

# Function to show network devices
show_network_devices() {
    echo -e "\n${BLUE}Active Network Devices:${NC}"
    echo "----------------------"
    if [ -f "$CTRLD_LOG" ]; then
        # Extract unique client IPs from recent logs
        tail -100 "$CTRLD_LOG" | grep "QUERY" | \
        sed -n 's/.*QUERY: \([0-9.]*\):[0-9]*.*/\1/p' | \
        sort | uniq -c | sort -nr | head -10 | \
        while read count ip; do
            printf "%-15s %s queries\n" "$ip" "$count"
        done
    else
        echo -e "${RED}Log file not found: $CTRLD_LOG${NC}"
    fi
}

# Function to analyze traffic patterns
analyze_traffic() {
    echo -e "\n${BLUE}Running DNS Traffic Analysis...${NC}"
    if [ -f "/home/darlinghurstlinux/dns-traffic-analyzer.py" ]; then
        python3 /home/darlinghurstlinux/dns-traffic-analyzer.py "$CTRLD_LOG"
    else
        echo -e "${YELLOW}DNS traffic analyzer script not found${NC}"
        echo "Please ensure dns-traffic-analyzer.py is in the current directory"
    fi
}

# Main menu
show_menu() {
    echo -e "\n${YELLOW}Select an option:${NC}"
    echo "1. Check Control D status"
    echo "2. Show recent DNS queries"
    echo "3. Monitor live traffic"
    echo "4. Show active network devices"
    echo "5. Run traffic analysis"
    echo "6. Exit"
    echo -n "Enter choice [1-6]: "
}

# Main execution
case "${1:-}" in
    --status)
        check_ctrld_status
        ;;
    --recent)
        show_recent_queries
        ;;
    --live)
        monitor_live_traffic
        ;;
    --devices)
        show_network_devices
        ;;
    --analyze)
        analyze_traffic
        ;;
    *)
        while true; do
            show_menu
            read -r choice
            
            case $choice in
                1) check_ctrld_status ;;
                2) show_recent_queries ;;
                3) monitor_live_traffic ;;
                4) show_network_devices ;;
                5) analyze_traffic ;;
                6) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
                *) echo -e "${RED}Invalid option. Please try again.${NC}" ;;
            esac
        done
        ;;
esac