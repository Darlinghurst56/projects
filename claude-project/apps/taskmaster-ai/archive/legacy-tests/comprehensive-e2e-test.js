#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test for TaskMaster AI System
 * Tests the complete workflow from task assignment to completion
 * Uses both API testing and browser automation
 */

const { chromium } = require('playwright');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3001';
const WEB_URL = `${BASE_URL}/agent-management`;
const API_BASE = `${BASE_URL}/api/v2`;

// Test results tracking
const testResults = {
    startTime: new Date().toISOString(),
    endTime: null,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    steps: [],
    issues: [],
    recommendations: []
};

// Utility functions
function logStep(step, status, details = '', data = null) {
    const timestamp = new Date().toISOString();
    const stepResult = {
        step,
        status,
        details,
        timestamp,
        data: data ? JSON.stringify(data, null, 2) : null
    };
    
    testResults.steps.push(stepResult);
    testResults.totalTests++;
    
    if (status === 'PASS') {
        testResults.passedTests++;
        console.log(`✅ [${timestamp}] ${step}: ${details}`);
    } else {
        testResults.failedTests++;
        console.log(`❌ [${timestamp}] ${step}: ${details}`);
        if (data) console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
}

function logIssue(issue, severity = 'MEDIUM') {
    testResults.issues.push({ issue, severity, timestamp: new Date().toISOString() });
    console.log(`⚠️  ISSUE [${severity}]: ${issue}`);
}

function logRecommendation(recommendation) {
    testResults.recommendations.push({ recommendation, timestamp: new Date().toISOString() });
    console.log(`💡 RECOMMENDATION: ${recommendation}`);
}

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { success: true, status: response.status, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function runComprehensiveE2ETest() {
    console.log('🚀 Starting Comprehensive E2E Test for TaskMaster AI');
    console.log('=' .repeat(60));
    
    let browser = null;
    let page = null;
    
    try {
        // Step 1: Check system health
        console.log('\n📊 Step 1: System Health Check');
        const healthCheck = await makeRequest(`${BASE_URL}/api/health`);
        if (healthCheck.success) {
            logStep('Health Check', 'PASS', 'System is healthy', healthCheck.data);
        } else {
            logStep('Health Check', 'FAIL', 'System health check failed', healthCheck.error);
            return;
        }

        // Step 2: Get available tasks via API v2
        console.log('\n📋 Step 2: Get Available Tasks (API v2)');
        const tasksResponse = await makeRequest(`${API_BASE}/tasks`);
        if (tasksResponse.success && tasksResponse.data.tasks) {
            logStep('Get Tasks', 'PASS', `Found ${tasksResponse.data.tasks.length} tasks`, {
                totalTasks: tasksResponse.data.tasks.length,
                taskIds: tasksResponse.data.tasks.map(t => t.id).slice(0, 5) // First 5 IDs
            });
            
            if (tasksResponse.data.tasks.length === 0) {
                logIssue('No tasks available for testing', 'HIGH');
                logRecommendation('Create some test tasks before running E2E tests');
                return;
            }
        } else {
            logStep('Get Tasks', 'FAIL', 'Failed to retrieve tasks', tasksResponse.error || tasksResponse.data);
            return;
        }

        const availableTasks = tasksResponse.data.tasks;
        const testTask = availableTasks.find(t => t.status !== 'completed') || availableTasks[0];

        // Step 3: Get available agents
        console.log('\n🤖 Step 3: Get Available Agents');
        const agentsResponse = await makeRequest(`${API_BASE}/agents`);
        if (agentsResponse.success && agentsResponse.data.agents) {
            logStep('Get Agents', 'PASS', `Found ${agentsResponse.data.agents.length} agents`, {
                totalAgents: agentsResponse.data.agents.length,
                agentTypes: agentsResponse.data.agents.map(a => a.type || a.role)
            });
            
            if (agentsResponse.data.agents.length === 0) {
                logIssue('No agents available for testing', 'HIGH');
                logRecommendation('Ensure agents are properly configured and running');
                return;
            }
        } else {
            logStep('Get Agents', 'FAIL', 'Failed to retrieve agents', agentsResponse.error || agentsResponse.data);
            return;
        }

        const availableAgents = agentsResponse.data.agents;
        const qaAgent = availableAgents.find(a => (a.type || a.role || '').toLowerCase().includes('qa'));
        const primaryAgent = availableAgents.find(a => a.id !== qaAgent?.id) || availableAgents[0];

        // Step 4: Use orchestrator to analyze task for assignment
        console.log('\n🧠 Step 4: Orchestrator Task Analysis');
        const analysisPayload = {
            taskId: testTask.id,
            requireCapabilities: ['development', 'testing'],
            priority: 'medium'
        };
        
        const analysisResponse = await makeRequest(`${API_BASE}/orchestrator/analyze`, {
            method: 'POST',
            body: JSON.stringify(analysisPayload)
        });

        if (analysisResponse.success) {
            logStep('Orchestrator Analysis', 'PASS', 'Task analysis completed', analysisResponse.data);
        } else {
            logStep('Orchestrator Analysis', 'FAIL', 'Task analysis failed', analysisResponse.error || analysisResponse.data);
            // Continue with test even if analysis fails
        }

        // Step 5: Assign task to primary agent
        console.log('\n📝 Step 5: Task Assignment');
        const assignmentPayload = {
            agentId: primaryAgent.id,
            priority: 'medium',
            assignedBy: 'e2e-test',
            notes: 'E2E test assignment'
        };

        const assignResponse = await makeRequest(`${API_BASE}/tasks/${testTask.id}/assign`, {
            method: 'POST',
            body: JSON.stringify(assignmentPayload)
        });

        if (assignResponse.success) {
            logStep('Task Assignment', 'PASS', `Task ${testTask.id} assigned to ${primaryAgent.id}`, assignResponse.data);
        } else {
            logStep('Task Assignment', 'FAIL', 'Task assignment failed', assignResponse.error || assignResponse.data);
            logIssue('Task assignment endpoint may need debugging', 'HIGH');
        }

        // Step 6: Monitor agent work progress
        console.log('\n👁️ Step 6: Monitor Agent Progress');
        let progressChecks = 0;
        const maxProgressChecks = 5;
        
        while (progressChecks < maxProgressChecks) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            const statusResponse = await makeRequest(`${API_BASE}/agents/${primaryAgent.id}/status`);
            
            if (statusResponse.success) {
                logStep('Agent Status Check', 'PASS', `Progress check ${progressChecks + 1}`, statusResponse.data);
                
                // Check if agent is actually working
                if (statusResponse.data.currentTask === testTask.id) {
                    logStep('Agent Working', 'PASS', 'Agent is working on assigned task');
                    break;
                } else if (statusResponse.data.status === 'idle') {
                    logIssue('Agent appears idle despite task assignment', 'MEDIUM');
                }
            } else {
                logStep('Agent Status Check', 'FAIL', `Progress check ${progressChecks + 1} failed`, statusResponse.error);
            }
            
            progressChecks++;
        }

        // Step 7: QA Agent Review (if QA agent is available)
        console.log('\n🔍 Step 7: QA Agent Review');
        if (qaAgent) {
            const qaReviewPayload = {
                taskId: testTask.id,
                reviewType: 'quality_check',
                requestedBy: 'e2e-test'
            };

            const qaReviewResponse = await makeRequest(`${API_BASE}/agents/${qaAgent.id}/review`, {
                method: 'POST',
                body: JSON.stringify(qaReviewPayload)
            });

            if (qaReviewResponse.success) {
                logStep('QA Review', 'PASS', 'QA agent review initiated', qaReviewResponse.data);
            } else {
                logStep('QA Review', 'FAIL', 'QA review failed', qaReviewResponse.error || qaReviewResponse.data);
                logIssue('QA review endpoint may need implementation', 'MEDIUM');
            }
        } else {
            logStep('QA Review', 'SKIP', 'No QA agent available for review');
            logRecommendation('Ensure QA agent is properly configured for comprehensive testing');
        }

        // Step 8: Browser automation test of web interface
        console.log('\n🌐 Step 8: Browser Automation Test');
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();

        // Set up error and response logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logIssue(`Browser console error: ${msg.text()}`, 'MEDIUM');
            }
        });

        page.on('pageerror', error => {
            logIssue(`Page error: ${error.message}`, 'HIGH');
        });

        // Navigate to web interface
        try {
            await page.goto(WEB_URL, { waitUntil: 'networkidle' });
            logStep('Page Load', 'PASS', 'Web interface loaded successfully');

            // Take screenshot
            const screenshotPath = path.join(__dirname, 'screenshots', `e2e-test-${Date.now()}.png`);
            await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
            await page.screenshot({ path: screenshotPath });
            logStep('Screenshot', 'PASS', `Screenshot saved: ${screenshotPath}`);

            // Test interface elements
            const titleExists = await page.locator('h1, h2, .title, #title').count() > 0;
            if (titleExists) {
                logStep('UI Elements', 'PASS', 'Main title/header found');
            } else {
                logStep('UI Elements', 'FAIL', 'No main title/header found');
                logIssue('Web interface may be missing basic UI structure', 'MEDIUM');
            }

            // Test agent status display
            const agentElements = await page.locator('[data-agent], .agent, .agent-card').count();
            if (agentElements > 0) {
                logStep('Agent Display', 'PASS', `Found ${agentElements} agent elements`);
            } else {
                logStep('Agent Display', 'FAIL', 'No agent elements found in UI');
                logRecommendation('Ensure agents are displayed properly in the web interface');
            }

            // Test task display
            const taskElements = await page.locator('[data-task], .task, .task-card').count();
            if (taskElements > 0) {
                logStep('Task Display', 'PASS', `Found ${taskElements} task elements`);
            } else {
                logStep('Task Display', 'FAIL', 'No task elements found in UI');
                logRecommendation('Ensure tasks are displayed properly in the web interface');
            }

        } catch (error) {
            logStep('Browser Test', 'FAIL', `Browser automation failed: ${error.message}`);
            logIssue('Web interface may not be accessible or properly configured', 'HIGH');
        }

        // Step 9: Task completion test
        console.log('\n✅ Step 9: Task Completion Test');
        const completionPayload = {
            status: 'completed',
            completedBy: 'e2e-test',
            notes: 'E2E test completion',
            qaApproved: qaAgent ? true : false
        };

        const completionResponse = await makeRequest(`${API_BASE}/tasks/${testTask.id}/status`, {
            method: 'PUT',
            body: JSON.stringify(completionPayload)
        });

        if (completionResponse.success) {
            logStep('Task Completion', 'PASS', 'Task marked as completed', completionResponse.data);
        } else {
            logStep('Task Completion', 'FAIL', 'Task completion failed', completionResponse.error || completionResponse.data);
            logIssue('Task completion endpoint may need debugging', 'MEDIUM');
        }

        // Step 10: Final system status check
        console.log('\n🏁 Step 10: Final System Status');
        const finalHealthCheck = await makeRequest(`${BASE_URL}/api/health`);
        if (finalHealthCheck.success) {
            logStep('Final Health Check', 'PASS', 'System healthy after E2E test', finalHealthCheck.data);
        } else {
            logStep('Final Health Check', 'FAIL', 'System health degraded after test', finalHealthCheck.error);
            logIssue('System may have issues after running E2E test', 'HIGH');
        }

    } catch (error) {
        logStep('E2E Test Error', 'FAIL', `Unexpected error: ${error.message}`);
        logIssue(`Unexpected test failure: ${error.message}`, 'HIGH');
    } finally {
        // Cleanup
        if (page) await page.close();
        if (browser) await browser.close();
        
        // Finalize results
        testResults.endTime = new Date().toISOString();
        
        // Generate report
        await generateTestReport();
    }
}

async function generateTestReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 E2E TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`\n🕐 Test Duration: ${testResults.startTime} to ${testResults.endTime}`);
    console.log(`📈 Total Tests: ${testResults.totalTests}`);
    console.log(`✅ Passed: ${testResults.passedTests}`);
    console.log(`❌ Failed: ${testResults.failedTests}`);
    console.log(`📊 Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
    
    if (testResults.issues.length > 0) {
        console.log('\n⚠️  ISSUES FOUND:');
        testResults.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. [${issue.severity}] ${issue.issue}`);
        });
    }
    
    if (testResults.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        testResults.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec.recommendation}`);
        });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-reports', `comprehensive-e2e-${Date.now()}.json`);
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    // Summary for monitoring needs
    console.log('\n🔧 MONITORING ENHANCEMENT NEEDS:');
    if (testResults.issues.find(i => i.issue.includes('idle'))) {
        console.log('   - Real-time agent activity monitoring');
        console.log('   - Task progress tracking with timestamps');
    }
    if (testResults.issues.find(i => i.issue.includes('endpoint'))) {
        console.log('   - API endpoint status monitoring');
        console.log('   - Enhanced error reporting and logging');
    }
    if (testResults.issues.find(i => i.issue.includes('UI'))) {
        console.log('   - Web interface health checks');
        console.log('   - User experience monitoring');
    }
    
    console.log('\n✨ E2E Test Complete!');
}

// Run the test
if (require.main === module) {
    runComprehensiveE2ETest().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runComprehensiveE2ETest };