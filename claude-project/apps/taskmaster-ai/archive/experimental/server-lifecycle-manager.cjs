#!/usr/bin/env node

/**
 * Server Lifecycle Manager
 * Intelligent server lifecycle management for the Control D Dashboard
 * Ensures single server instance, comprehensive tracking, and graceful management
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

class ServerLifecycleManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.pidFile = path.join(this.projectRoot, '.server.pid');
        this.logFile = path.join(this.projectRoot, 'server.log');
        this.configFile = path.join(this.projectRoot, 'package.json');
        this.serverProcess = null;
        this.isShuttingDown = false;
        
        // Server configuration
        this.config = {
            port: process.env.PORT || 3000,
            host: process.env.HOST || 'localhost',
            maxRestarts: 5,
            restartDelay: 3000,
            healthCheckInterval: 30000,
            gracefulShutdownTimeout: 10000
        };
        
        this.restartCount = 0;
        this.lastRestart = null;
        
        // Setup signal handlers
        this.setupSignalHandlers();
        
        console.log('🚀 Server Lifecycle Manager initialized');
    }
    
    /**
     * Start the development server with lifecycle management
     */
    async startServer(options = {}) {
        try {
            console.log('🔄 Starting server lifecycle management...');
            
            // Check if server is already running
            const existingPid = await this.getExistingServerPid();
            if (existingPid && await this.isProcessRunning(existingPid)) {
                console.log(`⚠️  Server already running with PID ${existingPid}`);
                
                if (options.force) {
                    console.log('🛑 Force restart requested, stopping existing server...');
                    await this.stopServer(existingPid);
                } else {
                    console.log('💡 Use --force to restart existing server');
                    return false;
                }
            }
            
            // Validate environment
            if (!await this.validateEnvironment()) {
                throw new Error('Environment validation failed');
            }
            
            // Start the server process
            await this.spawnServerProcess();
            
            // Setup health monitoring
            this.startHealthMonitoring();
            
            console.log('✅ Server lifecycle management started successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            return false;
        }
    }
    
    /**
     * Stop the server gracefully
     */
    async stopServer(pid = null) {
        try {
            console.log('🛑 Initiating graceful server shutdown...');
            this.isShuttingDown = true;
            
            const targetPid = pid || await this.getExistingServerPid();
            
            if (!targetPid) {
                console.log('ℹ️  No server process found to stop');
                return true;
            }
            
            // Send SIGTERM for graceful shutdown
            console.log(`📡 Sending SIGTERM to process ${targetPid}...`);
            process.kill(targetPid, 'SIGTERM');
            
            // Wait for graceful shutdown
            let attempts = 0;
            const maxAttempts = this.config.gracefulShutdownTimeout / 1000;
            
            while (attempts < maxAttempts && await this.isProcessRunning(targetPid)) {
                await this.delay(1000);
                attempts++;
                console.log(`⏳ Waiting for graceful shutdown... (${attempts}/${maxAttempts})`);
            }
            
            // Force kill if still running
            if (await this.isProcessRunning(targetPid)) {
                console.log('⚡ Forcing process termination...');
                process.kill(targetPid, 'SIGKILL');
                await this.delay(2000);
            }
            
            // Cleanup
            await this.cleanup();
            
            console.log('✅ Server stopped successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error during server shutdown:', error.message);
            return false;
        }
    }
    
    /**
     * Restart the server
     */
    async restartServer() {
        try {
            console.log('🔄 Restarting server...');
            
            if (this.restartCount >= this.config.maxRestarts) {
                const timeSinceLastRestart = Date.now() - (this.lastRestart || 0);
                if (timeSinceLastRestart < 60000) { // 1 minute
                    console.error('❌ Too many restarts in a short period. Manual intervention required.');
                    return false;
                }
                this.restartCount = 0; // Reset counter after cooldown
            }
            
            await this.stopServer();
            await this.delay(this.config.restartDelay);
            
            this.restartCount++;
            this.lastRestart = Date.now();
            
            return await this.startServer();
            
        } catch (error) {
            console.error('❌ Failed to restart server:', error.message);
            return false;
        }
    }
    
    /**
     * Get server status information
     */
    async getServerStatus() {
        try {
            const pid = await this.getExistingServerPid();
            const isRunning = pid && await this.isProcessRunning(pid);
            
            const status = {
                running: isRunning,
                pid: pid,
                port: this.config.port,
                host: this.config.host,
                uptime: null,
                restartCount: this.restartCount,
                lastRestart: this.lastRestart,
                healthCheckStatus: 'unknown'
            };
            
            if (isRunning) {
                status.uptime = await this.getProcessUptime(pid);
                status.healthCheckStatus = await this.performHealthCheck();
            }
            
            return status;
            
        } catch (error) {
            console.error('❌ Failed to get server status:', error.message);
            return { running: false, error: error.message };
        }
    }
    
    /**
     * Spawn the server process
     */
    async spawnServerProcess() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🚀 Spawning Vite development server...');
                
                const serverArgs = ['run', 'dev'];
                const serverOptions = {
                    cwd: this.projectRoot,
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PORT: this.config.port,
                        HOST: this.config.host,
                        NODE_ENV: 'development'
                    }
                };
                
                this.serverProcess = spawn('npm', serverArgs, serverOptions);
                
                // Write PID file
                fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());
                
                // Setup logging
                this.setupLogging();
                
                // Handle process events
                this.serverProcess.on('spawn', () => {
                    console.log(`✅ Server spawned successfully with PID ${this.serverProcess.pid}`);
                    resolve();
                });
                
                this.serverProcess.on('error', (error) => {
                    console.error('❌ Server spawn error:', error);
                    reject(error);
                });
                
                this.serverProcess.on('exit', (code, signal) => {
                    console.log(`🔚 Server process exited with code ${code}, signal ${signal}`);
                    this.handleServerExit(code, signal);
                });
                
                // Wait a bit to ensure successful startup
                setTimeout(resolve, 2000);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Setup logging for server output
     */
    setupLogging() {
        if (!this.serverProcess) return;
        
        const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
        
        this.serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            logStream.write(`[STDOUT] ${new Date().toISOString()} ${output}`);
            
            // Also log to console for debugging
            if (process.env.DEBUG) {
                console.log('[SERVER]', output.trim());
            }
        });
        
        this.serverProcess.stderr.on('data', (data) => {
            const output = data.toString();
            logStream.write(`[STDERR] ${new Date().toISOString()} ${output}`);
            
            // Log errors to console
            console.error('[SERVER ERROR]', output.trim());
        });
    }
    
    /**
     * Handle server process exit
     */
    async handleServerExit(code, signal) {
        if (this.isShuttingDown) {
            console.log('📝 Expected server shutdown');
            return;
        }
        
        if (code !== 0) {
            console.error(`⚠️  Server exited unexpectedly with code ${code}`);
            
            if (this.restartCount < this.config.maxRestarts) {
                console.log(`🔄 Attempting automatic restart (${this.restartCount + 1}/${this.config.maxRestarts})...`);
                setTimeout(() => this.restartServer(), this.config.restartDelay);
            } else {
                console.error('❌ Maximum restart attempts reached. Manual intervention required.');
            }
        }
        
        await this.cleanup();
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
        }
        
        this.healthMonitor = setInterval(async () => {
            if (this.isShuttingDown) return;
            
            const health = await this.performHealthCheck();
            if (health !== 'healthy') {
                console.warn('⚠️  Server health check failed:', health);
                
                if (health === 'unresponsive') {
                    console.log('🔄 Restarting unresponsive server...');
                    await this.restartServer();
                }
            }
        }, this.config.healthCheckInterval);
    }
    
    /**
     * Perform health check on the server
     */
    async performHealthCheck() {
        try {
            const response = await this.makeHealthRequest();
            return response.ok ? 'healthy' : 'unhealthy';
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                return 'unresponsive';
            }
            return 'error';
        }
    }
    
    /**
     * Make health check request
     */
    async makeHealthRequest() {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const req = http.request({
                hostname: this.config.host,
                port: this.config.port,
                path: '/',
                method: 'HEAD',
                timeout: 5000
            }, (res) => {
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 400 });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Health check timeout'));
            });
            
            req.end();
        });
    }
    
    /**
     * Validate environment before starting server
     */
    async validateEnvironment() {
        try {
            console.log('🔍 Validating environment...');
            
            // Check if package.json exists
            if (!fs.existsSync(this.configFile)) {
                throw new Error('package.json not found');
            }
            
            // Check if node_modules exists
            const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                console.log('📦 Installing dependencies...');
                await this.runCommand('npm install');
            }
            
            // Check port availability
            const portInUse = await this.isPortInUse(this.config.port);
            if (portInUse) {
                const existingPid = await this.getExistingServerPid();
                if (!existingPid || !await this.isProcessRunning(existingPid)) {
                    throw new Error(`Port ${this.config.port} is in use by another process`);
                }
            }
            
            console.log('✅ Environment validation passed');
            return true;
            
        } catch (error) {
            console.error('❌ Environment validation failed:', error.message);
            return false;
        }
    }
    
    /**
     * Setup signal handlers for graceful shutdown
     */
    setupSignalHandlers() {
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`📡 Received ${signal}, initiating graceful shutdown...`);
                await this.stopServer();
                process.exit(0);
            });
        });
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught exception:', error);
            this.stopServer().then(() => process.exit(1));
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
            this.stopServer().then(() => process.exit(1));
        });
    }
    
    /**
     * Utility methods
     */
    async getExistingServerPid() {
        try {
            if (fs.existsSync(this.pidFile)) {
                return parseInt(fs.readFileSync(this.pidFile, 'utf8').trim());
            }
        } catch (error) {
            // Ignore errors reading PID file
        }
        return null;
    }
    
    async isProcessRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async isPortInUse(port) {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            
            server.listen(port, () => {
                server.once('close', () => resolve(false));
                server.close();
            });
            
            server.on('error', () => resolve(true));
        });
    }
    
    async getProcessUptime(pid) {
        try {
            const { stdout } = await this.runCommand(`ps -o etime= -p ${pid}`);
            return stdout.trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    async runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    async cleanup() {
        // Remove PID file
        if (fs.existsSync(this.pidFile)) {
            fs.unlinkSync(this.pidFile);
        }
        
        // Clear health monitor
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
            this.healthMonitor = null;
        }
        
        // Reset server process reference
        this.serverProcess = null;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new ServerLifecycleManager();
    const command = process.argv[2];
    const flags = process.argv.slice(3);
    
    const hasFlag = (flag) => flags.includes(`--${flag}`);
    
    (async () => {
        try {
            switch (command) {
                case 'start':
                    await manager.startServer({ force: hasFlag('force') });
                    break;
                    
                case 'stop':
                    await manager.stopServer();
                    break;
                    
                case 'restart':
                    await manager.restartServer();
                    break;
                    
                case 'status':
                    const status = await manager.getServerStatus();
                    console.log('📊 Server Status:');
                    console.log(JSON.stringify(status, null, 2));
                    break;
                    
                default:
                    console.log(`
🚀 Server Lifecycle Manager

Usage:
  node server-lifecycle-manager.js <command> [options]

Commands:
  start    Start the development server
  stop     Stop the development server
  restart  Restart the development server
  status   Show server status

Options:
  --force  Force restart if server is already running

Examples:
  node server-lifecycle-manager.js start
  node server-lifecycle-manager.js start --force
  node server-lifecycle-manager.js status
                    `);
                    break;
            }
        } catch (error) {
            console.error('❌ Command failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = ServerLifecycleManager;