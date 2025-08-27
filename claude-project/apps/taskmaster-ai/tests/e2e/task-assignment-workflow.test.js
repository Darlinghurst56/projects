#!/usr/bin/env node

/**
 * Comprehensive E2E Test for Task Assignment Workflow
 * Tests the complete flow from task creation to completion via agent assignment
 */

const http = require('http');
const { execSync } = require('child_process');

class TaskAssignmentE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.testResults = [];
        this.testTask = null;
        this.testAgent = 'qa-specialist';
    }

    // Helper to make HTTP requests
    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url, this.baseUrl);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const response = {
                            status: res.statusCode,
                            data: body ? JSON.parse(body) : null
                        };
                        resolve(response);
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // Test 1: Verify API is healthy
    async testAPIHealth() {
        console.log('\n🔍 Test 1: Checking API Health...');
        try {
            const response = await this.makeRequest('/api/health');
            
            if (response.status === 200 && response.data.status === 'healthy') {
                this.recordSuccess('API Health Check', 'API is healthy and responding');
                return true;
            } else {
                this.recordFailure('API Health Check', 'API is not healthy', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('API Health Check', error.message);
            return false;
        }
    }

    // Test 2: Get available tasks
    async testGetTasks() {
        console.log('\n🔍 Test 2: Getting Available Tasks...');
        try {
            const response = await this.makeRequest('/api/v2/tasks');
            
            if (response.status === 200 && response.data.success) {
                const pendingTasks = response.data.tasks.filter(t => 
                    t.status === 'pending' || t.status === 'in-progress'
                );
                
                if (pendingTasks.length > 0) {
                    this.testTask = pendingTasks[0];
                    this.recordSuccess('Get Tasks', `Found ${pendingTasks.length} available tasks`);
                    console.log(`  ✓ Selected task: ${this.testTask.title} (ID: ${this.testTask.id})`);
                    return true;
                } else {
                    this.recordFailure('Get Tasks', 'No pending tasks available');
                    return false;
                }
            } else {
                this.recordFailure('Get Tasks', 'Failed to retrieve tasks', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('Get Tasks', error.message);
            return false;
        }
    }

    // Test 3: Get available agents
    async testGetAgents() {
        console.log('\n🔍 Test 3: Getting Available Agents...');
        try {
            const response = await this.makeRequest('/api/v2/agents');
            
            if (response.status === 200 && response.data.success) {
                const agent = response.data.agents.find(a => a.id === this.testAgent);
                
                if (agent) {
                    this.recordSuccess('Get Agents', `Found ${this.testAgent} agent`);
                    console.log(`  ✓ Agent status: ${agent.status}`);
                    console.log(`  ✓ Assigned tasks: ${agent.assignedTasks.length}`);
                    return true;
                } else {
                    this.recordFailure('Get Agents', `Agent ${this.testAgent} not found`);
                    return false;
                }
            } else {
                this.recordFailure('Get Agents', 'Failed to retrieve agents', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('Get Agents', error.message);
            return false;
        }
    }

    // Test 4: Assign task to agent
    async testAssignTask() {
        console.log('\n🔍 Test 4: Assigning Task to Agent...');
        if (!this.testTask) {
            this.recordFailure('Assign Task', 'No test task available');
            return false;
        }

        try {
            const assignData = {
                agentId: this.testAgent,
                reasoning: 'E2E test assignment - testing workflow',
                priority: this.testTask.priority || 'medium'
            };

            const response = await this.makeRequest(
                `/api/v2/tasks/${this.testTask.id}/assign`,
                'POST',
                assignData
            );
            
            if (response.status === 200 && response.data.success) {
                this.recordSuccess('Assign Task', `Task ${this.testTask.id} assigned to ${this.testAgent}`);
                return true;
            } else {
                this.recordFailure('Assign Task', 'Failed to assign task', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('Assign Task', error.message);
            return false;
        }
    }

    // Test 5: Verify task status update
    async testVerifyTaskStatus() {
        console.log('\n🔍 Test 5: Verifying Task Status Update...');
        if (!this.testTask) {
            this.recordFailure('Verify Task Status', 'No test task available');
            return false;
        }

        try {
            // Wait a moment for status to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await this.makeRequest('/api/v2/tasks');
            
            if (response.status === 200 && response.data.success) {
                const updatedTask = response.data.tasks.find(t => t.id === this.testTask.id);
                
                if (updatedTask && updatedTask.status === 'in-progress') {
                    this.recordSuccess('Verify Task Status', 'Task status updated to in-progress');
                    console.log(`  ✓ Task agent metadata: ${JSON.stringify(updatedTask.agentMetadata)}`);
                    return true;
                } else {
                    this.recordFailure('Verify Task Status', 
                        `Task status not updated. Current status: ${updatedTask?.status || 'unknown'}`);
                    return false;
                }
            } else {
                this.recordFailure('Verify Task Status', 'Failed to retrieve updated tasks', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('Verify Task Status', error.message);
            return false;
        }
    }

    // Test 6: Verify agent has the task
    async testVerifyAgentAssignment() {
        console.log('\n🔍 Test 6: Verifying Agent Assignment...');
        
        try {
            const response = await this.makeRequest('/api/v2/agents');
            
            if (response.status === 200 && response.data.success) {
                const agent = response.data.agents.find(a => a.id === this.testAgent);
                
                if (agent && agent.assignedTasks.includes(this.testTask.id.toString())) {
                    this.recordSuccess('Verify Agent Assignment', 
                        `Agent ${this.testAgent} has task ${this.testTask.id} in assigned tasks`);
                    return true;
                } else {
                    this.recordFailure('Verify Agent Assignment', 
                        `Task not found in agent's assigned tasks. Current tasks: ${agent?.assignedTasks || []}`);
                    return false;
                }
            } else {
                this.recordFailure('Verify Agent Assignment', 'Failed to retrieve agents', response);
                return false;
            }
        } catch (error) {
            this.recordFailure('Verify Agent Assignment', error.message);
            return false;
        }
    }

    // Test 7: Simulate task completion
    async testTaskCompletion() {
        console.log('\n🔍 Test 7: Simulating Task Completion...');
        if (!this.testTask) {
            this.recordFailure('Task Completion', 'No test task available');
            return false;
        }

        try {
            const updateData = {
                status: 'done',
                agentId: this.testAgent,
                completionNotes: 'E2E test completion - workflow validated'
            };

            const response = await this.makeRequest(
                `/api/v2/tasks/${this.testTask.id}/status`,
                'POST',
                updateData
            );
            
            if (response.status === 200 && response.data.success) {
                this.recordSuccess('Task Completion', `Task ${this.testTask.id} marked as done`);
                return true;
            } else {
                // Fallback: Try using the working copy update
                console.log('  ⚠️  Primary status update failed, trying working copy...');
                const workingCopyResponse = await this.makeRequest(
                    `/api/v2/working-copy/tasks/${this.testTask.id}`,
                    'PUT',
                    { status: 'done' }
                );
                
                if (workingCopyResponse.status === 200) {
                    this.recordSuccess('Task Completion', 'Task marked as done via working copy');
                    return true;
                } else {
                    this.recordFailure('Task Completion', 'Failed to update task status', response);
                    return false;
                }
            }
        } catch (error) {
            this.recordFailure('Task Completion', error.message);
            return false;
        }
    }

    // Test 8: Verify final state
    async testVerifyFinalState() {
        console.log('\n🔍 Test 8: Verifying Final State...');
        
        try {
            // Check task status
            const tasksResponse = await this.makeRequest('/api/v2/tasks');
            const finalTask = tasksResponse.data.tasks.find(t => t.id === this.testTask.id);
            
            // Check agent status
            const agentsResponse = await this.makeRequest('/api/v2/agents');
            const finalAgent = agentsResponse.data.agents.find(a => a.id === this.testAgent);
            
            const taskComplete = finalTask && finalTask.status === 'done';
            const agentUpdated = finalAgent && !finalAgent.assignedTasks.includes(this.testTask.id.toString());
            
            if (taskComplete) {
                this.recordSuccess('Verify Final State', 'Task marked as complete');
                
                if (agentUpdated) {
                    this.recordSuccess('Verify Final State', 'Agent task list updated');
                } else {
                    this.recordWarning('Verify Final State', 
                        'Task complete but agent still shows task as assigned');
                }
                return true;
            } else {
                this.recordFailure('Verify Final State', 
                    `Task not complete. Status: ${finalTask?.status || 'unknown'}`);
                return false;
            }
        } catch (error) {
            this.recordFailure('Verify Final State', error.message);
            return false;
        }
    }

    // Helper methods
    recordSuccess(test, message) {
        console.log(`  ✅ ${test}: ${message}`);
        this.testResults.push({ test, status: 'PASS', message });
    }

    recordFailure(test, message, details = null) {
        console.log(`  ❌ ${test}: ${message}`);
        if (details) {
            console.log(`     Details: ${JSON.stringify(details, null, 2)}`);
        }
        this.testResults.push({ test, status: 'FAIL', message, details });
    }

    recordWarning(test, message) {
        console.log(`  ⚠️  ${test}: ${message}`);
        this.testResults.push({ test, status: 'WARN', message });
    }

    // Run all tests
    async runTests() {
        console.log('🚀 Starting Task Assignment Workflow E2E Tests');
        console.log('=' .repeat(60));

        const tests = [
            () => this.testAPIHealth(),
            () => this.testGetTasks(),
            () => this.testGetAgents(),
            () => this.testAssignTask(),
            () => this.testVerifyTaskStatus(),
            () => this.testVerifyAgentAssignment(),
            () => this.testTaskCompletion(),
            () => this.testVerifyFinalState()
        ];

        for (const test of tests) {
            const result = await test();
            if (!result) {
                console.log('\n⚠️  Stopping tests due to failure');
                break;
            }
        }

        // Print summary
        console.log('\n' + '=' .repeat(60));
        console.log('📊 Test Summary:');
        console.log('=' .repeat(60));

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Task assignment workflow is working correctly.');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed. Please review the workflow implementation.');
            process.exit(1);
        }
    }
}

// Check if server is running
const test = new TaskAssignmentE2ETest();

console.log('Checking if TaskMaster API server is running...');
http.get('http://localhost:3010/api/health', (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Server is running. Starting tests...\n');
        test.runTests();
    } else {
        console.log('❌ Server returned unexpected status:', res.statusCode);
        process.exit(1);
    }
}).on('error', (err) => {
    console.log('❌ Server is not running at http://localhost:3010');
    console.log('Please start the server with: npm start');
    process.exit(1);
});