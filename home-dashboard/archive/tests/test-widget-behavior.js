#!/usr/bin/env node
// Test Widget Graceful Degradation Behavior

const axios = require('axios');

async function testWidgetBehavior() {
  console.log('🔍 Testing Widget Graceful Degradation Behavior...\n');
  
  try {
    // First, let's check what the frontend actually returns
    console.log('1. Analyzing Frontend Response...');
    const frontendResponse = await axios.get('http://localhost:3003/HurstHome');
    const html = frontendResponse.data;
    
    console.log('   ✅ Frontend HTML length:', html.length);
    console.log('   ✅ Contains React root:', html.includes('id="root"'));
    console.log('   ✅ Contains main script:', html.includes('/src/main.jsx'));
    
    // Check what happens when we try to access APIs that widgets would call
    console.log('\n2. Testing API Endpoints (Widget Dependencies)...');
    
    const apiTests = [
      { name: 'DNS Status', url: 'http://localhost:3000/api/dns/status' },
      { name: 'DNS Analytics', url: 'http://localhost:3000/api/dns/analytics' },
      { name: 'System Status', url: 'http://localhost:3000/api/system/status' },
      { name: 'Google Auth Status', url: 'http://localhost:3000/api/google/auth-status' },
    ];
    
    for (const api of apiTests) {
      try {
        const response = await axios.get(api.url, {
          headers: { 'Authorization': 'Bearer test-token' },
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          console.log(`   ✅ ${api.name}: Returns data (${response.data?.success ? 'success' : 'data'} response)`);
        } else if (response.status === 401) {
          console.log(`   🔐 ${api.name}: Auth required (${response.status}) - widget should show login prompt`);
        } else {
          console.log(`   ⚠️ ${api.name}: Status ${response.status} - widget should show error state`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ ${api.name}: Connection refused - widget should show offline state`);
        } else {
          console.log(`   ❌ ${api.name}: Error (${error.message}) - widget should show error state`);
        }
      }
    }
    
    // Test with a very simple browser automation using Playwright without system deps
    console.log('\n3. Attempting Browser Test (Limited Mode)...');
    
    try {
      // Try to use Playwright in a minimal way
      const { chromium } = require('playwright-core');
      
      const browser = await chromium.launch({
        executablePath: '/home/darlinghurstlinux/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--remote-debugging-port=0',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--run-all-compositor-stages-before-draw',
          '--disable-ipc-flooding-protection'
        ]
      });
      
      const page = await browser.newPage();
      
      // Monitor console messages and errors
      const consoleMessages = [];
      const pageErrors = [];
      
      page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(`${msg.type()}: ${text}`);
        if (msg.type() === 'error') {
          console.log(`   🐛 Console Error: ${text}`);
        }
      });
      
      page.on('pageerror', error => {
        pageErrors.push(error.message);
        console.log(`   💥 Page Error: ${error.message}`);
      });
      
      console.log('   🌐 Loading dashboard page...');
      await page.goto('http://localhost:3003/HurstHome', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Wait for any JavaScript to execute
      await page.waitForTimeout(8000);
      
      // Check what's actually in the page
      const bodyText = await page.locator('body').textContent();
      const rootContent = await page.locator('#root').innerHTML();
      
      console.log('\n4. Page Analysis Results:');
      console.log(`   📊 Body text length: ${bodyText.length}`);
      console.log(`   📊 Root element content length: ${rootContent.length}`);
      console.log(`   📊 Console messages: ${consoleMessages.length}`);
      console.log(`   📊 Page errors: ${pageErrors.length}`);
      
      // Look for widget-related content
      const widgetElements = await page.locator('[class*="widget"], [class*="card"], [class*="dns"], [class*="google"], [class*="ai"]').count();
      console.log(`   📊 Widget-like elements found: ${widgetElements}`);
      
      // Check for specific text that indicates graceful degradation
      const errorText = await page.locator('text=error, text=unavailable, text=offline, text=loading, text=failed').count();
      const loginText = await page.locator('text=login, text=sign in, text=authenticate').count();
      const fallbackText = await page.locator('text=fallback, text=degraded, text=limited').count();
      
      console.log(`   📊 Error state indicators: ${errorText}`);
      console.log(`   📊 Login prompts: ${loginText}`);
      console.log(`   📊 Fallback content: ${fallbackText}`);
      
      // Take screenshots
      await page.screenshot({ 
        path: 'tests/screenshots/widget-behavior-test.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: tests/screenshots/widget-behavior-test.png');
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'tests/screenshots/widget-behavior-mobile.png',
        fullPage: true 
      });
      console.log('   📸 Mobile screenshot saved: tests/screenshots/widget-behavior-mobile.png');
      
      await browser.close();
      
      // Analysis and verdict
      console.log('\n5. Widget Behavior Analysis:');
      
      if (rootContent.length === 0) {
        console.log('   ❌ CRITICAL: React root is empty - widgets completely disappeared');
        console.log('   🚨 This is NOT graceful degradation - this is a failed render');
      } else if (rootContent.length < 100) {
        console.log('   ⚠️ WARNING: Minimal content in React root - possible render issues');
        console.log('   🔍 Root content preview:', rootContent.substring(0, 200));
      } else {
        console.log('   ✅ React root has content - checking for proper degradation...');
        
        if (widgetElements === 0) {
          console.log('   ❌ FAIL: No widget elements found - widgets disappeared instead of degrading');
        } else if (errorText > 0 || fallbackText > 0) {
          console.log('   ✅ PASS: Found error states and fallback content - proper graceful degradation');
        } else if (bodyText.length < 200) {
          console.log('   ❌ FAIL: Very little visible content - likely rendering failure');
        } else {
          console.log('   ⚠️ UNCLEAR: Content present but unclear if proper degradation');
          console.log('   📝 Body text preview:', bodyText.substring(0, 300));
        }
      }
      
      if (pageErrors.length > 0) {
        console.log('\n   🐛 JavaScript Errors Detected:');
        pageErrors.forEach((error, i) => {
          console.log(`      ${i+1}. ${error}`);
        });
      }
      
      return true;
      
    } catch (browserError) {
      console.log('   ❌ Browser test failed:', browserError.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Widget behavior test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testWidgetBehavior();
  
  console.log('\n📋 WIDGET GRACEFUL DEGRADATION REQUIREMENTS:');
  console.log('   ✅ Widgets should remain visible with "No data available" messages');
  console.log('   ✅ Page layout should be preserved');
  console.log('   ✅ Error states should be user-friendly');
  console.log('   ✅ Loading states should show spinners/placeholders');
  console.log('   ❌ Widgets should NOT disappear completely');
  console.log('   ❌ Page should NOT be blank');
  
  if (!success) {
    console.log('\n🔧 DEBUGGING STEPS:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Verify widget components handle API failures properly');
    console.log('   3. Ensure error boundaries don\'t crash entire page');
    console.log('   4. Test each widget individually');
  }
}

main().catch(console.error);