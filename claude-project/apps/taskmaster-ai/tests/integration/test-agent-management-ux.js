#!/usr/bin/env node

/**
 * TaskMaster AI - Agent Management UX Testing
 * Uses user-testing-mcp to validate UI/UX aspects
 */

const { chromium } = require('playwright');

class AgentManagementUXTest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.agentManagementUrl = `${this.baseUrl}/agent-management`;
        this.testResults = {
            passed: 0,
            failed: 0,
            scores: {},
            recommendations: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[34m',    // blue
            success: '\x1b[32m', // green
            error: '\x1b[31m',   // red
            warning: '\x1b[33m', // yellow
            score: '\x1b[35m',   // magenta
            reset: '\x1b[0m'
        };
        const color = colors[type] || colors.info;
        console.log(`[${timestamp}] ${color}${message}${colors.reset}`);
    }

    async runTest(name, testFn) {
        this.log(`Running: ${name}`, 'info');
        try {
            const result = await testFn();
            this.testResults.passed++;
            this.log(`✅ ${name}`, 'success');
            return result;
        } catch (error) {
            this.testResults.failed++;
            this.log(`❌ ${name}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Test 1: Task Assignment User Journey
     * Validates the complete flow from landing to task assignment
     */
    async testTaskAssignmentJourney() {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1400, height: 900 }
        });
        const page = await context.newPage();

        try {
            // Journey metrics
            const journey = {
                steps: [],
                timings: {},
                errors: [],
                score: 0
            };

            const startTime = Date.now();

            // Step 1: Landing
            await page.goto(this.agentManagementUrl);
            await page.waitForLoadState('networkidle');
            journey.timings.pageLoad = Date.now() - startTime;
            journey.steps.push('landing');

            // Check if page loaded correctly
            const title = await page.title();
            if (!title.includes('Agent Management')) {
                journey.errors.push('Page title unclear');
            }

            // Step 2: Identify available tasks
            const taskElements = await page.$$('.task-item, [class*="task"]');
            journey.steps.push('task-identification');
            journey.taskCount = taskElements.length;

            // Step 3: Identify agents
            const agentElements = await page.$$('.agent-card, [class*="agent"]');
            journey.steps.push('agent-identification');
            journey.agentCount = agentElements.length;

            // Step 4: Test interaction - click on a task
            if (taskElements.length > 0) {
                const taskTime = Date.now();
                await taskElements[0].click();
                journey.timings.taskSelection = Date.now() - taskTime;
                journey.steps.push('task-selection');
            }

            // Step 5: Test assignment form
            const assignButton = await page.$('button:has-text("Assign"), button:has-text("assign")');
            if (assignButton) {
                const visible = await assignButton.isVisible();
                if (visible) {
                    journey.steps.push('assignment-ready');
                }
            }

            // Calculate journey score
            journey.score = this.calculateJourneyScore(journey);

            await browser.close();
            return journey;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 2: Mobile Responsiveness and Touch Targets
     */
    async testMobileExperience() {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 }, // iPhone SE
            hasTouch: true,
            isMobile: true
        });
        const page = await context.newPage();

        try {
            const mobile = {
                touchTargets: [],
                responsiveIssues: [],
                score: 0
            };

            await page.goto(this.agentManagementUrl);
            await page.waitForLoadState('networkidle');

            // Check all clickable elements for size
            const clickables = await page.$$('button, a, [onclick], .clickable, .agent-card, .task-item');
            
            for (const element of clickables) {
                const box = await element.boundingBox();
                if (box) {
                    if (box.width < 44 || box.height < 44) {
                        mobile.responsiveIssues.push({
                            type: 'small-touch-target',
                            size: `${box.width}x${box.height}`,
                            recommended: '44x44'
                        });
                    }
                    mobile.touchTargets.push({
                        width: box.width,
                        height: box.height
                    });
                }
            }

            // Check text readability
            const textElements = await page.$$('p, span, div');
            for (const element of textElements.slice(0, 10)) { // Sample first 10
                const fontSize = await element.evaluate(el => 
                    window.getComputedStyle(el).fontSize
                );
                if (parseInt(fontSize) < 14) {
                    mobile.responsiveIssues.push({
                        type: 'small-text',
                        size: fontSize,
                        recommended: '14px minimum'
                    });
                }
            }

            // Check viewport overflow
            const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
            const viewportWidth = 375;
            if (bodyWidth > viewportWidth) {
                mobile.responsiveIssues.push({
                    type: 'horizontal-scroll',
                    bodyWidth,
                    viewportWidth
                });
            }

            mobile.score = this.calculateMobileScore(mobile);

            await browser.close();
            return mobile;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 3: Visual Hierarchy and Information Architecture
     */
    async testVisualHierarchy() {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            const hierarchy = {
                headings: [],
                contrast: [],
                spacing: [],
                score: 0
            };

            await page.goto(this.agentManagementUrl);
            await page.waitForLoadState('networkidle');

            // Check heading structure
            const headings = await page.evaluate(() => {
                const h1 = document.querySelectorAll('h1').length;
                const h2 = document.querySelectorAll('h2').length;
                const h3 = document.querySelectorAll('h3').length;
                return { h1, h2, h3 };
            });
            hierarchy.headings = headings;

            // Check main content areas
            const mainAreas = await page.evaluate(() => {
                const areas = [];
                const selectors = ['main', '.main-content', '#content', '.agents-grid', '.task-list'];
                selectors.forEach(selector => {
                    const element = document.querySelector(selector);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        areas.push({
                            selector,
                            width: rect.width,
                            height: rect.height,
                            visible: rect.width > 0 && rect.height > 0
                        });
                    }
                });
                return areas;
            });
            hierarchy.mainAreas = mainAreas;

            // Check color contrast for key elements
            const contrastResults = await page.evaluate(() => {
                const results = [];
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    const styles = window.getComputedStyle(button);
                    results.push({
                        element: 'button',
                        color: styles.color,
                        background: styles.backgroundColor
                    });
                });
                return results;
            });
            hierarchy.contrast = contrastResults;

            hierarchy.score = this.calculateHierarchyScore(hierarchy);

            await browser.close();
            return hierarchy;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 4: User Feedback and Loading States
     */
    async testFeedbackQuality() {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            const feedback = {
                loadingStates: [],
                hoverStates: [],
                clickFeedback: [],
                score: 0
            };

            await page.goto(this.agentManagementUrl);
            await page.waitForLoadState('networkidle');

            // Test hover states on interactive elements
            const interactiveElements = await page.$$('button, a, .agent-card, .task-item');
            for (const element of interactiveElements.slice(0, 5)) { // Test first 5
                const beforeHover = await element.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        background: styles.backgroundColor,
                        transform: styles.transform,
                        cursor: styles.cursor
                    };
                });

                await element.hover();
                await page.waitForTimeout(100);

                const afterHover = await element.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        background: styles.backgroundColor,
                        transform: styles.transform,
                        cursor: styles.cursor
                    };
                });

                feedback.hoverStates.push({
                    hasChange: JSON.stringify(beforeHover) !== JSON.stringify(afterHover),
                    cursor: afterHover.cursor
                });
            }

            // Test click feedback
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
                const button = buttons[0];
                const clickTime = Date.now();
                
                await button.click();
                
                // Check for immediate visual feedback
                const feedbackTime = Date.now() - clickTime;
                feedback.clickFeedback.push({
                    responseTime: feedbackTime,
                    immediate: feedbackTime < 100
                });
            }

            feedback.score = this.calculateFeedbackScore(feedback);

            await browser.close();
            return feedback;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    // Scoring functions
    calculateJourneyScore(journey) {
        let score = 100;
        
        // Deduct for errors
        score -= journey.errors.length * 10;
        
        // Deduct for slow page load
        if (journey.timings.pageLoad > 3000) score -= 10;
        if (journey.timings.pageLoad > 5000) score -= 10;
        
        // Deduct if no tasks or agents found
        if (!journey.taskCount) score -= 20;
        if (!journey.agentCount) score -= 20;
        
        // Deduct for incomplete steps
        const expectedSteps = ['landing', 'task-identification', 'agent-identification'];
        const missingSteps = expectedSteps.filter(step => !journey.steps.includes(step));
        score -= missingSteps.length * 10;
        
        return Math.max(0, score);
    }

    calculateMobileScore(mobile) {
        let score = 100;
        
        // Deduct for small touch targets
        const smallTargets = mobile.responsiveIssues.filter(i => i.type === 'small-touch-target');
        score -= smallTargets.length * 5;
        
        // Major deduction for horizontal scroll
        const hasScroll = mobile.responsiveIssues.some(i => i.type === 'horizontal-scroll');
        if (hasScroll) score -= 30;
        
        // Deduct for small text
        const smallText = mobile.responsiveIssues.filter(i => i.type === 'small-text');
        score -= smallText.length * 2;
        
        return Math.max(0, score);
    }

    calculateHierarchyScore(hierarchy) {
        let score = 100;
        
        // Check heading structure
        if (hierarchy.headings.h1 !== 1) score -= 10;
        if (hierarchy.headings.h2 === 0) score -= 10;
        
        // Check main areas visibility
        const visibleAreas = hierarchy.mainAreas.filter(a => a.visible);
        if (visibleAreas.length === 0) score -= 30;
        
        return Math.max(0, score);
    }

    calculateFeedbackScore(feedback) {
        let score = 100;
        
        // Check hover states
        const hasHoverFeedback = feedback.hoverStates.some(s => s.hasChange);
        if (!hasHoverFeedback) score -= 20;
        
        // Check cursor changes
        const hasCursorPointer = feedback.hoverStates.some(s => s.cursor === 'pointer');
        if (!hasCursorPointer) score -= 10;
        
        // Check click response time
        const slowClicks = feedback.clickFeedback.filter(f => !f.immediate);
        score -= slowClicks.length * 10;
        
        return Math.max(0, score);
    }

    async runAllTests() {
        this.log('🚀 Starting TaskMaster Agent Management UX Testing', 'info');
        this.log('Testing design flow, text sizing, and human expectations\n', 'info');

        // Check if server is running
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            if (!response.ok) throw new Error('Server not responding');
        } catch (error) {
            this.log('❌ Server not responding. Please start TaskMaster API server first.', 'error');
            return;
        }

        // Run all UX tests
        const journeyResult = await this.runTest('Task Assignment Journey', () => this.testTaskAssignmentJourney());
        const mobileResult = await this.runTest('Mobile Experience & Touch Targets', () => this.testMobileExperience());
        const hierarchyResult = await this.runTest('Visual Hierarchy & Information Architecture', () => this.testVisualHierarchy());
        const feedbackResult = await this.runTest('User Feedback & Loading States', () => this.testFeedbackQuality());

        // Calculate overall UX score
        const scores = {
            journey: journeyResult?.score || 0,
            mobile: mobileResult?.score || 0,
            hierarchy: hierarchyResult?.score || 0,
            feedback: feedbackResult?.score || 0
        };
        
        const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);

        // Display results
        this.log('\n📊 UX Test Results:', 'info');
        this.log(`Task Assignment Journey: ${scores.journey}/100`, 'score');
        this.log(`Mobile Experience: ${scores.mobile}/100`, 'score');
        this.log(`Visual Hierarchy: ${scores.hierarchy}/100`, 'score');
        this.log(`User Feedback: ${scores.feedback}/100`, 'score');
        this.log(`\n🎯 Overall UX Score: ${overallScore}/100`, overallScore >= 80 ? 'success' : 'warning');

        // Provide recommendations
        this.log('\n💡 Recommendations:', 'info');
        
        if (mobileResult && mobileResult.responsiveIssues.length > 0) {
            this.log('- Increase touch target sizes to minimum 44x44px for mobile', 'warning');
        }
        
        if (hierarchyResult && hierarchyResult.headings.h1 !== 1) {
            this.log('- Use exactly one H1 heading for better accessibility', 'warning');
        }
        
        if (feedbackResult && !feedbackResult.hoverStates.some(s => s.hasChange)) {
            this.log('- Add hover states to interactive elements for better feedback', 'warning');
        }

        if (journeyResult && journeyResult.timings.pageLoad > 3000) {
            this.log(`- Optimize page load time (current: ${journeyResult.timings.pageLoad}ms)`, 'warning');
        }

        // Summary
        this.log('\n📋 Summary:', 'info');
        this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
        
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run tests
const tester = new AgentManagementUXTest();
tester.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});