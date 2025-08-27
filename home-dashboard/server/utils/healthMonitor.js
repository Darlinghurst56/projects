/**
 * Simple Service Health Monitor for Home Dashboard
 * 
 * Lightweight health checking for external services using standard HTTP patterns.
 * Designed for home server deployment with reasonable timeout values.
 */

const fetch = require('node-fetch');

/**
 * Service health monitoring class
 */
class HealthMonitor {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.config = {
      defaultTimeout: 5000,
      checkInterval: 60000, // Check every minute
      retryAttempts: 2,
      healthyThreshold: 2, // Consecutive successes needed
      unhealthyThreshold: 3 // Consecutive failures needed
    };
  }

  /**
   * Register a service for health monitoring
   * @param {string} name - Service name
   * @param {Object} options - Service configuration
   */
  registerService(name, options) {
    const service = {
      name,
      url: options.url,
      method: options.method || 'GET',
      timeout: options.timeout || this.config.defaultTimeout,
      headers: options.headers || {},
      expectedStatus: options.expectedStatus || [200, 201, 204],
      enabled: options.enabled !== false,
      
      // Health state
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalChecks: 0,
      totalFailures: 0,
      responseTime: null,
      error: null
    };

    this.services.set(name, service);
    
    if (service.enabled) {
      this.startHealthCheck(name);
    }

    return service;
  }

  /**
   * Start health checking for a service
   * @param {string} name - Service name
   */
  startHealthCheck(name) {
    if (this.healthChecks.has(name)) {
      return; // Already checking this service
    }

    const checkService = async () => {
      try {
        await this.checkServiceHealth(name);
      } catch (error) {
        console.error(`🚨 Health check error for ${name}:`, error.message);
        // Error is already handled in checkServiceHealth, but this prevents unhandled rejections
      }
    };

    // Initial check with error handling
    checkService().catch(error => {
      console.error(`🚨 Initial health check failed for ${name}:`, error.message);
    });

    // Schedule regular checks
    const interval = setInterval(checkService, this.config.checkInterval);
    this.healthChecks.set(name, interval);
  }

  /**
   * Stop health checking for a service
   * @param {string} name - Service name
   */
  stopHealthCheck(name) {
    const interval = this.healthChecks.get(name);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(name);
    }
  }

  /**
   * Check health of a specific service
   * @param {string} name - Service name
   */
  async checkServiceHealth(name) {
    const service = this.services.get(name);
    if (!service || !service.enabled) {
      return;
    }

    const startTime = Date.now();
    service.lastCheck = startTime;
    service.totalChecks++;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(service.url, {
        method: service.method,
        headers: service.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      service.responseTime = responseTime;

      // Check if response status is expected
      const isHealthy = service.expectedStatus.includes(response.status);
      
      if (isHealthy) {
        service.status = 'healthy';
        service.lastSuccess = startTime;
        service.consecutiveSuccesses++;
        service.consecutiveFailures = 0;
        service.error = null;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

    } catch (error) {
      service.status = 'unhealthy';
      service.lastFailure = Date.now();
      service.consecutiveFailures++;
      service.consecutiveSuccesses = 0;
      service.totalFailures++;
      service.error = error.message;
      service.responseTime = Date.now() - startTime;
    }

    // Update overall status based on consecutive checks
    if (service.consecutiveSuccesses >= this.config.healthyThreshold) {
      service.status = 'healthy';
    } else if (service.consecutiveFailures >= this.config.unhealthyThreshold) {
      service.status = 'unhealthy';
    } else if (service.totalChecks === 1) {
      // First check sets initial status
      service.status = service.error ? 'unhealthy' : 'healthy';
    }
  }

  /**
   * Get health status for all services
   */
  getAllHealthStatus() {
    const services = {};
    let healthyCount = 0;
    let unhealthyCount = 0;
    let unknownCount = 0;

    for (const [name, service] of this.services) {
      services[name] = {
        name: service.name,
        status: service.status,
        url: service.url,
        lastCheck: service.lastCheck,
        lastSuccess: service.lastSuccess,
        lastFailure: service.lastFailure,
        responseTime: service.responseTime,
        error: service.error,
        uptime: this.calculateUptime(service),
        enabled: service.enabled
      };

      switch (service.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
        default:
          unknownCount++;
      }
    }

    const totalServices = this.services.size;
    const overallStatus = unhealthyCount > 0 ? 'degraded' : 
                         unknownCount > 0 ? 'unknown' : 'healthy';

    return {
      overall: {
        status: overallStatus,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        unknown: unknownCount,
        total: totalServices
      },
      services,
      timestamp: Date.now()
    };
  }

  /**
   * Get health status for a specific service
   * @param {string} name - Service name
   */
  getServiceHealth(name) {
    const service = this.services.get(name);
    if (!service) {
      return null;
    }

    return {
      name: service.name,
      status: service.status,
      url: service.url,
      lastCheck: service.lastCheck,
      lastSuccess: service.lastSuccess,
      lastFailure: service.lastFailure,
      responseTime: service.responseTime,
      error: service.error,
      uptime: this.calculateUptime(service),
      stats: {
        totalChecks: service.totalChecks,
        totalFailures: service.totalFailures,
        successRate: service.totalChecks > 0 ? 
          ((service.totalChecks - service.totalFailures) / service.totalChecks * 100).toFixed(1) : 0
      },
      enabled: service.enabled
    };
  }

  /**
   * Calculate service uptime percentage
   * @param {Object} service - Service object
   */
  calculateUptime(service) {
    if (service.totalChecks === 0) {
      return 0;
    }

    const successfulChecks = service.totalChecks - service.totalFailures;
    return ((successfulChecks / service.totalChecks) * 100).toFixed(1);
  }

  /**
   * Manually trigger health check for a service
   * @param {string} name - Service name
   */
  async triggerCheck(name) {
    await this.checkServiceHealth(name);
    return this.getServiceHealth(name);
  }

  /**
   * Enable or disable service monitoring
   * @param {string} name - Service name
   * @param {boolean} enabled - Enable/disable monitoring
   */
  setServiceEnabled(name, enabled) {
    const service = this.services.get(name);
    if (!service) {
      return false;
    }

    service.enabled = enabled;

    if (enabled) {
      this.startHealthCheck(name);
    } else {
      this.stopHealthCheck(name);
      service.status = 'disabled';
    }

    return true;
  }

  /**
   * Get simple health summary for dashboard display
   */
  getHealthSummary() {
    const health = this.getAllHealthStatus();
    const issues = [];

    for (const [name, service] of Object.entries(health.services)) {
      if (service.status === 'unhealthy') {
        issues.push(`${name}: ${service.error || 'Service unavailable'}`);
      }
    }

    return {
      status: health.overall.status,
      healthy: health.overall.healthy,
      total: health.overall.total,
      issues: issues.slice(0, 3), // Limit to 3 most recent issues
      lastUpdate: new Date(health.timestamp).toISOString()
    };
  }

  /**
   * Cleanup - stop all health checks
   */
  cleanup() {
    for (const [name] of this.healthChecks) {
      this.stopHealthCheck(name);
    }
  }
}

// Export singleton instance
const healthMonitor = new HealthMonitor();

module.exports = healthMonitor;