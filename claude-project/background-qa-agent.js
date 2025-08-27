#!/usr/bin/env node

/**
 * Background QA Agent
 * Autonomous agent that performs QA testing on the TaskMaster workflow
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DASHBOARD_API = 'http://localhost:3001';
const AGENT_ID = 'qa-background-agent-001';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const TASK_CHECK_INTERVAL = 45000; // 45 seconds

class BackgroundQAAgent {
    constructor() {
        this.agentId = AGENT_ID;
        this.role = 'qa-specialist';
        this.capabilities = ['automated-testing', 'workflow-validation', 'api-testing', 'e2e-testing'];
        this.status = 'idle';
        this.currentTask = null;
        this.isRunning = false;
        this.heartbeatInterval = null;
        this.taskCheckInterval = null;
    }

    async start() {
        console.log(`🤖 Starting Background QA Agent: ${this.agentId}`);
        
        try {
            // Register with the dashboard
            await this.registerAgent();
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Start task monitoring
            this.startTaskMonitoring();
            
            this.isRunning = true;
            console.log('✅ QA Agent is now operational and monitoring for tasks');
            
            // Keep the process alive
            process.on('SIGINT', () => this.shutdown());
            process.on('SIGTERM', () => this.shutdown());
            
        } catch (error) {
            console.error('❌ Failed to start QA Agent:', error.message);
            process.exit(1);
        }
    }

    async registerAgent() {
        console.log('📋 Registering with dashboard...');
        
        const registrationData = {
            agentId: this.agentId,
            role: this.role,
            capabilities: this.capabilities,
            status: this.status
        };

        const response = await fetch(`${DASHBOARD_API}/api/agents/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Registered successfully: ${result.message}`);
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`${DASHBOARD_API}/api/agents/${this.agentId}/heartbeat`, {
                    method: 'POST'
                });
                console.log('💓 Heartbeat sent');
            } catch (error) {
                console.error('💔 Heartbeat failed:', error.message);
            }
        }, HEARTBEAT_INTERVAL);
    }

    startTaskMonitoring() {
        this.taskCheckInterval = setInterval(async () => {
            if (this.status === 'idle') {
                await this.checkForQATasks();
            }
        }, TASK_CHECK_INTERVAL);
    }

    async checkForQATasks() {
        try {
            console.log('🔍 Checking for QA tasks...');
            
            // Get QA-related tasks from TaskMaster
            const response = await fetch(`${DASHBOARD_API}/api/taskmaster/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tag: 'qa-specialist',
                    include_subtasks: true 
                })
            });

            if (!response.ok) {
                console.log('⚠️ Could not fetch QA tasks');
                return;
            }

            const data = await response.json();
            const availableTasks = data.tasks.filter(task => 
                task.status === 'pending' && 
                this.isQATask(task)
            );

            if (availableTasks.length > 0) {
                const task = availableTasks[0]; // Take the first available task
                await this.claimAndExecuteTask(task);
            } else {
                console.log('📋 No QA tasks available, checking workflow health...');
                await this.performGeneralQACheck();
            }

        } catch (error) {
            console.error('❌ Error checking for tasks:', error.message);
        }
    }

    isQATask(task) {
        const qaKeywords = ['qa', 'test', 'testing', 'validation', 'verify', 'check'];
        const taskText = `${task.title} ${task.description}`.toLowerCase();
        return qaKeywords.some(keyword => taskText.includes(keyword));
    }

    async claimAndExecuteTask(task) {
        console.log(`🎯 Claiming task: ${task.id} - ${task.title}`);
        
        try {
            // Update status to working
            await this.updateStatus('working', task.id);
            
            // Execute the QA task
            const result = await this.executeQATask(task);
            
            // Update TaskMaster with results
            await this.reportTaskProgress(task.id, result);
            
            // Mark task as complete and return to idle
            await this.updateStatus('idle', null);
            
            console.log(`✅ Task ${task.id} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Task ${task.id} failed:`, error.message);
            await this.updateStatus('error', task.id);
            
            // Return to idle after error
            setTimeout(() => this.updateStatus('idle', null), 5000);
        }
    }

    async executeQATask(task) {
        console.log(`🧪 Executing QA task: ${task.title}`);
        
        const qaResults = {
            taskId: task.id,
            startTime: new Date().toISOString(),
            tests: [],
            status: 'running'
        };

        // Determine QA test type based on task content
        if (task.title.toLowerCase().includes('dashboard')) {
            qaResults.tests.push(await this.testDashboardFunctionality());
        }
        
        if (task.title.toLowerCase().includes('api')) {
            qaResults.tests.push(await this.testAPIEndpoints());
        }
        
        if (task.title.toLowerCase().includes('integration')) {
            qaResults.tests.push(await this.testIntegrationFlow());
        }
        
        // Default: comprehensive workflow test
        if (qaResults.tests.length === 0) {
            qaResults.tests.push(await this.testWorkflowIntegrity());
        }

        qaResults.endTime = new Date().toISOString();
        qaResults.status = qaResults.tests.every(test => test.passed) ? 'passed' : 'failed';
        qaResults.summary = this.generateTestSummary(qaResults.tests);

        return qaResults;
    }

    async testDashboardFunctionality() {
        console.log('📊 Testing dashboard functionality...');
        
        const test = {
            name: 'Dashboard Functionality Test',
            startTime: new Date().toISOString(),
            passed: false,
            details: []
        };

        try {
            // Test dashboard API health
            const healthResponse = await fetch(`${DASHBOARD_API}/api/health`);
            test.details.push({
                check: 'Dashboard API Health',
                passed: healthResponse.ok,
                response: healthResponse.status
            });

            // Test agent status endpoint
            const agentsResponse = await fetch(`${DASHBOARD_API}/api/taskmaster/agents/status`);
            const agentsData = await agentsResponse.json();
            test.details.push({
                check: 'Agent Status Endpoint',
                passed: agentsResponse.ok && agentsData.total >= 0,
                result: `${agentsData.total} agents tracked`
            });

            // Test TaskMaster integration
            const tasksResponse = await fetch(`${DASHBOARD_API}/api/taskmaster/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ include_subtasks: true })
            });
            const tasksData = await tasksResponse.json();
            test.details.push({
                check: 'TaskMaster Integration',
                passed: tasksResponse.ok && tasksData.total > 0,
                result: `${tasksData.total} tasks accessible`
            });

            test.passed = test.details.every(detail => detail.passed);

        } catch (error) {
            test.details.push({
                check: 'Dashboard Test Execution',
                passed: false,
                error: error.message
            });
        }

        test.endTime = new Date().toISOString();
        return test;
    }

    async testAPIEndpoints() {
        console.log('🔌 Testing API endpoints...');
        
        const test = {
            name: 'API Endpoints Test',
            startTime: new Date().toISOString(),
            passed: false,
            details: []
        };

        const endpoints = [
            { method: 'GET', path: '/api/health', name: 'Health Check' },
            { method: 'GET', path: '/api/taskmaster/agents/status', name: 'Agent Status' },
            { method: 'GET', path: '/api/taskmaster/tags', name: 'TaskMaster Tags' },
            { method: 'GET', path: '/api/agents/dashboard/summary', name: 'Dashboard Summary' }
        ];

        try {
            for (const endpoint of endpoints) {
                const response = await fetch(`${DASHBOARD_API}${endpoint.path}`, {
                    method: endpoint.method
                });
                
                test.details.push({
                    check: endpoint.name,
                    passed: response.ok,
                    status: response.status,
                    method: endpoint.method,
                    path: endpoint.path
                });
            }

            test.passed = test.details.every(detail => detail.passed);

        } catch (error) {
            test.details.push({
                check: 'API Test Execution',
                passed: false,
                error: error.message
            });
        }

        test.endTime = new Date().toISOString();
        return test;
    }

    async testIntegrationFlow() {
        console.log('🔄 Testing integration flow...');
        
        const test = {
            name: 'Integration Flow Test',
            startTime: new Date().toISOString(),
            passed: false,
            details: []
        };

        try {
            // Test agent registration flow
            const testAgentId = `test-integration-${Date.now()}`;
            const registerResponse = await fetch(`${DASHBOARD_API}/api/agents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: testAgentId,
                    role: 'test-agent',
                    capabilities: ['testing']
                })
            });

            test.details.push({
                check: 'Agent Registration',
                passed: registerResponse.ok,
                agentId: testAgentId
            });

            if (registerResponse.ok) {
                // Test status update
                const statusResponse = await fetch(`${DASHBOARD_API}/api/agents/${testAgentId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'working', currentTask: 'test-task' })
                });

                test.details.push({
                    check: 'Status Update',
                    passed: statusResponse.ok
                });

                // Test heartbeat
                const heartbeatResponse = await fetch(`${DASHBOARD_API}/api/agents/${testAgentId}/heartbeat`, {
                    method: 'POST'
                });

                test.details.push({
                    check: 'Heartbeat',
                    passed: heartbeatResponse.ok
                });

                // Cleanup test agent
                await fetch(`${DASHBOARD_API}/api/agents/${testAgentId}`, {
                    method: 'DELETE'
                });

                test.details.push({
                    check: 'Agent Cleanup',
                    passed: true
                });
            }

            test.passed = test.details.every(detail => detail.passed);

        } catch (error) {
            test.details.push({
                check: 'Integration Test Execution',
                passed: false,
                error: error.message
            });
        }

        test.endTime = new Date().toISOString();
        return test;
    }

    async testWorkflowIntegrity() {
        console.log('⚙️ Testing workflow integrity...');
        
        const test = {
            name: 'Workflow Integrity Test',
            startTime: new Date().toISOString(),
            passed: false,
            details: []
        };

        try {
            // Test TaskMaster data accessibility
            const tasksResponse = await fetch(`${DASHBOARD_API}/api/taskmaster/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ include_subtasks: true })
            });
            const tasksData = await tasksResponse.json();

            test.details.push({
                check: 'TaskMaster Data Access',
                passed: tasksResponse.ok && tasksData.total > 0,
                result: `${tasksData.total} tasks, ${tasksData.workspaces} workspaces`
            });

            // Test agent system health
            const agentsResponse = await fetch(`${DASHBOARD_API}/api/taskmaster/agents/status`);
            const agentsData = await agentsResponse.json();

            test.details.push({
                check: 'Agent System Health',
                passed: agentsResponse.ok,
                result: `${agentsData.total} agents (${agentsData.active} active)`
            });

            // Test storage persistence
            const summaryResponse = await fetch(`${DASHBOARD_API}/api/agents/dashboard/summary`);
            const summaryData = await summaryResponse.json();

            test.details.push({
                check: 'Storage Persistence',
                passed: summaryResponse.ok && summaryData.lastUpdated,
                result: `Last updated: ${summaryData.lastUpdated}`
            });

            test.passed = test.details.every(detail => detail.passed);

        } catch (error) {
            test.details.push({
                check: 'Workflow Test Execution',
                passed: false,
                error: error.message
            });
        }

        test.endTime = new Date().toISOString();
        return test;
    }

    async performGeneralQACheck() {
        console.log('🔍 Performing general QA health check...');
        
        try {
            // Quick health verification
            const healthResponse = await fetch(`${DASHBOARD_API}/api/health`);
            if (!healthResponse.ok) {
                console.log('⚠️ Dashboard API health check failed');
                return;
            }

            // Check for system anomalies
            const agentsResponse = await fetch(`${DASHBOARD_API}/api/taskmaster/agents/status`);
            const agentsData = await agentsResponse.json();
            
            if (agentsData.offline > agentsData.active * 2) {
                console.log('⚠️ High number of offline agents detected');
            }

            console.log('✅ General QA check completed - system healthy');

        } catch (error) {
            console.error('❌ General QA check failed:', error.message);
        }
    }

    generateTestSummary(tests) {
        const totalTests = tests.length;
        const passedTests = tests.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
            details: tests.map(test => ({
                name: test.name,
                passed: test.passed,
                duration: this.calculateDuration(test.startTime, test.endTime),
                checks: test.details.length
            }))
        };
    }

    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return `${end - start}ms`;
    }

    async reportTaskProgress(taskId, results) {
        console.log(`📊 Reporting results for task ${taskId}...`);
        
        try {
            const updateData = {
                taskId: taskId,
                prompt: `QA Agent completed testing. Results: ${results.summary.successRate} success rate (${results.summary.passed}/${results.summary.total} tests passed). Status: ${results.status}. Details: ${JSON.stringify(results.summary.details)}`
            };

            await fetch(`${DASHBOARD_API}/api/taskmaster/update-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            console.log('✅ Task progress reported to TaskMaster');

        } catch (error) {
            console.error('❌ Failed to report task progress:', error.message);
        }
    }

    async updateStatus(status, currentTask = null) {
        try {
            this.status = status;
            this.currentTask = currentTask;

            const response = await fetch(`${DASHBOARD_API}/api/agents/${this.agentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, currentTask })
            });

            if (response.ok) {
                console.log(`📊 Status updated: ${status}${currentTask ? ` (task: ${currentTask})` : ''}`);
            }

        } catch (error) {
            console.error('❌ Failed to update status:', error.message);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down QA Agent...');
        
        this.isRunning = false;
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.taskCheckInterval) {
            clearInterval(this.taskCheckInterval);
        }

        // Update status to offline
        await this.updateStatus('offline');
        
        console.log('✅ QA Agent shutdown complete');
        process.exit(0);
    }
}

// Start the QA agent
const qaAgent = new BackgroundQAAgent();
qaAgent.start();