#!/usr/bin/env node

/**
 * Server Startup Validation CLI Tool
 * Task 2.1 - Server Agent Implementation
 * 
 * Command-line utility to validate server startup before launching development servers
 * Prevents multiple server instances from conflicting
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ServerStartupValidator, ServerStartupBlockedError } from '../src/server/ServerStartupValidator.js';
import { serverInstanceManager } from '../src/server/ServerInstanceManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ServerValidationCLI {
  constructor() {
    this.validator = new ServerStartupValidator();
    this.args = process.argv.slice(2);
  }

  async run() {
    try {
      const command = this.args[0] || 'help';
      
      switch (command) {
        case 'validate':
          await this.validateCommand();
          break;
        case 'check-port':
          await this.checkPortCommand();
          break;
        case 'environment':
          await this.environmentCommand();
          break;
        case 'kill-port':
          await this.killPortCommand();
          break;
        case 'list-servers':
          await this.listServersCommand();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      if (error instanceof ServerStartupBlockedError) {
        console.error(`\\n❌ SERVER STARTUP BLOCKED:`);
        console.error(`Port: ${error.port}`);
        console.error(`Server Type: ${error.serverType}`);
        console.error(`\\nConflicts:`);
        error.conflicts.forEach(conflict => {
          console.error(`  • ${conflict.message}`);
        });
        process.exit(1);
      } else {
        console.error(`\\n❌ Error: ${error.message}`);
        process.exit(1);
      }
    }
  }

  async validateCommand() {
    const port = parseInt(this.args[1]);
    const serverType = this.args[2] || 'unknown';
    const force = this.args.includes('--force');
    const includeEnv = this.args.includes('--environment');
    
    if (!port || isNaN(port)) {
      console.error('❌ Port number required. Usage: validate <port> [server-type] [--force] [--environment]');
      process.exit(1);
    }

    console.log(`🔍 Validating ${serverType} server startup on port ${port}...\\n`);
    
    const validation = await this.validator.validateAndBlock(port, serverType, {
      force,
      includeEnvironmentCheck: includeEnv
    });
    
    if (validation.canStart) {
      console.log(`\\n✅ Validation successful! Server can start on port ${port}`);
      process.exit(0);
    } else {
      console.log(`\\n❌ Validation failed! Server cannot start on port ${port}`);
      process.exit(1);
    }
  }

  async checkPortCommand() {
    const port = parseInt(this.args[1]);
    
    if (!port || isNaN(port)) {
      console.error('❌ Port number required. Usage: check-port <port>');
      process.exit(1);
    }

    console.log(`🔍 Checking port ${port}...\\n`);
    
    const result = await serverInstanceManager.isPortInUse(port);
    
    if (result.inUse) {
      console.log(`❌ Port ${port} is IN USE`);
      console.log(`   Processes: ${result.processes.join(', ')}`);
      
      // Get detailed process info
      for (const pid of result.processes) {
        const info = await serverInstanceManager.getProcessInfo(parseInt(pid));
        if (info) {
          console.log(`   PID ${pid}: ${info.command}`);
          console.log(`   Started: ${info.startTime}, Running: ${info.elapsedTime}`);
        }
      }
      process.exit(1);
    } else {
      console.log(`✅ Port ${port} is AVAILABLE`);
      process.exit(0);
    }
  }

  async environmentCommand() {
    console.log('🔍 Performing comprehensive environment check...\\n');
    
    const report = await serverInstanceManager.performEnvironmentCheck();
    
    console.log('📊 ENVIRONMENT REPORT');
    console.log('===================\\n');
    
    // Port status
    console.log('🔌 Port Status:');
    Object.entries(report.portChecks).forEach(([port, check]) => {
      const status = check.inUse ? '❌ IN USE' : '✅ Available';
      console.log(`   Port ${port}: ${status}`);
      if (check.inUse && check.processes.length > 0) {
        console.log(`      Processes: ${check.processes.join(', ')}`);
      }
    });
    
    // Running processes
    console.log(`\\n🏃 Server Processes: ${report.runningProcesses.length} found`);
    if (report.runningProcesses.length > 0) {
      report.runningProcesses.forEach(proc => {
        console.log(`   PID ${proc.pid} (${proc.pattern})`);
      });
    }
    
    // Tracked servers
    console.log(`\\n📋 Tracked Servers: ${report.trackedServers.length}`);
    report.trackedServers.forEach(server => {
      console.log(`   Port ${server.port}: ${server.serverType} (${server.status})`);
    });
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`\\n💡 Recommendations:`);
      report.recommendations.forEach(rec => {
        const icon = rec.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${rec.message}`);
      });
    }
    
    console.log(`\\n⏰ Report generated: ${report.timestamp.toLocaleString()}`);
  }

  async killPortCommand() {
    const port = parseInt(this.args[1]);
    const confirmed = this.args.includes('--confirm');
    
    if (!port || isNaN(port)) {
      console.error('❌ Port number required. Usage: kill-port <port> --confirm');
      process.exit(1);
    }
    
    if (!confirmed) {
      console.error('❌ Confirmation required. Add --confirm flag to proceed.');
      console.error('⚠️  WARNING: This will forcefully kill processes using the port!');
      process.exit(1);
    }
    
    console.log(`🛑 Force killing processes on port ${port}...\\n`);
    
    const result = await this.validator.forceKillConflicts(port, { 
      confirmed: true,
      gracePeriodMs: 3000 
    });
    
    console.log(`\\n${result.killed > 0 ? '✅' : 'ℹ️'} Killed ${result.killed} process(es) on port ${port}`);
    
    if (result.killedProcesses.length > 0) {
      console.log(`   PIDs: ${result.killedProcesses.join(', ')}`);
    }
  }

  async listServersCommand() {
    console.log('📋 Listing tracked servers...\\n');
    
    const servers = serverInstanceManager.getAllTrackedServers();
    
    if (servers.length === 0) {
      console.log('ℹ️ No servers currently tracked');
      return;
    }
    
    console.log('TRACKED SERVERS');
    console.log('===============\\n');
    
    servers.forEach(server => {
      console.log(`🖥️  ${server.serverType} (PID: ${server.pid})`);
      console.log(`   Port: ${server.port}`);
      console.log(`   Status: ${server.status}`);
      console.log(`   Started: ${server.startTime.toLocaleString()}`);
      if (server.command) {
        console.log(`   Command: ${server.command}`);
      }
      console.log('');
    });
  }

  showHelp() {
    console.log(`
🚀 Server Startup Validation CLI Tool
=====================================

COMMANDS:
  validate <port> [type] [--force] [--environment]
    Validate server startup on specified port
    Options:
      --force        Override blocking and allow startup
      --environment  Include full environment check
    
  check-port <port>
    Quick check if port is available
    
  environment
    Comprehensive environment and process check
    
  kill-port <port> --confirm
    Force kill processes using the specified port
    WARNING: This forcefully terminates processes!
    
  list-servers
    List all tracked server instances
    
  help
    Show this help message

EXAMPLES:
  # Validate Vite dev server startup
  ./validate-server-startup.js validate 5173 vite-dev
  
  # Check if port 3000 is available
  ./validate-server-startup.js check-port 3000
  
  # Full environment check
  ./validate-server-startup.js environment
  
  # Force kill processes on port 5173 (DANGEROUS!)
  ./validate-server-startup.js kill-port 5173 --confirm

EXIT CODES:
  0  Success / Port available / Server can start
  1  Failure / Port in use / Server blocked
`);
  }
}

// Run the CLI
const cli = new ServerValidationCLI();
cli.run();