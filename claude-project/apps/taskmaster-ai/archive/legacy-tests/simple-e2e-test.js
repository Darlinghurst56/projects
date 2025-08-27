#!/usr/bin/env node

/**
 * Simple TaskMaster AI End-to-End Test
 * Tests task creation workflow without complex dependencies
 */

const http = require('http');
const https = require('https');
const url = require('url');

class SimpleE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    log(message, prefix = 'INFO') {
        console.log(`[${new Date().toISOString()}] [${prefix}] ${message}`);
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const fullUrl = `${this.baseUrl}${endpoint}`;
            const parsedUrl = url.parse(fullUrl);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 80,
                path: parsedUrl.path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TaskMaster-E2E-Test'
                },
                timeout: 10000
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
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async testServerHealth() {
        this.log('Testing server health...', 'TEST');
        
        try {
            const response = await this.makeRequest('/api/health');
            
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

    async testTaskCreationAPI() {
        this.log('Testing task creation API...', 'TEST');
        
        const taskData = {
            title: 'E2E Test Task',
            description: 'Test task created by end-to-end test',
            priority: 'medium',
            agent: 'frontend-agent'
        };

        try {
            const response = await this.makeRequest('/api/tasks', 'POST', taskData);
            
            if (response.ok || response.status === 201) {
                this.log('✅ Task creation API responded without errors', 'PASS');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Task creation API failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('Task creation API failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ Task creation API error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`Task creation API error: ${error.message}`);
            return false;
        }
    }

    async testTaskListAPI() {
        this.log('Testing task list API...', 'TEST');
        
        try {
            const response = await this.makeRequest('/api/tasks');
            
            if (response.ok) {
                this.log('✅ Task list API responded without errors', 'PASS');
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Task list API failed: ${response.status}`, 'FAIL');
                this.results.failed++;
                this.results.errors.push('Task list API failed');
                return false;
            }
        } catch (error) {
            this.log(`❌ Task list API error: ${error.message}`, 'FAIL');
            this.results.failed++;
            this.results.errors.push(`Task list API error: ${error.message}`);
            return false;
        }
    }

    async runTest() {
        this.log('🚀 Starting TaskMaster AI End-to-End Test', 'START');
        this.log('Pass condition: No errors during task creation process', 'INFO');
        
        const tests = [
            this.testServerHealth.bind(this),
            this.testTaskCreationAPI.bind(this),
            this.testTaskListAPI.bind(this)
        ];

        for (const test of tests) {
            await test();
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.generateReport();
    }

    generateReport() {
        this.log('📊 Test Report:', 'REPORT');
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
            process.exit(0);
        } else {
            this.log('❌ Some tests failed - Errors detected during task creation process', 'FAILURE');
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    try {
        const test = new SimpleE2ETest();
        await test.runTest();
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = SimpleE2ETest;