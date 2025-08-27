#!/usr/bin/env node

/**
 * TaskMaster AI - End-to-End Task Creation Test
 * Tests the complete task creation workflow through the API
 * Pass condition: No errors during task creation process (not whether task is created)
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class TaskCreationE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow
        };
        console.log(`[${timestamp}] ${colors[type] || chalk.white}${message}`);
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            // Use dynamic import for node-fetch (ESM module)
            const fetch = (await import('node-fetch')).default;
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TaskMaster-E2E-Test'
                },
                timeout: 10000 // 10 second timeout
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

            return {
                status: response.status,
                ok: response.ok,
                data: jsonData,
                headers: response.headers
            };
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

    async testServerHealth() {
        this.log('Testing server health...', 'info');
        
        const response = await this.makeRequest('/api/health');
        
        if (response.ok) {
            this.log('✅ Server health check passed', 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Server health check failed: ${response.status} - ${response.error}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Server health check failed');
            return false;
        }
    }

    async testTaskCreationAPI() {
        this.log('Testing task creation API...', 'info');
        
        const taskData = {
            title: 'E2E Test Task',
            description: 'Test task created by end-to-end test',
            priority: 'medium',
            agent: 'frontend-agent',
            metadata: {
                created_by: 'e2e-test',
                test_run: new Date().toISOString()
            }
        };

        const response = await this.makeRequest('/api/tasks', 'POST', taskData);
        
        if (response.ok || response.status === 201) {
            this.log('✅ Task creation API responded without errors', 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Task creation API failed: ${response.status} - ${response.error}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Task creation API failed');
            return false;
        }
    }

    async testTaskListAPI() {
        this.log('Testing task list API...', 'info');
        
        const response = await this.makeRequest('/api/tasks');
        
        if (response.ok) {
            this.log('✅ Task list API responded without errors', 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Task list API failed: ${response.status} - ${response.error}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Task list API failed');
            return false;
        }
    }

    async testAgentStatusAPI() {
        this.log('Testing agent status API...', 'info');
        
        const response = await this.makeRequest('/api/agents');
        
        if (response.ok) {
            this.log('✅ Agent status API responded without errors', 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Agent status API failed: ${response.status} - ${response.error}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Agent status API failed');
            return false;
        }
    }

    async testHumanApprovalAPI() {
        this.log('Testing human approval API...', 'info');
        
        const suggestionData = {
            taskId: 'test-task-' + Date.now(),
            targetAgent: 'frontend-agent',
            reasoning: 'E2E test suggestion'
        };

        const response = await this.makeRequest('/api/human-approval/suggestions', 'POST', suggestionData);
        
        if (response.ok || response.status === 201) {
            this.log('✅ Human approval API responded without errors', 'success');
            this.testResults.passed++;
            return true;
        } else {
            this.log(`❌ Human approval API failed: ${response.status} - ${response.error}`, 'error');
            this.testResults.failed++;
            this.testResults.errors.push('Human approval API failed');
            return false;
        }
    }

    async runFullTest() {
        this.log('🚀 Starting TaskMaster AI End-to-End Task Creation Test', 'info');
        this.log('Pass condition: No errors during task creation process', 'warning');
        
        const tests = [
            this.testServerHealth.bind(this),
            this.testTaskCreationAPI.bind(this),
            this.testTaskListAPI.bind(this),
            this.testAgentStatusAPI.bind(this),
            this.testHumanApprovalAPI.bind(this)
        ];

        for (const test of tests) {
            await test();
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.generateTestReport();
    }

    generateTestReport() {
        this.log('📊 Test Report:', 'info');
        this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
        
        if (this.testResults.errors.length > 0) {
            this.log('🔍 Error Details:', 'error');
            this.testResults.errors.forEach(error => {
                this.log(`  - ${error}`, 'error');
            });
        }

        const overallResult = this.testResults.failed === 0 ? 'PASSED' : 'FAILED';
        const resultColor = this.testResults.failed === 0 ? 'success' : 'error';
        
        this.log(`\n🎯 Overall Result: ${overallResult}`, resultColor);
        
        if (this.testResults.failed === 0) {
            this.log('✅ All tests passed - No errors during task creation process', 'success');
            process.exit(0);
        } else {
            this.log('❌ Some tests failed - Errors detected during task creation process', 'error');
            process.exit(1);
        }
    }
}

// Install node-fetch if not available
async function ensureNodeFetch() {
    try {
        await import('node-fetch');
    } catch (error) {
        console.log('Installing node-fetch for HTTP requests...');
        const { execSync } = require('child_process');
        try {
            execSync('npm install node-fetch@2.6.7', { stdio: 'inherit' });
        } catch (installError) {
            console.error('Failed to install node-fetch:', installError.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    try {
        await ensureNodeFetch();
        const test = new TaskCreationE2ETest();
        await test.runFullTest();
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = TaskCreationE2ETest;