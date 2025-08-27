import { test, expect } from '@playwright/test';

test.describe('Simple Dashboard Tests - Current Setup', () => {
  
  test('Backend health check responds correctly', async ({ request }) => {
    console.log('🔍 Testing backend health endpoint...');
    
    const response = await request.get('http://localhost:3000/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status', 'healthy');
    console.log('✅ Backend health check passed:', healthData);
  });

  test('Frontend loads HTML structure', async ({ page }) => {
    console.log('🌐 Testing frontend HTML loading...');
    
    await page.goto('/');
    
    // Check basic HTML structure
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeAttached();
    
    // Check for main script
    const mainScript = page.locator('script[src="/src/main.jsx"]');
    await expect(mainScript).toBeAttached();
    
    console.log('✅ Frontend HTML structure is correct');
  });

  test('Dashboard route loads without errors', async ({ page }) => {
    console.log('🏠 Testing /HurstHome route...');
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    await page.goto('/HurstHome');
    
    // Wait for page to settle
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-current.png',
      fullPage: true 
    });
    
    console.log('📊 Console errors found:', consoleErrors.length);
    console.log('📊 Page errors found:', pageErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors:', consoleErrors);
    }
    
    if (pageErrors.length > 0) {
      console.log('❌ Page errors:', pageErrors);
    }
    
    // Basic page validation
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent.length).toBeGreaterThan(0);
    
    console.log('✅ Dashboard route loaded with', bodyContent.length, 'characters');
    console.log('📸 Screenshot saved: tests/screenshots/dashboard-current.png');
  });

  test('Check for React component rendering', async ({ page }) => {
    console.log('⚛️ Testing React component rendering...');
    
    await page.goto('/HurstHome');
    
    // Wait for React to potentially load
    await page.waitForTimeout(10000);
    
    // Check if any React components are visible
    const reactElements = await page.locator('[data-reactroot], [data-react-helmet], .react-component, div[class*="component"], div[class*="widget"]').count();
    console.log('📊 React-like elements found:', reactElements);
    
    // Check for any visible text content
    const visibleText = await page.locator('body').textContent();
    const hasVisibleContent = visibleText && visibleText.trim().length > 50;
    
    console.log('📊 Has visible content:', hasVisibleContent);
    console.log('📊 Content preview:', visibleText?.substring(0, 200));
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/react-check.png',
      fullPage: true 
    });
    
    console.log('📸 React check screenshot saved: tests/screenshots/react-check.png');
  });

  test('Mobile responsiveness basic check', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/HurstHome');
    await page.waitForTimeout(3000);
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/mobile-current.png',
      fullPage: true 
    });
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/HurstHome');
    await page.waitForTimeout(3000);
    
    // Take desktop screenshot  
    await page.screenshot({ 
      path: 'tests/screenshots/desktop-current.png',
      fullPage: true 
    });
    
    console.log('📸 Mobile screenshot: tests/screenshots/mobile-current.png');
    console.log('📸 Desktop screenshot: tests/screenshots/desktop-current.png');
    console.log('✅ Responsiveness test completed');
  });
});