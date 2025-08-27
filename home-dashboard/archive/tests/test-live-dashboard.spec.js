import { test, expect } from '@playwright/test';

// Updated Live UX Testing for Current Port Configuration
test.describe('Live Dashboard UX Testing - Current Ports', () => {
  
  test('CRITICAL: Backend health check on port 3000', async ({ page }) => {
    console.log('🔍 Testing backend health...');
    
    const response = await page.request.get('http://localhost:3000/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status');
    console.log('✅ Backend health check passed:', healthData);
  });

  test('CRITICAL: Frontend loads on port 3003 with React content', async ({ page }) => {
    console.log('🚀 Testing frontend loading...');
    
    const startTime = Date.now();
    
    // Navigate to frontend
    await page.goto('http://localhost:3003/', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Frontend loaded in ${loadTime}ms`);
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 5000 });
    
    // Check if React app is loaded
    const rootContent = await page.locator('#root').innerHTML();
    console.log('Root content length:', rootContent.length);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'tests/screenshots/frontend-loading.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: tests/screenshots/frontend-loading.png');
  });

  test('CRITICAL: Dashboard route /HurstHome loads correctly', async ({ page }) => {
    console.log('🏠 Testing /HurstHome route...');
    
    await page.goto('http://localhost:3003/HurstHome', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Wait for any React components to load
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what's actually loading
    await page.screenshot({ 
      path: 'tests/screenshots/hursthome-route.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: tests/screenshots/hursthome-route.png');
    
    // Check for any visible content
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body content length:', bodyContent.length);
    
    // Look for any text content
    const visibleText = await page.locator('body').textContent();
    console.log('Visible text:', visibleText?.substring(0, 200));
  });

  test('CRITICAL: Check for JavaScript errors in console', async ({ page }) => {
    console.log('🐛 Checking for JavaScript errors...');
    
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    await page.goto('http://localhost:3003/HurstHome');
    await page.waitForTimeout(5000);
    
    console.log('Console messages:', consoleMessages);
    console.log('Errors found:', errors);
    
    // Take screenshot showing current state
    await page.screenshot({ 
      path: 'tests/screenshots/error-check.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: tests/screenshots/error-check.png');
    
    // Report findings
    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected:', errors);
    } else {
      console.log('✅ No JavaScript errors found');
    }
  });

  test('CRITICAL: Test widget graceful degradation', async ({ page }) => {
    console.log('🔧 Testing widget graceful degradation...');
    
    await page.goto('http://localhost:3003/HurstHome');
    await page.waitForTimeout(5000);
    
    // Look for error states or fallback content
    const errorElements = await page.locator('[class*="error"], [class*="fallback"], [class*="loading"]').count();
    console.log('Error/fallback elements found:', errorElements);
    
    // Look for widget containers
    const widgets = await page.locator('[class*="widget"], [class*="card"], [class*="component"]').count();
    console.log('Widget elements found:', widgets);
    
    // Check for any "graceful degradation" messages
    const degradationText = await page.locator('text=degradation, text=fallback, text=unavailable').count();
    console.log('Degradation messages found:', degradationText);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/widget-degradation.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: tests/screenshots/widget-degradation.png');
  });

  test('CRITICAL: Mobile responsiveness check', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/HurstHome');
    await page.waitForTimeout(3000);
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/mobile-view.png',
      fullPage: true 
    });
    console.log('📸 Mobile screenshot saved: tests/screenshots/mobile-view.png');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Take tablet screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/tablet-view.png',
      fullPage: true 
    });
    console.log('📸 Tablet screenshot saved: tests/screenshots/tablet-view.png');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Take desktop screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/desktop-view.png',
      fullPage: true 
    });
    console.log('📸 Desktop screenshot saved: tests/screenshots/desktop-view.png');
  });
});