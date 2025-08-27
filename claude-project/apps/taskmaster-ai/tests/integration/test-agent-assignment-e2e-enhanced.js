#!/usr/bin/env node

/**
 * Enhanced E2E Test for Task Assignment
 * Validates both UI functionality AND backend API success
 */

const { chromium } = require('playwright');

class EnhancedTaskAssignmentTest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.agentManagementUrl = `${this.baseUrl}/agent-management`;
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
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
    }

    async runTest(name, testFn) {
        this.log(`Testing: ${name}`, 'info');
        try {
            await testFn();
            this.results.passed++;
            this.log(`✅ ${name}`, 'success');
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ test: name, error: error.message });
            this.log(`❌ ${name}: ${error.message}`, 'error');
        }
    }

    async testTaskAssignmentWithAPIValidation() {
        const browser = await chromium.launch({ 
            headless: false, // Show browser for debugging
            slowMo: 500 // Slow down for visibility
        });
        
        try {
            const page = await browser.newPage();
            await page.goto(this.agentManagementUrl);

            // Wait for page to load
            await page.waitForSelector('#agentsGrid');
            await page.waitForTimeout(2000);

            // Click on first available task
            const taskElement = await page.$('.task-item');
            if (!taskElement) {
                throw new Error('No task elements found');
            }

            await taskElement.click();
            await page.waitForTimeout(1000);

            // Select an agent
            await page.selectOption('#agentSelect', 'qa-specialist');
            await page.waitForTimeout(500);

            // Set up response listener BEFORE clicking assign button
            let apiResponse = null;
            let networkError = null;

            page.on('response', async (response) => {
                if (response.url().includes('/assign-task')) {
                    apiResponse = {
                        status: response.status(),
                        statusText: response.statusText(),
                        url: response.url()
                    };
                    
                    try {
                        const responseBody = await response.text();
                        apiResponse.body = responseBody;
                    } catch (e) {
                        apiResponse.bodyError = e.message;
                    }
                }
            });

            page.on('requestfailed', (request) => {
                if (request.url().includes('/assign-task')) {
                    networkError = {
                        url: request.url(),
                        failure: request.failure().errorText
                    };
                }
            });

            // Click assign button
            const assignButton = await page.$('#assignTask');
            if (!assignButton) {
                throw new Error('Assign button not found');
            }

            await assignButton.click();

            // Wait for API response
            await page.waitForTimeout(3000);

            // Validate the results
            if (networkError) {
                throw new Error(`Network error: ${networkError.failure}`);
            }

            if (!apiResponse) {
                throw new Error('No API response captured - assignment request may not have been made');
            }

            this.log(`API Response: ${apiResponse.status} ${apiResponse.statusText}`, 'info');
            
            // Check for successful response
            if (apiResponse.status === 200) {
                this.log('✅ Task assignment API succeeded', 'success');
                
                // Verify success message appears in UI
                const successMessage = await page.waitForSelector('.success, .assignment-success', { 
                    timeout: 5000 
                }).catch(() => null);
                
                if (successMessage) {
                    this.log('✅ Success feedback shown in UI', 'success');
                } else {
                    this.log('⚠️  No UI success feedback found', 'warning');
                }
                
            } else {
                // Log the error details
                this.log(`API Error Body: ${apiResponse.body}`, 'error');
                throw new Error(`Task assignment failed: HTTP ${apiResponse.status} - ${apiResponse.body || apiResponse.statusText}`);
            }

            await browser.close();

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    async testAPIEndpointDirectly() {
        // Test the API endpoint directly to isolate backend issues
        const testPayload = {
            taskId: '1',
            priority: 'medium'
        };

        try {
            const response = await fetch(`${this.baseUrl}/api/agents/qa-specialist/assign-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload)
            });

            const responseText = await response.text();
            
            this.log(`Direct API Test: ${response.status} ${response.statusText}`, 'info');
            this.log(`Response body: ${responseText}`, 'info');

            if (response.status === 200) {
                this.log('✅ Direct API call succeeded', 'success');
            } else {
                throw new Error(`Direct API call failed: ${response.status} - ${responseText}`);
            }

        } catch (error) {
            throw new Error(`Direct API test failed: ${error.message}`);
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Enhanced Task Assignment E2E Tests', 'info');
        this.log('Testing both UI functionality AND backend API success\n', 'info');

        // Test API endpoint directly first
        await this.runTest('Direct API Call Test', () => this.testAPIEndpointDirectly());

        // Test complete UI workflow with API validation
        await this.runTest('Complete UI Workflow with API Validation', () => this.testTaskAssignmentWithAPIValidation());

        // Results
        this.log('\n📊 Test Results:', 'info');
        this.log(`✅ Passed: ${this.results.passed}`, 'success');
        this.log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');

        if (this.results.errors.length > 0) {
            this.log('\n❌ Detailed Errors:', 'error');
            this.results.errors.forEach(err => {
                this.log(`  ${err.test}: ${err.error}`, 'error');
            });
        }

        if (this.results.failed === 0) {
            this.log('\n🎉 All tests passed! Task assignment is working correctly.', 'success');
        } else {
            this.log('\n🚨 Some tests failed. Please review the errors above.', 'error');
        }

        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3010/api/health');
        if (!response.ok) throw new Error('Server not healthy');
        return true;
    } catch (error) {
        console.error('❌ TaskMaster server not responding. Please start the server first.');
        process.exit(1);
    }
}

// Run tests
checkServer().then(() => {
    const tester = new EnhancedTaskAssignmentTest();
    tester.runAllTests().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
});