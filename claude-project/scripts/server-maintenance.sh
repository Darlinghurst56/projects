#!/bin/bash

# TaskMaster API Server Maintenance Script
# Server Agent - Maintenance operations and health management

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 TaskMaster API Server Maintenance Tool${NC}"
echo "=========================================="

# Function to check server status
check_server_status() {
    echo -e "${BLUE}🔍 Checking server status...${NC}"
    
    PID=$(ps aux | grep "taskmaster-api-server" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        echo -e "${RED}❌ Server is not running${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Server is running (PID: $PID)${NC}"
        
        # Check responsiveness
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is responding to requests${NC}"
            return 0
        else
            echo -e "${RED}❌ Server is not responding${NC}"
            return 2
        fi
    fi
}

# Function to start server
start_server() {
    echo -e "${BLUE}🚀 Starting TaskMaster API server...${NC}"
    
    cd /mnt/d/Projects/claude-project
    nohup node taskmaster-api-server.js > server.log 2>&1 &
    
    sleep 3
    
    if check_server_status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started successfully${NC}"
        NEW_PID=$(ps aux | grep "taskmaster-api-server" | grep -v grep | awk '{print $2}')
        echo "   Process ID: $NEW_PID"
        echo "   Dashboard: http://localhost:3001/"
        echo "   Logs: server.log"
    else
        echo -e "${RED}❌ Failed to start server${NC}"
        echo "Check server.log for errors"
    fi
}

# Function to stop server
stop_server() {
    echo -e "${BLUE}🛑 Stopping TaskMaster API server...${NC}"
    
    PID=$(ps aux | grep "taskmaster-api-server" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        echo -e "${YELLOW}⚠️  Server is not running${NC}"
    else
        echo "   Terminating process $PID"
        kill -SIGTERM $PID
        sleep 2
        
        # Check if process ended
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Process still running, forcing shutdown${NC}"
            kill -SIGKILL $PID
            sleep 1
        fi
        
        echo -e "${GREEN}✅ Server stopped${NC}"
    fi
}

# Function to restart server
restart_server() {
    echo -e "${BLUE}🔄 Restarting TaskMaster API server...${NC}"
    stop_server
    sleep 2
    start_server
}

# Function to view server logs
view_logs() {
    echo -e "${BLUE}📋 Server Logs (last 20 lines):${NC}"
    echo "================================"
    
    if [ -f "server.log" ]; then
        tail -20 server.log
    else
        echo -e "${YELLOW}⚠️  No server.log file found${NC}"
    fi
}

# Function to check server health
health_check() {
    echo -e "${BLUE}🏥 Comprehensive Health Check:${NC}"
    echo "=============================="
    
    # Process check
    PID=$(ps aux | grep "taskmaster-api-server" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        echo -e "${RED}❌ Process: Not running${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Process: Running (PID: $PID)${NC}"
    fi
    
    # Port check
    if netstat -tlnp 2>/dev/null | grep :3001 > /dev/null; then
        echo -e "${GREEN}✅ Port 3001: Listening${NC}"
    else
        echo -e "${RED}❌ Port 3001: Not listening${NC}"
    fi
    
    # HTTP health check
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ HTTP Health: OK${NC}"
        if command -v jq > /dev/null 2>&1; then
            STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')
            UPTIME=$(echo "$HEALTH_RESPONSE" | jq -r '.uptime')
            echo "   Status: $STATUS"
            echo "   Uptime: ${UPTIME} seconds"
        fi
    else
        echo -e "${RED}❌ HTTP Health: Failed${NC}"
    fi
    
    # Detailed server status
    SERVER_STATUS=$(curl -s http://localhost:3001/api/server/status 2>/dev/null)
    if [ $? -eq 0 ] && command -v jq > /dev/null 2>&1; then
        echo ""
        echo -e "${BLUE}📊 System Metrics:${NC}"
        
        MEMORY=$(echo "$SERVER_STATUS" | jq -r '.performance.memory.heapUsed')
        WS_CONN=$(echo "$SERVER_STATUS" | jq -r '.connectivity.webSocket.connections')
        AGENTS=$(echo "$SERVER_STATUS" | jq -r '.services.agentCoordination.activeAgents')
        TASKS=$(echo "$SERVER_STATUS" | jq -r '.services.taskmaster.taskCount')
        
        echo "   Memory Usage: $MEMORY"
        echo "   WebSocket Connections: $WS_CONN"
        echo "   Active Agents: $AGENTS"
        echo "   Total Tasks: $TASKS"
    fi
}

# Function to clean up old logs
cleanup_logs() {
    echo -e "${BLUE}🧹 Cleaning up old logs...${NC}"
    
    if [ -f "server.log" ]; then
        LOG_SIZE=$(du -h server.log | cut -f1)
        echo "   Current log size: $LOG_SIZE"
        
        # Keep last 1000 lines
        tail -1000 server.log > server.log.tmp
        mv server.log.tmp server.log
        
        NEW_SIZE=$(du -h server.log | cut -f1)
        echo -e "${GREEN}✅ Log trimmed to last 1000 lines (${NEW_SIZE})${NC}"
    else
        echo -e "${YELLOW}⚠️  No server.log file found${NC}"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${CYAN}Available Operations:${NC}"
    echo "1. Check server status"
    echo "2. Start server"
    echo "3. Stop server" 
    echo "4. Restart server"
    echo "5. View logs"
    echo "6. Health check"
    echo "7. Clean up logs"
    echo "8. Exit"
    echo ""
}

# Main execution
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Select operation (1-8): " choice
        
        case $choice in
            1) check_server_status ;;
            2) start_server ;;
            3) stop_server ;;
            4) restart_server ;;
            5) view_logs ;;
            6) health_check ;;
            7) cleanup_logs ;;
            8) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${RED}❌ Invalid option${NC}" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
else
    # Command line mode
    case $1 in
        "status") check_server_status ;;
        "start") start_server ;;
        "stop") stop_server ;;
        "restart") restart_server ;;
        "logs") view_logs ;;
        "health") health_check ;;
        "cleanup") cleanup_logs ;;
        *)
            echo "Usage: $0 [status|start|stop|restart|logs|health|cleanup]"
            echo "   Or run without arguments for interactive mode"
            ;;
    esac
fi