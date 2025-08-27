#!/usr/bin/env node

/**
 * Optimized End-to-End Test for TaskMaster AI
 * Tests task creation with improved timeouts and retry logic
 * Pass condition: No errors during task creation process
 */

const http = require('http');
const { URL } = require('url');

class OptimizedE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.results = { passed: 0, failed: 0, errors: [] };
        this.timeouts = {
            health: 3000,      // Quick health checks
            taskList: 5000,    // Fast read operations
            taskCreate: 8000,  // Allow time for AI processing
            agentStatus: 10000 // Agent coordination takes longer
        };
        this.retryAttempts = 2;
        this.retryDelay = 1000;
    }

    log(message, prefix = 'INFO') {
        console.log(`[${new Date().toISOString()}] [${prefix}] ${message}`);
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} data - Request data
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise} Response object
     */
    async makeRequestWithRetry(endpoint, method = 'GET', data = null, timeoutMs = 5000) {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.makeRequest(endpoint, method, data, timeoutMs);
                return response;
            } catch (error) {
                this.log(`Attempt ${attempt} failed: ${error.message}`, 'RETRY');
                if (attempt === this.retryAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} data - Request data
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise} Response object
     */
    async makeRequest(endpoint, method = 'GET', data = null, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            const fullUrl = new URL(endpoint, this.baseUrl);
            
            const options = {
                hostname: fullUrl.hostname,
                port: fullUrl.port || 80,
                path: fullUrl.pathname + fullUrl.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TaskMaster-Optimized-E2E-Test',
                    'Connection': 'keep-alive'
                },
                timeout: timeoutMs
            };

            if (data) {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    let jsonData;
                    try {
                        jsonData = JSON.parse(responseData);
                    } catch (e) {
                        jsonData = { raw: responseData };
                    }
                    
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        data: jsonData,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${timeoutMs}ms`));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    /**
     * Test server health with quick timeout
     */
    async testServerHealth() {
        this.log('Testing server health...', 'TEST');
        
        try {
            const response = await this.makeRequestWithRetry('/api/health', 'GET', null, this.timeouts.health);
            
            if (response.ok) {
                this.log('✅ Server health check passed', 'PASS');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Server health check failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('Server health check failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ Server health check error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`Server health check error: ${error.message}`);
            return false;
        }
    }

    /**
     * Test task creation with optimized timeout
     */
    async testTaskCreation() {
        this.log('Testing task creation...', 'TEST');
        
        const taskData = {
            title: 'E2E Test Task - Family Notice Board',
            description: 'Test task for family notice board development',
            priority: 'medium',
            agent: 'frontend-agent',
            type: 'development',
            metadata: {
                created_by: 'optimized-e2e-test',
                test_run: new Date().toISOString(),
                family_context: true
            }
        };

        try {
            const response = await this.makeRequestWithRetry('/api/tasks', 'POST', taskData, this.timeouts.taskCreate);
            
            if (response.ok || response.status === 201 || response.status === 202) {
                this.log('✅ Task creation succeeded without errors', 'PASS');
                this.log(`   Response: ${response.data.message || 'Task processed'}`, 'INFO');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Task creation failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('Task creation failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ Task creation error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`Task creation error: ${error.message}`);
            return false;
        }
    }

    /**
     * Test task listing with fast timeout
     */
    async testTaskListing() {
        this.log('Testing task listing...', 'TEST');
        
        try {
            const response = await this.makeRequestWithRetry('/api/tasks', 'GET', null, this.timeouts.taskList);
            
            if (response.ok) {
                this.log('✅ Task listing succeeded without errors', 'PASS');
                this.log(`   Found ${response.data.metadata?.total || 0} tasks`, 'INFO');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Task listing failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('Task listing failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ Task listing error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`Task listing error: ${error.message}`);
            return false;
        }
    }

    /**
     * Test system status endpoint
     */
    async testSystemStatus() {
        this.log('Testing system status...', 'TEST');
        
        try {
            const response = await this.makeRequestWithRetry('/api/system/status', 'GET', null, this.timeouts.agentStatus);
            
            if (response.ok) {
                this.log('✅ System status check passed', 'PASS');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ System status check failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('System status check failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ System status error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`System status error: ${error.message}`);
            return false;
        }
    }

    /**
     * Run the complete optimized test suite
     */
    async runOptimizedTest() {
        this.log('🚀 Starting Optimized TaskMaster AI E2E Test', 'START');
        this.log('Using optimized timeouts and retry logic', 'INFO');
        this.log('Pass condition: No errors during task creation process', 'INFO');
        
        const tests = [
            { name: 'Server Health', test: this.testServerHealth.bind(this) },
            { name: 'Task Creation', test: this.testTaskCreation.bind(this) },
            { name: 'Task Listing', test: this.testTaskListing.bind(this) },
            { name: 'System Status', test: this.testSystemStatus.bind(this) }
        ];

        for (const { name, test } of tests) {
            this.log(`Running ${name} test...`, 'TEST');
            await test();
            
            // Short delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.generateReport();
    }

    /**
     * Generate test report
     */
    generateReport() {
        this.log('📊 Optimized Test Report:', 'REPORT');
        this.log(`✅ Passed: ${this.results.passed}`, 'REPORT');
        this.log(`❌ Failed: ${this.results.failed}`, 'REPORT');
        
        if (this.results.errors.length > 0) {
            this.log('🔍 Error Details:', 'REPORT');
            this.results.errors.forEach(error => {
                this.log(`  - ${error}`, 'ERROR');
            });
        }

        const overallResult = this.results.failed === 0 ? 'PASSED' : 'FAILED';
        this.log(`\n🎯 Overall Result: ${overallResult}`, 'RESULT');
        
        if (this.results.failed === 0) {
            this.log('✅ All tests passed - No errors during task creation process', 'SUCCESS');
            this.log('🏠 TaskMaster AI ready for family notice board development', 'SUCCESS');
            return true;
        } else {
            this.log('❌ Some tests failed - Errors detected during task creation process', 'FAILURE');
            this.log('🔧 Check server status and retry', 'FAILURE');
            return false;
        }
    }
}

// Main execution
async function main() {
    try {
        const test = new OptimizedE2ETest();
        const result = await test.runOptimizedTest();
        process.exit(result ? 0 : 1);
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = OptimizedE2ETest;