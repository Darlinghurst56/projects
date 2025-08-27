#!/bin/bash
# Enhanced Agent Dashboard Production Startup Script

echo "🚀 Starting Enhanced Agent Dashboard Production Server..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the production server."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-3001}

echo "🌍 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"
echo ""

# Start the production server
echo "🚀 Launching Enhanced Agent Dashboard..."
echo "📊 Dashboard will be available at: http://localhost:$PORT/dashboard"
echo "🌐 DNS Dashboard available at: http://localhost:$PORT/dns"
echo "🔧 API Health check: http://localhost:$PORT/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node production-server.js