#!/usr/bin/env node

/**
 * TaskMaster AI - UX Testing with Puppeteer
 * Tests design flow, text sizing, and human expectations
 */

const path = require('path');

// Use puppeteer from dashboard directory
const puppeteer = require(path.join(__dirname, '../../../dashboard/node_modules/puppeteer'));

class PuppeteerUXTest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.agentManagementUrl = `${this.baseUrl}/agent-management`;
        this.testResults = {
            passed: 0,
            failed: 0,
            uxScores: {},
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
     * Test 1: User Journey & Task Flow
     */
    async testUserJourney() {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 900 });

            // Track journey metrics
            const journey = {
                steps: [],
                timings: {},
                interactions: 0,
                errors: [],
                score: 100
            };

            const startTime = Date.now();

            // Step 1: Landing page load
            await page.goto(this.agentManagementUrl, { waitUntil: 'networkidle2' });
            journey.timings.pageLoad = Date.now() - startTime;
            journey.steps.push('landing');

            // Check page title clarity
            const title = await page.title();
            if (!title || title.length < 5) {
                journey.errors.push('Page title missing or unclear');
                journey.score -= 10;
            }

            // Step 2: Check primary elements visibility
            const primaryElements = await page.evaluate(() => {
                const elements = {
                    agents: document.querySelectorAll('.agent-card, [id*="agent"]').length,
                    tasks: document.querySelectorAll('.task-item, [id*="task"]').length,
                    buttons: document.querySelectorAll('button').length,
                    forms: document.querySelectorAll('form, .form').length
                };
                return elements;
            });

            if (primaryElements.agents === 0) {
                journey.errors.push('No agent elements found');
                journey.score -= 20;
            }
            if (primaryElements.tasks === 0) {
                journey.errors.push('No task elements found');
                journey.score -= 20;
            }

            journey.elements = primaryElements;
            journey.steps.push('element-discovery');

            // Step 3: Test primary interaction
            const clickableElements = await page.$$('button, .task-item, .agent-card');
            if (clickableElements.length > 0) {
                const interactionTime = Date.now();
                await clickableElements[0].click();
                journey.timings.firstInteraction = Date.now() - interactionTime;
                journey.interactions++;
                journey.steps.push('first-interaction');
            }

            // Check for feedback after interaction
            await page.waitForTimeout(500);
            const hasVisualFeedback = await page.evaluate(() => {
                // Check for any visual changes, modals, or status updates
                return document.querySelectorAll('.active, .selected, .modal, .feedback').length > 0;
            });

            if (!hasVisualFeedback) {
                journey.errors.push('No visual feedback after interaction');
                journey.score -= 15;
            }

            await browser.close();
            return journey;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 2: Text Sizing & Readability
     */
    async testTextReadability() {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 900 });
            await page.goto(this.agentManagementUrl, { waitUntil: 'networkidle2' });

            const readability = {
                issues: [],
                score: 100,
                measurements: {}
            };

            // Analyze text elements
            const textAnalysis = await page.evaluate(() => {
                const results = {
                    tooSmall: [],
                    goodSize: [],
                    lineHeights: [],
                    contrasts: []
                };

                // Check all text elements
                const textElements = document.querySelectorAll('p, span, div, button, a, h1, h2, h3, h4, h5, h6');
                
                textElements.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    const fontSize = parseInt(styles.fontSize);
                    const lineHeight = parseFloat(styles.lineHeight) / fontSize;
                    
                    if (el.textContent.trim().length > 0) {
                        if (fontSize < 14) {
                            results.tooSmall.push({
                                text: el.textContent.substring(0, 50),
                                size: fontSize,
                                element: el.tagName
                            });
                        } else {
                            results.goodSize.push(fontSize);
                        }
                        
                        if (lineHeight < 1.4 && el.textContent.length > 50) {
                            results.lineHeights.push({
                                ratio: lineHeight,
                                recommended: 1.5
                            });
                        }
                    }
                });

                return results;
            });

            readability.measurements = textAnalysis;

            // Calculate readability score
            if (textAnalysis.tooSmall.length > 0) {
                readability.score -= Math.min(30, textAnalysis.tooSmall.length * 5);
                readability.issues.push(`${textAnalysis.tooSmall.length} text elements below 14px`);
            }

            if (textAnalysis.lineHeights.length > 0) {
                readability.score -= 10;
                readability.issues.push('Some text has tight line spacing');
            }

            await browser.close();
            return readability;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 3: Mobile Touch Targets & Responsiveness
     */
    async testMobileUsability() {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // iPhone SE viewport
            await page.setViewport({ 
                width: 375, 
                height: 667,
                isMobile: true,
                hasTouch: true
            });

            await page.goto(this.agentManagementUrl, { waitUntil: 'networkidle2' });

            const mobile = {
                issues: [],
                score: 100,
                touchTargets: []
            };

            // Check touch target sizes
            const touchAnalysis = await page.evaluate(() => {
                const results = {
                    tooSmall: [],
                    appropriate: [],
                    viewport: {
                        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                        contentWidth: document.body.scrollWidth,
                        viewportWidth: window.innerWidth
                    }
                };

                // Check all interactive elements
                const interactive = document.querySelectorAll('button, a, input, select, .clickable, [onclick]');
                
                interactive.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const size = Math.min(rect.width, rect.height);
                    
                    if (size < 44) {
                        results.tooSmall.push({
                            element: el.tagName,
                            text: el.textContent.substring(0, 30),
                            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
                        });
                    } else {
                        results.appropriate.push(size);
                    }
                });

                return results;
            });

            mobile.touchTargets = touchAnalysis;

            // Calculate mobile score
            if (touchAnalysis.tooSmall.length > 0) {
                mobile.score -= Math.min(40, touchAnalysis.tooSmall.length * 10);
                mobile.issues.push(`${touchAnalysis.tooSmall.length} touch targets below 44x44px`);
            }

            if (touchAnalysis.viewport.hasHorizontalScroll) {
                mobile.score -= 30;
                mobile.issues.push('Horizontal scrolling detected on mobile');
            }

            await browser.close();
            return mobile;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Test 4: Visual Feedback & User Expectations
     */
    async testVisualFeedback() {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 900 });
            await page.goto(this.agentManagementUrl, { waitUntil: 'networkidle2' });

            const feedback = {
                issues: [],
                score: 100,
                interactions: []
            };

            // Test hover states
            const hoverAnalysis = await page.evaluate(async () => {
                const results = {
                    withHover: 0,
                    withoutHover: 0,
                    buttons: []
                };

                const buttons = document.querySelectorAll('button');
                
                for (const button of buttons) {
                    const beforeStyles = window.getComputedStyle(button);
                    const beforeBg = beforeStyles.backgroundColor;
                    const beforeTransform = beforeStyles.transform;
                    
                    // Trigger hover
                    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    
                    // Wait a bit for CSS transitions
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const afterStyles = window.getComputedStyle(button);
                    const afterBg = afterStyles.backgroundColor;
                    const afterTransform = afterStyles.transform;
                    
                    const hasChange = beforeBg !== afterBg || beforeTransform !== afterTransform;
                    
                    if (hasChange) {
                        results.withHover++;
                    } else {
                        results.withoutHover++;
                    }
                    
                    results.buttons.push({
                        text: button.textContent.substring(0, 30),
                        hasHoverFeedback: hasChange
                    });
                }

                return results;
            });

            feedback.interactions = hoverAnalysis;

            // Calculate feedback score
            if (hoverAnalysis.withoutHover > hoverAnalysis.withHover) {
                feedback.score -= 20;
                feedback.issues.push('Most buttons lack hover feedback');
            }

            // Test loading states
            const hasLoadingIndicators = await page.evaluate(() => {
                return document.querySelectorAll('.loading, .spinner, [class*="load"]').length > 0;
            });

            if (!hasLoadingIndicators) {
                feedback.score -= 10;
                feedback.issues.push('No loading state indicators found');
            }

            await browser.close();
            return feedback;

        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting TaskMaster UX Testing with Puppeteer', 'info');
        this.log('Testing design flow, text sizing, and human expectations\n', 'info');

        // Check server health
        try {
            const http = require('http');
            await new Promise((resolve, reject) => {
                http.get(`${this.baseUrl}/api/health`, (res) => {
                    if (res.statusCode === 200) resolve();
                    else reject(new Error('Server not healthy'));
                }).on('error', reject);
            });
        } catch (error) {
            this.log('❌ Server not responding. Please ensure TaskMaster is running.', 'error');
            return;
        }

        // Run all tests
        const journeyResult = await this.runTest('User Journey & Task Flow', () => this.testUserJourney());
        const readabilityResult = await this.runTest('Text Sizing & Readability', () => this.testTextReadability());
        const mobileResult = await this.runTest('Mobile Touch Targets', () => this.testMobileUsability());
        const feedbackResult = await this.runTest('Visual Feedback & Expectations', () => this.testVisualFeedback());

        // Calculate overall UX score
        const scores = {
            journey: journeyResult?.score || 0,
            readability: readabilityResult?.score || 0,
            mobile: mobileResult?.score || 0,
            feedback: feedbackResult?.score || 0
        };

        const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);

        // Display results
        this.log('\n📊 UX Test Results:', 'info');
        this.log(`User Journey Score: ${scores.journey}/100`, 'score');
        this.log(`Text Readability: ${scores.readability}/100`, 'score');
        this.log(`Mobile Usability: ${scores.mobile}/100`, 'score');
        this.log(`Visual Feedback: ${scores.feedback}/100`, 'score');
        this.log(`\n🎯 Overall UX Score: ${overallScore}/100`, overallScore >= 80 ? 'success' : 'warning');

        // Detailed findings
        this.log('\n📋 Detailed Findings:', 'info');
        
        if (journeyResult) {
            this.log(`\nUser Journey:`, 'info');
            this.log(`- Page load time: ${journeyResult.timings.pageLoad}ms`, 'info');
            this.log(`- Elements found: ${journeyResult.elements?.agents || 0} agents, ${journeyResult.elements?.tasks || 0} tasks`, 'info');
            if (journeyResult.errors.length > 0) {
                journeyResult.errors.forEach(err => this.log(`- Issue: ${err}`, 'warning'));
            }
        }

        if (readabilityResult && readabilityResult.issues.length > 0) {
            this.log(`\nText Readability Issues:`, 'info');
            readabilityResult.issues.forEach(issue => this.log(`- ${issue}`, 'warning'));
        }

        if (mobileResult && mobileResult.issues.length > 0) {
            this.log(`\nMobile Usability Issues:`, 'info');
            mobileResult.issues.forEach(issue => this.log(`- ${issue}`, 'warning'));
        }

        if (feedbackResult && feedbackResult.issues.length > 0) {
            this.log(`\nVisual Feedback Issues:`, 'info');
            feedbackResult.issues.forEach(issue => this.log(`- ${issue}`, 'warning'));
        }

        // Recommendations
        this.log('\n💡 Recommendations:', 'info');
        
        if (overallScore < 80) {
            if (scores.mobile < 70) {
                this.log('- Increase touch target sizes to 44x44px minimum', 'warning');
                this.log('- Ensure no horizontal scrolling on mobile devices', 'warning');
            }
            if (scores.readability < 80) {
                this.log('- Increase font sizes to minimum 14px for body text', 'warning');
                this.log('- Improve line height to 1.5x for better readability', 'warning');
            }
            if (scores.feedback < 80) {
                this.log('- Add hover states to interactive elements', 'warning');
                this.log('- Include loading indicators for async operations', 'warning');
            }
        }

        // Summary
        this.log('\n📈 Test Summary:', 'info');
        this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
        this.log(`❌ Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
        
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run the tests
const tester = new PuppeteerUXTest();
tester.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});