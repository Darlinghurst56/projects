#!/usr/bin/env node
// Dashboard Test with Puppeteer (lighter alternative to Playwright)

const fs = require('fs').promises;

async function testWithPuppeteer() {
  try {
    console.log('🚀 Starting Puppeteer Dashboard Test...\n');
    
    // Try to use a lightweight browser approach
    console.log('1. Installing Chrome for Testing...');
    
    // First try to install chrome for testing
    const { execSync } = require('child_process');
    
    try {
      execSync('npx @puppeteer/browsers install chrome@stable', { stdio: 'inherit' });
    } catch (e) {
      console.log('Chrome installation skipped - trying with existing setup');
    }
    
    const puppeteer = require('puppeteer-core');
    
    // Try different browser executable paths
    const possiblePaths = [
      '/home/darlinghurstlinux/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser', 
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/snap/bin/chromium',
      process.env.CHROME_PATH,
    ].filter(Boolean);
    
    let browser = null;
    let executablePath = null;
    
    for (const path of possiblePaths) {
      try {
        const { execSync } = require('child_process');
        execSync(`test -f "${path}"`, { stdio: 'ignore' });
        executablePath = path;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!executablePath) {
      console.log('❌ No Chrome/Chromium browser found at standard paths');
      console.log('📝 Tried paths:', possiblePaths);
      return false;
    }
    
    console.log('✅ Found browser at:', executablePath);
    
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--remote-debugging-port=9222',
      ],
    });
    
    const page = await browser.newPage();
    
    // Set up error monitoring
    const consoleErrors = [];
    const pageErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    console.log('\n2. Testing Dashboard Loading...');
    
    // Test dashboard loading
    await page.goto('http://localhost:3003/HurstHome', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('✅ Page navigation completed');
    
    // Wait for React to potentially render
    await page.waitForTimeout(5000);
    
    // Get page metrics
    const content = await page.content();
    const visibleText = await page.$eval('body', el => el.textContent);
    
    console.log('\n3. Dashboard Analysis:');
    console.log('   📊 HTML content length:', content.length);
    console.log('   📊 Visible text length:', visibleText.length);
    console.log('   📊 Console errors:', consoleErrors.length);
    console.log('   📊 Page errors:', pageErrors.length);
    
    // Check for React indicators
    const hasReactRoot = await page.$('#root');
    const reactRootContent = hasReactRoot ? await page.$eval('#root', el => el.innerHTML) : '';
    
    console.log('   📊 React root exists:', !!hasReactRoot);
    console.log('   📊 React root content length:', reactRootContent.length);
    
    // Take screenshots
    await fs.mkdir('tests/screenshots', { recursive: true });
    
    await page.screenshot({ 
      path: 'tests/screenshots/puppeteer-desktop.png',
      fullPage: true 
    });
    console.log('   📸 Desktop screenshot: tests/screenshots/puppeteer-desktop.png');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'tests/screenshots/puppeteer-mobile.png',
      fullPage: true 
    });
    console.log('   📸 Mobile screenshot: tests/screenshots/puppeteer-mobile.png');
    
    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\n4. Console Errors Found:');
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i+1}. ${error}`);
      });
    }
    
    if (pageErrors.length > 0) {
      console.log('\n5. Page Errors Found:');
      pageErrors.forEach((error, i) => {
        console.log(`   ${i+1}. ${error}`);
      });
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    
    if (reactRootContent.length > 0) {
      console.log('✅ REACT APP: Content is rendering in root element');
    } else if (visibleText.length > 50) {
      console.log('✅ STATIC CONTENT: Page has visible content');
    } else {
      console.log('❌ BLANK PAGE: Minimal or no content visible');
    }
    
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('✅ JAVASCRIPT: No errors detected');
    } else {
      console.log('❌ JAVASCRIPT: Errors detected - check logs above');
    }
    
    console.log('\n🌐 DASHBOARD STATUS:');
    console.log('   Primary URL: http://localhost:3003/HurstHome');
    console.log('   React Root Content:', reactRootContent.length > 0 ? 'RENDERING' : 'EMPTY');
    console.log('   Overall Status:', (reactRootContent.length > 0 || visibleText.length > 50) ? 'WORKING' : 'NEEDS INVESTIGATION');
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.log('❌ Puppeteer test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testWithPuppeteer();
  
  if (!success) {
    console.log('\n🔧 ALTERNATIVE APPROACH:');
    console.log('   1. Use browser manually: http://localhost:3003/HurstHome');
    console.log('   2. Open Developer Tools (F12) to check for errors');
    console.log('   3. Check Network tab for failed requests');
    console.log('   4. Widget graceful degradation should show error states');
  }
}

main().catch(console.error);