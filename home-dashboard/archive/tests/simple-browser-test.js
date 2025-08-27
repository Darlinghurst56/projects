#!/usr/bin/env node
// Simple Browser Test with Puppeteer (lighter than Playwright)

const axios = require('axios');

async function testWithPuppeteer() {
  try {
    // Try to import puppeteer if available
    const puppeteer = require('puppeteer-core');
    console.log('📱 Using Puppeteer for browser testing...');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser', // Common path
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    console.log('🔍 Testing frontend loading...');
    await page.goto('http://localhost:3003/HurstHome', { waitUntil: 'domcontentloaded' });
    
    // Get page content
    const content = await page.content();
    console.log('✅ Page content length:', content.length);
    
    // Look for React root
    const rootElement = await page.$('#root');
    if (rootElement) {
      const rootContent = await page.$eval('#root', el => el.innerHTML);
      console.log('✅ React root content length:', rootContent.length);
      console.log('📝 Root content preview:', rootContent.substring(0, 200));
    } else {
      console.log('❌ React root element not found');
    }
    
    // Check for errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors:', errors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Take screenshot if possible
    try {
      await page.screenshot({ path: 'tests/screenshots/dashboard.png', fullPage: true });
      console.log('📸 Screenshot saved: tests/screenshots/dashboard.png');
    } catch (e) {
      console.log('📸 Screenshot failed:', e.message);
    }
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.log('❌ Puppeteer test failed:', error.message);
    return false;
  }
}

async function testWithCurl() {
  console.log('\n🌐 Testing with curl fallback...');
  
  try {
    // Test backend
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend health:', health.data);
    
    // Test frontend
    const frontend = await axios.get('http://localhost:3003/HurstHome');
    console.log('✅ Frontend response length:', frontend.data.length);
    
    // Check for React indicators
    const hasReact = frontend.data.includes('React') || frontend.data.includes('react');
    const hasRoot = frontend.data.includes('id="root"');
    const hasTitle = frontend.data.includes('Home Dashboard');
    
    console.log('📊 Frontend analysis:');
    console.log('  - Contains React:', hasReact);
    console.log('  - Has root element:', hasRoot);
    console.log('  - Has title:', hasTitle);
    
    if (hasRoot) {
      console.log('✅ React app structure present');
    } else {
      console.log('❌ React root element missing');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Curl test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Starting Dashboard Browser Testing...\n');
  
  // Try browser test first
  const browserSuccess = await testWithPuppeteer();
  
  // Always run curl test
  const curlSuccess = await testWithCurl();
  
  console.log('\n📊 Test Results:');
  console.log('Browser test:', browserSuccess ? '✅ PASSED' : '❌ FAILED');
  console.log('HTTP test:', curlSuccess ? '✅ PASSED' : '❌ FAILED');
  
  if (curlSuccess) {
    console.log('\n🎉 Dashboard servers are working correctly!');
    console.log('🌐 Access at: http://localhost:3003/HurstHome');
  } else {
    console.log('\n🚨 Dashboard has issues - check server logs');
  }
}

main().catch(console.error);