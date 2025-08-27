/**
 * Server Instance Tracking System
 * Task 2.2 - Server Agent Implementation
 * 
 * Comprehensive tracking of server instances with persistent state management
 * Monitors PID, port, start time, status, and server type for all running servers
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export class ServerTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      stateFile: options.stateFile || '.server-tracker-state.json',
      autoSave: options.autoSave !== false,
      monitoringInterval: options.monitoringInterval || 10000, // 10 seconds
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      maxHistoryEntries: options.maxHistoryEntries || 100,
      ...options
    };
    
    // Server tracking data structure
    this.servers = new Map();
    this.history = [];
    this.monitoring = false;
    this.healthChecking = false;
    
    // Status definitions
    this.STATUS = {
      STARTING: 'starting',
      RUNNING: 'running',
      STOPPING: 'stopping',
      STOPPED: 'stopped',
      CRASHED: 'crashed',
      UNKNOWN: 'unknown'
    };
    
    // Server type definitions
    this.SERVER_TYPES = {
      VITE_DEV: 'vite-dev',
      VITE_PREVIEW: 'vite-preview',
      EXPRESS: 'express',
      NODE_DEV: 'node-dev',
      WEBPACK_DEV: 'webpack-dev',
      NEXT_DEV: 'next-dev',
      NUXT_DEV: 'nuxt-dev',
      DASHBOARD: 'dashboard',
      API: 'api',
      CUSTOM: 'custom'
    };
    
    // Load existing state
    this.loadState();
    
    // Setup auto-save
    if (this.options.autoSave) {
      setInterval(() => this.saveState(), 60000); // Save every minute
    }
    
    // Handle process cleanup
    process.on('exit', () => this.saveState());
    process.on('SIGINT', () => this.saveState());
    process.on('SIGTERM', () => this.saveState());
  }

  /**
   * Register a new server instance
   */
  registerServer(serverInfo) {
    const {
      pid,
      port,
      serverType = this.SERVER_TYPES.CUSTOM,
      command = 'unknown',
      workingDirectory = process.cwd(),
      environment = {}
    } = serverInfo;
    
    if (!pid || !port) {
      throw new Error('PID and port are required for server registration');
    }
    
    const serverId = this.generateServerId(pid, port);
    const now = new Date();
    
    const server = {
      id: serverId,
      pid: parseInt(pid),
      port: parseInt(port),
      serverType,
      command,
      workingDirectory,
      environment,
      startTime: now,
      lastHeartbeat: now,
      lastStatusCheck: now,
      status: this.STATUS.STARTING,
      statusHistory: [{
        status: this.STATUS.STARTING,
        timestamp: now,
        reason: 'Server registration'
      }],
      metrics: {
        uptimeMs: 0,
        statusChanges: 1,
        lastCrashTime: null,
        crashCount: 0,
        restartCount: 0
      },
      health: {
        isResponsive: null,
        lastHealthCheck: null,
        healthCheckFailures: 0,
        consecutiveFailures: 0
      }
    };
    
    this.servers.set(serverId, server);
    this.addHistoryEntry('server_registered', server);
    
    console.log(`📋 ServerTracker: Registered ${serverType} server (PID: ${pid}, Port: ${port})`);
    
    this.emit('serverRegistered', server);
    
    if (this.options.autoSave) {
      this.saveState();
    }
    
    return server;
  }

  /**
   * Update server status
   */
  updateServerStatus(serverId, newStatus, reason = 'Status update') {
    const server = this.servers.get(serverId);
    if (!server) {
      console.warn(`⚠️ ServerTracker: Server ${serverId} not found for status update`);
      return false;
    }
    
    const oldStatus = server.status;
    const now = new Date();
    
    // Update server status
    server.status = newStatus;
    server.lastStatusCheck = now;
    server.lastHeartbeat = now;
    
    // Add to status history
    server.statusHistory.push({
      status: newStatus,
      timestamp: now,
      reason,
      previousStatus: oldStatus
    });
    
    // Update metrics
    server.metrics.statusChanges++;
    server.metrics.uptimeMs = now - server.startTime;
    
    // Handle specific status changes
    switch (newStatus) {
      case this.STATUS.CRASHED:
        server.metrics.crashCount++;
        server.metrics.lastCrashTime = now;
        break;
      case this.STATUS.RUNNING:
        if (oldStatus === this.STATUS.STARTING) {
          console.log(`🚀 ServerTracker: Server ${serverId} successfully started`);
        } else if (oldStatus === this.STATUS.CRASHED) {
          server.metrics.restartCount++;
          console.log(`🔄 ServerTracker: Server ${serverId} recovered from crash`);
        }
        break;
      case this.STATUS.STOPPED:
        console.log(`🛑 ServerTracker: Server ${serverId} stopped`);
        break;
    }
    
    this.addHistoryEntry('status_changed', server, { oldStatus, newStatus, reason });
    
    console.log(`🔄 ServerTracker: ${serverId} status: ${oldStatus} → ${newStatus} (${reason})`);
    
    this.emit('statusChanged', server, oldStatus, newStatus);
    
    if (this.options.autoSave) {
      this.saveState();
    }
    
    return true;
  }

  /**
   * Update server by PID
   */
  updateServerByPid(pid, newStatus, reason) {
    const server = this.findServerByPid(pid);
    if (server) {
      return this.updateServerStatus(server.id, newStatus, reason);
    }
    return false;
  }

  /**
   * Update server by port
   */
  updateServerByPort(port, newStatus, reason) {
    const server = this.findServerByPort(port);
    if (server) {
      return this.updateServerStatus(server.id, newStatus, reason);
    }
    return false;
  }

  /**
   * Unregister a server instance
   */
  unregisterServer(serverId, reason = 'Manual unregistration') {
    const server = this.servers.get(serverId);
    if (!server) {
      console.warn(`⚠️ ServerTracker: Server ${serverId} not found for unregistration`);
      return false;
    }
    
    // Update to stopped status first
    this.updateServerStatus(serverId, this.STATUS.STOPPED, reason);
    
    // Remove from active tracking
    this.servers.delete(serverId);
    
    this.addHistoryEntry('server_unregistered', server, { reason });
    
    console.log(`🗑️ ServerTracker: Unregistered server ${serverId}`);
    
    this.emit('serverUnregistered', server);
    
    if (this.options.autoSave) {
      this.saveState();
    }
    
    return true;
  }

  /**
   * Find server by PID
   */
  findServerByPid(pid) {
    for (const server of this.servers.values()) {
      if (server.pid === parseInt(pid)) {
        return server;
      }
    }
    return null;
  }

  /**
   * Find server by port
   */
  findServerByPort(port) {
    for (const server of this.servers.values()) {
      if (server.port === parseInt(port)) {
        return server;
      }
    }
    return null;
  }

  /**
   * Find servers by type
   */
  findServersByType(serverType) {
    return Array.from(this.servers.values()).filter(
      server => server.serverType === serverType
    );
  }

  /**
   * Find servers by status
   */
  findServersByStatus(status) {
    return Array.from(this.servers.values()).filter(
      server => server.status === status
    );
  }

  /**
   * Get all tracked servers
   */
  getAllServers() {
    return Array.from(this.servers.values());
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    const servers = this.getAllServers();
    const now = new Date();
    
    const stats = {
      total: servers.length,
      byStatus: {},
      byType: {},
      totalUptime: 0,
      averageUptime: 0,
      totalCrashes: 0,
      totalRestarts: 0,
      oldestServer: null,
      newestServer: null
    };
    
    // Initialize status counts
    Object.values(this.STATUS).forEach(status => {
      stats.byStatus[status] = 0;
    });
    
    // Initialize type counts
    Object.values(this.SERVER_TYPES).forEach(type => {
      stats.byType[type] = 0;
    });
    
    servers.forEach(server => {
      // Status counts
      stats.byStatus[server.status]++;
      
      // Type counts
      stats.byType[server.serverType]++;
      
      // Uptime calculation
      const uptime = now - server.startTime;
      stats.totalUptime += uptime;
      
      // Crash and restart counts
      stats.totalCrashes += server.metrics.crashCount;
      stats.totalRestarts += server.metrics.restartCount;
      
      // Oldest and newest servers
      if (!stats.oldestServer || server.startTime < stats.oldestServer.startTime) {
        stats.oldestServer = server;
      }
      if (!stats.newestServer || server.startTime > stats.newestServer.startTime) {
        stats.newestServer = server;
      }
    });
    
    // Calculate average uptime
    stats.averageUptime = servers.length > 0 ? stats.totalUptime / servers.length : 0;
    
    return stats;
  }

  /**
   * Start monitoring all servers
   */
  startMonitoring() {
    if (this.monitoring) {
      console.log('ℹ️ ServerTracker: Monitoring already started');
      return;
    }
    
    this.monitoring = true;
    console.log(`🔍 ServerTracker: Started monitoring (interval: ${this.options.monitoringInterval}ms)`);
    
    this.monitoringTimer = setInterval(() => {
      this.performMonitoringCheck();
    }, this.options.monitoringInterval);
    
    // Also start health checking
    this.startHealthChecking();
    
    this.emit('monitoringStarted');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }
    
    this.monitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    this.stopHealthChecking();
    
    console.log('🛑 ServerTracker: Stopped monitoring');
    this.emit('monitoringStopped');
  }

  /**
   * Start health checking
   */
  startHealthChecking() {
    if (this.healthChecking) {
      return;
    }
    
    this.healthChecking = true;
    console.log(`💓 ServerTracker: Started health checking (interval: ${this.options.healthCheckInterval}ms)`);
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  /**
   * Stop health checking
   */
  stopHealthChecking() {
    if (!this.healthChecking) {
      return;
    }
    
    this.healthChecking = false;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    console.log('🛑 ServerTracker: Stopped health checking');
  }

  /**
   * Perform monitoring check on all servers
   */
  async performMonitoringCheck() {
    const servers = this.getAllServers();
    
    for (const server of servers) {
      await this.checkServerStatus(server);
    }
  }

  /**
   * Check individual server status
   */
  async checkServerStatus(server) {
    try {
      // Check if process still exists
      const processExists = await this.checkProcessExists(server.pid);
      
      if (!processExists) {
        if (server.status !== this.STATUS.STOPPED && server.status !== this.STATUS.CRASHED) {
          this.updateServerStatus(server.id, this.STATUS.CRASHED, 'Process no longer exists');
        }
        return;
      }
      
      // If process exists and server was marked as crashed, it may have recovered
      if (server.status === this.STATUS.CRASHED) {
        this.updateServerStatus(server.id, this.STATUS.RUNNING, 'Process detected as running');
      }
      
      // Update heartbeat
      server.lastHeartbeat = new Date();
      
    } catch (error) {
      console.error(`❌ ServerTracker: Error checking server ${server.id}:`, error.message);
    }
  }

  /**
   * Check if process exists
   */
  async checkProcessExists(pid) {
    try {
      process.kill(pid, 0); // Signal 0 just checks if process exists
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Perform health checks on all servers
   */
  async performHealthChecks() {
    const servers = this.findServersByStatus(this.STATUS.RUNNING);
    
    for (const server of servers) {
      await this.performServerHealthCheck(server);
    }
  }

  /**
   * Perform health check on individual server
   */
  async performServerHealthCheck(server) {
    const now = new Date();
    server.health.lastHealthCheck = now;
    
    try {
      // Basic health check - could be extended with HTTP requests for web servers
      const isResponsive = await this.checkProcessExists(server.pid);
      
      if (isResponsive) {
        server.health.isResponsive = true;
        server.health.consecutiveFailures = 0;
      } else {
        server.health.isResponsive = false;
        server.health.healthCheckFailures++;
        server.health.consecutiveFailures++;
        
        // Mark as crashed if multiple consecutive failures
        if (server.health.consecutiveFailures >= 3) {
          this.updateServerStatus(server.id, this.STATUS.CRASHED, 'Health check failures');
        }
      }
      
    } catch (error) {
      console.error(`❌ ServerTracker: Health check failed for ${server.id}:`, error.message);
      server.health.isResponsive = false;
      server.health.healthCheckFailures++;
      server.health.consecutiveFailures++;
    }
  }

  /**
   * Generate unique server ID
   */
  generateServerId(pid, port) {
    return `server_${pid}_${port}_${Date.now()}`;
  }

  /**
   * Add entry to history
   */
  addHistoryEntry(event, server, details = {}) {
    const entry = {
      timestamp: new Date(),
      event,
      serverId: server.id,
      serverType: server.serverType,
      pid: server.pid,
      port: server.port,
      details
    };
    
    this.history.unshift(entry);
    
    // Trim history to max entries
    if (this.history.length > this.options.maxHistoryEntries) {
      this.history = this.history.slice(0, this.options.maxHistoryEntries);
    }
  }

  /**
   * Get history entries
   */
  getHistory(limit = 50) {
    return this.history.slice(0, limit);
  }

  /**
   * Save state to file
   */
  saveState() {
    try {
      const state = {
        servers: Array.from(this.servers.entries()),
        history: this.history,
        savedAt: new Date(),
        version: '1.0.0'
      };
      
      writeFileSync(this.options.stateFile, JSON.stringify(state, null, 2));
      console.log(`💾 ServerTracker: State saved to ${this.options.stateFile}`);
      
    } catch (error) {
      console.error(`❌ ServerTracker: Failed to save state:`, error.message);
    }
  }

  /**
   * Load state from file
   */
  loadState() {
    try {
      if (!existsSync(this.options.stateFile)) {
        console.log(`ℹ️ ServerTracker: No existing state file found`);
        return;
      }
      
      const stateData = readFileSync(this.options.stateFile, 'utf8');
      const state = JSON.parse(stateData);
      
      // Restore servers
      if (state.servers) {
        this.servers = new Map(state.servers.map(([id, server]) => {
          // Convert date strings back to Date objects
          server.startTime = new Date(server.startTime);
          server.lastHeartbeat = new Date(server.lastHeartbeat);
          server.lastStatusCheck = new Date(server.lastStatusCheck);
          
          if (server.statusHistory) {
            server.statusHistory.forEach(entry => {
              entry.timestamp = new Date(entry.timestamp);
            });
          }
          
          if (server.health && server.health.lastHealthCheck) {
            server.health.lastHealthCheck = new Date(server.health.lastHealthCheck);
          }
          
          return [id, server];
        }));
      }
      
      // Restore history
      if (state.history) {
        this.history = state.history.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
      
      console.log(`📂 ServerTracker: Loaded state with ${this.servers.size} servers`);
      
    } catch (error) {
      console.error(`❌ ServerTracker: Failed to load state:`, error.message);
    }
  }

  /**
   * Clear all tracking data
   */
  clearAll() {
    this.servers.clear();
    this.history = [];
    
    if (this.options.autoSave) {
      this.saveState();
    }
    
    console.log('🗑️ ServerTracker: Cleared all tracking data');
    this.emit('allCleared');
  }

  /**
   * Get comprehensive report
   */
  getComprehensiveReport() {
    return {
      timestamp: new Date(),
      servers: this.getAllServers(),
      stats: this.getServerStats(),
      history: this.getHistory(20),
      monitoring: {
        isMonitoring: this.monitoring,
        isHealthChecking: this.healthChecking,
        monitoringInterval: this.options.monitoringInterval,
        healthCheckInterval: this.options.healthCheckInterval
      }
    };
  }
}

// Export singleton instance
export const serverTracker = new ServerTracker({
  stateFile: join(process.cwd(), '.server-tracker-state.json'),
  autoSave: true,
  monitoringInterval: 10000,
  healthCheckInterval: 30000
});