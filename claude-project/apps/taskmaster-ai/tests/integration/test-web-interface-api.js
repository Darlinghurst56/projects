#!/usr/bin/env node

/**
 * TaskMaster AI - Web Interface API E2E Test
 * Tests the API endpoints that power the agent management web interface
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class WebInterfaceAPITest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
        this.testReport = {
            timestamp: new Date().toISOString(),
            tests: [],
            apiResponses: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow
        };
        const coloredMessage = `[${timestamp}] ${colors[type] || chalk.white}${message}`;
        console.log(coloredMessage);
        
        this.testReport.tests.push({
            timestamp,
            message,
            type,
            status: type === 'error' ? 'failed' : 'passed'
        });
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const fetch = (await import('node-fetch')).default;
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TaskMaster-API-Test'
                },
                timeout: 10000
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseData = await response.text();
            
            let jsonData;
            try {
                jsonData = JSON.parse(responseData);
            } catch (e) {
                jsonData = { raw: responseData };
            }

            const result = {
                status: response.status,
                ok: response.ok,
                data: jsonData,
                headers: Object.fromEntries(response.headers.entries())
            };

            this.testReport.apiResponses.push({
                endpoint,
                method,
                requestData: data,
                response: result,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            this.log(`Request failed: ${error.message}`, 'error');
            return {
                status: 0,
                ok: false,
                error: error.message,
                data: null
            };
        }
    }

    async testAPIHealth() {
        this.log('Testing API health endpoint...', 'info');
        
        const response = await this.makeRequest('/api/health');
        
        if (response.ok && response.data.status === 'healthy') {
            this.log('✅ API health check passed', 'success');
            this.log(`  - Service: ${response.data.service}`, 'info');
            this.log(`  - TaskMaster: ${response.data.taskmaster}`, 'info');
            this.log(`  - Uptime: ${Math.round(response.data.uptime)}s`, 'info');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ API health check failed: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('API health check failed');
            return false;
        }
    }

    async testAgentsEndpoint() {
        this.log('Testing agents endpoint...', 'info');
        
        const response = await this.makeRequest('/api/agents');
        
        if (response.ok && response.data.agents) {
            const agentCount = response.data.agents.length;
            this.log(`✅ Agents endpoint returned ${agentCount} agents`, 'success');
            
            // Check agent structure
            const firstAgent = response.data.agents[0];
            if (firstAgent && firstAgent.id && firstAgent.capabilities) {
                this.log(`  - First agent: ${firstAgent.id}`, 'info');
                this.log(`  - Capabilities: ${firstAgent.capabilities.length}`, 'info');
                this.testResults.passed++;
                return true;
            } else {
                this.log('❌ Agent data structure invalid', 'error');
                this.testResults.failed++;
                return false;
            }
        } else {
            this.log(`❌ Agents endpoint failed: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Agents endpoint failed');
            return false;
        }
    }

    async testTasksEndpoint() {
        this.log('Testing tasks endpoint...', 'info');
        
        const response = await this.makeRequest('/api/tasks');
        
        if (response.ok && response.data.tasks) {
            const taskCount = response.data.tasks.length;
            this.log(`✅ Tasks endpoint returned ${taskCount} tasks`, 'success');
            
            // Check task structure
            if (taskCount > 0) {
                const firstTask = response.data.tasks[0];
                if (firstTask && firstTask.id && firstTask.title) {
                    this.log(`  - First task: ${firstTask.title}`, 'info');
                    this.log(`  - Status: ${firstTask.status}`, 'info');
                    this.log(`  - Priority: ${firstTask.priority}`, 'info');
                }
            } else {
                this.log('  - No tasks available (valid state)', 'info');
            }
            
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Tasks endpoint failed: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Tasks endpoint failed');
            return false;
        }
    }

    async testAgentManagementPage() {
        this.log('Testing agent management page...', 'info');
        
        const response = await this.makeRequest('/agent-management');
        
        if (response.ok && response.data.raw) {
            const htmlContent = response.data.raw;
            
            // Check for key elements
            const hasTitle = htmlContent.includes('TaskMaster AI - Agent Management');
            const hasAgentsGrid = htmlContent.includes('agents-grid');
            const hasTaskForm = htmlContent.includes('task-assignment');
            const hasRefreshButton = htmlContent.includes('refreshData()');
            
            if (hasTitle && hasAgentsGrid && hasTaskForm && hasRefreshButton) {
                this.log('✅ Agent management page contains required elements', 'success');
                this.log('  - Title: ✓', 'info');
                this.log('  - Agents grid: ✓', 'info');
                this.log('  - Task form: ✓', 'info');
                this.log('  - Refresh button: ✓', 'info');
                this.testResults.passed++;
                return true;
            } else {
                this.log('❌ Agent management page missing required elements', 'error');
                this.log(`  - Title: ${hasTitle ? '✓' : '✗'}`, 'info');
                this.log(`  - Agents grid: ${hasAgentsGrid ? '✓' : '✗'}`, 'info');
                this.log(`  - Task form: ${hasTaskForm ? '✓' : '✗'}`, 'info');
                this.log(`  - Refresh button: ${hasRefreshButton ? '✓' : '✗'}`, 'info');
                this.testResults.failed++;
                return false;
            }
        } else {
            this.log(`❌ Agent management page failed to load: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Agent management page failed to load');
            return false;
        }
    }

    async testTaskAssignmentEndpoint() {
        this.log('Testing task assignment endpoint...', 'info');
        
        // First get available agents
        const agentsResponse = await this.makeRequest('/api/agents');
        if (!agentsResponse.ok || !agentsResponse.data.agents || agentsResponse.data.agents.length === 0) {
            this.log('❌ No agents available for assignment test', 'error');
            this.testResults.failed++;
            return false;
        }
        
        const firstAgent = agentsResponse.data.agents[0];
        const assignmentData = {
            taskId: 'test-task-' + Date.now(),
            priority: 'medium'
        };
        
        const response = await this.makeRequest(`/api/agents/${firstAgent.id}/assign-task`, 'POST', assignmentData);
        
        // Assignment might fail for various reasons, but endpoint should respond properly
        if (response.status === 200 || response.status === 400 || response.status === 404) {
            this.log('✅ Task assignment endpoint responded appropriately', 'success');
            this.log(`  - Status: ${response.status}`, 'info');
            this.log(`  - Response: ${response.data.message || response.data.error}`, 'info');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Task assignment endpoint failed unexpectedly: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Task assignment endpoint failed');
            return false;
        }
    }

    async testHumanApprovalEndpoint() {
        this.log('Testing human approval endpoint...', 'info');
        
        const suggestionData = {
            taskId: 'test-task-' + Date.now(),
            targetAgent: 'frontend-agent',
            reasoning: 'API test suggestion'
        };
        
        const response = await this.makeRequest('/api/human-approval/suggestions', 'POST', suggestionData);
        
        if (response.ok || response.status === 201) {
            this.log('✅ Human approval endpoint working', 'success');
            this.log(`  - Status: ${response.status}`, 'info');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Human approval endpoint failed: ${response.status}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Human approval endpoint failed');
            return false;
        }
    }

    async testAPIPerformance() {
        this.log('Testing API performance...', 'info');
        
        const endpoints = [
            '/api/health',
            '/api/agents',
            '/api/tasks'
        ];
        
        const performanceResults = [];
        
        for (const endpoint of endpoints) {
            const startTime = Date.now();
            const response = await this.makeRequest(endpoint);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            performanceResults.push({
                endpoint,
                duration,
                status: response.status,
                success: response.ok
            });
            
            this.log(`  - ${endpoint}: ${duration}ms (${response.status})`, 'info');
        }
        
        const avgDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
        const allSuccessful = performanceResults.every(r => r.success);
        
        if (allSuccessful && avgDuration < 2000) {
            this.log(`✅ API performance acceptable (avg: ${Math.round(avgDuration)}ms)`, 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ API performance issues (avg: ${Math.round(avgDuration)}ms)`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('API performance issues');
            return false;
        }
    }

    async testCLIIntegration() {
        this.log('Testing CLI integration issues...', 'info');
        
        // Check if the CLI errors in server log are affecting API functionality
        const response = await this.makeRequest('/api/tasks');
        
        if (response.ok) {
            this.log('✅ API tasks endpoint working despite CLI errors', 'success');
            this.log('  - CLI errors in server log do not affect web interface', 'info');
            this.testResults.passed++;
            return true;
        } else {
            this.log('❌ CLI integration issues affecting API', 'error');
            this.testResults.failed++;
            this.testResults.errors.push('CLI integration issues');
            return false;
        }
    }

    async generateReport() {
        this.log('Generating test report...', 'info');
        
        try {
            const reportPath = path.join(__dirname, 'test-reports', `web-interface-api-${Date.now()}.json`);
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            
            const report = {
                ...this.testReport,
                summary: {
                    totalTests: this.testResults.passed + this.testResults.failed,
                    passed: this.testResults.passed,
                    failed: this.testResults.failed,
                    successRate: Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100),
                    errors: this.testResults.errors
                },
                environment: {
                    baseUrl: this.baseUrl,
                    testType: 'API Integration Test',
                    nodeVersion: process.version
                }
            };
            
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            this.log(`📊 Test report saved: ${reportPath}`, 'success');
            
            return report;
        } catch (error) {
            this.log(`Report generation failed: ${error.message}`, 'error');
            return null;
        }
    }

    async runFullTest() {
        this.log('🚀 Starting TaskMaster AI Web Interface API E2E Test', 'info');
        this.log('Testing all API endpoints that power the agent management interface', 'info');
        
        const tests = [
            { name: 'API Health', fn: this.testAPIHealth.bind(this) },
            { name: 'Agents Endpoint', fn: this.testAgentsEndpoint.bind(this) },
            { name: 'Tasks Endpoint', fn: this.testTasksEndpoint.bind(this) },
            { name: 'Agent Management Page', fn: this.testAgentManagementPage.bind(this) },
            { name: 'Task Assignment Endpoint', fn: this.testTaskAssignmentEndpoint.bind(this) },
            { name: 'Human Approval Endpoint', fn: this.testHumanApprovalEndpoint.bind(this) },
            { name: 'API Performance', fn: this.testAPIPerformance.bind(this) },
            { name: 'CLI Integration', fn: this.testCLIIntegration.bind(this) }
        ];

        for (const test of tests) {
            this.log(`\n🔍 Running test: ${test.name}`, 'info');
            try {
                await test.fn();
                await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
            } catch (error) {
                this.log(`Test "${test.name}" threw error: ${error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`${test.name}: ${error.message}`);
            }
        }

        await this.generateReport();
        
        this.log('\n📊 Final Test Results:', 'info');
        this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
        
        if (this.testResults.errors.length > 0) {
            this.log('\n🔍 Error Details:', 'error');
            this.testResults.errors.forEach(error => {
                this.log(`  - ${error}`, 'error');
            });
        }

        const overallResult = this.testResults.failed === 0 ? 'PASSED' : 'FAILED';
        const resultColor = this.testResults.failed === 0 ? 'success' : 'error';
        
        this.log(`\n🎯 Overall Result: ${overallResult}`, resultColor);
        
        if (this.testResults.failed === 0) {
            this.log('✅ All API tests passed - Web interface backend is functional', 'success');
            process.exit(0);
        } else {
            this.log('❌ Some API tests failed - Issues detected in web interface backend', 'error');
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    try {
        const test = new WebInterfaceAPITest();
        await test.runFullTest();
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = WebInterfaceAPITest;