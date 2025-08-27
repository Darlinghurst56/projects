/**
 * ServerAPI - Dashboard Integration for Server Management
 * Task 2.4 - Server Agent Implementation
 * 
 * Provides API endpoints for server status queries, controlled restart operations,
 * and dashboard widget integration with proper authentication and authorization.
 */

import { ServerManager, ServerInstance } from './ServerManager.js';

export interface ServerStatusResponse {
  serverId: string;
  status: ServerInstance['status'];
  pid: number;
  port: number;
  startTime: string;
  uptime: number; // milliseconds
  serverType: string;
  restartCount: number;
  lastHealthCheck?: string;
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  cpuUsage?: number;
}

export interface ServerListResponse {
  servers: ServerStatusResponse[];
  totalServers: number;
  runningServers: number;
  stoppedServers: number;
  crashedServers: number;
}

export interface ServerOperationResponse {
  success: boolean;
  message: string;
  serverId?: string;
  timestamp: string;
}

export class ServerAPI {
  private serverManager: ServerManager;
  private authorizedRoles = ['server-agent']; // Only server agent can control servers

  constructor(serverManager: ServerManager) {
    this.serverManager = serverManager;
    console.log('🌐 ServerAPI initialized for dashboard integration');
  }

  /**
   * Verify that only server agents can perform operations
   */
  private verifyAuthorization(agentRole?: string): boolean {
    if (!agentRole) {
      console.log('❌ ServerAPI: No agent role provided');
      return false;
    }

    const isAuthorized = this.authorizedRoles.includes(agentRole);
    if (!isAuthorized) {
      console.log(`❌ ServerAPI: Unauthorized role '${agentRole}' attempted server operation`);
    }

    return isAuthorized;
  }

  /**
   * Get status of all servers for dashboard display
   */
  public async getServerList(): Promise<ServerListResponse> {
    try {
      console.log('📊 ServerAPI: Getting server list for dashboard...');

      const servers = this.serverManager.getServerStatus();
      const serverStatuses: ServerStatusResponse[] = [];
      let runningCount = 0;
      let stoppedCount = 0;
      let crashedCount = 0;

      for (const [serverId, server] of servers) {
        const uptime = Date.now() - server.startTime.getTime();
        
        const status: ServerStatusResponse = {
          serverId,
          status: server.status,
          pid: server.pid,
          port: server.port,
          startTime: server.startTime.toISOString(),
          uptime,
          serverType: server.serverType,
          restartCount: server.restartCount,
          lastHealthCheck: server.lastHealthCheck?.toISOString()
        };

        // Add system metrics if available
        if (server.status === 'running') {
          status.memoryUsage = await this.getProcessMemoryUsage(server.pid);
          status.cpuUsage = await this.getProcessCpuUsage(server.pid);
        }

        serverStatuses.push(status);

        // Count by status
        switch (server.status) {
          case 'running':
          case 'starting':
            runningCount++;
            break;
          case 'stopped':
            stoppedCount++;
            break;
          case 'crashed':
            crashedCount++;
            break;
        }
      }

      const response: ServerListResponse = {
        servers: serverStatuses,
        totalServers: serverStatuses.length,
        runningServers: runningCount,
        stoppedServers: stoppedCount,
        crashedServers: crashedCount
      };

      console.log(`✅ ServerAPI: Returned status for ${response.totalServers} servers`);
      return response;
    } catch (error) {
      console.error('❌ ServerAPI: Error getting server list:', error);
      return {
        servers: [],
        totalServers: 0,
        runningServers: 0,
        stoppedServers: 0,
        crashedServers: 0
      };
    }
  }

  /**
   * Get status of specific server
   */
  public async getServerStatus(serverId: string): Promise<ServerStatusResponse | null> {
    try {
      console.log(`📊 ServerAPI: Getting status for server ${serverId}...`);

      const server = this.serverManager.getServer(serverId);
      if (!server) {
        console.log(`❌ ServerAPI: Server ${serverId} not found`);
        return null;
      }

      const uptime = Date.now() - server.startTime.getTime();
      
      const status: ServerStatusResponse = {
        serverId,
        status: server.status,
        pid: server.pid,
        port: server.port,
        startTime: server.startTime.toISOString(),
        uptime,
        serverType: server.serverType,
        restartCount: server.restartCount,
        lastHealthCheck: server.lastHealthCheck?.toISOString()
      };

      // Add system metrics if running
      if (server.status === 'running') {
        status.memoryUsage = await this.getProcessMemoryUsage(server.pid);
        status.cpuUsage = await this.getProcessCpuUsage(server.pid);
      }

      console.log(`✅ ServerAPI: Retrieved status for server ${serverId}`);
      return status;
    } catch (error) {
      console.error(`❌ ServerAPI: Error getting server status for ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Start server with authorization check
   */
  public async startServer(options: {
    serverType: 'vite-dev' | 'vite-preview' | 'production' | 'custom';
    port?: number;
    command: string;
    workingDirectory: string;
    serverId?: string;
    agentRole?: string;
  }): Promise<ServerOperationResponse> {
    try {
      console.log(`🚀 ServerAPI: Start server request from agent: ${options.agentRole}`);

      // Authorization check
      if (!this.verifyAuthorization(options.agentRole)) {
        return {
          success: false,
          message: `Unauthorized: Only server agents can start servers`,
          timestamp: new Date().toISOString()
        };
      }

      const result = await this.serverManager.startServer({
        serverType: options.serverType,
        port: options.port,
        command: options.command,
        workingDirectory: options.workingDirectory,
        serverId: options.serverId,
        healthCheckUrl: options.port ? `http://localhost:${options.port}/health` : undefined
      });

      if (result.success) {
        console.log(`✅ ServerAPI: Server started successfully: ${result.serverId}`);
        return {
          success: true,
          message: `Server started successfully`,
          serverId: result.serverId,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`❌ ServerAPI: Failed to start server: ${result.error}`);
        return {
          success: false,
          message: result.error || 'Unknown error starting server',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ ServerAPI: Error in startServer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stop server with authorization check
   */
  public async stopServer(serverId: string, options: {
    force?: boolean;
    agentRole?: string;
  } = {}): Promise<ServerOperationResponse> {
    try {
      console.log(`🛑 ServerAPI: Stop server request for ${serverId} from agent: ${options.agentRole}`);

      // Authorization check
      if (!this.verifyAuthorization(options.agentRole)) {
        return {
          success: false,
          message: `Unauthorized: Only server agents can stop servers`,
          serverId,
          timestamp: new Date().toISOString()
        };
      }

      const result = await this.serverManager.stopServer(serverId, options.force);

      if (result.success) {
        console.log(`✅ ServerAPI: Server stopped successfully: ${serverId}`);
        return {
          success: true,
          message: `Server stopped successfully`,
          serverId,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`❌ ServerAPI: Failed to stop server: ${result.error}`);
        return {
          success: false,
          message: result.error || 'Unknown error stopping server',
          serverId,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`❌ ServerAPI: Error stopping server ${serverId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        serverId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Restart server with authorization check
   */
  public async restartServer(serverId: string, options: {
    agentRole?: string;
  } = {}): Promise<ServerOperationResponse> {
    try {
      console.log(`🔄 ServerAPI: Restart server request for ${serverId} from agent: ${options.agentRole}`);

      // Authorization check
      if (!this.verifyAuthorization(options.agentRole)) {
        return {
          success: false,
          message: `Unauthorized: Only server agents can restart servers`,
          serverId,
          timestamp: new Date().toISOString()
        };
      }

      const server = this.serverManager.getServer(serverId);
      if (!server) {
        return {
          success: false,
          message: `Server ${serverId} not found`,
          serverId,
          timestamp: new Date().toISOString()
        };
      }

      // Stop the server first
      const stopResult = await this.serverManager.stopServer(serverId, false);
      if (!stopResult.success) {
        return {
          success: false,
          message: `Failed to stop server for restart: ${stopResult.error}`,
          serverId,
          timestamp: new Date().toISOString()
        };
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start the server again with same configuration
      const startResult = await this.serverManager.startServer({
        serverType: server.serverType,
        port: server.port,
        command: server.command,
        workingDirectory: server.workingDirectory,
        serverId: serverId,
        healthCheckUrl: `http://localhost:${server.port}/health`
      });

      if (startResult.success) {
        console.log(`✅ ServerAPI: Server restarted successfully: ${serverId}`);
        return {
          success: true,
          message: `Server restarted successfully`,
          serverId,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`❌ ServerAPI: Failed to restart server: ${startResult.error}`);
        return {
          success: false,
          message: `Failed to restart server: ${startResult.error}`,
          serverId,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`❌ ServerAPI: Error restarting server ${serverId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        serverId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system health overview for dashboard
   */
  public async getSystemHealth(): Promise<{
    overallStatus: 'healthy' | 'warning' | 'critical';
    serverCount: number;
    runningServers: number;
    issues: string[];
    lastUpdate: string;
  }> {
    try {
      console.log('💊 ServerAPI: Getting system health overview...');

      const serverList = await this.getServerList();
      const issues: string[] = [];

      // Check for crashed servers
      if (serverList.crashedServers > 0) {
        issues.push(`${serverList.crashedServers} server(s) have crashed`);
      }

      // Check for no running servers
      if (serverList.runningServers === 0 && serverList.totalServers > 0) {
        issues.push('No servers are currently running');
      }

      // Determine overall status
      let overallStatus: 'healthy' | 'warning' | 'critical';
      if (issues.length === 0) {
        overallStatus = 'healthy';
      } else if (serverList.crashedServers > 0 || serverList.runningServers === 0) {
        overallStatus = 'critical';
      } else {
        overallStatus = 'warning';
      }

      const health = {
        overallStatus,
        serverCount: serverList.totalServers,
        runningServers: serverList.runningServers,
        issues,
        lastUpdate: new Date().toISOString()
      };

      console.log(`✅ ServerAPI: System health status: ${overallStatus}`);
      return health;
    } catch (error) {
      console.error('❌ ServerAPI: Error getting system health:', error);
      return {
        overallStatus: 'critical',
        serverCount: 0,
        runningServers: 0,
        issues: ['Error retrieving system health'],
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Helper methods for system metrics
   */
  private async getProcessMemoryUsage(pid: number): Promise<{
    rss: number;
    heapUsed: number;
    heapTotal: number;
  } | undefined> {
    try {
      // This would use ps or /proc in real implementation
      console.log(`📊 ServerAPI: Getting memory usage for PID ${pid}`);
      
      // Simulate memory usage data
      return {
        rss: Math.floor(Math.random() * 100) + 50, // MB
        heapUsed: Math.floor(Math.random() * 50) + 20, // MB
        heapTotal: Math.floor(Math.random() * 80) + 40  // MB
      };
    } catch (error) {
      console.error(`❌ ServerAPI: Error getting memory usage for PID ${pid}:`, error);
      return undefined;
    }
  }

  private async getProcessCpuUsage(pid: number): Promise<number | undefined> {
    try {
      // This would use ps or top in real implementation
      console.log(`📊 ServerAPI: Getting CPU usage for PID ${pid}`);
      
      // Simulate CPU usage percentage
      return Math.floor(Math.random() * 50) + 5; // 5-55%
    } catch (error) {
      console.error(`❌ ServerAPI: Error getting CPU usage for PID ${pid}:`, error);
      return undefined;
    }
  }
}

// Export factory function for creating configured instance
export function createServerAPI(serverManager: ServerManager): ServerAPI {
  return new ServerAPI(serverManager);
}