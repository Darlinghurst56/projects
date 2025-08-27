/**
 * Server Instance Manager - Single Server Instance Enforcement
 * Task 2.1 - Server Agent Implementation
 * 
 * Prevents multiple server instances running on the same port
 * Uses process detection and port checking to enforce single instance rule
 */

import { spawn } from 'child_process';
import { promisify } from 'util';

export class ServerInstanceManager {
  constructor() {
    this.runningServers = new Map(); // Track known server instances
    this.defaultPorts = {
      vite: 5173,
      express: 3000,
      dashboard: 8080
    };
  }

  /**
   * Check if any process is using the specified port
   * Uses lsof to detect port usage
   */
  async isPortInUse(port) {
    return new Promise((resolve) => {
      const lsof = spawn('lsof', ['-i', `:${port}`, '-t']);
      let output = '';
      let hasProcess = false;

      lsof.stdout.on('data', (data) => {
        output += data.toString();
        hasProcess = true;
      });

      lsof.on('close', (code) => {
        // lsof returns 0 if processes found, 1 if no processes found
        const processes = output.trim().split('\n').filter(pid => pid);
        resolve({
          inUse: hasProcess && processes.length > 0,
          processes: processes,
          port: port
        });
      });

      lsof.on('error', (error) => {
        console.warn(`⚠️ ServerInstanceManager: lsof command failed: ${error.message}`);
        // Fallback to assuming port is available if lsof fails
        resolve({ inUse: false, processes: [], port: port });
      });
    });
  }

  /**
   * Find running server processes by name pattern
   * Uses pgrep to find processes matching server patterns
   */
  async findServerProcesses(patterns = ['vite', 'node.*dev', 'npm.*dev', 'yarn.*dev']) {
    const results = [];
    
    for (const pattern of patterns) {
      try {
        const processes = await this.findProcessesByPattern(pattern);
        results.push(...processes);
      } catch (error) {
        console.warn(`⚠️ ServerInstanceManager: Failed to find processes for pattern '${pattern}': ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Find processes matching a specific pattern using pgrep
   */
  async findProcessesByPattern(pattern) {
    return new Promise((resolve, reject) => {
      const pgrep = spawn('pgrep', ['-f', pattern]);
      let output = '';

      pgrep.stdout.on('data', (data) => {
        output += data.toString();
      });

      pgrep.on('close', (code) => {
        if (code === 0) {
          const pids = output.trim().split('\n').filter(pid => pid);
          resolve(pids.map(pid => ({ pid: parseInt(pid), pattern })));
        } else {
          // pgrep returns 1 when no processes found - this is normal
          resolve([]);
        }
      });

      pgrep.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get detailed process information using ps
   */
  async getProcessInfo(pid) {
    return new Promise((resolve) => {
      const ps = spawn('ps', ['-p', pid, '-o', 'pid,ppid,cmd,etime,start']);
      let output = '';

      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.on('close', (code) => {
        if (code === 0) {
          const lines = output.trim().split('\n');
          if (lines.length > 1) {
            const data = lines[1].trim().split(/\s+/);
            resolve({
              pid: parseInt(data[0]),
              ppid: parseInt(data[1]),
              command: lines[1].substring(lines[1].indexOf(data[2])),
              elapsedTime: data[data.length - 2],
              startTime: data[data.length - 1]
            });
          }
        }
        resolve(null);
      });

      ps.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Check if we can safely start a server on the specified port
   * Returns validation result with details
   */
  async validateServerStartup(port, serverType = 'unknown') {
    console.log(`🔍 ServerInstanceManager: Validating startup for ${serverType} on port ${port}`);
    
    const validation = {
      canStart: true,
      port: port,
      serverType: serverType,
      conflicts: [],
      warnings: [],
      timestamp: new Date()
    };

    try {
      // Check 1: Port availability
      const portCheck = await this.isPortInUse(port);
      if (portCheck.inUse) {
        validation.canStart = false;
        validation.conflicts.push({
          type: 'port_in_use',
          message: `Port ${port} is already in use`,
          processes: portCheck.processes,
          severity: 'critical'
        });
      }

      // Check 2: Existing server processes
      const serverProcesses = await this.findServerProcesses();
      if (serverProcesses.length > 0) {
        validation.warnings.push({
          type: 'existing_servers',
          message: `Found ${serverProcesses.length} existing server process(es)`,
          processes: serverProcesses,
          severity: 'warning'
        });

        // Get detailed info for each process
        for (const proc of serverProcesses) {
          const info = await this.getProcessInfo(proc.pid);
          if (info) {
            validation.warnings[validation.warnings.length - 1].processDetails = 
              validation.warnings[validation.warnings.length - 1].processDetails || [];
            validation.warnings[validation.warnings.length - 1].processDetails.push(info);
          }
        }
      }

      // Check 3: Known server tracking
      if (this.runningServers.has(port)) {
        const knownServer = this.runningServers.get(port);
        validation.conflicts.push({
          type: 'tracked_server',
          message: `Server already tracked on port ${port}`,
          serverInfo: knownServer,
          severity: 'critical'
        });
        validation.canStart = false;
      }

    } catch (error) {
      validation.warnings.push({
        type: 'validation_error',
        message: `Validation check failed: ${error.message}`,
        error: error,
        severity: 'warning'
      });
    }

    return validation;
  }

  /**
   * Register a server instance in our tracking system
   */
  registerServer(port, serverInfo) {
    const registration = {
      port: port,
      pid: serverInfo.pid,
      serverType: serverInfo.serverType || 'unknown',
      startTime: new Date(),
      status: 'starting',
      command: serverInfo.command || 'unknown',
      ...serverInfo
    };

    this.runningServers.set(port, registration);
    console.log(`📋 ServerInstanceManager: Registered server on port ${port}`);
    
    return registration;
  }

  /**
   * Update server status
   */
  updateServerStatus(port, status, additionalInfo = {}) {
    if (this.runningServers.has(port)) {
      const server = this.runningServers.get(port);
      server.status = status;
      server.lastUpdate = new Date();
      Object.assign(server, additionalInfo);
      
      console.log(`🔄 ServerInstanceManager: Updated server on port ${port} to status '${status}'`);
    }
  }

  /**
   * Unregister a server instance
   */
  unregisterServer(port) {
    if (this.runningServers.has(port)) {
      const server = this.runningServers.get(port);
      this.runningServers.delete(port);
      console.log(`🗑️ ServerInstanceManager: Unregistered server on port ${port}`);
      return server;
    }
    return null;
  }

  /**
   * Get all tracked servers
   */
  getAllTrackedServers() {
    return Array.from(this.runningServers.entries()).map(([port, info]) => ({
      port,
      ...info
    }));
  }

  /**
   * Perform comprehensive server environment check
   */
  async performEnvironmentCheck() {
    console.log('🔍 ServerInstanceManager: Performing comprehensive environment check...');
    
    const report = {
      timestamp: new Date(),
      portChecks: {},
      runningProcesses: [],
      trackedServers: this.getAllTrackedServers(),
      recommendations: []
    };

    // Check common ports
    const portsToCheck = [3000, 5173, 8080, 4173, 3001];
    for (const port of portsToCheck) {
      report.portChecks[port] = await this.isPortInUse(port);
    }

    // Find all server-like processes
    report.runningProcesses = await this.findServerProcesses();

    // Generate recommendations
    const busyPorts = Object.entries(report.portChecks)
      .filter(([port, check]) => check.inUse)
      .map(([port, check]) => port);

    if (busyPorts.length > 0) {
      report.recommendations.push({
        type: 'port_conflicts',
        message: `Ports in use: ${busyPorts.join(', ')}. Consider using alternative ports.`,
        severity: 'warning'
      });
    }

    if (report.runningProcesses.length > 0) {
      report.recommendations.push({
        type: 'existing_servers',
        message: `${report.runningProcesses.length} server process(es) detected. Verify they won't conflict.`,
        severity: 'info'
      });
    }

    console.log(`📊 ServerInstanceManager: Environment check complete. Found ${busyPorts.length} busy ports, ${report.runningProcesses.length} server processes.`);
    
    return report;
  }

  /**
   * Kill a server process by PID with grace period
   */
  async killServerProcess(pid, gracePeriodMs = 5000) {
    console.log(`🛑 ServerInstanceManager: Attempting to kill process ${pid} with ${gracePeriodMs}ms grace period`);
    
    try {
      // Try SIGTERM first (graceful shutdown)
      process.kill(pid, 'SIGTERM');
      console.log(`📤 ServerInstanceManager: Sent SIGTERM to process ${pid}`);
      
      // Wait for grace period
      await new Promise(resolve => setTimeout(resolve, gracePeriodMs));
      
      // Check if process still exists
      try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        // If we get here, process is still running, use SIGKILL
        process.kill(pid, 'SIGKILL');
        console.log(`💀 ServerInstanceManager: Sent SIGKILL to process ${pid}`);
      } catch (error) {
        // Process already terminated - this is good
        console.log(`✅ ServerInstanceManager: Process ${pid} terminated gracefully`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ ServerInstanceManager: Failed to kill process ${pid}: ${error.message}`);
      return false;
    }
  }
}

// Export singleton instance
export const serverInstanceManager = new ServerInstanceManager();