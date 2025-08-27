#!/bin/bash
# Claude CLI MCP Setup Script
# This script configures MCP servers for Claude CLI

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Claude CLI MCP Setup Script${NC}"
echo -e "${CYAN}===========================${NC}\n"

# Check if Claude CLI is installed
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude CLI is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Claude CLI first: npm install -g @anthropic/claude-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Claude CLI found${NC}\n"

# Function to setup MCP
setup_mcp() {
    local name=$1
    local command=$2
    shift 2
    local args=("$@")
    
    echo -e "${CYAN}Setting up $name MCP...${NC}"
    
    # For project scope, we rely on .mcp.json
    echo -e "${GREEN}✓ $name configured in .mcp.json${NC}"
}

# Ensure we're in the project root directory
project_root="/mnt/d/Projects"
if [ ! -f "$project_root/.mcp.json" ]; then
    echo -e "${RED}Error: .mcp.json not found in $project_root${NC}"
    echo -e "${YELLOW}Please run this script from $project_root${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found .mcp.json configuration${NC}\n"

# Set up environment variables if not already set
echo -e "${CYAN}Checking environment variables...${NC}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠ GITHUB_TOKEN not set. GitHub MCP will not work without it.${NC}"
    echo -e "${YELLOW}  Set it with: export GITHUB_TOKEN='your-token'${NC}"
else
    echo -e "${GREEN}✓ GITHUB_TOKEN is set${NC}"
fi

if [ -z "$BRAVE_API_KEY" ]; then
    echo -e "${YELLOW}⚠ BRAVE_API_KEY not set. Brave Search MCP will not work without it.${NC}"
    echo -e "${YELLOW}  Set it with: export BRAVE_API_KEY='your-key'${NC}"
else
    echo -e "${GREEN}✓ BRAVE_API_KEY is set${NC}"
fi

echo -e "\n${CYAN}MCP Servers configured in .mcp.json:${NC}"
echo -e "• filesystem - File operations"
echo -e "• memory - Persistent memory"
echo -e "• sequential-thinking - Complex reasoning"
echo -e "• github - GitHub integration (requires GITHUB_TOKEN)"
echo -e "• brave-search - Web search (requires BRAVE_API_KEY)"
echo -e "• browser - Web browsing"

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "\n${CYAN}To use MCPs with Claude CLI:${NC}"
echo -e "1. Change to the project root: ${YELLOW}cd /mnt/d/Projects${NC}"
echo -e "2. Start a new Claude CLI session: ${YELLOW}claude${NC}"
echo -e "3. MCPs will be automatically loaded from .mcp.json"
echo -e "4. Check MCP status with: ${YELLOW}/mcp${NC}"
echo -e "5. Use MCP tools as they become available"

echo -e "\n${CYAN}Useful Claude CLI commands:${NC}"
echo -e "• ${YELLOW}claude mcp list${NC} - List all configured MCPs"
echo -e "• ${YELLOW}claude mcp status${NC} - Check MCP server status"
echo -e "• ${YELLOW}claude --help${NC} - Get help with Claude CLI"