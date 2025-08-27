#!/bin/bash

# MCP Setup Validation Script
# Validates environment and MCP server configurations

set -e

echo "🔍 Validating MCP Setup..."

# Check if we're in the correct directory
if [ ! -f ".mcp.json" ]; then
    echo "❌ Error: .mcp.json not found. Run from claude-project directory."
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copy from .env.example"
    if [ -f ".env.example" ]; then
        echo "   Run: cp .env.example .env"
    fi
else
    echo "✅ .env file found"
fi

# Validate .env has required keys (if file exists)
if [ -f ".env" ]; then
    source .env
    
    # Check GitHub token
    if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" = "your_github_personal_access_token_here" ]; then
        echo "⚠️  Warning: GITHUB_TOKEN not configured"
    else
        echo "✅ GITHUB_TOKEN configured"
    fi
    
    # Check Google API key
    if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your_google_api_key_here" ]; then
        echo "⚠️  Warning: GOOGLE_API_KEY not configured"
    else
        echo "✅ GOOGLE_API_KEY configured"
    fi
fi

# Check custom MCP server files exist
echo "🔍 Checking custom MCP servers..."

custom_servers=(
    "./mcp-servers/accessibility-testing-mcp/index.js"
    "./mcp-servers/user-testing-mcp/index.js" 
    "./mcp-servers/design-system-mcp/index.js"
)

for server in "${custom_servers[@]}"; do
    if [ -f "$server" ]; then
        echo "✅ $(basename $(dirname $server)) server found"
    else
        echo "❌ Missing: $server"
    fi
done

# Check if dashboard build script exists (for tailwindcss MCP)
if [ -f "./dashboard/build.js" ]; then
    echo "✅ Dashboard build script found"
else
    echo "⚠️  Warning: ./dashboard/build.js not found (required for tailwindcss MCP)"
fi

# Test basic MCP server functionality
echo "🧪 Testing core MCP servers..."

# Test filesystem server
echo "Testing filesystem server..."
timeout 5s npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1 && echo "✅ Filesystem server OK" || echo "❌ Filesystem server failed"

# Test memory server
echo "Testing memory server..."
timeout 5s npx @modelcontextprotocol/server-memory --help > /dev/null 2>&1 && echo "✅ Memory server OK" || echo "❌ Memory server failed"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "📋 npm version: $NPM_VERSION"

# Validate .mcp.json syntax
echo "📋 Validating .mcp.json syntax..."
if jq empty .mcp.json 2>/dev/null; then
    echo "✅ .mcp.json is valid JSON"
else
    echo "❌ .mcp.json has syntax errors"
    exit 1
fi

# Check for absolute paths in .mcp.json (should be relative now)
if grep -q "/mnt/" .mcp.json; then
    echo "❌ Found absolute Windows paths in .mcp.json"
    exit 1
else
    echo "✅ No absolute paths found in .mcp.json"
fi

# Count configured servers
SERVER_COUNT=$(jq '.mcpServers | length' .mcp.json)
echo "📋 Total configured MCP servers: $SERVER_COUNT"

echo ""
echo "🎉 MCP setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Configure missing API keys in .env"
echo "2. Run: ./start-mcps-final.sh"
echo "3. Test with Claude Desktop"