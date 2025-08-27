/**
 * Home Server Manager
 * Task 2.2 - Server Agent Implementation (Revised for Single User)
 * 
 * Simple port conflict detection for single-user home dashboard
 * Prevents accidentally starting multiple dev servers
 */

import { spawn } from 'child_process';

export class HomeServerManager {
  constructor() {
    this.defaultPort = 5173;
    this.serverType = 'vite-dev';
  }

  /**
   * Check if port is in use (simple approach for home environment)
   */
  async isPortInUse(port) {
    return new Promise((resolve) => {
      // Simple netstat check for home use
      const netstat = spawn('netstat', ['-an']);
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      netstat.on('close', (code) => {
        const portPattern = new RegExp(`:${port}\\s`, 'i');
        const inUse = portPattern.test(output);
        resolve({
          inUse,
          port,
          message: inUse ? `Port ${port} is already in use` : `Port ${port} is available`
        });
      });
      
      netstat.on('error', () => {
        // Fallback: try to bind to port
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
          server.close();
          resolve({ inUse: false, port, message: `Port ${port} is available` });
        });
        
        server.on('error', () => {
          resolve({ inUse: true, port, message: `Port ${port} is in use` });
        });
      });
    });
  }

  /**
   * Check if Vite is already running (simple process check)
   */
  async isViteRunning() {
    return new Promise((resolve) => {
      const ps = spawn('ps', ['aux']);
      let output = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ps.on('close', () => {
        const viteRunning = output.includes('vite') && output.includes('5173');
        resolve({
          running: viteRunning,
          message: viteRunning ? 'Vite dev server is already running' : 'No Vite server detected'
        });
      });
      
      ps.on('error', () => {
        // Fallback to port check only
        resolve({ running: false, message: 'Could not check processes' });
      });
    });
  }

  /**
   * Simple validation for home environment
   */
  async validateStartup(port = this.defaultPort) {
    console.log(`🏠 Checking if port ${port} is available for home dashboard...`);
    
    const portCheck = await this.isPortInUse(port);
    const viteCheck = await this.isViteRunning();
    
    const result = {
      canStart: !portCheck.inUse && !viteCheck.running,
      port,
      checks: {
        portAvailable: !portCheck.inUse,
        viteNotRunning: !viteCheck.running
      },
      messages: [portCheck.message, viteCheck.message]
    };
    
    if (result.canStart) {
      console.log('✅ All clear! Dashboard server can start safely.');
    } else {
      console.log('❌ Conflict detected:');
      result.messages.forEach(msg => console.log(`   ${msg}`));
    }
    
    return result;
  }

  /**
   * Kill existing Vite process (gentle approach for home use)
   */
  async stopExistingVite() {
    return new Promise((resolve) => {
      console.log('🛑 Stopping existing Vite server...');
      
      const pkill = spawn('pkill', ['-f', 'vite']);
      
      pkill.on('close', (code) => {
        const stopped = code === 0;
        console.log(stopped ? '✅ Existing server stopped' : 'ℹ️ No server to stop');
        resolve({ stopped, code });
      });
      
      pkill.on('error', () => {
        console.log('⚠️ Could not stop server automatically');
        resolve({ stopped: false, error: true });
      });
    });
  }

  /**
   * Get friendly status message for home user
   */
  async getHomeStatus() {
    const validation = await this.validateStartup();
    
    if (validation.canStart) {
      return {
        status: 'ready',
        message: '🏠 Your dashboard is ready to start!',
        action: 'Run `npm run dev` to start your dashboard'
      };
    } else {
      const conflicts = validation.messages.filter(msg => msg.includes('in use') || msg.includes('running'));
      return {
        status: 'conflict',
        message: '⚠️ Your dashboard might already be running',
        conflicts,
        suggestions: [
          'Check if you already have the dashboard open in another browser tab',
          'Try running `npm run dev:safe --stop-existing` to restart cleanly',
          'Or manually stop the existing server with Ctrl+C in the terminal'
        ]
      };
    }
  }
}

// Export singleton for home use
export const homeServerManager = new HomeServerManager();