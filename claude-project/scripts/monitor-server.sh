#!/bin/bash

# TaskMaster API Server Monitoring Script
# Server Agent - Continuous monitoring and health checks

echo "🖥️  TaskMaster API Server Monitor - Server Agent"
echo "=============================================="
echo "Monitoring server at http://localhost:3001"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Monitoring loop
while true; do
    clear
    echo -e "${BLUE}🖥️  TaskMaster API Server Monitor - $(date)${NC}"
    echo "=============================================="
    
    # Check if server process is running
    PID=$(ps aux | grep "taskmaster-api-server" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        echo -e "${RED}❌ Server Process: NOT RUNNING${NC}"
        echo "   Server needs to be restarted!"
    else
        echo -e "${GREEN}✅ Server Process: RUNNING (PID: $PID)${NC}"
    fi
    
    # Check port accessibility
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port 3001: ACCESSIBLE${NC}"
    else
        echo -e "${RED}❌ Port 3001: NOT ACCESSIBLE${NC}"
    fi
    
    # Check WebSocket endpoint
    if curl -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001/ws 2>/dev/null | grep -q "101\|400"; then
        echo -e "${GREEN}✅ WebSocket: AVAILABLE${NC}"
    else
        echo -e "${YELLOW}⚠️  WebSocket: CHECK NEEDED${NC}"
    fi
    
    # Get detailed server status
    echo ""
    echo -e "${BLUE}📊 Server Status Details:${NC}"
    
    STATUS=$(curl -s http://localhost:3001/api/server/status 2>/dev/null)
    if [ $? -eq 0 ]; then
        # Parse key metrics using jq if available, otherwise basic parsing
        if command -v jq > /dev/null 2>&1; then
            UPTIME=$(echo "$STATUS" | jq -r '.server.uptime')
            MEMORY_USED=$(echo "$STATUS" | jq -r '.performance.memory.heapUsed')
            WS_CONNECTIONS=$(echo "$STATUS" | jq -r '.connectivity.webSocket.connections')
            ACTIVE_AGENTS=$(echo "$STATUS" | jq -r '.services.agentCoordination.activeAgents')
            TASK_COUNT=$(echo "$STATUS" | jq -r '.services.taskmaster.taskCount')
            
            echo "   Uptime: ${UPTIME} seconds"
            echo "   Memory Used: ${MEMORY_USED}"
            echo "   WebSocket Connections: ${WS_CONNECTIONS}"
            echo "   Active Agents: ${ACTIVE_AGENTS}"
            echo "   Total Tasks: ${TASK_COUNT}"
        else
            echo "   Server status retrieved (install jq for detailed metrics)"
        fi
        
        echo ""
        echo -e "${BLUE}🔗 Available Endpoints:${NC}"
        echo "   Dashboard: http://localhost:3001/"
        echo "   Health: http://localhost:3001/api/health"
        echo "   Server Monitor: http://localhost:3001/api/server/status"
        echo "   Agents: http://localhost:3001/api/agents"
        echo "   Coordination: http://localhost:3001/api/coordination/status"
        
    else
        echo -e "${RED}   ❌ Unable to retrieve server status${NC}"
    fi
    
    # Check recent log entries
    echo ""
    echo -e "${BLUE}📋 Recent Server Logs:${NC}"
    if [ -f "server.log" ]; then
        tail -3 server.log | sed 's/^/   /'
    else
        echo "   No server.log file found"
    fi
    
    echo ""
    echo -e "${YELLOW}⏱️  Next check in 30 seconds... (Ctrl+C to stop)${NC}"
    sleep 30
done