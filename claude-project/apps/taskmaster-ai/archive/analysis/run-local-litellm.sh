#!/bin/bash

# Local LiteLLM Proxy Runner
# Alternative to Docker for development/testing

set -e

echo "🚀 Starting Local LiteLLM Proxy Server..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python 3 found${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pip install -q -r requirements.txt

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file with your API keys${NC}"
    echo "Required keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY"
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check for at least one API key
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  No API keys found. Proxy will start but models may not work.${NC}"
    echo "Set API keys in .env file for full functionality."
fi

# Set default values
export LITELLM_PORT=${LITELLM_PORT:-4000}
export LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY:-taskmaster-litellm-key}
export TASKMASTER_API_URL=${TASKMASTER_API_URL:-http://localhost:3001}

echo ""
echo -e "${GREEN}🎯 Configuration:${NC}"
echo "   📍 Port: $LITELLM_PORT"
echo "   🔑 Master Key: $LITELLM_MASTER_KEY"
echo "   🔗 TaskMaster API: $TASKMASTER_API_URL"

# Check if TaskMaster API is reachable
if curl -s -f "$TASKMASTER_API_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ TaskMaster API is reachable${NC}"
else
    echo -e "${YELLOW}   ⚠️  TaskMaster API not reachable (proxy will still work)${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Starting LiteLLM Proxy Server...${NC}"

# Start the proxy
python3 litellm-proxy.py