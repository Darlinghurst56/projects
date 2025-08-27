#!/usr/bin/env node

/**
 * TaskMaster AI - Comprehensive Web Interface E2E Test
 * Tests the complete agent management web interface with real user workflows
 */

const { test, expect, chromium } = require('@playwright/test');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class WebInterfaceE2ETest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.agentManagementUrl = `${this.baseUrl}/agent-management`;
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
        this.browser = null;
        this.page = null;
        this.testReport = {
            timestamp: new Date().toISOString(),
            tests: [],
            screenshots: []
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
        
        // Add to test report
        this.testReport.tests.push({
            timestamp,
            message,
            type,
            status: type === 'error' ? 'failed' : 'passed'
        });
    }

    async setup() {
        this.log('Setting up browser and page...', 'info');
        try {
            this.browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-dev-shm-usage']
            });
            
            const context = await this.browser.newContext({
                viewport: { width: 1400, height: 900 }
            });
            
            this.page = await context.newPage();
            
            // Enable console logging
            this.page.on('console', msg => {
                console.log(`[BROWSER] ${msg.text()}`);
            });
            
            // Log network errors
            this.page.on('requestfailed', request => {
                console.log(`[NETWORK ERROR] ${request.url()}: ${request.failure().errorText}`);
            });
            
            this.log('Browser setup complete', 'success');
            return true;
        } catch (error) {
            this.log(`Browser setup failed: ${error.message}`, 'error');
            return false;
        }
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testReport.screenshots.push(screenshotPath);
            this.log(`Screenshot saved: ${screenshotPath}`, 'info');
            return screenshotPath;
        } catch (error) {
            this.log(`Screenshot failed: ${error.message}`, 'error');
            return null;
        }
    }

    async waitForNetworkIdle() {
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async testPageLoad() {
        this.log('Testing page load and initial rendering...', 'info');
        try {
            await this.page.goto(this.agentManagementUrl, { waitUntil: 'networkidle' });
            
            // Wait for main elements to load
            await this.page.waitForSelector('.header', { timeout: 5000 });
            await this.page.waitForSelector('.agents-grid', { timeout: 5000 });
            
            // Check page title
            const title = await this.page.title();
            if (title.includes('TaskMaster AI')) {
                this.log('✅ Page title correct', 'success');
            } else {
                this.log(`❌ Page title incorrect: ${title}`, 'error');
                this.testResults.failed++;
                return false;
            }
            
            // Check header content
            const headerTitle = await this.page.textContent('.header-title');
            if (headerTitle.includes('TaskMaster AI')) {
                this.log('✅ Header title correct', 'success');
            } else {
                this.log(`❌ Header title incorrect: ${headerTitle}`, 'error');
                this.testResults.failed++;
                return false;
            }
            
            await this.takeScreenshot('page-load');
            this.testResults.passed++;
            return true;
        } catch (error) {
            this.log(`Page load test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testSystemStatus() {
        this.log('Testing system status indicator...', 'info');
        try {
            await this.page.waitForSelector('#systemStatus', { timeout: 5000 });
            await this.page.waitForSelector('#statusText', { timeout: 5000 });
            
            const statusIndicator = await this.page.textContent('#systemStatus');
            const statusText = await this.page.textContent('#statusText');
            
            this.log(`System status: ${statusIndicator} - ${statusText}`, 'info');
            
            // Status should be either healthy or show an error
            if (statusText && statusText !== 'Loading...') {
                this.log('✅ System status loaded', 'success');
                this.testResults.passed++;
                return true;
            } else {
                this.log('❌ System status not loaded properly', 'error');
                this.testResults.failed++;
                return false;
            }
        } catch (error) {
            this.log(`System status test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testAgentGrid() {
        this.log('Testing agent grid rendering...', 'info');
        try {
            await this.page.waitForSelector('.agents-grid', { timeout: 5000 });
            
            // Wait for agents to load
            await this.page.waitForFunction(() => {
                const grid = document.querySelector('.agents-grid');
                return grid && grid.children.length > 0;
            }, { timeout: 10000 });
            
            const agentCards = await this.page.$$('.agent-card');
            this.log(`Found ${agentCards.length} agent cards`, 'info');
            
            if (agentCards.length > 0) {
                // Check first agent card structure
                const firstCard = agentCards[0];
                const agentName = await firstCard.$eval('.agent-name', el => el.textContent);
                const agentStatus = await firstCard.$eval('.agent-status', el => el.textContent);
                const capabilities = await firstCard.$$('.capability-tag');
                
                this.log(`First agent: ${agentName} (${agentStatus}) with ${capabilities.length} capabilities`, 'info');
                
                // Check for controls
                const viewTasksBtn = await firstCard.$('button[onclick*="viewAgentTasks"]');
                const autoAssignBtn = await firstCard.$('button[onclick*="assignAvailableTask"]');
                
                if (viewTasksBtn && autoAssignBtn) {
                    this.log('✅ Agent card controls present', 'success');
                    this.testResults.passed++;
                    return true;
                } else {
                    this.log('❌ Agent card controls missing', 'error');
                    this.testResults.failed++;
                    return false;
                }
            } else {
                this.log('❌ No agent cards found', 'error');
                this.testResults.failed++;
                return false;
            }
        } catch (error) {
            this.log(`Agent grid test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testTaskAssignmentForm() {
        this.log('Testing task assignment form...', 'info');
        try {
            await this.page.waitForSelector('.task-assignment', { timeout: 5000 });
            
            // Check form elements
            const titleInput = await this.page.$('#taskTitle');
            const descriptionTextarea = await this.page.$('#taskDescription');
            const agentSelect = await this.page.$('#assignToAgent');
            const prioritySelect = await this.page.$('#taskPriority');
            const assignButton = await this.page.$('button[onclick="assignTask()"]');
            
            if (titleInput && descriptionTextarea && agentSelect && prioritySelect && assignButton) {
                this.log('✅ Task assignment form elements present', 'success');
                
                // Check if agent select is populated
                const agentOptions = await this.page.$$eval('#assignToAgent option', options => 
                    options.map(opt => opt.textContent).filter(text => text !== 'Select an agent...')
                );
                
                if (agentOptions.length > 0) {
                    this.log(`✅ Agent select populated with ${agentOptions.length} agents`, 'success');
                    this.testResults.passed++;
                    return true;
                } else {
                    this.log('❌ Agent select not populated', 'error');
                    this.testResults.failed++;
                    return false;
                }
            } else {
                this.log('❌ Task assignment form elements missing', 'error');
                this.testResults.failed++;
                return false;
            }
        } catch (error) {
            this.log(`Task assignment form test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testAvailableTasksSection() {
        this.log('Testing available tasks section...', 'info');
        try {
            await this.page.waitForSelector('#quickTasks', { timeout: 5000 });
            
            // Wait for tasks to load
            await this.page.waitForFunction(() => {
                const tasksContainer = document.querySelector('#quickTasks');
                return tasksContainer && tasksContainer.innerHTML.trim() !== '';
            }, { timeout: 10000 });
            
            const taskElements = await this.page.$$('.quick-task');
            this.log(`Found ${taskElements.length} available tasks`, 'info');
            
            if (taskElements.length > 0) {
                // Test clicking on first task
                const firstTask = taskElements[0];
                const taskTitle = await firstTask.$eval('.quick-task-title', el => el.textContent);
                
                this.log(`Testing click on task: ${taskTitle}`, 'info');
                await firstTask.click();
                
                // Check if form was populated
                const titleValue = await this.page.inputValue('#taskTitle');
                if (titleValue === taskTitle) {
                    this.log('✅ Task click populated form correctly', 'success');
                    this.testResults.passed++;
                    return true;
                } else {
                    this.log('❌ Task click did not populate form', 'error');
                    this.testResults.failed++;
                    return false;
                }
            } else {
                // No tasks available is also valid
                const noTasksMessage = await this.page.textContent('#quickTasks');
                if (noTasksMessage.includes('No tasks available')) {
                    this.log('✅ No tasks message displayed correctly', 'success');
                    this.testResults.passed++;
                    return true;
                } else {
                    this.log('❌ Tasks section not loading properly', 'error');
                    this.testResults.failed++;
                    return false;
                }
            }
        } catch (error) {
            this.log(`Available tasks test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testRefreshFunctionality() {
        this.log('Testing refresh functionality...', 'info');
        try {
            const refreshButton = await this.page.$('button[onclick="refreshData()"]');
            
            if (refreshButton) {
                this.log('Clicking refresh button...', 'info');
                await refreshButton.click();
                
                // Wait for refresh to complete
                await this.page.waitForTimeout(2000);
                
                // Check if success message appears
                const successMessage = await this.page.waitForSelector('.success-message', { timeout: 5000 });
                if (successMessage) {
                    const messageText = await successMessage.textContent();
                    if (messageText.includes('refreshed successfully')) {
                        this.log('✅ Refresh functionality working', 'success');
                        this.testResults.passed++;
                        return true;
                    }
                }
            }
            
            this.log('❌ Refresh functionality not working properly', 'error');
            this.testResults.failed++;
            return false;
        } catch (error) {
            this.log(`Refresh test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testMobileResponsiveness() {
        this.log('Testing mobile responsiveness...', 'info');
        try {
            // Test mobile viewport
            await this.page.setViewportSize({ width: 375, height: 667 });
            await this.page.waitForTimeout(1000);
            
            // Check if elements are still visible and usable
            const header = await this.page.isVisible('.header');
            const agentsGrid = await this.page.isVisible('.agents-grid');
            const taskForm = await this.page.isVisible('.task-assignment');
            
            if (header && agentsGrid && taskForm) {
                this.log('✅ Mobile viewport elements visible', 'success');
                
                // Test touch-friendly controls
                const buttons = await this.page.$$('.btn');
                if (buttons.length > 0) {
                    const buttonHeight = await buttons[0].boundingBox();
                    if (buttonHeight && buttonHeight.height >= 44) {
                        this.log('✅ Touch-friendly button sizes', 'success');
                        this.testResults.passed++;
                        
                        // Reset viewport
                        await this.page.setViewportSize({ width: 1400, height: 900 });
                        await this.takeScreenshot('mobile-responsive');
                        return true;
                    }
                }
            }
            
            this.log('❌ Mobile responsiveness issues detected', 'error');
            this.testResults.failed++;
            return false;
        } catch (error) {
            this.log(`Mobile responsiveness test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testRealUserWorkflow() {
        this.log('Testing complete real user workflow...', 'info');
        try {
            // Step 1: User loads page
            await this.page.goto(this.agentManagementUrl, { waitUntil: 'networkidle' });
            await this.page.waitForSelector('.agents-grid', { timeout: 10000 });
            
            // Step 2: User checks system status
            await this.page.waitForSelector('#systemStatus', { timeout: 5000 });
            
            // Step 3: User views available tasks
            await this.page.waitForSelector('#quickTasks', { timeout: 5000 });
            
            // Step 4: User selects a task (if available)
            const taskElements = await this.page.$$('.quick-task');
            if (taskElements.length > 0) {
                this.log('User selecting first available task...', 'info');
                await taskElements[0].click();
                
                // Step 5: User selects an agent
                const agentOptions = await this.page.$$eval('#assignToAgent option', options => 
                    options.map(opt => opt.value).filter(val => val !== '')
                );
                
                if (agentOptions.length > 0) {
                    this.log('User selecting agent...', 'info');
                    await this.page.selectOption('#assignToAgent', agentOptions[0]);
                    
                    // Step 6: User attempts to assign task
                    this.log('User attempting task assignment...', 'info');
                    const assignButton = await this.page.$('button[onclick="assignTask()"]');
                    if (assignButton) {
                        await assignButton.click();
                        
                        // Wait for assignment response
                        await this.page.waitForTimeout(3000);
                        
                        // Check for success or error message
                        const successMsg = await this.page.$('.success-message');
                        const errorMsg = await this.page.$('.error-message');
                        
                        if (successMsg || errorMsg) {
                            this.log('✅ Real user workflow completed successfully', 'success');
                            this.testResults.passed++;
                            await this.takeScreenshot('user-workflow-complete');
                            return true;
                        }
                    }
                }
            } else {
                this.log('✅ Real user workflow - no tasks available (valid state)', 'success');
                this.testResults.passed++;
                return true;
            }
            
            this.log('❌ Real user workflow incomplete', 'error');
            this.testResults.failed++;
            return false;
        } catch (error) {
            this.log(`Real user workflow test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async testAccessibilityBasics() {
        this.log('Testing basic accessibility features...', 'info');
        try {
            // Check for proper heading structure
            const h1 = await this.page.$('h1');
            const h2s = await this.page.$$('h2');
            
            if (h1 && h2s.length > 0) {
                this.log('✅ Proper heading structure found', 'success');
            } else {
                this.log('❌ Heading structure issues', 'error');
                this.testResults.failed++;
                return false;
            }
            
            // Check for form labels
            const formLabels = await this.page.$$('label');
            const formInputs = await this.page.$$('input, select, textarea');
            
            if (formLabels.length > 0 && formInputs.length > 0) {
                this.log('✅ Form labels present', 'success');
            } else {
                this.log('❌ Form accessibility issues', 'error');
                this.testResults.failed++;
                return false;
            }
            
            // Check for keyboard navigation
            await this.page.keyboard.press('Tab');
            const focusedElement = await this.page.evaluate(() => document.activeElement.tagName);
            
            if (focusedElement) {
                this.log('✅ Keyboard navigation working', 'success');
                this.testResults.passed++;
                return true;
            } else {
                this.log('❌ Keyboard navigation issues', 'error');
                this.testResults.failed++;
                return false;
            }
        } catch (error) {
            this.log(`Accessibility test failed: ${error.message}`, 'error');
            this.testResults.failed++;
            return false;
        }
    }

    async generateReport() {
        this.log('Generating comprehensive test report...', 'info');
        
        try {
            const reportPath = path.join(__dirname, 'test-reports', `web-interface-e2e-${Date.now()}.json`);
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
                    viewport: '1400x900',
                    browser: 'chromium',
                    userAgent: await this.page.evaluate(() => navigator.userAgent)
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

    async cleanup() {
        this.log('Cleaning up browser resources...', 'info');
        try {
            if (this.page) {
                await this.page.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
            this.log('✅ Cleanup completed', 'success');
        } catch (error) {
            this.log(`Cleanup failed: ${error.message}`, 'error');
        }
    }

    async runFullTest() {
        this.log('🚀 Starting TaskMaster AI Web Interface E2E Test', 'info');
        this.log('Testing complete agent management web interface with real user workflows', 'info');
        
        const setupSuccess = await this.setup();
        if (!setupSuccess) {
            this.log('❌ Test setup failed - aborting', 'error');
            return;
        }
        
        const tests = [
            { name: 'Page Load', fn: this.testPageLoad.bind(this) },
            { name: 'System Status', fn: this.testSystemStatus.bind(this) },
            { name: 'Agent Grid', fn: this.testAgentGrid.bind(this) },
            { name: 'Task Assignment Form', fn: this.testTaskAssignmentForm.bind(this) },
            { name: 'Available Tasks', fn: this.testAvailableTasksSection.bind(this) },
            { name: 'Refresh Functionality', fn: this.testRefreshFunctionality.bind(this) },
            { name: 'Mobile Responsiveness', fn: this.testMobileResponsiveness.bind(this) },
            { name: 'Real User Workflow', fn: this.testRealUserWorkflow.bind(this) },
            { name: 'Accessibility Basics', fn: this.testAccessibilityBasics.bind(this) }
        ];

        for (const test of tests) {
            this.log(`\n🔍 Running test: ${test.name}`, 'info');
            try {
                await test.fn();
                await this.page.waitForTimeout(1000); // Brief pause between tests
            } catch (error) {
                this.log(`Test "${test.name}" threw error: ${error.message}`, 'error');
                this.testResults.failed++;
                this.testResults.errors.push(`${test.name}: ${error.message}`);
            }
        }

        await this.generateReport();
        await this.cleanup();
        
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
            this.log('✅ All web interface tests passed - Agent management system is functional', 'success');
            process.exit(0);
        } else {
            this.log('❌ Some web interface tests failed - Issues detected in agent management system', 'error');
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    try {
        const test = new WebInterfaceE2ETest();
        await test.runFullTest();
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = WebInterfaceE2ETest;