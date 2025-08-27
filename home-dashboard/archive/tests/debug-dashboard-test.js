#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugDashboard() {
    console.log('🔍 Debug: Testing dashboard loading...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ],
            timeout: 60000
        });

        const page = await browser.newPage();
        
        // Set up event listeners
        page.on('console', (msg) => {
            console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
        });
        
        page.on('pageerror', (error) => {
            console.log('PAGE ERROR:', error.message);
        });
        
        page.on('requestfailed', (request) => {
            console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
        });

        console.log('📄 Attempting to load http://localhost:3003/...');
        
        const response = await page.goto('http://localhost:3003/', {
            waitUntil: ['networkidle0'],
            timeout: 30000
        });

        console.log('📊 Response status:', response.status());
        console.log('📊 Response OK:', response.ok());
        
        if (response.ok()) {
            console.log('✅ Dashboard loaded successfully!');
            
            // Check page title
            const title = await page.title();
            console.log('📄 Page title:', title);
            
            // Check if React root exists
            const reactRoot = await page.$('#root');
            console.log('⚛️ React root found:', !!reactRoot);
            
            // Wait a bit for React to load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check for main elements
            const mainElements = await page.evaluate(() => {
                return {
                    hasBody: !!document.body,
                    hasRoot: !!document.querySelector('#root'),
                    rootContent: document.querySelector('#root') ? document.querySelector('#root').innerHTML.length : 0,
                    bodyContent: document.body.innerHTML.length,
                    title: document.title,
                    url: window.location.href
                };
            });
            
            console.log('📊 Page analysis:', JSON.stringify(mainElements, null, 2));
            
            // Take screenshot
            await page.screenshot({
                path: 'debug-dashboard-screenshot.png',
                fullPage: true
            });
            
            console.log('📸 Screenshot saved as debug-dashboard-screenshot.png');
            
        } else {
            console.error('❌ Failed to load dashboard:', response.status(), response.statusText());
        }

    } catch (error) {
        console.error('💥 Error during debug test:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed');
        }
    }
}

debugDashboard();