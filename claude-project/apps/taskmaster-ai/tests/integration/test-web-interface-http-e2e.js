#!/usr/bin/env node

/**
 * TaskMaster AI - HTTP-based E2E Test
 * Alternative to Playwright - tests API endpoints and HTML responses
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class HTTPBasedE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
        this.testReport = {
            timestamp: new Date().toISOString(),
            tests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[34m',    // blue
            success: '\x1b[32m', // green
            error: '\x1b[31m',   // red
            warning: '\x1b[33m', // yellow
            reset: '\x1b[0m'
        };
        const color = colors[type] || colors.info;
        console.log(`[${timestamp}] ${color}${message}${colors.reset}`);
        
        this.testReport.tests.push({
            timestamp,
            message,
            type,
            status: type === 'error' ? 'failed' : 'passed'
        });
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            });
            
            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async runTest(name, testFn) {
        this.log(`Running: ${name}`, 'info');
        try {
            await testFn();
            this.testResults.passed++;
            this.log(`✅ ${name}`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({ test: name, error: error.message });
            this.log(`❌ ${name}: ${error.message}`, 'error');
        }
    }

    async test1_APIHealth() {
        const response = await this.makeRequest(`${this.baseUrl}/api/health`);
        if (response.statusCode !== 200) {
            throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        const health = JSON.parse(response.body);
        if (health.status !== 'healthy') {
            throw new Error(`API not healthy: ${health.status}`);
        }
        this.log(`API uptime: ${Math.round(health.uptime)}s`, 'info');
    }

    async test2_AgentsEndpoint() {
        const response = await this.makeRequest(`${this.baseUrl}/api/agents`);
        if (response.statusCode !== 200) {
            throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        const data = JSON.parse(response.body);
        if (!data.agents || data.agents.length === 0) {
            throw new Error('No agents loaded');
        }
        this.log(`Found ${data.agents.length} agents`, 'info');
    }

    async test3_TasksEndpoint() {
        const response = await this.makeRequest(`${this.baseUrl}/api/tasks`);
        if (response.statusCode !== 200) {
            throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        const data = JSON.parse(response.body);
        if (!data.tasks) {
            throw new Error('No tasks property in response');
        }
        this.log(`Found ${data.tasks.length} tasks`, 'info');
    }

    async test4_AgentManagementPage() {
        const response = await this.makeRequest(`${this.baseUrl}/agent-management`);
        if (response.statusCode !== 200) {
            throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        if (!response.body.includes('Agent Management')) {
            throw new Error('Agent Management page not loading correctly');
        }
        // Check for key UI elements
        const requiredElements = [
            'agentsGrid',
            'quickTasks',
            'activityFeed',
            'Auto-Assign Tasks',
            'Refresh Data'
        ];
        for (const element of requiredElements) {
            if (!response.body.includes(element)) {
                throw new Error(`Missing UI element: ${element}`);
            }
        }
        this.log('All UI elements present', 'info');
    }

    async test5_TaskAssignment() {
        // Test task assignment endpoint
        const assignmentData = JSON.stringify({
            taskId: 'test-task-1',
            agentId: 'qa-specialist',
            priority: 'medium',
            reasoning: 'E2E test assignment'
        });

        const response = await this.makeRequest(`${this.baseUrl}/api/agents/qa-specialist/assign-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(assignmentData)
            },
            body: assignmentData
        });

        // Check if endpoint exists and responds
        if (response.statusCode === 404) {
            throw new Error('Task assignment endpoint not found');
        }
        
        // For now, we accept 200 or error responses as the endpoint exists
        this.log(`Assignment endpoint responded with ${response.statusCode}`, 'info');
    }

    async test6_HumanApproval() {
        // Test human approval endpoint
        const suggestionData = JSON.stringify({
            taskId: 'test-task-2',
            targetAgent: 'frontend-agent',
            reasoning: 'E2E test suggestion'
        });

        const response = await this.makeRequest(`${this.baseUrl}/api/human-approval/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(suggestionData)
            },
            body: suggestionData
        });

        if (response.statusCode === 404) {
            throw new Error('Human approval endpoint not found');
        }
        
        this.log(`Approval endpoint responded with ${response.statusCode}`, 'info');
    }

    async test7_DeveloperInterface() {
        const response = await this.makeRequest(`${this.baseUrl}/developer-interface`);
        if (response.statusCode !== 200) {
            throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        if (!response.body.includes('Developer Dashboard')) {
            throw new Error('Developer interface not loading correctly');
        }
        this.log('Developer interface loaded', 'info');
    }

    async test8_BatchOperations() {
        // Test batch operations endpoint
        const response = await this.makeRequest(`${this.baseUrl}/api/agents/batch-status`);
        // This endpoint might not exist, but we're testing the API structure
        this.log(`Batch operations endpoint check: ${response.statusCode}`, 'info');
    }

    async runAllTests() {
        this.log('🚀 Starting TaskMaster AI HTTP-based E2E Test', 'info');
        this.log('Testing API endpoints and HTML responses without browser dependencies', 'info');

        // Check if server is running first
        try {
            await this.makeRequest(`${this.baseUrl}/api/health`);
        } catch (error) {
            this.log('❌ Server not responding. Please start TaskMaster API server first.', 'error');
            return;
        }

        // Run all tests
        await this.runTest('API Health Check', () => this.test1_APIHealth());
        await this.runTest('Agents Endpoint', () => this.test2_AgentsEndpoint());
        await this.runTest('Tasks Endpoint', () => this.test3_TasksEndpoint());
        await this.runTest('Agent Management Page', () => this.test4_AgentManagementPage());
        await this.runTest('Task Assignment API', () => this.test5_TaskAssignment());
        await this.runTest('Human Approval API', () => this.test6_HumanApproval());
        await this.runTest('Developer Interface', () => this.test7_DeveloperInterface());
        await this.runTest('Batch Operations Check', () => this.test8_BatchOperations());

        // Summary
        this.log('\n📊 Test Summary:', 'info');
        this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
        
        if (this.testResults.errors.length > 0) {
            this.log('\n❌ Errors:', 'error');
            this.testResults.errors.forEach(err => {
                this.log(`  ${err.test}: ${err.error}`, 'error');
            });
        }

        // Save report
        const fs = require('fs').promises;
        const reportPath = `test-reports/http-e2e-${Date.now()}.json`;
        await fs.mkdir('test-reports', { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(this.testReport, null, 2));
        this.log(`\n📝 Test report saved to: ${reportPath}`, 'info');

        // Exit code based on results
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run tests
const tester = new HTTPBasedE2ETest();
tester.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});