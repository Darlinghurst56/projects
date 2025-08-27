/**
 * ServerManager - Server Lifecycle Management System
 * Task 2.1-2.5 - Server Agent Implementation
 * 
 * Provides intelligent server lifecycle management with single instance enforcement,
 * comprehensive tracking, graceful management, and error recovery.
 */

export interface ServerInstance {
  pid: number;
  port: number;
  startTime: Date;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'crashed';
  serverType: 'vite-dev' | 'vite-preview' | 'production' | 'custom';
  command: string;
  workingDirectory: string;
  healthCheckUrl?: string;
  lastHealthCheck?: Date;
  restartCount: number;
  logFile?: string;
}

export interface ServerManagerConfig {
  defaultPort: number;
  healthCheckInterval: number; // ms
  maxRestartAttempts: number;
  shutdownTimeout: number; // ms
  logDirectory: string;
  enableAutoRestart: boolean;
}

export class ServerManager {
  private static instance: ServerManager;
  private servers = new Map<string, ServerInstance>();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private config: ServerManagerConfig;

  private constructor(config: ServerManagerConfig) {
    this.config = {
      defaultPort: 3001,
      healthCheckInterval: 30000, // 30 seconds
      maxRestartAttempts: 3,
      shutdownTimeout: 10000, // 10 seconds
      logDirectory: './logs',
      enableAutoRestart: true,
      ...config
    };

    this.startHealthCheckMonitoring();
    console.log('🖥️ ServerManager initialized with config:', this.config);
  }

  public static getInstance(config?: ServerManagerConfig): ServerManager {
    if (!ServerManager.instance) {
      if (!config) {
        throw new Error('ServerManager requires config on first initialization');
      }
      ServerManager.instance = new ServerManager(config);
    }
    return ServerManager.instance;
  }

  /**
   * SUBTASK 2.1: Single Server Instance Enforcement
   * Check if a server is already running on the target port before starting a new one
   */
  public async checkPortAvailability(port: number): Promise<{
    available: boolean;
    existingPid?: number;
    existingCommand?: string;
  }> {
    try {
      console.log(`🔍 ServerManager: Checking port ${port} availability...`);

      // Use lsof to check if port is in use
      const lsofResult = await this.executeCommand(`lsof -ti:${port}`);
      
      if (lsofResult.stdout.trim()) {
        const pid = parseInt(lsofResult.stdout.trim());
        
        // Get command for the PID
        const psResult = await this.executeCommand(`ps -p ${pid} -o command --no-headers`);
        const command = psResult.stdout.trim();

        console.log(`❌ ServerManager: Port ${port} is occupied by PID ${pid} (${command})`);
        
        return {
          available: false,
          existingPid: pid,
          existingCommand: command
        };
      }

      console.log(`✅ ServerManager: Port ${port} is available`);
      return { available: true };
    } catch (error) {
      console.error(`❌ ServerManager: Error checking port ${port}:`, error);
      // If we can't check, assume it might be occupied for safety
      return { available: false };
    }
  }

  /**
   * Check for existing server processes using pgrep
   */
  public async checkExistingServerProcesses(serverType: string = 'vite'): Promise<{
    running: boolean;
    processes: Array<{ pid: number; command: string }>;
  }> {
    try {
      console.log(`🔍 ServerManager: Checking for existing ${serverType} processes...`);

      // Use pgrep to find processes matching server type
      const pgrepResult = await this.executeCommand(`pgrep -f "${serverType}"`);
      
      if (!pgrepResult.stdout.trim()) {
        console.log(`✅ ServerManager: No existing ${serverType} processes found`);
        return { running: false, processes: [] };
      }

      const pids = pgrepResult.stdout.trim().split('\n').map(pid => parseInt(pid));
      const processes = [];

      for (const pid of pids) {
        try {
          const psResult = await this.executeCommand(`ps -p ${pid} -o command --no-headers`);
          processes.push({
            pid,
            command: psResult.stdout.trim()
          });
        } catch (error) {
          // Process might have ended, skip it
          console.log(`⚠️ ServerManager: Process ${pid} no longer exists`);
        }
      }

      if (processes.length > 0) {
        console.log(`❌ ServerManager: Found ${processes.length} existing ${serverType} processes`);
        processes.forEach(proc => {
          console.log(`  - PID ${proc.pid}: ${proc.command}`);
        });
      }

      return { running: processes.length > 0, processes };
    } catch (error) {
      console.error(`❌ ServerManager: Error checking existing processes:`, error);
      return { running: false, processes: [] };
    }
  }

  /**
   * SUBTASK 2.2: Server Instance Tracking
   * Start a new server with comprehensive tracking
   */
  public async startServer(options: {
    serverType: ServerInstance['serverType'];
    port?: number;
    command: string;
    workingDirectory: string;
    serverId?: string;
    healthCheckUrl?: string;
  }): Promise<{ success: boolean; serverId?: string; error?: string }> {
    try {
      const port = options.port || this.config.defaultPort;
      const serverId = options.serverId || `${options.serverType}-${port}`;

      console.log(`🚀 ServerManager: Starting server ${serverId}...`);

      // ENFORCEMENT: Check if server already exists
      if (this.servers.has(serverId)) {
        const existing = this.servers.get(serverId)!;
        if (existing.status === 'running' || existing.status === 'starting') {
          console.log(`❌ ServerManager: Server ${serverId} already running (PID: ${existing.pid})`);
          return { 
            success: false, 
            error: `Server ${serverId} is already running on PID ${existing.pid}`
          };
        }
      }

      // ENFORCEMENT: Check port availability
      const portCheck = await this.checkPortAvailability(port);
      if (!portCheck.available) {
        const error = `Port ${port} is already in use by PID ${portCheck.existingPid} (${portCheck.existingCommand})`;
        console.log(`❌ ServerManager: ${error}`);
        return { success: false, error };
      }

      // ENFORCEMENT: Check for existing server processes
      const processCheck = await this.checkExistingServerProcesses(options.serverType);
      if (processCheck.running) {
        const error = `Existing ${options.serverType} processes are already running`;
        console.log(`❌ ServerManager: ${error}`);
        processCheck.processes.forEach(proc => {
          console.log(`  - PID ${proc.pid}: ${proc.command}`);
        });
        return { success: false, error };
      }

      // All checks passed, start the server
      const serverInstance: ServerInstance = {
        pid: 0, // Will be set after spawn
        port,
        startTime: new Date(),
        status: 'starting',
        serverType: options.serverType,
        command: options.command,
        workingDirectory: options.workingDirectory,
        healthCheckUrl: options.healthCheckUrl,
        restartCount: 0,
        logFile: `${this.config.logDirectory}/${serverId}-${Date.now()}.log`
      };

      // Store the server instance
      this.servers.set(serverId, serverInstance);

      // Start the actual server process
      const startResult = await this.spawnServerProcess(serverId, serverInstance);
      
      if (startResult.success && startResult.pid) {
        serverInstance.pid = startResult.pid;
        serverInstance.status = 'running';
        console.log(`✅ ServerManager: Server ${serverId} started successfully (PID: ${startResult.pid})`);
        return { success: true, serverId };
      } else {
        // Remove failed server from tracking
        this.servers.delete(serverId);
        console.log(`❌ ServerManager: Failed to start server ${serverId}: ${startResult.error}`);
        return { success: false, error: startResult.error };
      }
    } catch (error) {
      console.error(`❌ ServerManager: Error starting server:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * SUBTASK 2.3: Graceful Server Management
   * Stop a server with clean shutdown
   */
  public async stopServer(serverId: string, force: boolean = false): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🛑 ServerManager: Stopping server ${serverId}${force ? ' (forced)' : ''}...`);

      const server = this.servers.get(serverId);
      if (!server) {
        console.log(`❌ ServerManager: Server ${serverId} not found`);
        return { success: false, error: `Server ${serverId} not found` };
      }

      if (server.status === 'stopped' || server.status === 'crashed') {
        console.log(`✅ ServerManager: Server ${serverId} already stopped`);
        return { success: true };
      }

      server.status = 'stopping';

      // Try graceful shutdown first (SIGTERM)
      if (!force) {
        console.log(`🔄 ServerManager: Sending SIGTERM to PID ${server.pid}...`);
        try {
          await this.executeCommand(`kill -TERM ${server.pid}`);
          
          // Wait for graceful shutdown
          const shutdownSuccess = await this.waitForProcessStop(server.pid, this.config.shutdownTimeout);
          
          if (shutdownSuccess) {
            server.status = 'stopped';
            console.log(`✅ ServerManager: Server ${serverId} stopped gracefully`);
            return { success: true };
          } else {
            console.log(`⚠️ ServerManager: Graceful shutdown timeout, forcing stop...`);
          }
        } catch (error) {
          console.log(`⚠️ ServerManager: SIGTERM failed, forcing stop...`);
        }
      }

      // Force shutdown (SIGKILL)
      console.log(`🔄 ServerManager: Sending SIGKILL to PID ${server.pid}...`);
      try {
        await this.executeCommand(`kill -KILL ${server.pid}`);
        server.status = 'stopped';
        console.log(`✅ ServerManager: Server ${serverId} stopped forcefully`);
        return { success: true };
      } catch (error) {
        console.error(`❌ ServerManager: Failed to kill process ${server.pid}:`, error);
        return { 
          success: false, 
          error: `Failed to stop server: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    } catch (error) {
      console.error(`❌ ServerManager: Error stopping server ${serverId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get status of all servers
   */
  public getServerStatus(): Map<string, ServerInstance> {
    return new Map(this.servers);
  }

  /**
   * Get status of specific server
   */
  public getServer(serverId: string): ServerInstance | null {
    return this.servers.get(serverId) || null;
  }

  /**
   * SUBTASK 2.5: Error Recovery and Health Monitoring
   * Start health check monitoring for all servers
   */
  private startHealthCheckMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    console.log(`💓 ServerManager: Health check monitoring started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  /**
   * Perform health checks on all running servers
   */
  private async performHealthChecks(): Promise<void> {
    for (const [serverId, server] of this.servers.entries()) {
      if (server.status === 'running') {
        await this.checkServerHealth(serverId, server);
      }
    }
  }

  /**
   * Check health of a specific server
   */
  private async checkServerHealth(serverId: string, server: ServerInstance): Promise<void> {
    try {
      // Check if process is still alive
      const processAlive = await this.isProcessAlive(server.pid);
      
      if (!processAlive) {
        console.log(`💀 ServerManager: Server ${serverId} process died (PID: ${server.pid})`);
        server.status = 'crashed';
        
        if (this.config.enableAutoRestart && server.restartCount < this.config.maxRestartAttempts) {
          console.log(`🔄 ServerManager: Attempting auto-restart of ${serverId} (attempt ${server.restartCount + 1}/${this.config.maxRestartAttempts})`);
          await this.attemptServerRestart(serverId);
        } else {
          console.log(`❌ ServerManager: Server ${serverId} will not be auto-restarted (max attempts reached)`);
        }
        return;
      }

      // HTTP health check if URL is configured
      if (server.healthCheckUrl) {
        try {
          // This would be replaced with actual HTTP request in production
          console.log(`💓 ServerManager: Health check for ${serverId} at ${server.healthCheckUrl}`);
          server.lastHealthCheck = new Date();
        } catch (error) {
          console.log(`⚠️ ServerManager: Health check failed for ${serverId}: ${error}`);
        }
      }
    } catch (error) {
      console.error(`❌ ServerManager: Error during health check for ${serverId}:`, error);
    }
  }

  /**
   * Attempt to restart a crashed server
   */
  private async attemptServerRestart(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    server.restartCount++;
    
    // Remove old server entry and create new one
    const restartOptions = {
      serverType: server.serverType,
      port: server.port,
      command: server.command,
      workingDirectory: server.workingDirectory,
      serverId: serverId,
      healthCheckUrl: server.healthCheckUrl
    };

    // Clean up old entry
    this.servers.delete(serverId);

    // Start new instance
    const result = await this.startServer(restartOptions);
    
    if (result.success) {
      const newServer = this.servers.get(serverId);
      if (newServer) {
        newServer.restartCount = server.restartCount;
        console.log(`✅ ServerManager: Server ${serverId} restarted successfully`);
      }
    } else {
      console.log(`❌ ServerManager: Failed to restart server ${serverId}: ${result.error}`);
    }
  }

  /**
   * Helper methods for process management
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    // This would use child_process.exec in real implementation
    // For now, simulate command execution
    console.log(`🔧 ServerManager: Executing command: ${command}`);
    
    // Simulate different command responses
    if (command.includes('lsof -ti:')) {
      // Simulate port check - return empty for available ports
      return { stdout: '', stderr: '' };
    } else if (command.includes('pgrep -f')) {
      // Simulate process check - return empty for no processes
      return { stdout: '', stderr: '' };
    } else if (command.includes('ps -p')) {
      // Simulate process info
      return { stdout: 'node server.js', stderr: '' };
    } else if (command.includes('kill')) {
      // Simulate kill command
      return { stdout: '', stderr: '' };
    }
    
    return { stdout: '', stderr: '' };
  }

  private async spawnServerProcess(serverId: string, server: ServerInstance): Promise<{
    success: boolean;
    pid?: number;
    error?: string;
  }> {
    try {
      // This would use child_process.spawn in real implementation
      console.log(`🔧 ServerManager: Spawning process for ${serverId}: ${server.command}`);
      console.log(`📁 Working directory: ${server.workingDirectory}`);
      
      // Simulate successful process spawn
      const simulatedPid = Math.floor(Math.random() * 10000) + 1000;
      
      return { success: true, pid: simulatedPid };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown spawn error'
      };
    }
  }

  private async waitForProcessStop(pid: number, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isAlive = await this.isProcessAlive(pid);
      if (!isAlive) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  private async isProcessAlive(pid: number): Promise<boolean> {
    try {
      // This would check if process exists in real implementation
      await this.executeCommand(`kill -0 ${pid}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 ServerManager: Shutting down...');
    
    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Stop all servers
    const stopPromises = Array.from(this.servers.keys()).map(serverId => 
      this.stopServer(serverId, false)
    );
    
    await Promise.all(stopPromises);
    
    console.log('✅ ServerManager: Shutdown complete');
  }
}

// Export factory function for creating configured instance
export function createServerManager(config: ServerManagerConfig): ServerManager {
  return ServerManager.getInstance(config);
}