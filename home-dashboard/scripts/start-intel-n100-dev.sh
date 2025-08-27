#!/bin/bash

# Intel N100 Optimized Development Server Startup
# Optimized for 800MHz base frequency, 4 cores, 16GB RAM

set -e

echo "🚀 Starting Intel N100 Optimized Development Environment"
echo "========================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Load Intel N100 environment variables
if [ -f ".intel-n100.env" ]; then
    echo "📊 Loading Intel N100 optimizations..."
    export $(cat .intel-n100.env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .intel-n100.env not found, using defaults"
fi

# Check system resources
echo "🔍 System Check:"
echo "   CPU: $(lscpu | grep 'Model name:' | cut -d: -f2 | xargs)"
echo "   Cores: $(nproc)"
echo "   Memory: $(free -h | grep 'Mem:' | awk '{print $2}')"

# Check if development servers are already running
if netstat -tlnp 2>/dev/null | grep -q ':3000' || ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "⚠️  Warning: Port 3000 already in use"
    read -p "🤔 Stop existing servers and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping existing servers..."
        pkill -f "nodemon.*server/index.js" 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
        pkill -f "concurrently" 2>/dev/null || true
        sleep 2
    else
        echo "ℹ️  Continuing with existing setup..."
    fi
fi

# Clean up any stale processes
echo "🧹 Cleaning up stale processes..."
pkill -f "esbuild.*service" 2>/dev/null || true

# Create performance reports directory
mkdir -p performance-reports

# Set Node.js memory limits for Intel N100
export NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size --gc-interval=100"
export UV_THREADPOOL_SIZE=4

# Optimize file watching for Intel N100
export CHOKIDAR_USEPOLLING=false
export CHOKIDAR_INTERVAL=1000

echo "⚙️  Intel N100 Optimizations Applied:"
echo "   Node.js Memory: 2048MB"
echo "   Thread Pool: 4 threads"
echo "   File Watch: Native (non-polling)"
echo "   GC Interval: 100"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 Installing/updating dependencies..."
    npm ci --prefer-offline --no-audit
fi

# Clear Vite cache for fresh start
if [ -d "node_modules/.vite" ]; then
    echo "🧹 Clearing Vite cache..."
    rm -rf node_modules/.vite
fi

# Start servers with performance monitoring
echo "🌟 Starting Development Servers:"
echo "   Backend (Node.js): http://localhost:3000"
echo "   Frontend (Vite): http://localhost:3003"
echo "   DevTools Debug: http://localhost:9222"

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Shutting down development servers..."
    
    # Kill all related processes
    pkill -P $$ 2>/dev/null || true
    pkill -f "nodemon.*server/index.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "concurrently" 2>/dev/null || true
    pkill -f "performance-monitor.js" 2>/dev/null || true
    
    echo "✅ Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the optimized development environment
echo "🚀 Launching Intel N100 optimized servers..."

# Use the performance-optimized npm script
if npm run dev:performance; then
    echo "✅ Development servers started successfully"
else
    echo "❌ Failed to start development servers"
    echo "💡 Trying fallback command..."
    
    # Fallback to regular dev command
    npm run dev
fi