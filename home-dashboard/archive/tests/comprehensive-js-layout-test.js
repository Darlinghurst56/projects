#!/usr/bin/env node

/**
 * Comprehensive JavaScript and Layout Testing Script
 * for Family Dashboard at http://localhost:3003/
 * 
 * This script performs:
 * 1. Console Error Analysis
 * 2. React Component Testing
 * 3. Layout and Sizing Analysis
 * 4. Title Issues Diagnostics
 * 5. Browser Compatibility Testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestingSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            url: 'http://localhost:3003/',
            consoleErrors: [],
            jsErrors: [],
            reactComponentErrors: [],
            layoutIssues: [],
            titleIssues: [],
            sizingProblems: [],
            responsiveIssues: [],
            apiCallErrors: [],
            websocketIssues: [],
            recommendations: []
        };
        this.browser = null;
        this.page = null;
    }

    async initializeBrowser() {
        console.log('🚀 Initializing browser for comprehensive testing...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Run in visible mode for better debugging
            devtools: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--remote-debugging-port=9222'
            ],
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });

        this.page = await this.browser.newPage();
        
        // Set up console event listeners
        this.page.on('console', (msg) => {
            const type = msg.type();
            const text = msg.text();
            const location = msg.location();
            
            if (type === 'error') {
                this.testResults.consoleErrors.push({
                    type: 'console.error',
                    message: text,
                    location: location,
                    timestamp: new Date().toISOString()
                });
            } else if (type === 'warning' && text.includes('React')) {
                this.testResults.reactComponentErrors.push({
                    type: 'react.warning',
                    message: text,
                    location: location,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Set up error event listeners
        this.page.on('pageerror', (error) => {
            this.testResults.jsErrors.push({
                type: 'page.error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        this.page.on('requestfailed', (request) => {
            this.testResults.apiCallErrors.push({
                type: 'request.failed',
                url: request.url(),
                failure: request.failure(),
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Browser initialized successfully');
    }

    async loadDashboard() {
        console.log('📄 Loading dashboard at http://localhost:3003/...');
        
        try {
            const response = await this.page.goto('http://localhost:3003/', {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            if (!response.ok()) {
                this.testResults.jsErrors.push({
                    type: 'navigation.error',
                    message: `Failed to load page: ${response.status()} ${response.statusText()}`,
                    timestamp: new Date().toISOString()
                });
                return false;
            }

            // Wait for React to initialize
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('✅ Dashboard loaded successfully');
            return true;
        } catch (error) {
            this.testResults.jsErrors.push({
                type: 'navigation.timeout',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async analyzeConsoleErrors() {
        console.log('🔍 Analyzing console errors...');

        // Wait a bit more for any delayed console messages
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for specific React errors
        const reactErrorsFound = await this.page.evaluate(() => {
            const errors = [];
            
            // Check for React hydration errors
            const hydrateErrors = document.querySelectorAll('[data-reactroot] [data-react-error]');
            hydrateErrors.forEach(el => {
                errors.push({
                    type: 'react.hydration',
                    element: el.tagName,
                    message: 'React hydration mismatch detected'
                });
            });

            // Check for unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                errors.push({
                    type: 'promise.rejection',
                    message: event.reason.toString(),
                    timestamp: new Date().toISOString()
                });
            });

            return errors;
        });

        this.testResults.reactComponentErrors.push(...reactErrorsFound);
        console.log(`🔍 Found ${this.testResults.consoleErrors.length} console errors`);
        console.log(`🔍 Found ${this.testResults.reactComponentErrors.length} React component errors`);
    }

    async testReactComponentMounting() {
        console.log('⚛️ Testing React component mounting...');

        const componentTests = await this.page.evaluate(() => {
            const results = [];
            const reactRoot = document.querySelector('#root');
            
            if (!reactRoot) {
                results.push({
                    component: 'ReactRoot',
                    status: 'missing',
                    issue: 'No React root element found'
                });
                return results;
            }

            // Check for common components
            const expectedComponents = [
                { selector: '[data-testid="dashboard"]', name: 'Dashboard' },
                { selector: '[data-testid="header-nav"]', name: 'HeaderNav' },
                { selector: '[data-testid="widget-grid"]', name: 'WidgetGrid' },
                { selector: '.dns-status-widget', name: 'DnsStatusWidget' },
                { selector: '.dns-analytics-widget', name: 'DnsAnalyticsWidget' },
                { selector: '.google-calendar-widget', name: 'GoogleCalendarWidget' },
                { selector: '.ai-chat-widget', name: 'AiChatWidget' },
                { selector: '.meal-planner-widget', name: 'MealPlannerWidget' }
            ];

            expectedComponents.forEach(comp => {
                const element = document.querySelector(comp.selector);
                results.push({
                    component: comp.name,
                    status: element ? 'mounted' : 'missing',
                    element: element ? element.tagName : null,
                    hasContent: element ? element.textContent.length > 0 : false
                });
            });

            return results;
        });

        // Analyze component mounting results
        componentTests.forEach(test => {
            if (test.status === 'missing') {
                this.testResults.reactComponentErrors.push({
                    type: 'component.missing',
                    component: test.component,
                    message: `${test.component} component not found in DOM`,
                    timestamp: new Date().toISOString()
                });
            } else if (test.status === 'mounted' && !test.hasContent) {
                this.testResults.reactComponentErrors.push({
                    type: 'component.empty',
                    component: test.component,
                    message: `${test.component} component mounted but has no content`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        console.log(`⚛️ Tested ${componentTests.length} React components`);
        return componentTests;
    }

    async analyzeTitleIssues() {
        console.log('🏷️ Analyzing title sizing and positioning issues...');

        const titleAnalysis = await this.page.evaluate(() => {
            const analysis = {
                elements: [],
                issues: []
            };

            // Find all potential title elements
            const titleSelectors = [
                'h1', 'h2', 'h3', '.title', '.header-title', 
                '[data-testid*="title"]', '.dashboard-title',
                'header h1', 'header h2', 'header .title'
            ];

            titleSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(element);
                    
                    const elementData = {
                        selector: selector,
                        tagName: element.tagName,
                        text: element.textContent.trim(),
                        dimensions: {
                            width: rect.width,
                            height: rect.height,
                            x: rect.x,
                            y: rect.y
                        },
                        styles: {
                            fontSize: computedStyle.fontSize,
                            fontWeight: computedStyle.fontWeight,
                            lineHeight: computedStyle.lineHeight,
                            margin: computedStyle.margin,
                            padding: computedStyle.padding,
                            position: computedStyle.position,
                            overflow: computedStyle.overflow,
                            textOverflow: computedStyle.textOverflow,
                            whiteSpace: computedStyle.whiteSpace
                        },
                        isVisible: rect.width > 0 && rect.height > 0,
                        isInViewport: rect.top >= 0 && rect.left >= 0 && 
                                     rect.bottom <= window.innerHeight && 
                                     rect.right <= window.innerWidth
                    };

                    analysis.elements.push(elementData);

                    // Check for common title issues
                    if (elementData.text.includes('Welcome to Hurst Home')) {
                        // Specific analysis for the main title
                        if (rect.width === 0 || rect.height === 0) {
                            analysis.issues.push({
                                type: 'title.invisible',
                                element: elementData,
                                message: 'Main title has zero dimensions'
                            });
                        }
                        
                        if (parseFloat(computedStyle.fontSize) > 60) {
                            analysis.issues.push({
                                type: 'title.oversized',
                                element: elementData,
                                message: `Title font size (${computedStyle.fontSize}) may be too large`
                            });
                        }
                        
                        if (computedStyle.position === 'absolute' && (rect.x < 0 || rect.y < 0)) {
                            analysis.issues.push({
                                type: 'title.positioned_offscreen',
                                element: elementData,
                                message: 'Title positioned outside visible area'
                            });
                        }
                        
                        if (computedStyle.overflow === 'hidden' && element.scrollWidth > element.clientWidth) {
                            analysis.issues.push({
                                type: 'title.text_overflow',
                                element: elementData,
                                message: 'Title text is being clipped due to overflow'
                            });
                        }
                    }

                    // General title issues
                    if (rect.width > window.innerWidth * 1.2) {
                        analysis.issues.push({
                            type: 'title.too_wide',
                            element: elementData,
                            message: 'Title wider than viewport'
                        });
                    }
                });
            });

            return analysis;
        });

        this.testResults.titleIssues = titleAnalysis.issues;
        console.log(`🏷️ Found ${titleAnalysis.issues.length} title-related issues`);
        console.log(`🏷️ Analyzed ${titleAnalysis.elements.length} potential title elements`);
        
        return titleAnalysis;
    }

    async analyzeLayoutAndSizing() {
        console.log('📐 Analyzing layout and component sizing...');

        const layoutAnalysis = await this.page.evaluate(() => {
            const analysis = {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                body: {
                    width: document.body.clientWidth,
                    height: document.body.clientHeight,
                    scrollWidth: document.body.scrollWidth,
                    scrollHeight: document.body.scrollHeight
                },
                widgets: [],
                layoutIssues: []
            };

            // Analyze widget containers
            const widgetSelectors = [
                '.widget', '.dns-widget', '.google-widget', 
                '.ai-widget', '.meal-widget', '[class*="widget"]'
            ];

            widgetSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(element);
                    
                    const widgetData = {
                        selector: selector,
                        className: element.className,
                        dimensions: {
                            width: rect.width,
                            height: rect.height,
                            x: rect.x,
                            y: rect.y
                        },
                        styles: {
                            display: computedStyle.display,
                            position: computedStyle.position,
                            flexBasis: computedStyle.flexBasis,
                            gridArea: computedStyle.gridArea,
                            margin: computedStyle.margin,
                            padding: computedStyle.padding,
                            minWidth: computedStyle.minWidth,
                            maxWidth: computedStyle.maxWidth,
                            minHeight: computedStyle.minHeight,
                            maxHeight: computedStyle.maxHeight
                        }
                    };

                    analysis.widgets.push(widgetData);

                    // Check for sizing issues
                    if (rect.width > analysis.viewport.width) {
                        analysis.layoutIssues.push({
                            type: 'widget.too_wide',
                            element: widgetData,
                            message: `Widget is wider than viewport (${rect.width}px > ${analysis.viewport.width}px)`
                        });
                    }

                    if (rect.height > analysis.viewport.height) {
                        analysis.layoutIssues.push({
                            type: 'widget.too_tall',
                            element: widgetData,
                            message: `Widget is taller than viewport (${rect.height}px > ${analysis.viewport.height}px)`
                        });
                    }

                    if (rect.x < 0 || rect.y < 0) {
                        analysis.layoutIssues.push({
                            type: 'widget.positioned_offscreen',
                            element: widgetData,
                            message: `Widget positioned outside visible area (x: ${rect.x}, y: ${rect.y})`
                        });
                    }

                    if (rect.width === 0 || rect.height === 0) {
                        analysis.layoutIssues.push({
                            type: 'widget.zero_dimensions',
                            element: widgetData,
                            message: `Widget has zero dimensions (${rect.width}x${rect.height})`
                        });
                    }
                });
            });

            // Check for horizontal scrolling
            if (analysis.body.scrollWidth > analysis.viewport.width) {
                analysis.layoutIssues.push({
                    type: 'layout.horizontal_overflow',
                    message: `Page has horizontal overflow (${analysis.body.scrollWidth}px > ${analysis.viewport.width}px)`
                });
            }

            // Check CSS Grid/Flexbox layouts
            const gridContainers = document.querySelectorAll('[style*="grid"], .grid, [class*="grid"]');
            const flexContainers = document.querySelectorAll('[style*="flex"], .flex, [class*="flex"]');
            
            analysis.layoutSystems = {
                gridContainers: gridContainers.length,
                flexContainers: flexContainers.length
            };

            return analysis;
        });

        this.testResults.layoutIssues = layoutAnalysis.layoutIssues;
        this.testResults.sizingProblems = layoutAnalysis.widgets;
        
        console.log(`📐 Found ${layoutAnalysis.layoutIssues.length} layout issues`);
        console.log(`📐 Analyzed ${layoutAnalysis.widgets.length} widget components`);
        
        return layoutAnalysis;
    }

    async testEventHandlers() {
        console.log('🖱️ Testing event handlers and interactive elements...');

        const interactionTests = await this.page.evaluate(() => {
            const results = [];
            
            // Find interactive elements
            const interactiveSelectors = [
                'button', 'input', 'select', 'textarea',
                '[role="button"]', '[onclick]', '.clickable',
                'a[href]', '[tabindex]'
            ];

            interactiveSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const hasEventListeners = element.onclick !== null || 
                                             element.getAttribute('onclick') !== null ||
                                             element.hasAttribute('role');
                    
                    results.push({
                        selector: selector,
                        tagName: element.tagName,
                        hasEventListeners: hasEventListeners,
                        isDisabled: element.disabled,
                        isVisible: element.offsetParent !== null,
                        text: element.textContent.trim()
                    });
                });
            });

            return results;
        });

        // Test actual clicking on visible buttons
        const visibleButtons = await this.page.$$('button:not([disabled])');
        const buttonTestResults = [];

        for (const button of visibleButtons.slice(0, 3)) { // Test first 3 buttons
            try {
                const text = await button.evaluate(el => el.textContent.trim());
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any responses
                
                buttonTestResults.push({
                    text: text,
                    clicked: true,
                    error: null
                });
            } catch (error) {
                const text = await button.evaluate(el => el.textContent.trim());
                buttonTestResults.push({
                    text: text,
                    clicked: false,
                    error: error.message
                });
            }
        }

        console.log(`🖱️ Found ${interactionTests.length} interactive elements`);
        console.log(`🖱️ Tested ${buttonTestResults.length} button clicks`);
        
        return { interactionTests, buttonTestResults };
    }

    async testResponsiveDesign() {
        console.log('📱 Testing responsive design behavior...');

        const viewportSizes = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1920, height: 1080 }
        ];

        const responsiveResults = [];

        for (const viewport of viewportSizes) {
            await this.page.setViewport({
                width: viewport.width,
                height: viewport.height
            });

            await new Promise(resolve => setTimeout(resolve, 1000)); // Allow layout to adjust

            const layoutAtSize = await this.page.evaluate((viewportName) => {
                const body = document.body.getBoundingClientRect();
                const widgets = Array.from(document.querySelectorAll('[class*="widget"]')).map(el => {
                    const rect = el.getBoundingClientRect();
                    return {
                        className: el.className,
                        width: rect.width,
                        height: rect.height,
                        isVisible: rect.width > 0 && rect.height > 0
                    };
                });

                const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
                
                return {
                    viewportName: viewportName,
                    bodyWidth: body.width,
                    hasHorizontalScroll: hasHorizontalScroll,
                    widgets: widgets,
                    visibleWidgets: widgets.filter(w => w.isVisible).length
                };
            }, viewport.name);

            responsiveResults.push(layoutAtSize);

            if (layoutAtSize.hasHorizontalScroll) {
                this.testResults.responsiveIssues.push({
                    type: 'responsive.horizontal_scroll',
                    viewport: viewport.name,
                    message: `Horizontal scrolling required at ${viewport.width}px width`
                });
            }
        }

        // Reset to original viewport
        await this.page.setViewport({ width: 1920, height: 1080 });

        console.log(`📱 Tested ${viewportSizes.length} viewport sizes`);
        return responsiveResults;
    }

    async testAPIConnections() {
        console.log('🔌 Testing API connections and WebSocket functionality...');

        // Monitor network requests for a period
        const networkRequests = [];
        const wsConnections = [];

        this.page.on('request', (request) => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: new Date().toISOString()
            });
        });

        this.page.on('response', (response) => {
            if (response.url().includes('api/') || response.url().includes('socket')) {
                const request = networkRequests.find(req => req.url === response.url());
                if (request) {
                    request.status = response.status();
                    request.statusText = response.statusText();
                    request.ok = response.ok();
                }
            }
        });

        // Wait for network activity
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check for WebSocket connections
        const wsStatus = await this.page.evaluate(() => {
            const wsConnections = [];
            
            // Check if WebSocket is being used
            if (window.WebSocket) {
                // This is a basic check - in a real implementation, 
                // we'd need more sophisticated WebSocket monitoring
                return {
                    supported: true,
                    connections: 0 // Placeholder
                };
            }
            
            return {
                supported: false,
                connections: 0
            };
        });

        const apiRequests = networkRequests.filter(req => 
            req.url.includes('api/') || 
            req.url.includes('localhost:3003') ||
            req.resourceType === 'xhr' ||
            req.resourceType === 'fetch'
        );

        const failedRequests = apiRequests.filter(req => req.status && !req.ok);
        
        this.testResults.apiCallErrors.push(...failedRequests.map(req => ({
            type: 'api.failed_request',
            url: req.url,
            method: req.method,
            status: req.status,
            statusText: req.statusText,
            timestamp: req.timestamp
        })));

        console.log(`🔌 Monitored ${networkRequests.length} network requests`);
        console.log(`🔌 Found ${apiRequests.length} API calls`);
        console.log(`🔌 Found ${failedRequests.length} failed requests`);
        
        return { networkRequests, apiRequests, failedRequests, wsStatus };
    }

    async takeScreenshots() {
        console.log('📸 Taking diagnostic screenshots...');
        
        const screenshotDir = '/home/darlinghurstlinux/projects/home-dashboard/test-results';
        await fs.mkdir(screenshotDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Full page screenshot
        await this.page.screenshot({
            path: path.join(screenshotDir, `comprehensive-test-${timestamp}-fullpage.png`),
            fullPage: true
        });

        // Viewport screenshot
        await this.page.screenshot({
            path: path.join(screenshotDir, `comprehensive-test-${timestamp}-viewport.png`),
            fullPage: false
        });

        console.log('📸 Screenshots saved to test-results directory');
    }

    generateRecommendations() {
        console.log('💡 Generating recommendations...');

        const recommendations = [];

        // Console error recommendations
        if (this.testResults.consoleErrors.length > 0) {
            recommendations.push({
                category: 'JavaScript Errors',
                priority: 'high',
                issue: `Found ${this.testResults.consoleErrors.length} console errors`,
                recommendation: 'Review and fix console errors as they may indicate underlying JavaScript issues',
                action: 'Open browser DevTools and check Console tab for detailed error messages'
            });
        }

        // React component recommendations
        if (this.testResults.reactComponentErrors.length > 0) {
            recommendations.push({
                category: 'React Components',
                priority: 'high',
                issue: `Found ${this.testResults.reactComponentErrors.length} React component issues`,
                recommendation: 'Fix React component mounting and rendering issues',
                action: 'Check for missing props, incorrect state management, or component lifecycle issues'
            });
        }

        // Title-specific recommendations
        if (this.testResults.titleIssues.length > 0) {
            const titleIssueTypes = this.testResults.titleIssues.map(issue => issue.type);
            
            if (titleIssueTypes.includes('title.oversized')) {
                recommendations.push({
                    category: 'Title Issues',
                    priority: 'medium',
                    issue: 'Title font size may be too large',
                    recommendation: 'Reduce title font size or implement responsive typography',
                    action: 'Check CSS for .title, h1, or header selectors and adjust font-size values'
                });
            }

            if (titleIssueTypes.includes('title.positioned_offscreen')) {
                recommendations.push({
                    category: 'Title Issues',
                    priority: 'high',
                    issue: 'Title positioned outside visible area',
                    recommendation: 'Fix absolute positioning or CSS layout issues',
                    action: 'Review CSS position, top, left, transform properties for title elements'
                });
            }

            if (titleIssueTypes.includes('title.text_overflow')) {
                recommendations.push({
                    category: 'Title Issues',
                    priority: 'medium',
                    issue: 'Title text is being clipped',
                    recommendation: 'Increase container width or use responsive text sizing',
                    action: 'Add overflow: visible, text-overflow: ellipsis, or increase container width'
                });
            }
        }

        // Layout recommendations
        if (this.testResults.layoutIssues.length > 0) {
            const layoutIssueTypes = this.testResults.layoutIssues.map(issue => issue.type);
            
            if (layoutIssueTypes.includes('widget.too_wide')) {
                recommendations.push({
                    category: 'Layout Issues',
                    priority: 'high',
                    issue: 'Widgets wider than viewport',
                    recommendation: 'Implement responsive design for widget containers',
                    action: 'Use CSS max-width: 100%, flexbox, or CSS Grid with fr units'
                });
            }

            if (layoutIssueTypes.includes('layout.horizontal_overflow')) {
                recommendations.push({
                    category: 'Layout Issues',
                    priority: 'high',
                    issue: 'Page requires horizontal scrolling',
                    recommendation: 'Fix layout to prevent horizontal overflow',
                    action: 'Review CSS width values, margins, padding, and box-sizing properties'
                });
            }
        }

        // Responsive design recommendations
        if (this.testResults.responsiveIssues.length > 0) {
            recommendations.push({
                category: 'Responsive Design',
                priority: 'medium',
                issue: 'Layout issues at different screen sizes',
                recommendation: 'Implement proper responsive design with media queries',
                action: 'Add CSS media queries for mobile (max-width: 768px) and tablet viewports'
            });
        }

        // API connection recommendations
        if (this.testResults.apiCallErrors.length > 0) {
            recommendations.push({
                category: 'API Connectivity',
                priority: 'medium',
                issue: `Found ${this.testResults.apiCallErrors.length} API call failures`,
                recommendation: 'Implement proper error handling for failed API requests',
                action: 'Add try-catch blocks, loading states, and fallback UI for API failures'
            });
        }

        // General recommendations
        recommendations.push({
            category: 'General Improvement',
            priority: 'low',
            issue: 'Ongoing monitoring needed',
            recommendation: 'Set up regular automated testing to catch issues early',
            action: 'Implement CI/CD testing pipeline with Playwright or similar tools'
        });

        this.testResults.recommendations = recommendations;
        return recommendations;
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');

        const report = {
            summary: {
                timestamp: this.testResults.timestamp,
                url: this.testResults.url,
                totalIssues: this.testResults.consoleErrors.length + 
                           this.testResults.jsErrors.length + 
                           this.testResults.reactComponentErrors.length + 
                           this.testResults.titleIssues.length + 
                           this.testResults.layoutIssues.length + 
                           this.testResults.responsiveIssues.length + 
                           this.testResults.apiCallErrors.length,
                criticalIssues: this.testResults.recommendations.filter(r => r.priority === 'high').length,
                testStatus: 'completed'
            },
            detailedResults: this.testResults,
            prioritizedRecommendations: this.testResults.recommendations.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
        };

        const reportPath = '/home/darlinghurstlinux/projects/home-dashboard/test-results/comprehensive-test-report.json';
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Also generate a markdown summary
        const mdReport = this.generateMarkdownReport(report);
        const mdReportPath = '/home/darlinghurstlinux/projects/home-dashboard/COMPREHENSIVE_JS_LAYOUT_TEST_REPORT.md';
        await fs.writeFile(mdReportPath, mdReport);

        console.log('📊 Test report saved to:', reportPath);
        console.log('📊 Markdown report saved to:', mdReportPath);
        
        return report;
    }

    generateMarkdownReport(report) {
        const timestamp = new Date().toISOString();
        
        return `# Comprehensive JavaScript and Layout Test Report

**Generated:** ${timestamp}  
**Test URL:** ${report.summary.url}  
**Total Issues Found:** ${report.summary.totalIssues}  
**Critical Issues:** ${report.summary.criticalIssues}  

## Executive Summary

This comprehensive test analyzed the family dashboard for JavaScript errors, React component issues, layout problems, and title-specific issues. The testing covered:

- Console error analysis
- React component mounting verification
- Title sizing and positioning diagnostics
- Layout and responsive design testing
- API connectivity verification
- Event handler functionality

## Critical Findings

### Console Errors (${report.detailedResults.consoleErrors.length})
${report.detailedResults.consoleErrors.map(error => `- **${error.type}**: ${error.message}`).join('\n')}

### JavaScript Errors (${report.detailedResults.jsErrors.length})
${report.detailedResults.jsErrors.map(error => `- **${error.type}**: ${error.message}`).join('\n')}

### React Component Issues (${report.detailedResults.reactComponentErrors.length})
${report.detailedResults.reactComponentErrors.map(error => `- **${error.component || error.type}**: ${error.message}`).join('\n')}

### Title Issues (${report.detailedResults.titleIssues.length})
${report.detailedResults.titleIssues.map(issue => `- **${issue.type}**: ${issue.message}`).join('\n')}

### Layout Issues (${report.detailedResults.layoutIssues.length})
${report.detailedResults.layoutIssues.map(issue => `- **${issue.type}**: ${issue.message}`).join('\n')}

### API Call Errors (${report.detailedResults.apiCallErrors.length})
${report.detailedResults.apiCallErrors.map(error => `- **${error.type}**: ${error.url} (${error.status})`).join('\n')}

## Prioritized Recommendations

${report.prioritizedRecommendations.map(rec => `
### ${rec.category} (${rec.priority.toUpperCase()} priority)
**Issue:** ${rec.issue}  
**Recommendation:** ${rec.recommendation}  
**Action:** ${rec.action}
`).join('\n')}

## Next Steps

1. **Immediate Actions** (High Priority):
   ${report.prioritizedRecommendations.filter(r => r.priority === 'high').map(r => `- ${r.recommendation}`).join('\n   ')}

2. **Short-term Improvements** (Medium Priority):
   ${report.prioritizedRecommendations.filter(r => r.priority === 'medium').map(r => `- ${r.recommendation}`).join('\n   ')}

3. **Long-term Enhancements** (Low Priority):
   ${report.prioritizedRecommendations.filter(r => r.priority === 'low').map(r => `- ${r.recommendation}`).join('\n   ')}

## Technical Details

This test was performed using Puppeteer with comprehensive DOM analysis, network monitoring, and responsive design testing across multiple viewport sizes.

---
*Generated by Comprehensive JavaScript and Layout Testing Suite*
`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed successfully');
        }
    }

    async runComprehensiveTest() {
        try {
            console.log('🚀 Starting Comprehensive JavaScript and Layout Testing Suite...\n');

            await this.initializeBrowser();
            
            const dashboardLoaded = await this.loadDashboard();
            if (!dashboardLoaded) {
                console.error('❌ Failed to load dashboard - aborting tests');
                await this.cleanup();
                return false;
            }

            await this.analyzeConsoleErrors();
            await this.testReactComponentMounting();
            await this.analyzeTitleIssues();
            await this.analyzeLayoutAndSizing();
            await this.testEventHandlers();
            await this.testResponsiveDesign();
            await this.testAPIConnections();
            await this.takeScreenshots();

            this.generateRecommendations();
            const report = await this.generateReport();

            console.log('\n✅ Comprehensive testing completed!');
            console.log(`📊 Total issues found: ${report ? report.summary.totalIssues : 'N/A'}`);
            console.log(`🚨 Critical issues: ${report ? report.summary.criticalIssues : 'N/A'}`);
            console.log('📄 Detailed report saved to COMPREHENSIVE_JS_LAYOUT_TEST_REPORT.md');

            await this.cleanup();
            return report;

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            await this.cleanup();
            throw error;
        }
    }
}

// Run the comprehensive test if this script is executed directly
if (require.main === module) {
    const testSuite = new ComprehensiveTestingSuite();
    testSuite.runComprehensiveTest()
        .then(report => {
            console.log('\n🎉 Testing completed successfully!');
            if (report && report.summary && report.summary.criticalIssues > 0) {
                process.exit(1); // Exit with error code if critical issues found
            }
        })
        .catch(error => {
            console.error('💥 Testing failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveTestingSuite;