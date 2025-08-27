#!/usr/bin/env node

/**
 * Simple Dashboard Layout Test
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testDashboard() {
    console.log('🚀 Testing dashboard at http://localhost:3003...\n');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const consoleMessages = [];
    const errors = [];

    // Capture console messages
    page.on('console', (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
        errors.push(`Page Error: ${error.message}`);
    });

    page.on('response', (response) => {
        if (response.status() >= 400) {
            errors.push(`HTTP ${response.status()}: ${response.url()}`);
        }
    });

    try {
        // Navigate to dashboard
        await page.goto('http://localhost:3003', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take screenshot
        const screenshotPath = '/home/darlinghurstlinux/projects/home-dashboard/dashboard-after-js-layout-fixes-2025-08-08.png';
        await page.screenshot({
            path: screenshotPath,
            fullPage: false,
            type: 'png'
        });

        console.log('✅ Screenshot saved:', screenshotPath);

        // Check for favicon
        try {
            const faviconResponse = await page.goto('http://localhost:3003/favicon.svg');
            console.log('✅ Favicon test:', faviconResponse.status() === 200 ? 'PASS' : 'FAIL');
        } catch (e) {
            console.log('❌ Favicon test: ERROR -', e.message);
        }

        // Go back to main page
        await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });

        // Check page content
        const title = await page.title();
        console.log('📄 Page title:', title);

        // Get basic page info
        const pageInfo = await page.evaluate(() => {
            return {
                url: window.location.href,
                bodyScrollWidth: document.body.scrollWidth,
                bodyScrollHeight: document.body.scrollHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                widgetCount: document.querySelectorAll('[class*="widget"], [class*="card"], .grid-item').length
            };
        });

        console.log('📐 Page dimensions:', pageInfo);
        console.log('🎯 Found', pageInfo.widgetCount, 'widgets/cards');

        // Report console messages
        console.log('\n📋 Console Messages (' + consoleMessages.length + ' total):');
        if (consoleMessages.length > 0) {
            consoleMessages.slice(0, 10).forEach(msg => console.log('  ', msg));
            if (consoleMessages.length > 10) {
                console.log('  ... and', consoleMessages.length - 10, 'more messages');
            }
        }

        // Report errors
        console.log('\n❌ Errors (' + errors.length + ' total):');
        if (errors.length > 0) {
            errors.forEach(error => console.log('  ', error));
        } else {
            console.log('   No errors detected! ✅');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testDashboard();