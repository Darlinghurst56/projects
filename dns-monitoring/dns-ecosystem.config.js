module.exports = {
  apps: [
    {
      name: 'dns-log-collector',
      script: './dns-log-collector.js',
      cwd: '/home/darlinghurstlinux/projects/dns-monitoring',
      
      // Environment configuration
      env: {
        NODE_ENV: 'production',
        CTRLD_LOG_FILE: '/mnt/c/ctrld.log',
        DEVICE_MAP_FILE: './device-map.json',
        DNS_POLL_INTERVAL_MINUTES: '2',
        LOG_RETENTION_DAYS: '30',
        LOG_LEVEL: 'info'
      },
      
      // Process management
      instances: 1,
      exec_mode: 'fork',
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      
      // Logging configuration
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      out_file: './logs/dns-collector-out.log',
      error_file: './logs/dns-collector-error.log',
      log_file: './logs/dns-collector-combined.log',
      
      // Log rotation
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Monitoring
      monitoring: false, // Set to true if you have PM2 Plus
      
      // Advanced options
      node_args: '--max-old-space-size=256',
      
      // Health check via simple file existence (DNS logs directory)
      health_check_grace_period: 30000,
      
      // Custom metadata
      vizion: false,
    },
    
    {
      name: 'dns-analyzer',
      script: './device-mapper.py',
      args: '--analyze /mnt/c/ctrld.log',
      cwd: '/home/darlinghurstlinux/projects/dns-monitoring',
      interpreter: 'python3',
      
      // Environment configuration
      env: {
        PYTHONPATH: '/home/darlinghurstlinux/projects/dns-monitoring',
      },
      
      // Process management - run periodically (every 30 minutes)
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '*/30 * * * *', // Every 30 minutes
      autorestart: false, // Only restart via cron
      
      // Logging configuration
      log_type: 'json',
      out_file: './logs/dns-analyzer-out.log',
      error_file: './logs/dns-analyzer-error.log',
      
      // Graceful shutdown
      kill_timeout: 10000,
      
      // Custom metadata
      vizion: false,
    }
  ],
  
  // Global PM2 settings
  deploy: {
    production: {
      user: 'darlinghurstlinux',
      host: 'localhost',
      ref: 'origin/master',
      repo: 'git@github.com:user/repo.git',
      path: '/home/darlinghurstlinux/projects/dns-monitoring',
      'post-deploy': 'npm install && pm2 reload dns-ecosystem.config.js --env production'
    }
  }
};