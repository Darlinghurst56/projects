#!/bin/bash

# TaskMaster Dashboard Startup Script
echo "🚀 Starting TaskMaster Dashboard..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting TaskMaster API Server..."
echo "📊 Dashboard will be available at: http://localhost:3001"
echo "🔧 API health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node taskmaster-api-server.js