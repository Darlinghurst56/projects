#!/usr/bin/env node

/**
 * TaskMaster AI - Unified Web Startup Script
 * One-click startup that launches everything and opens browser
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AgentTelemetryTracker } = require('../.taskmaster/agents/agent-telemetry-tracker.js');

const PROJECT_ROOT = path.join(__dirname, '..');
const API_PORT = process.env.PORT || 3001;
const DASHBOARD_URL = `http://localhost:${API_PORT}/enhanced-dashboard.html`;

class TaskMasterWebStarter {
    constructor() {
        this.tracker = new AgentTelemetryTracker();
        this.processes = new Map();
        this.startupLog = [];
        this.isShuttingDown = false;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] [${type}] ${message}`;
        console.log(logEntry);
        this.startupLog.push({ timestamp, type, message });
    }

    /**
     * Check system prerequisites
     */
    async checkPrerequisites() {
        this.log('🔍 Checking system prerequisites...', 'SETUP');
        
        const checks = [];
        
        // Check Node.js version
        const nodeVersion = process.version;
        checks.push({ name: 'Node.js', status: 'OK', version: nodeVersion });
        
        // Check TaskMaster CLI
        try {
            execSync('task-master --version', { stdio: 'pipe' });
            const version = execSync('task-master --version', { encoding: 'utf8' }).trim();
            checks.push({ name: 'TaskMaster CLI', status: 'OK', version: version });
        } catch (error) {
            checks.push({ name: 'TaskMaster CLI', status: 'ERROR', error: 'Not installed or not in PATH' });
        }
        
        // Check model configurations
        const configPath = path.join(PROJECT_ROOT, '.taskmaster/config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const models = Object.keys(config.models || {});
            checks.push({ name: 'Model Config', status: 'OK', models: models.length });
        } else {
            checks.push({ name: 'Model Config', status: 'ERROR', error: 'Config file missing' });
        }
        
        // Check API keys
        const hasGoogle = !!process.env.GOOGLE_API_KEY;
        const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
        const keyCount = [hasGoogle, hasPerplexity].filter(Boolean).length;
        checks.push({ name: 'API Keys', status: keyCount > 0 ? 'OK' : 'WARN', available: keyCount });
        
        // Display results
        console.log('\n📊 System Status:');
        checks.forEach(check => {
            const status = check.status === 'OK' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
            const detail = check.version || check.models || check.available || check.error || '';
            console.log(`   ${status} ${check.name}: ${detail}`);
        });
        
        const hasErrors = checks.some(c => c.status === 'ERROR');
        if (hasErrors) {
            this.log('❌ Prerequisites check failed. Please fix errors above.', 'ERROR');
            process.exit(1);
        }
        
        this.log('✅ Prerequisites check passed', 'SETUP');
        return checks;
    }

    /**
     * Start the API server
     */
    async startAPIServer() {
        this.log('🚀 Starting TaskMaster API Server...', 'SERVER');
        
        return new Promise((resolve, reject) => {
            const serverProcess = spawn('node', ['app/core/taskmaster-api-server.js'], {
                cwd: PROJECT_ROOT,
                stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'production' }
            });

            let serverReady = false;
            
            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('TaskMaster API server running')) {
                    serverReady = true;
                    this.log(`✅ API Server running on port ${API_PORT}`, 'SERVER');
                    resolve(serverProcess);
                }
                // Log important server output only
                const importantLines = output.split('\n').filter(line => 
                    line.includes('✅') || line.includes('❌') || line.includes('🚀')
                );
                importantLines.forEach(line => {
                    if (line.trim()) this.log(`[API] ${line}`, 'SERVER');
                });
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                this.log(`[API ERROR] ${error}`, 'ERROR');
            });

            serverProcess.on('error', (error) => {
                this.log(`Failed to start API server: ${error.message}`, 'ERROR');
                reject(error);
            });

            // Timeout if server doesn't start in 30 seconds
            setTimeout(() => {
                if (!serverReady) {
                    this.log('API server startup timeout', 'ERROR');
                    reject(new Error('Server startup timeout'));
                }
            }, 30000);

            this.processes.set('api-server', serverProcess);
        });
    }

    /**
     * Initialize telemetry tracking
     */
    async initializeTelemetry() {
        this.log('📊 Initializing telemetry tracking...', 'TELEMETRY');
        
        // Create telemetry directory if it doesn't exist
        const telemetryDir = path.join(PROJECT_ROOT, '.taskmaster/telemetry');
        if (!fs.existsSync(telemetryDir)) {
            fs.mkdirSync(telemetryDir, { recursive: true });
        }
        
        // Log startup event
        this.tracker.trackLLMUsage('system', 'startup', 'web-startup', {
            startupTime: new Date().toISOString(),
            processes: Array.from(this.processes.keys()),
            apiPort: API_PORT
        });
        
        this.log('✅ Telemetry tracking initialized', 'TELEMETRY');
    }

    /**
     * Start agents with available models
     */
    async startAgents() {
        this.log('🤖 Starting agent system...', 'AGENTS');
        
        return new Promise((resolve, reject) => {
            const agentProcess = spawn('npm', ['run', 'agents:start'], {
                cwd: PROJECT_ROOT,
                stdio: 'pipe'
            });

            let agentOutput = '';
            let agentsStarted = 0;
            const expectedAgents = 5; // orchestrator, frontend, backend, devops, qa

            agentProcess.stdout.on('data', (data) => {
                const output = data.toString();
                agentOutput += output;
                
                // Count started agents
                const startedMatches = output.match(/✓ Started \w+-agent/g);
                if (startedMatches) {
                    agentsStarted += startedMatches.length;
                }
                
                // Log agent output
                output.split('\n').filter(Boolean).forEach(line => {
                    if (line.includes('Started') || line.includes('ERROR')) {
                        this.log(`[AGENTS] ${line}`, 'AGENTS');
                    }
                });
            });

            agentProcess.stderr.on('data', (data) => {
                this.log(`[AGENTS ERROR] ${data.toString()}`, 'ERROR');
            });

            // Give agents time to start (they continue running in background)
            setTimeout(() => {
                this.log(`✅ Agent startup initiated (${agentsStarted}/${expectedAgents} detected)`, 'AGENTS');
                resolve(agentProcess);
            }, 10000); // 10 seconds should be enough for startup

            this.processes.set('agents', agentProcess);
        });
    }

    /**
     * Test model providers
     */
    async testModelProviders() {
        this.log('🧪 Testing model providers...', 'MODELS');
        
        const tests = [];
        
        // Test Google Gemini
        try {
            this.log('Testing Google Gemini...', 'MODELS');
            const result = execSync('task-master research "Hello" --detail=minimal', { 
                encoding: 'utf8', 
                timeout: 15000,
                stdio: 'pipe'
            });
            tests.push({ provider: 'Google Gemini', status: 'OK', response: result.length });
        } catch (error) {
            tests.push({ provider: 'Google Gemini', status: 'ERROR', error: error.message });
        }
        
        // Test TaskMaster with fallback
        try {
            this.log('Testing TaskMaster fallback...', 'MODELS');
            const result = execSync('task-master list', { 
                encoding: 'utf8', 
                timeout: 10000,
                stdio: 'pipe'
            });
            tests.push({ provider: 'TaskMaster', status: 'OK', tasks: 'Connected' });
        } catch (error) {
            tests.push({ provider: 'TaskMaster', status: 'ERROR', error: error.message });
        }
        
        // Display results
        console.log('\n🧠 Model Provider Status:');
        tests.forEach(test => {
            const status = test.status === 'OK' ? '✅' : '❌';
            const detail = test.response || test.tasks || test.error || '';
            console.log(`   ${status} ${test.provider}: ${detail}`);
        });
        
        const workingProviders = tests.filter(t => t.status === 'OK').length;
        this.log(`✅ ${workingProviders}/${tests.length} model providers working`, 'MODELS');
        
        return tests;
    }

    /**
     * Open browser to dashboard
     */
    async openBrowser() {
        this.log('🌐 Opening web dashboard...', 'BROWSER');
        
        // Wait a moment for server to be fully ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const opener = process.platform === 'win32' ? 'start' : 
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
        
        try {
            execSync(`${opener} ${DASHBOARD_URL}`, { stdio: 'ignore' });
            this.log(`✅ Browser opened to ${DASHBOARD_URL}`, 'BROWSER');
        } catch (error) {
            this.log(`⚠️ Could not auto-open browser. Visit: ${DASHBOARD_URL}`, 'BROWSER');
        }
    }

    /**
     * Setup graceful shutdown
     */
    setupShutdown() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            
            this.log(`\n🛑 Received ${signal}, shutting down gracefully...`, 'SHUTDOWN');
            
            // Stop all processes
            for (const [name, process] of this.processes) {
                this.log(`Stopping ${name}...`, 'SHUTDOWN');
                process.kill('SIGTERM');
            }
            
            // Log shutdown
            this.tracker.trackLLMUsage('system', 'shutdown', 'web-shutdown', {
                shutdownTime: new Date().toISOString(),
                uptime: process.uptime(),
                signal
            });
            
            this.log('👋 TaskMaster AI shutdown complete', 'SHUTDOWN');
            process.exit(0);
        };
        
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    /**
     * Main startup sequence
     */
    async start() {
        console.log('╭─────────────────────────────────────────────────────────╮');
        console.log('│                                                         │');
        console.log('│               🚀 TaskMaster AI Web Startup              │');
        console.log('│                                                         │');
        console.log('╰─────────────────────────────────────────────────────────╯');
        console.log('');

        try {
            // Setup shutdown handlers
            this.setupShutdown();
            
            // 1. Check prerequisites
            await this.checkPrerequisites();
            
            // 2. Start API server
            await this.startAPIServer();
            
            // 3. Initialize telemetry
            await this.initializeTelemetry();
            
            // 4. Start agents
            await this.startAgents();
            
            // 5. Test models
            await this.testModelProviders();
            
            // 6. Open browser
            await this.openBrowser();
            
            // Success message
            console.log('\n╭─────────────────────────────────────────────────────────╮');
            console.log('│                                                         │');
            console.log('│                  🎉 Startup Complete!                   │');
            console.log('│                                                         │');
            console.log(`│  🌐 Dashboard: ${DASHBOARD_URL.padEnd(31)} │`);
            console.log('│  📊 Telemetry: Running                                  │');
            console.log('│  🤖 Agents: Started                                     │');
            console.log('│                                                         │');
            console.log('│  Press Ctrl+C to shutdown                               │');
            console.log('│                                                         │');
            console.log('╰─────────────────────────────────────────────────────────╯');
            
            // Keep the process alive
            await new Promise(() => {});
            
        } catch (error) {
            this.log(`❌ Startup failed: ${error.message}`, 'ERROR');
            console.log('\n💡 Troubleshooting:');
            console.log('   • Check that port 3001 is not in use');
            console.log('   • Verify API keys are configured');
            console.log('   • Run "npm install" if dependencies are missing');
            process.exit(1);
        }
    }
}

// Start the web application
if (require.main === module) {
    const starter = new TaskMasterWebStarter();
    starter.start().catch(console.error);
}

module.exports = TaskMasterWebStarter;