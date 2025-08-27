#!/bin/bash

# MCP Server Configuration Script
# This script verifies MCP server configuration and dependencies
# MCP servers are started automatically by Claude Code when needed

# Load NVM and use Node.js 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22.16.0

# Set PATH to ensure we use the correct Node.js
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"

# Print environment info
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
NODE_PATH=$(which node)
echo "Using Node.js version: $NODE_VERSION"
echo "Using npm version: $NPM_VERSION"
echo "Node.js path: $NODE_PATH"

# Create Claude MCP directory if it doesn't exist
claude_dir="/mnt/d/Projects/claude-project"
if [ ! -d "$claude_dir" ]; then
    mkdir -p "$claude_dir"
fi
mkdir -p "$claude_dir/memory"

echo "\n==============================="
echo "MCP Server Configuration Check"
echo "===============================\n"

# Clean up any stale PID files from previous incorrect attempts
if [ -d "$claude_dir/pids" ]; then
    echo "Cleaning up stale PID files..."
    rm -rf "$claude_dir/pids"
    echo "  Removed stale PID directory"
fi

# Function to check if MCP server package is available
check_mcp_server() {
    local name="$1"
    local package="$2"
    echo "Checking $name MCP server..."
    
    if npm ls -g "$package" > /dev/null 2>&1 || npx --yes "$package" --help > /dev/null 2>&1; then
        echo "✓ $name MCP server is available"
        return 0
    else
        echo "⚠ $name MCP server may need installation: npm install -g $package"
        return 1
    fi
}

# Check availability of MCP servers
echo "Verifying MCP server dependencies:\n"

check_mcp_server "Memory" "@modelcontextprotocol/server-memory"
check_mcp_server "Sequential-Thinking" "@modelcontextprotocol/server-sequential-thinking"
check_mcp_server "Filesystem" "@modelcontextprotocol/server-filesystem"
check_mcp_server "GitHub" "@modelcontextprotocol/server-github"
check_mcp_server "Playwright" "@modelcontextprotocol/server-playwright"
check_mcp_server "Docker" "@modelcontextprotocol/server-docker"
check_mcp_server "ESLint" "@eslint/mcp"
check_mcp_server "Context7" "@upstash/context7-mcp"
check_mcp_server "Sourcery" "@sourcery-ai/sourcery-mcp-server"

# Check configuration files
echo "\nChecking configuration files:"
if [ -f "$claude_dir/.mcp.json" ]; then
    echo "✓ .mcp.json configuration found"
else
    echo "⚠ .mcp.json configuration not found"
fi

# Environment variables check
echo "\nChecking environment variables:"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✓ GITHUB_TOKEN is set"
else
    echo "⚠ GITHUB_TOKEN not set (GitHub MCP may not work)"
fi

if [ -n "$GOOGLE_API_KEY" ]; then
    echo "✓ GOOGLE_API_KEY is set"
else
    echo "⚠ GOOGLE_API_KEY not set (some features may not work)"
fi

echo "\n==============================="
echo "MCP Server Status"
echo "===============================\n"

echo "MCP servers are configured and will be started automatically by Claude Code when needed."
echo "They do not run as background processes."
echo "\nConfigured servers in .mcp.json:"
echo "  • Memory (persistent storage)"
echo "  • Sequential-Thinking (complex reasoning)"
echo "  • Filesystem (file operations)"
echo "  • GitHub (repository management)"
echo "  • Playwright (browser automation)"
echo "  • Docker (container management)"
echo "  • ESLint (code linting)"
echo "  • Context7 (code documentation)"
echo "  • Sourcery (code quality and refactoring)"
echo "  • Custom servers (fetch, accessibility, user-testing, design-system)"

echo "\nUseful commands:"
echo "  Check configuration: cat $claude_dir/.mcp.json"
echo "  Test MCP server: npx @modelcontextprotocol/server-memory --help"
echo "  Claude Code docs: https://docs.anthropic.com/en/docs/claude-code/mcp"

echo "\nNote: If you encounter issues with MCP servers, they will be shown in Claude Code's output."
echo "MCP servers communicate via stdio and are managed by Claude Code directly."