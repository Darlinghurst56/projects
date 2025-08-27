#!/bin/bash
# MCP Stop Script for Linux/WSL
# Note: MCP servers run through Claude's desktop app, not as standalone processes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Note: MCP servers run through Claude's desktop app${NC}"
echo -e "${YELLOW}They are not standalone background processes.${NC}"
echo -e ""
echo -e "${GREEN}To stop MCP servers:${NC}"
echo -e "1. Close Claude desktop application"
echo -e "2. Or disable specific MCPs in Claude's settings"
echo -e ""
echo -e "${YELLOW}If you have any test MCP processes running:${NC}"

# Kill any test npx processes that might be running MCP servers
if pgrep -f "@modelcontextprotocol/server-" > /dev/null 2>&1; then
    pkill -f "@modelcontextprotocol/server-"
    echo -e "${GREEN}Stopped test MCP processes${NC}"
fi

if pgrep -f "@browsermcp/mcp" > /dev/null 2>&1; then
    pkill -f "@browsermcp/mcp"
    echo -e "${GREEN}Stopped Browser MCP test process${NC}"
fi

echo -e "${GREEN}Done.${NC}"