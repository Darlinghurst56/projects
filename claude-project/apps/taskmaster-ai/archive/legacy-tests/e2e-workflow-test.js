#!/usr/bin/env node

/**
 * Complete End-to-End Workflow Test
 * Tests the full TaskMaster AI workflow with browser automation
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v2`;

class E2EWorkflowTest {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 Initializing E2E Workflow Test...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for demonstration
            defaultViewport: { width: 1200, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1200, height: 800 });
    }

    async testAPIEndpoints() {
        console.log('\n📊 Testing API v2 Endpoints...');
        
        try {
            // Test tasks endpoint
            const tasksResponse = await axios.get(`${API_BASE}/tasks`);
            console.log(`✅ Tasks API: ${tasksResponse.data.count} tasks available`);
            
            // Test agents endpoint  
            const agentsResponse = await axios.get(`${API_BASE}/agents`);
            console.log(`✅ Agents API: ${agentsResponse.data.count} agents active`);
            
            return {
                tasks: tasksResponse.data,
                agents: agentsResponse.data
            };
        } catch (error) {
            console.error('❌ API Test failed:', error.message);
            throw error;
        }
    }

    async testWebInterface() {
        console.log('\n🌐 Testing Web Interface...');
        
        try {
            // Navigate to agent management page
            await this.page.goto(`${BASE_URL}/agent-management`, { 
                waitUntil: 'networkidle0',
                timeout: 10000 
            });
            
            console.log('✅ Agent Management page loaded');
            
            // Take screenshot of initial state
            await this.page.screenshot({ 
                path: '/mnt/d/Projects/y/claude-project/apps/taskmaster-ai/screenshots/agent-management-initial.png',
                fullPage: true 
            });
            
            // Check for agent cards
            const agentCards = await this.page.$$('.agent-card, [data-testid="agent-card"]');
            console.log(`✅ Found ${agentCards.length} agent cards on page`);
            
            // Check for task assignment interface
            const taskInterface = await this.page.$('.task-assignment, [data-testid="task-assignment"]');
            if (taskInterface) {
                console.log('✅ Task assignment interface detected');
            }
            
            // Monitor real-time updates by waiting for status changes
            console.log('🔄 Monitoring real-time updates...');
            await this.page.waitForFunction(
                () => {
                    const statusElements = document.querySelectorAll('.agent-status, [data-testid="agent-status"]');
                    return statusElements.length > 0;
                },
                { timeout: 5000 }
            ).catch(() => console.log('⚠️  Real-time status elements not found (may be using different selectors)'));
            
            // Take final screenshot
            await this.page.screenshot({ 
                path: '/mnt/d/Projects/y/claude-project/apps/taskmaster-ai/screenshots/agent-management-final.png',
                fullPage: true 
            });
            
            return true;
        } catch (error) {
            console.error('❌ Web Interface test failed:', error.message);
            
            // Take error screenshot
            await this.page.screenshot({ 
                path: '/mnt/d/Projects/y/claude-project/apps/taskmaster-ai/screenshots/error-state.png',
                fullPage: true 
            });
            
            throw error;
        }
    }

    async testTaskAssignment() {
        console.log('\n🎯 Testing Task Assignment Workflow...');
        
        try {
            // Get available tasks
            const tasksResponse = await axios.get(`${API_BASE}/tasks`);
            const availableTasks = tasksResponse.data.tasks.filter(task => task.status === 'pending');
            
            if (availableTasks.length === 0) {
                console.log('⚠️  No pending tasks available for assignment test');
                return false;
            }
            
            const testTask = availableTasks[0];
            console.log(`📋 Testing with task: ${testTask.id} - "${testTask.title}"`);
            
            // Assign task to backend agent
            const assignResponse = await axios.post(`${API_BASE}/tasks/${testTask.id}/assign`, {
                agentId: 'backend-agent'
            });
            
            console.log(`✅ Task ${testTask.id} assigned to backend-agent`);
            
            // Check agent status
            const agentStatusResponse = await axios.get(`${API_BASE}/agents/backend-agent/status`);
            console.log(`🤖 Backend agent status: ${agentStatusResponse.data.agent.status}`);
            console.log(`📊 Assigned tasks: ${agentStatusResponse.data.agent.assignedTasks.length}`);
            
            return true;
        } catch (error) {
            console.error('❌ Task Assignment test failed:', error.message);
            return false;
        }
    }

    async runCompleteWorkflow() {
        console.log('\n🔥 Running Complete E2E Workflow...');
        
        const results = {
            apiTest: false,
            webInterfaceTest: false,
            taskAssignmentTest: false,
            screenshots: []
        };
        
        try {
            // Initialize browser
            await this.initialize();
            
            // Test API endpoints
            const apiData = await this.testAPIEndpoints();
            results.apiTest = true;
            
            // Test web interface
            await this.testWebInterface();
            results.webInterfaceTest = true;
            results.screenshots.push('agent-management-initial.png', 'agent-management-final.png');
            
            // Test task assignment
            await this.testTaskAssignment();
            results.taskAssignmentTest = true;
            
            console.log('\n🎉 E2E Workflow Test Complete!');
            console.log('Results:', results);
            
            return results;
            
        } catch (error) {
            console.error('\n💥 E2E Workflow Test Failed:', error.message);
            results.error = error.message;
            return results;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
    
    async generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            testResults: results,
            summary: {
                totalTests: 3,
                passedTests: Object.values(results).filter(r => r === true).length,
                failedTests: Object.values(results).filter(r => r === false).length
            }
        };
        
        console.log('\n📄 Test Report Generated:');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }
}

// Run the test if executed directly
if (require.main === module) {
    const tester = new E2EWorkflowTest();
    
    tester.runCompleteWorkflow()
        .then(results => tester.generateReport(results))
        .then(report => {
            process.exit(report.summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = E2EWorkflowTest;