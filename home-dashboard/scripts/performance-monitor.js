#!/usr/bin/env node

/**
 * Intel N100 Performance Monitor
 * Optimized for 800MHz base frequency, 4 cores, 16GB RAM
 * Monitors development server performance and resource usage
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class IntelN100PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      cpu: [],
      memory: [],
      serverResponse: [],
      hotReload: [],
      processes: new Map()
    };
    
    this.thresholds = {
      // Intel N100 optimized thresholds
      cpuWarning: 85,      // 85% CPU usage warning
      cpuCritical: 95,     // 95% CPU usage critical
      memoryWarning: 80,   // 80% memory usage warning (12.8GB of 16GB)
      memoryCritical: 90,  // 90% memory usage critical (14.4GB of 16GB)
      responseWarning: 500, // 500ms response time warning
      responseCritical: 1000, // 1000ms response time critical
      hotReloadWarning: 2000, // 2s hot reload warning
      hotReloadCritical: 5000 // 5s hot reload critical
    };
    
    console.log('🔍 Intel N100 Performance Monitor Started');
    console.log(`📊 CPU: ${os.cpus()[0].model}`);
    console.log(`💾 Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
    console.log(`🏠 Cores: ${os.cpus().length}`);
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Monitor system resources every 5 seconds
    setInterval(() => this.collectSystemMetrics(), 5000);
    
    // Check server health every 10 seconds
    setInterval(() => this.checkServerHealth(), 10000);
    
    // Generate performance report every minute
    setInterval(() => this.generateReport(), 60000);
    
    // Monitor file changes for hot reload timing
    this.setupFileWatcher();
    
    // Monitor development server processes
    this.monitorProcesses();
  }
  
  collectSystemMetrics() {
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    
    this.metrics.cpu.push({
      timestamp: Date.now(),
      usage: cpuUsage,
      loadAvg: os.loadavg()
    });
    
    this.metrics.memory.push({
      timestamp: Date.now(),
      usage: memoryUsage,
      free: os.freemem(),
      total: os.totalmem()
    });
    
    // Keep only last 100 measurements (8+ minutes of data)
    if (this.metrics.cpu.length > 100) {
      this.metrics.cpu.shift();
      this.metrics.memory.shift();
    }
    
    // Alert on threshold breaches
    this.checkThresholds(cpuUsage, memoryUsage);
  }
  
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    
    return 100 - Math.round(100 * idle / total);
  }
  
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    
    return Math.round((used / total) * 100);
  }
  
  async checkServerHealth() {
    const servers = [
      { name: 'Backend', port: 3000, path: '/health' },
      { name: 'Frontend', port: 3003, path: '/' }
    ];
    
    for (const server of servers) {
      try {
        const startTime = performance.now();
        
        // Use dynamic import for fetch in Node.js
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://localhost:${server.port}${server.path}`, {
          timeout: 5000
        });
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        this.metrics.serverResponse.push({
          timestamp: Date.now(),
          server: server.name,
          responseTime,
          status: response.status,
          healthy: response.ok
        });
        
        // Alert on slow responses
        if (responseTime > this.thresholds.responseWarning) {
          console.log(`⚠️  Slow ${server.name} response: ${responseTime}ms`);
        }
        
      } catch (error) {
        console.log(`❌ ${server.name} server health check failed:`, error.message);
      }
    }
    
    // Keep only last 50 response measurements
    if (this.metrics.serverResponse.length > 50) {
      this.metrics.serverResponse.shift();
    }
  }
  
  setupFileWatcher() {
    const watchDirs = ['./src', './server'];
    
    watchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        let changeTimeout;
        
        fs.watch(dir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.match(/\.(js|jsx|ts|tsx)$/)) {
            const changeStart = Date.now();
            
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
              const reloadTime = Date.now() - changeStart;
              
              this.metrics.hotReload.push({
                timestamp: Date.now(),
                filename,
                reloadTime
              });
              
              if (reloadTime > this.thresholds.hotReloadWarning) {
                console.log(`⚠️  Slow hot reload for ${filename}: ${reloadTime}ms`);
              }
              
              // Keep only last 20 hot reload measurements
              if (this.metrics.hotReload.length > 20) {
                this.metrics.hotReload.shift();
              }
            }, 1000); // Wait 1s for reload to complete
          }
        });
      }
    });
  }
  
  monitorProcesses() {
    const { spawn } = require('child_process');
    
    setInterval(() => {
      const ps = spawn('ps', ['aux']);
      let output = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ps.on('close', () => {
        const processes = output.split('\\n')
          .filter(line => line.includes('node') || line.includes('nodemon') || line.includes('vite'))
          .filter(line => !line.includes('grep'));
        
        processes.forEach(processLine => {
          const parts = processLine.trim().split(/\\s+/);
          if (parts.length > 10) {
            const pid = parts[1];
            const cpu = parseFloat(parts[2]);
            const mem = parseFloat(parts[3]);
            const command = parts.slice(10).join(' ');
            
            this.metrics.processes.set(pid, {
              timestamp: Date.now(),
              cpu,
              mem,
              command: command.substring(0, 100) // Truncate long commands
            });
          }
        });
      });
    }, 15000); // Check every 15 seconds
  }
  
  checkThresholds(cpuUsage, memoryUsage) {
    // CPU threshold alerts
    if (cpuUsage >= this.thresholds.cpuCritical) {
      console.log(`🚨 CRITICAL: CPU usage ${cpuUsage}% (Intel N100 may be throttling)`);
    } else if (cpuUsage >= this.thresholds.cpuWarning) {
      console.log(`⚠️  WARNING: High CPU usage ${cpuUsage}%`);
    }
    
    // Memory threshold alerts
    if (memoryUsage >= this.thresholds.memoryCritical) {
      console.log(`🚨 CRITICAL: Memory usage ${memoryUsage}% of 16GB`);
    } else if (memoryUsage >= this.thresholds.memoryWarning) {
      console.log(`⚠️  WARNING: High memory usage ${memoryUsage}% of 16GB`);
    }
  }
  
  generateReport() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    console.log('\\n' + '='.repeat(60));
    console.log(`📊 INTEL N100 PERFORMANCE REPORT (${hours}h ${minutes}m uptime)`);
    console.log('='.repeat(60));
    
    // CPU Statistics
    if (this.metrics.cpu.length > 0) {
      const avgCpu = Math.round(this.metrics.cpu.reduce((sum, m) => sum + m.usage, 0) / this.metrics.cpu.length);
      const maxCpu = Math.max(...this.metrics.cpu.map(m => m.usage));
      const currentCpu = this.metrics.cpu[this.metrics.cpu.length - 1].usage;
      
      console.log(`🖥️  CPU Usage: Current ${currentCpu}% | Avg ${avgCpu}% | Peak ${maxCpu}%`);
    }
    
    // Memory Statistics
    if (this.metrics.memory.length > 0) {
      const avgMem = Math.round(this.metrics.memory.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.length);
      const maxMem = Math.max(...this.metrics.memory.map(m => m.usage));
      const currentMem = this.metrics.memory[this.metrics.memory.length - 1].usage;
      const totalGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      
      console.log(`💾 Memory Usage: Current ${currentMem}% | Avg ${avgMem}% | Peak ${maxMem}% (${totalGB}GB total)`);
    }
    
    // Server Response Times
    if (this.metrics.serverResponse.length > 0) {
      const recentResponses = this.metrics.serverResponse.slice(-10);
      const avgResponse = Math.round(recentResponses.reduce((sum, m) => sum + m.responseTime, 0) / recentResponses.length);
      const maxResponse = Math.max(...recentResponses.map(m => m.responseTime));
      
      console.log(`⚡ Server Response: Avg ${avgResponse}ms | Max ${maxResponse}ms (last 10 requests)`);
    }
    
    // Hot Reload Performance
    if (this.metrics.hotReload.length > 0) {
      const avgReload = Math.round(this.metrics.hotReload.reduce((sum, m) => sum + m.reloadTime, 0) / this.metrics.hotReload.length);
      const maxReload = Math.max(...this.metrics.hotReload.map(m => m.reloadTime));
      
      console.log(`🔄 Hot Reload: Avg ${avgReload}ms | Max ${maxReload}ms`);
    }
    
    // Development Processes
    if (this.metrics.processes.size > 0) {
      console.log(`🔧 Active Dev Processes: ${this.metrics.processes.size}`);
      
      const topProcesses = Array.from(this.metrics.processes.entries())
        .sort(([,a], [,b]) => b.cpu - a.cpu)
        .slice(0, 3);
      
      topProcesses.forEach(([pid, process]) => {
        const shortCommand = process.command.length > 40 ? 
          process.command.substring(0, 37) + '...' : process.command;
        console.log(`   PID ${pid}: ${process.cpu}% CPU, ${process.mem}% MEM - ${shortCommand}`);
      });
    }
    
    console.log('='.repeat(60) + '\\n');
    
    // Save detailed metrics to file
    this.saveMetricsToFile();
  }
  
  saveMetricsToFile() {
    const reportData = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      system: {
        model: os.cpus()[0].model,
        cores: os.cpus().length,
        totalMemory: os.totalmem(),
        platform: os.platform(),
        release: os.release()
      },
      metrics: {
        cpu: this.metrics.cpu.slice(-20), // Last 20 measurements
        memory: this.metrics.memory.slice(-20),
        serverResponse: this.metrics.serverResponse.slice(-20),
        hotReload: this.metrics.hotReload.slice(-10)
      }
    };
    
    const reportsDir = path.join(__dirname, '../performance-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `intel-n100-performance-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
  }
  
  // Graceful shutdown
  shutdown() {
    console.log('\\n📴 Shutting down Intel N100 Performance Monitor...');
    this.generateReport();
    console.log('✅ Performance monitoring stopped');
    process.exit(0);
  }
}

// Initialize monitor
const monitor = new IntelN100PerformanceMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => monitor.shutdown());
process.on('SIGTERM', () => monitor.shutdown());

// Keep the process alive
process.stdin.resume();