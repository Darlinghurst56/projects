#!/usr/bin/env node

/**
 * Agent Interface Validation Script
 * Comprehensive validation of all agent management interfaces
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class AgentInterfaceValidator {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.results = {
            terminal: {},
            web: {},
            api: {},
            sse: {},
            overall: true
        };
    }

    async validateAll() {
        console.log(chalk.bold.cyan('🧪 TaskMaster AI - Agent Interface Validation'));
        console.log(chalk.gray('Testing all agent management interfaces\n'));

        // Phase 1: Terminal Interface Tests
        await this.validateTerminalInterfaces();

        // Phase 2: Web Interface Tests
        await this.validateWebInterface();

        // Phase 3: API Integration Tests
        await this.validateAPIIntegration();

        // Phase 4: SSE Communication Tests
        await this.validateSSECommunication();

        // Phase 5: Performance Tests
        await this.validatePerformance();

        // Generate Report
        this.generateReport();
    }

    async validateTerminalInterfaces() {
        console.log(chalk.bold.yellow('📋 Phase 1: Terminal Interface Validation'));

        const interfaces = [
            { name: 'Main Dashboard', command: 'npm run dashboard', timeout: 3000 },
            { name: 'Agent Overview', command: 'npm run overview', timeout: 3000 },
            { name: 'Agent Details', command: 'npm run details', timeout: 3000 },
            { name: 'Task Router', command: 'npm run task-router', timeout: 3000 },
            { name: 'Agent Manager', command: 'npm run agent-manager', timeout: 3000 }
        ];

        for (const iface of interfaces) {
            const spinner = ora(`Testing ${iface.name}...`).start();
            
            try {
                const result = await this.testTerminalInterface(iface);
                if (result.success) {
                    spinner.succeed(`${iface.name}: ${chalk.green('✅ PASSED')}`);
                    this.results.terminal[iface.name] = true;
                } else {
                    spinner.fail(`${iface.name}: ${chalk.red('❌ FAILED')} - ${result.error}`);
                    this.results.terminal[iface.name] = false;
                    this.results.overall = false;
                }
            } catch (error) {
                spinner.fail(`${iface.name}: ${chalk.red('❌ ERROR')} - ${error.message}`);
                this.results.terminal[iface.name] = false;
                this.results.overall = false;
            }
        }
        console.log('');
    }

    async validateWebInterface() {
        console.log(chalk.bold.yellow('🌐 Phase 2: Web Interface Validation'));

        const tests = [
            { name: 'Dashboard Loading', test: () => this.testWebDashboard() },
            { name: 'Responsive Design', test: () => this.testResponsiveDesign() },
            { name: 'Connection Status', test: () => this.testConnectionStatus() },
            { name: 'Visual Flow Stages', test: () => this.testVisualFlowStages() }
        ];

        for (const test of tests) {
            const spinner = ora(`Testing ${test.name}...`).start();
            
            try {
                const result = await test.test();
                if (result.success) {
                    spinner.succeed(`${test.name}: ${chalk.green('✅ PASSED')}`);
                    this.results.web[test.name] = true;
                } else {
                    spinner.fail(`${test.name}: ${chalk.red('❌ FAILED')} - ${result.error}`);
                    this.results.web[test.name] = false;
                    this.results.overall = false;
                }
            } catch (error) {
                spinner.fail(`${test.name}: ${chalk.red('❌ ERROR')} - ${error.message}`);
                this.results.web[test.name] = false;
                this.results.overall = false;
            }
        }
        console.log('');
    }

    async validateAPIIntegration() {
        console.log(chalk.bold.yellow('🔌 Phase 3: API Integration Validation'));

        const endpoints = [
            { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
            { name: 'Agent List', endpoint: '/api/agents', method: 'GET' },
            { name: 'Server Status', endpoint: '/api/server/status', method: 'GET' },
            { name: 'Coordination Status', endpoint: '/api/coordination/status', method: 'GET' }
        ];

        for (const endpoint of endpoints) {
            const spinner = ora(`Testing ${endpoint.name}...`).start();
            
            try {
                const result = await this.testAPIEndpoint(endpoint);
                if (result.success) {
                    spinner.succeed(`${endpoint.name}: ${chalk.green('✅ PASSED')}`);
                    this.results.api[endpoint.name] = true;
                } else {
                    spinner.fail(`${endpoint.name}: ${chalk.red('❌ FAILED')} - ${result.error}`);
                    this.results.api[endpoint.name] = false;
                    this.results.overall = false;
                }
            } catch (error) {
                spinner.fail(`${endpoint.name}: ${chalk.red('❌ ERROR')} - ${error.message}`);
                this.results.api[endpoint.name] = false;
                this.results.overall = false;
            }
        }
        console.log('');
    }

    async validateSSECommunication() {
        console.log(chalk.bold.yellow('📡 Phase 4: SSE Communication Validation'));

        const tests = [
            { name: 'SSE Connection', test: () => this.testSSEConnection() },
            { name: 'Orchestrator Handoff', test: () => this.testOrchestratorHandoff() },
            { name: 'Event Broadcasting', test: () => this.testEventBroadcasting() }
        ];

        for (const test of tests) {
            const spinner = ora(`Testing ${test.name}...`).start();
            
            try {
                const result = await test.test();
                if (result.success) {
                    spinner.succeed(`${test.name}: ${chalk.green('✅ PASSED')}`);
                    this.results.sse[test.name] = true;
                } else {
                    spinner.fail(`${test.name}: ${chalk.red('❌ FAILED')} - ${result.error}`);
                    this.results.sse[test.name] = false;
                    this.results.overall = false;
                }
            } catch (error) {
                spinner.fail(`${test.name}: ${chalk.red('❌ ERROR')} - ${error.message}`);
                this.results.sse[test.name] = false;
                this.results.overall = false;
            }
        }
        console.log('');
    }

    async validatePerformance() {
        console.log(chalk.bold.yellow('⚡ Phase 5: Performance Validation'));

        const spinner = ora('Testing load performance...').start();
        
        try {
            const startTime = Date.now();
            
            // Test multiple concurrent requests
            const requests = Array(20).fill().map(() => 
                fetch(`${this.baseUrl}/api/health`)
            );
            
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            
            const allSuccessful = responses.every(r => r.status === 200);
            const responseTime = endTime - startTime;
            
            if (allSuccessful && responseTime < 5000) {
                spinner.succeed(`Performance: ${chalk.green('✅ PASSED')} (${responseTime}ms for 20 requests)`);
                this.results.performance = true;
            } else {
                spinner.fail(`Performance: ${chalk.red('❌ FAILED')} (${responseTime}ms, ${responses.filter(r => r.status === 200).length}/20 successful)`);
                this.results.performance = false;
                this.results.overall = false;
            }
        } catch (error) {
            spinner.fail(`Performance: ${chalk.red('❌ ERROR')} - ${error.message}`);
            this.results.performance = false;
            this.results.overall = false;
        }
        console.log('');
    }

    async testTerminalInterface(iface) {
        return new Promise((resolve) => {
            const process = spawn('timeout', [`${iface.timeout / 1000}s`].concat(iface.command.split(' ')), {
                stdio: 'pipe'
            });

            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                // For terminal interfaces, timeout is expected behavior
                if (code === 124 || output.includes('launched successfully') || output.includes('Agent Overview')) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: `Exit code: ${code}` });
                }
            });
        });
    }

    async testWebDashboard() {
        try {
            const response = await fetch(`${this.baseUrl}/developer-interface`);
            const html = await response.text();
            
            if (response.ok && html.includes('TaskMaster AI - Developer Dashboard')) {
                return { success: true };
            } else {
                return { success: false, error: 'Dashboard not loading properly' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testResponsiveDesign() {
        try {
            const response = await fetch(`${this.baseUrl}/developer-interface`);
            const html = await response.text();
            
            if (response.ok && html.includes('viewport') && html.includes('responsive')) {
                return { success: true };
            } else {
                return { success: false, error: 'Responsive design elements not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testConnectionStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/developer-interface`);
            const html = await response.text();
            
            if (response.ok && html.includes('connection-status')) {
                return { success: true };
            } else {
                return { success: false, error: 'Connection status indicators not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testVisualFlowStages() {
        try {
            const response = await fetch(`${this.baseUrl}/developer-interface`);
            const html = await response.text();
            
            if (response.ok && html.includes('flow-stage-selector') && html.includes('stage-tab')) {
                return { success: true };
            } else {
                return { success: false, error: 'Visual flow stages not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testAPIEndpoint(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint.endpoint}`);
            const data = await response.json();
            
            if (response.ok && data) {
                return { success: true };
            } else {
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testSSEConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/events`, {
                headers: { 'Accept': 'text/event-stream' }
            });
            
            if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
                return { success: true };
            } else {
                return { success: false, error: 'SSE headers not correct' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testOrchestratorHandoff() {
        try {
            const response = await fetch(`${this.baseUrl}/api/events/orchestrator/handoff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'analysis',
                    taskId: 'validation-test-001',
                    agentId: 'orchestrator-agent',
                    message: 'Validation test handoff'
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                return { success: true };
            } else {
                return { success: false, error: 'Handoff not successful' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testEventBroadcasting() {
        try {
            const serverStatus = await fetch(`${this.baseUrl}/api/server/status`);
            const status = await serverStatus.json();
            
            if (serverStatus.ok && status.connectivity.serverSentEvents) {
                return { success: true };
            } else {
                return { success: false, error: 'SSE not configured' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    generateReport() {
        console.log(chalk.bold.cyan('📊 Validation Report'));
        console.log('='.repeat(50));

        const phases = [
            { name: 'Terminal Interfaces', results: this.results.terminal },
            { name: 'Web Interface', results: this.results.web },
            { name: 'API Integration', results: this.results.api },
            { name: 'SSE Communication', results: this.results.sse }
        ];

        phases.forEach(phase => {
            console.log(chalk.bold.white(`\n${phase.name}:`));
            Object.entries(phase.results).forEach(([test, passed]) => {
                const status = passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
                console.log(`  ${test}: ${status}`);
            });
        });

        if (this.results.performance !== undefined) {
            console.log(chalk.bold.white('\nPerformance:'));
            const status = this.results.performance ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
            console.log(`  Load Testing: ${status}`);
        }

        console.log('\n' + '='.repeat(50));
        
        if (this.results.overall) {
            console.log(chalk.bold.green('🎉 ALL TESTS PASSED - Agent interfaces are working correctly!'));
        } else {
            console.log(chalk.bold.red('❌ SOME TESTS FAILED - Check the results above'));
        }
        
        console.log('');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new AgentInterfaceValidator();
    validator.validateAll().catch(console.error);
}

module.exports = AgentInterfaceValidator;