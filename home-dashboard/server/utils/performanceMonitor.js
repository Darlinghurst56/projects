/**
 * Simple Performance Monitoring for Home Server
 * 
 * Lightweight monitoring using built-in Node.js capabilities.
 * Focused on home deployment with reasonable resource tracking.
 */

const os = require('os');
const process = require('process');

/**
 * Performance metrics collection
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        active: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
      },
      system: {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { percentage: 0 },
        uptime: 0
      },
      errors: {
        total: 0,
        last24h: 0
      }
    };
    
    this.requestTimes = [];
    this.errorLog = [];
    
    // Start system metrics collection
    this.startSystemMonitoring();
  }

  /**
   * Start system resource monitoring
   */
  startSystemMonitoring() {
    // Update system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);
    
    // Initial update
    this.updateSystemMetrics();
  }

  /**
   * Update system resource metrics
   */
  updateSystemMetrics() {
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    this.metrics.system.memory = {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
      nodeHeap: Math.round(memoryUsage.heapUsed / 1024 / 1024) // MB
    };

    // CPU usage (simple approximation)
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
    const usage = 100 - Math.round((idle / total) * 100);
    
    this.metrics.system.cpu = {
      percentage: Math.max(0, Math.min(100, usage)),
      cores: cpus.length
    };

    // System uptime
    this.metrics.system.uptime = Math.round(os.uptime());
  }

  /**
   * Track request start
   */
  startRequest() {
    this.metrics.requests.active++;
    this.metrics.requests.total++;
    return Date.now();
  }

  /**
   * Track request completion
   */
  endRequest(startTime, statusCode = 200) {
    this.metrics.requests.active = Math.max(0, this.metrics.requests.active - 1);
    
    const responseTime = Date.now() - startTime;
    this.requestTimes.push(responseTime);
    
    // Keep only last 100 response times for average calculation
    if (this.requestTimes.length > 100) {
      this.requestTimes = this.requestTimes.slice(-100);
    }
    
    // Calculate average response time
    this.metrics.requests.totalResponseTime += responseTime;
    this.metrics.requests.averageResponseTime = Math.round(
      this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length
    );

    // Track errors
    if (statusCode >= 400) {
      this.recordError(`HTTP ${statusCode}`);
    }
  }

  /**
   * Record error occurrence
   */
  recordError(errorType, error = null) {
    this.metrics.errors.total++;
    
    const errorEntry = {
      type: errorType,
      message: error?.message || errorType,
      timestamp: Date.now()
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }
    
    // Count errors in last 24 hours
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics.errors.last24h = this.errorLog.filter(
      err => err.timestamp > yesterday
    ).length;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      processUptime: Math.round(process.uptime())
    };
  }

  /**
   * Get health status based on metrics
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    
    // Determine health based on simple thresholds
    let status = 'healthy';
    const issues = [];
    
    // Check memory usage
    if (metrics.system.memory.percentage > 85) {
      status = 'warning';
      issues.push('High memory usage');
    }
    
    // Check CPU usage
    if (metrics.system.cpu.percentage > 80) {
      status = 'warning';
      issues.push('High CPU usage');
    }
    
    // Check error rate
    if (metrics.errors.last24h > 50) {
      status = 'warning';
      issues.push('High error rate');
    }
    
    // Check response times
    if (metrics.requests.averageResponseTime > 2000) {
      status = 'warning';
      issues.push('Slow response times');
    }
    
    return {
      status,
      issues,
      metrics: {
        memory: `${metrics.system.memory.percentage}%`,
        cpu: `${metrics.system.cpu.percentage}%`,
        responseTime: `${metrics.requests.averageResponseTime}ms`,
        errors24h: metrics.errors.last24h
      }
    };
  }

  /**
   * Express middleware for automatic request tracking
   */
  middleware() {
    return (req, res, next) => {
      const startTime = this.startRequest();
      
      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = (...args) => {
        this.endRequest(startTime, res.statusCode);
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;