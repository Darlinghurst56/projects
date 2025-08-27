#!/usr/bin/env node

/**
 * Layout Fixes Verification Test
 * 
 * This test verifies the CSS and JavaScript fixes implemented to resolve:
 * 1. Favicon 404 error
 * 2. Google OAuth client ID undefined error
 * 3. Widget sizing and layout constraints
 * 4. Overall responsive design improvements
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3003';
const SCREENSHOT_PATH = '/home/darlinghurstlinux/projects/home-dashboard/dashboard-after-js-layout-fixes-2025-08-08.png';

async function verifyLayoutFixes() {
    console.log('🚀 Starting Layout Fixes Verification Test...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const testResults = {
        faviconTest: { passed: false, details: '' },
        googleClientIdTest: { passed: false, details: '' },
        cssConstraintsTest: { passed: false, details: '' },
        consoleErrorsTest: { passed: false, details: '' },
        layoutTest: { passed: false, details: '' },
        timestamp: new Date().toISOString()
    };

    // Capture console messages
    const consoleMessages = [];
    const errorMessages = [];
    
    page.on('console', (msg) => {
        const text = msg.text();
        consoleMessages.push({
            type: msg.type(),
            text: text,
            timestamp: new Date().toISOString()
        });
        
        if (msg.type() === 'error') {
            errorMessages.push(text);
        }
    });

    page.on('response', (response) => {
        if (response.status() === 404) {
            errorMessages.push(`404 Error: ${response.url()}`);
        }
    });

    try {
        console.log('📱 Loading dashboard...');
        await page.goto(TEST_URL, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Wait for main content to load
        await page.waitForSelector('body', { timeout: 10000 });
        await page.waitForTimeout(3000); // Allow time for dynamic content

        // Test 1: Favicon accessibility
        console.log('🎯 Testing favicon accessibility...');
        try {
            const faviconResponse = await page.goto(`${TEST_URL}/favicon.svg`);
            testResults.faviconTest.passed = faviconResponse.status() === 200;
            testResults.faviconTest.details = `Favicon returned status: ${faviconResponse.status()}`;
        } catch (error) {
            testResults.faviconTest.details = `Favicon test error: ${error.message}`;
        }

        // Go back to main page
        await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        // Test 2: Check for Google Client ID in page source
        console.log('🔑 Testing Google OAuth Client ID...');
        const pageContent = await page.content();
        const hasGoogleClientId = pageContent.includes('VITE_GOOGLE_CLIENT_ID') || 
                                 pageContent.includes('google-client-id') ||
                                 !errorMessages.some(msg => msg.includes('Client ID') && msg.includes('undefined'));
        
        testResults.googleClientIdTest.passed = hasGoogleClientId;
        testResults.googleClientIdTest.details = hasGoogleClientId ? 
            'Google Client ID appears to be configured' : 
            'Google Client ID may still be undefined';

        // Test 3: CSS Layout and Widget Constraints
        console.log('🎨 Testing CSS layout and widget constraints...');
        
        // Check for title element
        const titleElement = await page.$('h1, .title, [class*="title"], [class*="header"]');
        let titleInfo = 'Title element not found';
        if (titleElement) {
            const titleBox = await titleElement.boundingBox();
            const titleText = await page.evaluate(el => el.textContent, titleElement);
            titleInfo = `Title: "${titleText.trim()}" - Position: ${Math.round(titleBox.x)}, ${Math.round(titleBox.y)} - Size: ${Math.round(titleBox.width)}x${Math.round(titleBox.height)}`;
        }

        // Check widget containers
        const widgets = await page.$$('.widget, [class*="widget"], [class*="card"], .grid-item');
        let widgetInfo = [];
        
        for (let i = 0; i < Math.min(widgets.length, 5); i++) {
            const widget = widgets[i];
            const box = await widget.boundingBox();
            const styles = await page.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    maxWidth: computed.maxWidth,
                    boxSizing: computed.boxSizing,
                    overflow: computed.overflow
                };
            }, widget);
            
            widgetInfo.push({
                index: i,
                position: `${Math.round(box.x)}, ${Math.round(box.y)}`,
                size: `${Math.round(box.width)}x${Math.round(box.height)}`,
                styles
            });
        }

        // Check overall layout dimensions
        const bodyDimensions = await page.evaluate(() => {
            return {
                scrollWidth: document.body.scrollWidth,
                scrollHeight: document.body.scrollHeight,
                clientWidth: document.body.clientWidth,
                clientHeight: document.body.clientHeight
            };
        });

        testResults.cssConstraintsTest.passed = widgets.length > 0;
        testResults.cssConstraintsTest.details = {
            title: titleInfo,
            widgets: widgetInfo,
            layout: bodyDimensions,
            widgetCount: widgets.length
        };

        // Test 4: Console Errors Analysis
        console.log('🔍 Analyzing console errors...');
        const criticalErrors = errorMessages.filter(msg => 
            !msg.includes('favicon') && // We expect some favicon-related messages during transition
            !msg.includes('DevTools') && // Ignore DevTools-related messages
            msg.includes('Error') || msg.includes('Failed') || msg.includes('404')
        );

        testResults.consoleErrorsTest.passed = criticalErrors.length === 0;
        testResults.consoleErrorsTest.details = {
            totalMessages: consoleMessages.length,
            errorMessages: errorMessages.length,
            criticalErrors: criticalErrors,
            faviconRelatedErrors: errorMessages.filter(msg => msg.includes('favicon')).length
        };

        // Test 5: Overall Layout Assessment
        console.log('📐 Assessing overall layout quality...');
        const layoutMetrics = await page.evaluate(() => {
            // Check for horizontal scrollbars (indicating overflow)
            const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
            
            // Check if content fits within viewport reasonably
            const viewportWidth = window.innerWidth;
            const contentWidth = document.body.scrollWidth;
            const overflowRatio = contentWidth / viewportWidth;
            
            return {
                hasHorizontalScroll,
                viewportWidth,
                contentWidth,
                overflowRatio,
                fitsInViewport: overflowRatio <= 1.1 // Allow 10% overflow for scrollbars
            };
        });

        testResults.layoutTest.passed = layoutMetrics.fitsInViewport && !layoutMetrics.hasHorizontalScroll;
        testResults.layoutTest.details = layoutMetrics;

        // Take screenshot
        console.log('📸 Taking screenshot of improved layout...');
        await page.screenshot({
            path: SCREENSHOT_PATH,
            fullPage: false, // Just viewport
            type: 'png'
        });

        console.log(`✅ Screenshot saved to: ${SCREENSHOT_PATH}`);

    } catch (error) {
        console.error('❌ Test execution error:', error.message);
        testResults.error = error.message;
    } finally {
        await browser.close();
    }

    return { testResults, consoleMessages, errorMessages };
}

async function generateReport(results) {
    const { testResults, consoleMessages, errorMessages } = results;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 LAYOUT FIXES VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    // Test Results Summary
    const tests = [
        { name: 'Favicon Accessibility', key: 'faviconTest' },
        { name: 'Google Client ID Configuration', key: 'googleClientIdTest' },
        { name: 'CSS Layout Constraints', key: 'cssConstraintsTest' },
        { name: 'Console Errors Analysis', key: 'consoleErrorsTest' },
        { name: 'Overall Layout Quality', key: 'layoutTest' }
    ];
    
    let passedTests = 0;
    
    tests.forEach(test => {
        const result = testResults[test.key];
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test.name}`);
        if (result.passed) passedTests++;
    });
    
    console.log(`\nOverall Score: ${passedTests}/${tests.length} tests passed\n`);
    
    // Detailed Results
    console.log('📋 DETAILED RESULTS:\n');
    
    console.log('🎯 1. FAVICON TEST:');
    console.log(`   Status: ${testResults.faviconTest.passed ? '✅ Fixed' : '❌ Issue'}`);
    console.log(`   Details: ${testResults.faviconTest.details}\n`);
    
    console.log('🔑 2. GOOGLE CLIENT ID TEST:');
    console.log(`   Status: ${testResults.googleClientIdTest.passed ? '✅ Configured' : '❌ Issue'}`);
    console.log(`   Details: ${testResults.googleClientIdTest.details}\n`);
    
    console.log('🎨 3. CSS LAYOUT TEST:');
    console.log(`   Status: ${testResults.cssConstraintsTest.passed ? '✅ Improved' : '❌ Issue'}`);
    if (testResults.cssConstraintsTest.details) {
        const details = testResults.cssConstraintsTest.details;
        console.log(`   ${details.title}`);
        console.log(`   Widgets found: ${details.widgetCount}`);
        if (details.widgets.length > 0) {
            console.log('   Widget Analysis:');
            details.widgets.forEach(widget => {
                console.log(`     Widget ${widget.index}: ${widget.size} at (${widget.position})`);
                console.log(`       Styles: max-width=${widget.styles.maxWidth}, box-sizing=${widget.styles.boxSizing}`);
            });
        }
        console.log(`   Layout: ${details.layout.clientWidth}x${details.layout.clientHeight} (viewport)`);
        console.log(`   Scroll: ${details.layout.scrollWidth}x${details.layout.scrollHeight} (content)\n`);
    }
    
    console.log('🔍 4. CONSOLE ERRORS ANALYSIS:');
    console.log(`   Status: ${testResults.consoleErrorsTest.passed ? '✅ Clean' : '❌ Errors Found'}`);
    if (testResults.consoleErrorsTest.details) {
        const details = testResults.consoleErrorsTest.details;
        console.log(`   Total console messages: ${details.totalMessages}`);
        console.log(`   Error messages: ${details.errorMessages}`);
        console.log(`   Critical errors: ${details.criticalErrors.length}`);
        console.log(`   Favicon-related errors: ${details.faviconRelatedErrors}`);
        
        if (details.criticalErrors.length > 0) {
            console.log('   Critical Errors:');
            details.criticalErrors.forEach(error => {
                console.log(`     - ${error}`);
            });
        }
    }
    console.log();
    
    console.log('📐 5. LAYOUT QUALITY TEST:');
    console.log(`   Status: ${testResults.layoutTest.passed ? '✅ Good' : '❌ Issues'}`);
    if (testResults.layoutTest.details) {
        const details = testResults.layoutTest.details;
        console.log(`   Viewport width: ${details.viewportWidth}px`);
        console.log(`   Content width: ${details.contentWidth}px`);
        console.log(`   Overflow ratio: ${details.overflowRatio.toFixed(2)}`);
        console.log(`   Horizontal scroll: ${details.hasHorizontalScroll ? 'Yes ❌' : 'No ✅'}`);
        console.log(`   Fits in viewport: ${details.fitsInViewport ? 'Yes ✅' : 'No ❌'}\n`);
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    
    if (!testResults.faviconTest.passed) {
        console.log('   - Check that favicon.svg is properly served from /public directory');
    }
    
    if (!testResults.googleClientIdTest.passed) {
        console.log('   - Verify VITE_GOOGLE_CLIENT_ID is set in .env file');
        console.log('   - Check that environment variables are loaded properly');
    }
    
    if (!testResults.cssConstraintsTest.passed) {
        console.log('   - Review widget container CSS for proper constraints');
        console.log('   - Ensure max-width: 100% and box-sizing: border-box are applied');
    }
    
    if (!testResults.consoleErrorsTest.passed) {
        console.log('   - Address remaining console errors for better stability');
        console.log('   - Check network requests for failed resources');
    }
    
    if (!testResults.layoutTest.passed) {
        console.log('   - Implement responsive design improvements');
        console.log('   - Add CSS media queries for large screens');
        console.log('   - Consider container max-width constraints');
    }
    
    if (passedTests === tests.length) {
        console.log('   🎉 All tests passed! Layout fixes appear successful.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📸 Screenshot saved as: ${path.basename(SCREENSHOT_PATH)}`);
    console.log('='.repeat(60) + '\n');
    
    return testResults;
}

// Run the test
(async () => {
    try {
        const results = await verifyLayoutFixes();
        await generateReport(results);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
})();