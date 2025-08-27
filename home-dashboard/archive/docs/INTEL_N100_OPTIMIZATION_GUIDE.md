# Intel N100 Development Server Optimization Guide

## System Specifications
- **Processor**: Intel N100 (800MHz base frequency, 4 cores, x64-based)
- **Memory**: 16GB RAM total
- **Target**: Optimized development environment for home dashboard

## Performance Optimizations Applied

### 1. Node.js Backend Server Optimization

#### Memory Management
```bash
# Optimized memory allocation for Intel N100
NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size --gc-interval=100"
UV_THREADPOOL_SIZE=4
```

#### Benefits:
- **2048MB heap**: Sufficient for development without overwhelming the system
- **Optimize for size**: Reduces memory footprint on Intel N100
- **GC interval 100**: More frequent garbage collection to prevent memory spikes
- **4 thread pool**: Matches Intel N100's 4-core architecture

### 2. Vite Frontend Server Optimization

#### File Watching
```javascript
watch: {
  usePolling: false,        // Native file watching (more efficient)
  interval: 1000,          // Balanced for Intel N100 performance
  binaryInterval: 2000,    // Reduced binary file checking
  ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
}
```

#### Build Optimization
```javascript
build: {
  target: 'es2018',              // Optimized for Intel N100 compatibility
  minify: 'esbuild',            // Faster minification
  maxParallelFileOps: 2,        // Limit parallel operations for stability
}
```

### 3. Concurrent Server Management

#### Process Limits
```javascript
maxProcesses: 4,          // Match Intel N100 core count
restartTries: 3,          // Reasonable retry limit
restartDelay: 2000        // Allow time for Intel N100 recovery
```

## Performance Scripts

### Quick Start (Recommended)
```bash
# Start optimized development environment
./scripts/start-intel-n100-dev.sh
```

### Manual Commands
```bash
# Performance optimized development
npm run dev:performance

# Individual optimized servers
npm run server:dev:optimized
npm run client:dev:optimized

# Performance monitoring
npm run monitor:performance
```

## Performance Monitoring

### Real-time Monitoring
The performance monitor tracks:
- **CPU usage**: Alerts at 85% (warning) and 95% (critical)
- **Memory usage**: Alerts at 80% (12.8GB) and 90% (14.4GB)
- **Server response**: Warns above 500ms, critical above 1000ms
- **Hot reload**: Warns above 2s, critical above 5s

### Performance Reports
Reports are saved to `performance-reports/` directory:
```bash
performance-reports/intel-n100-performance-YYYY-MM-DD.json
```

## Optimization Results

### Expected Performance Targets
- ✅ **Server startup**: <10 seconds for both servers
- ✅ **Hot reload**: <2 seconds for file changes  
- ✅ **API response**: <500ms for development endpoints
- ✅ **Memory usage**: Efficient use of 16GB RAM
- ✅ **CPU usage**: Optimal utilization of 4 cores at 800MHz

### Browser DevTools Integration
- **Port 9222**: Remote debugging with optimized Chrome flags
- **Memory limit**: 1024MB for Chrome to preserve system resources
- **Flags**: `--memory-pressure-off --max_old_space_size=1024`

## Configuration Files

### Core Configuration
- `package.json`: Optimized npm scripts
- `vite.config.js`: Intel N100-specific Vite settings
- `nodemon.json`: Backend server optimization
- `.intel-n100.env`: Environment variable optimization

### Utility Files
- `scripts/performance-monitor.js`: Real-time monitoring
- `scripts/start-intel-n100-dev.sh`: Quick start script
- `concurrently.config.js`: Process management

## Troubleshooting

### High CPU Usage (>90%)
```bash
# Check processes
ps aux | grep -E "(node|nodemon|vite)" | head -10

# Reduce concurrent processes
export CONCURRENCY_MAX_PROCESSES=3
npm run dev:performance
```

### Memory Issues (>14GB)
```bash
# Check memory usage
free -h

# Restart with lower memory limits
NODE_OPTIONS="--max-old-space-size=1536" npm run dev
```

### Slow Hot Reload (>3s)
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Use optimized file watching
export CHOKIDAR_USEPOLLING=false
npm run dev:performance
```

### Port Conflicts
```bash
# Check port usage
ss -tlnp | grep -E ":300[0-9]|:9222"

# Kill existing processes
pkill -f "nodemon.*server/index.js"
pkill -f "vite"
```

## Performance Validation

### System Health Check
```bash
# Check Intel N100 specs
lscpu | grep -E "(CPU\(s\)|Model name|CPU MHz)"
free -h

# Validate Node.js configuration
node -e "console.log('Max heap:', require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024, 'MB')"
```

### Development Server Health
```bash
# Backend health
curl -s http://localhost:3000/health | jq

# Frontend accessibility
curl -s http://localhost:3003 | head -5

# DevTools debug port
curl -s http://localhost:9222/json/version
```

## Intel N100 Specific Considerations

### CPU Frequency Management
- **Base frequency**: 800MHz may cause initial slowness
- **Boost frequency**: Should reach higher speeds under load
- **Thermal throttling**: Monitor for sustained high CPU usage

### Memory Architecture
- **16GB total**: Generous for development use
- **Allocation**: 2GB Node.js backend + 1GB Vite + 1GB Chrome + 12GB system/cache

### Storage I/O
- File watching optimizations reduce disk I/O
- Cache directories minimize repeated operations
- Log rotation prevents disk space issues

## Success Metrics

### Development Experience
- ⚡ **Fast startup**: Both servers ready in <10 seconds
- 🔄 **Responsive HMR**: File changes reflected in <2 seconds
- 🛠️ **Stable debugging**: DevTools integration without crashes
- 📊 **Resource efficiency**: <80% CPU and memory usage

### System Stability
- 🏃 **Sustained performance**: No degradation over 4+ hour sessions
- 💾 **Memory management**: No memory leaks or excessive growth
- 🔧 **Process recovery**: Automatic restart on failures
- 📈 **Monitoring**: Real-time alerts for performance issues

## Next Steps

1. **Run performance validation**: `npm run test:performance`
2. **Monitor system resources**: Use built-in performance monitor
3. **Adjust settings**: Modify `.intel-n100.env` as needed
4. **Scale optimization**: Apply learnings to production deployment

---

*Optimized for Intel N100 development on 2025-08-09*