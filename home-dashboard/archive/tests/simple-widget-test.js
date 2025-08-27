#!/usr/bin/env node
// Simple Widget Test with Playwright Core

async function testWidgets() {
  console.log('🔍 Testing Widget Behavior with Browser...\n');
  
  try {
    const { chromium } = require('playwright-core');
    
    const browser = await chromium.launch({
      executablePath: '/home/darlinghurstlinux/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-extensions'
      ]
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages and errors
    const logs = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      logs.push(text);
      console.log('   📝', text);
    });
    
    page.on('pageerror', error => {
      const text = `[ERROR] ${error.message}`;
      logs.push(text);
      console.log('   💥', text);
    });
    
    console.log('1. Loading dashboard...');
    await page.goto('http://localhost:3003/HurstHome', { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    
    console.log('2. Waiting for JavaScript execution...');
    await page.waitForTimeout(10000);
    
    console.log('3. Analyzing page content...');
    
    // Get page content details
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'NO ROOT ELEMENT';
    });
    
    // Count different types of elements
    const elementCounts = await page.evaluate(() => {
      return {
        divs: document.querySelectorAll('div').length,
        widgets: document.querySelectorAll('[class*="widget"], [class*="card"]').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        images: document.querySelectorAll('img').length,
      };
    });
    
    // Look for specific text patterns
    const textPatterns = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasError: /error|failed|unavailable/i.test(text),
        hasLoading: /loading|wait/i.test(text),
        hasLogin: /login|sign in|authenticate/i.test(text),
        hasData: /dns|google|ai|calendar|gmail|drive/i.test(text),
        hasWelcome: /welcome|dashboard|home|hurst/i.test(text),
      };
    });
    
    // Take screenshots
    await page.screenshot({ 
      path: 'tests/screenshots/widget-test-desktop.png',
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'tests/screenshots/widget-test-mobile.png',
      fullPage: true 
    });
    
    await browser.close();
    
    // Analysis
    console.log('\n📊 ANALYSIS RESULTS:');
    console.log(`   Body text length: ${bodyText.length}`);
    console.log(`   Root HTML length: ${rootHTML.length}`);
    console.log(`   Element counts:`, elementCounts);
    console.log(`   Text patterns:`, textPatterns);
    console.log(`   Console logs: ${logs.length}`);
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - tests/screenshots/widget-test-desktop.png');
    console.log('   - tests/screenshots/widget-test-mobile.png');
    
    // Verdict
    console.log('\n🏁 WIDGET DEGRADATION VERDICT:');
    
    if (rootHTML === 'NO ROOT ELEMENT') {
      console.log('   ❌ CRITICAL: React root element missing entirely');
      return false;
    } else if (rootHTML.length === 0) {
      console.log('   ❌ CRITICAL: React root is empty - complete render failure');
      console.log('   🚨 This means widgets disappeared instead of gracefully degrading');
      return false;
    } else if (rootHTML.length < 50) {
      console.log('   ❌ FAIL: Minimal content in React root');
      console.log('   📝 Root content:', rootHTML);
      return false;
    } else if (elementCounts.widgets === 0 && elementCounts.divs < 5) {
      console.log('   ❌ FAIL: No widgets or meaningful content found');
      return false;
    } else if (bodyText.length < 100) {
      console.log('   ❌ FAIL: Very little visible text content');
      console.log('   📝 Body text:', bodyText.substring(0, 200));
      return false;
    } else {
      console.log('   ✅ PASS: Content is rendering in React');
      
      if (textPatterns.hasError || textPatterns.hasLoading) {
        console.log('   ✅ GOOD: Found error/loading states - proper graceful degradation');
      } else if (textPatterns.hasWelcome || textPatterns.hasData) {
        console.log('   ✅ GOOD: Found dashboard content - widgets are present');
      } else {
        console.log('   ⚠️ UNCLEAR: Content present but unclear if widgets are properly degrading');
        console.log('   📝 Sample text:', bodyText.substring(0, 300));
      }
      
      return true;
    }
    
  } catch (error) {
    console.log('❌ Browser test failed:', error.message);
    
    if (error.message.includes('libnspr4')) {
      console.log('\n🔧 SYSTEM DEPENDENCY MISSING:');
      console.log('   The browser needs system libraries to run.');
      console.log('   Install with: sudo apt-get install libnspr4 libnss3 libasound2t64');
    }
    
    return false;
  }
}

testWidgets().catch(console.error);