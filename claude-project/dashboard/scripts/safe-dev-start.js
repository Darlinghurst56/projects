#!/usr/bin/env node

/**
 * Safe Development Server Starter
 * Task 2.2 - Server Agent Implementation (Revised for Home Use)
 * 
 * Simple wrapper for home dashboard development
 * Prevents accidentally starting multiple dev servers
 */

import { spawn } from 'child_process';
import { homeServerManager } from '../src/server/HomeServerManager.js';

class SafeDevStarter {
  constructor() {
    this.manager = homeServerManager;
    this.defaultPort = 5173;
    this.args = process.argv.slice(2);
  }

  async start() {
    console.log('🏠 Home Dashboard Dev Server');
    console.log('============================\\n');
    
    try {
      const options = this.parseArguments();
      
      // Simple home environment check
      console.log(`🔍 Checking if dashboard can start on port ${options.port}...`);
      const validation = await this.manager.validateStartup(options.port);
      
      if (validation.canStart || options.force) {
        await this.startServer(options);
      } else if (options.stopExisting) {
        console.log('🔄 Stopping existing server and restarting...');
        await this.manager.stopExistingVite();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await this.startServer(options);
      } else {
        this.showConflictHelp(validation);
      }
      
    } catch (error) {
      console.error(`\\n❌ Failed to start dashboard: ${error.message}`);
      console.log('\\n💡 Try: npm run dev:safe --stop-existing');
      process.exit(1);
    }
  }

  parseArguments() {
    const options = {
      port: this.defaultPort,
      force: false,
      stopExisting: false,
      verbose: false
    };
    
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      
      switch (arg) {
        case '--port':
        case '-p':
          options.port = parseInt(this.args[++i]);
          if (isNaN(options.port)) {
            throw new Error('Invalid port number');
          }
          break;
        case '--force':
        case '-f':
          options.force = true;
          break;
        case '--stop-existing':
        case '-s':
          options.stopExisting = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }
    
    return options;
  }

  async startServer(options) {
    console.log(`\\n✅ Starting your home dashboard on port ${options.port}...`);
    
    // Start Vite with the validated port
    const viteArgs = ['--port', options.port.toString(), '--host'];
    if (options.verbose) {
      viteArgs.push('--debug');
    }
    
    console.log(`🎯 Executing: vite ${viteArgs.join(' ')}\\n`);
    console.log(`🌐 Your dashboard will be available at: http://localhost:${options.port}\\n`);
    
    const viteProcess = spawn('npx', ['vite', ...viteArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Handle process events
    viteProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`\\n✅ Dashboard stopped normally`);
      } else {
        console.log(`\\n⚠️ Dashboard exited with code ${code}`);
      }
    });
    
    process.on('SIGINT', () => {
      console.log('\\n🛑 Stopping your dashboard...');
      viteProcess.kill('SIGTERM');
    });
    
    process.on('SIGTERM', () => {
      console.log('\\n🛑 Shutting down dashboard...');
      viteProcess.kill('SIGKILL');
    });
  }

  showConflictHelp(validation) {
    console.log('\\n⚠️ Your dashboard might already be running!');
    console.log('\\n📋 Status:');
    validation.messages.forEach(msg => console.log(`   ${msg}`));
    
    console.log('\\n💡 What you can do:');
    console.log('   1. Check if dashboard is already open in your browser');
    console.log('   2. Run: npm run dev:safe --stop-existing');
    console.log('   3. Run: npm run dev:safe --force (to start anyway)');
    console.log('   4. Press Ctrl+C in any terminal running the dashboard');
    
    process.exit(1);
  }

  showHelp() {
    console.log(`
🏠 Home Dashboard Safe Starter
==============================

Simple server starter for your home dashboard.
Prevents accidentally running multiple servers.

USAGE:
  npm run dev:safe [options]

OPTIONS:
  -p, --port <number>     Port number (default: 5173)
  -f, --force            Start even if something is running
  -s, --stop-existing    Stop existing server and restart
  -v, --verbose          Show detailed output
  -h, --help             Show this help

EXAMPLES:
  # Start normally
  npm run dev:safe
  
  # Restart cleanly
  npm run dev:safe --stop-existing
  
  # Use different port
  npm run dev:safe --port 3000

Your dashboard will be available at http://localhost:5173
`);
  }
}

// Run the safe dev starter
const starter = new SafeDevStarter();
starter.start();