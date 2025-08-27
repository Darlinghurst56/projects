// Concurrently Configuration for Intel N100
// Optimized for 800MHz base frequency, 4 cores, 16GB RAM

module.exports = {
  // Intel N100 process management optimization
  maxProcesses: 4,
  restartTries: 3,
  restartDelay: 2000,
  
  // Color coding for different processes
  prefix: 'name',
  timestampFormat: 'HH:mm:ss.SSS',
  
  // Intel N100 specific settings
  killOthers: ['failure', 'success'],
  killSignal: 'SIGTERM',
  
  // Environment variables for all processes
  env: {
    NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size',
    UV_THREADPOOL_SIZE: '4',
    CHOKIDAR_USEPOLLING: 'false',
    CHOKIDAR_INTERVAL: '1000'
  },
  
  // Process-specific configurations
  commands: {
    server: {
      command: 'npm run server:dev:optimized',
      name: 'SERVER',
      color: 'blue',
      env: {
        PORT: '3000',
        NODE_ENV: 'development'
      }
    },
    
    client: {
      command: 'npm run client:dev:optimized',
      name: 'CLIENT',
      color: 'green',
      env: {
        PORT: '3003',
        BROWSER: 'none' // Don't auto-open browser to save resources
      }
    },
    
    monitor: {
      command: 'npm run monitor:performance',
      name: 'MONITOR',
      color: 'yellow',
      env: {
        MONITOR_INTERVAL: '60000'
      }
    },
    
    devtools: {
      command: 'npm run browser:debug',
      name: 'DEVTOOLS',
      color: 'magenta',
      env: {
        CHROME_REMOTE_DEBUG_PORT: '9222'
      }
    }
  },
  
  // Intel N100 resource management
  success: {
    condition: 'first',
    command: 'echo "✅ Intel N100 development environment ready!"'
  },
  
  // Handle process failures gracefully
  handleInput: true,
  defaultInputTarget: 0,
  
  // Logging configuration
  outputStream: process.stdout,
  
  // Intel N100 performance considerations
  additionalArguments: [
    '--max-old-space-size=2048',
    '--optimize-for-size'
  ]
};