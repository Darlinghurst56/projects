#!/bin/bash

# LiteLLM Proxy Startup Script
# Handles Docker setup, configuration validation, and deployment

set -e

echo "🚀 Starting LiteLLM Proxy Server Setup..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file with your API keys before running again.${NC}"
    echo "   Required keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Validate configuration file
if [ ! -f litellm-config.yaml ]; then
    echo -e "${RED}❌ litellm-config.yaml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration file found${NC}"

# Create necessary directories
mkdir -p config logs

# Copy configuration to config directory
cp litellm-config.yaml config/
cp .env config/

echo -e "${GREEN}✅ Configuration files copied${NC}"

# Check if containers are already running
if docker-compose ps | grep -q "litellm-proxy"; then
    echo -e "${YELLOW}⚠️  LiteLLM containers are already running${NC}"
    echo "Would you like to restart them? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔄 Stopping existing containers..."
        docker-compose down
    else
        echo "ℹ️  Use 'docker-compose logs litellm-proxy' to view logs"
        exit 0
    fi
fi

# Build and start containers
echo "🔨 Building LiteLLM proxy container..."
docker-compose build

echo "🚀 Starting LiteLLM proxy..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for LiteLLM proxy to be healthy..."
timeout=60
count=0

while [ $count -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ LiteLLM proxy is healthy and ready!${NC}"
        break
    fi
    
    if docker-compose ps | grep -q "unhealthy"; then
        echo -e "${RED}❌ LiteLLM proxy failed health check${NC}"
        echo "📋 Container logs:"
        docker-compose logs litellm-proxy
        exit 1
    fi
    
    echo "⏳ Still waiting for health check... (${count}s/${timeout}s)"
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $timeout ]; then
    echo -e "${RED}❌ Timeout waiting for LiteLLM proxy to be healthy${NC}"
    echo "📋 Container logs:"
    docker-compose logs litellm-proxy
    exit 1
fi

# Display connection information
echo ""
echo -e "${GREEN}🎉 LiteLLM Proxy Server Successfully Started!${NC}"
echo ""
echo "📊 Connection Information:"
echo "   🌐 Proxy URL: http://localhost:4000"
echo "   ❤️  Health Check: http://localhost:4000/health"
echo "   📋 Models: http://localhost:4000/models"
echo "   📖 OpenAI-compatible endpoint: http://localhost:4000/v1/chat/completions"
echo ""
echo "🔧 Management Commands:"
echo "   📋 View logs: docker-compose logs -f litellm-proxy"
echo "   🔄 Restart: docker-compose restart litellm-proxy"
echo "   🛑 Stop: docker-compose down"
echo "   📊 Status: docker-compose ps"
echo ""

# Test basic connectivity
echo "🧪 Testing basic connectivity..."
if curl -s -f http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but container is running${NC}"
    echo "   This might be normal during startup. Check logs with: docker-compose logs litellm-proxy"
fi

echo ""
echo -e "${GREEN}✅ LiteLLM setup complete!${NC}"