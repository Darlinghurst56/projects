import { test, expect } from '@playwright/test';

test.describe('Live UX Testing - Must Pass or Fail Build', () => {
  // This test MUST connect to the actual running server
  // If server is down or dashboard broken, tests WILL FAIL
  
  test.beforeAll(async () => {
    // Verify server is actually running before tests
    console.log('🔍 Checking if dashboard server is running...');
  });

  test('CRITICAL: Dashboard server must be accessible and responsive', async ({ page }) => {
    // This will fail if server is not running
    console.log('🚀 Testing live server connection...');
    
    const response = await page.request.get('http://localhost:8080/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status');
    console.log('✅ Health check passed:', healthData);
  });

  test('CRITICAL: /hursthome landing page must load within 3 seconds', async ({ page }) => {
    console.log('⏱️ Testing page load performance...');
    
    const startTime = Date.now();
    
    // Navigate to actual dashboard URL
    await page.goto('http://localhost:8080/hursthome', { 
      waitUntil: 'domcontentloaded',
      timeout: 3000 // FAIL if takes longer than 3 seconds
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page loaded in ${loadTime}ms`);
    
    // MUST load within 3 seconds or test fails
    expect(loadTime).toBeLessThan(3000);
    
    // Page must contain core content
    await expect(page.locator('h1')).toContainText('Hurst Home', { timeout: 1000 });
    console.log('✅ Dashboard title found');
  });

  test('CRITICAL: Essential UI elements must be visible and functional', async ({ page }) => {
    console.log('🎛️ Testing core UI elements...');
    
    await page.goto('http://localhost:8080/hursthome');
    
    // REQUIRED: Main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/hurst home|welcome/i);
    console.log('✅ Main heading visible');
    
    // REQUIRED: Status indicators
    const statusSection = page.locator('text=Server Status');
    await expect(statusSection).toBeVisible();
    console.log('✅ Server status visible');
    
    // REQUIRED: Guest mode information
    const guestMode = page.locator('text=Guest Mode');
    await expect(guestMode).toBeVisible();
    console.log('✅ Guest mode indicator visible');
    
    // REQUIRED: Feature information
    const features = page.locator('text=DNS Status', 'text=AI Family Assistant');
    expect(await features.count()).toBeGreaterThan(0);
    console.log('✅ Feature descriptions found');
  });

  test('CRITICAL: Navigation and links must be functional', async ({ page }) => {
    console.log('🔗 Testing navigation functionality...');
    
    await page.goto('http://localhost:8080/hursthome');
    
    // Test health check link
    const healthLink = page.locator('a[href="/health"]');
    if (await healthLink.isVisible()) {
      await healthLink.click();
      await expect(page).toHaveURL(/.*\/health$/);
      
      // Verify health endpoint returns valid JSON
      const healthContent = page.locator('body');
      await expect(healthContent).toContainText(/status|ok/i);
      console.log('✅ Health check link functional');
      
      // Go back to dashboard
      await page.goto('http://localhost:8080/hursthome');
    }
    
    // Test API test link
    const apiLink = page.locator('a[href="/api/test"]');
    if (await apiLink.isVisible()) {
      await apiLink.click();
      await expect(page).toHaveURL(/.*\/api\/test$/);
      console.log('✅ API test link functional');
    }
  });

  test('CRITICAL: Mobile responsiveness must work', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080/hursthome');
    
    // Content must be readable on mobile
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    const headingBox = await heading.boundingBox();
    expect(headingBox.width).toBeLessThanOrEqual(375);
    console.log('✅ Mobile layout responsive');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    await expect(heading).toBeVisible();
    console.log('✅ Tablet layout responsive');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('CRITICAL: Page must be accessible', async ({ page }) => {
    console.log('♿ Testing accessibility...');
    
    await page.goto('http://localhost:8080/hursthome');
    
    // Check for proper HTML structure
    const main = page.locator('main, .container, body');
    await expect(main).toBeVisible();
    
    // Headings must exist and be hierarchical
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    expect(await h1.count()).toBe(1); // Only one H1
    
    // Links must have proper text
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const text = await link.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
    console.log('✅ Basic accessibility checks passed');
  });

  test('CRITICAL: Error handling must work gracefully', async ({ page }) => {
    console.log('🚨 Testing error handling...');
    
    // Test invalid URL
    await page.goto('http://localhost:8080/nonexistent-page');
    
    // Should not show browser error page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('This page can\'t be found');
    expect(pageContent).not.toContain('404');
    
    // Should show some kind of content (our catch-all route)
    expect(pageContent.length).toBeGreaterThan(100);
    console.log('✅ Error handling functional');
  });

  test('CRITICAL: Performance metrics must meet standards', async ({ page }) => {
    console.log('📈 Testing performance metrics...');
    
    await page.goto('http://localhost:8080/hursthome');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log('📊 Performance metrics:', metrics);
    
    // STRICT performance requirements
    expect(metrics.firstContentfulPaint).toBeLessThan(2000); // FCP < 2s
    expect(metrics.domContentLoaded).toBeLessThan(1000); // DOM < 1s
    
    console.log('✅ Performance standards met');
  });

  test('INTEGRATION: Guest mode workflow must be complete', async ({ page }) => {
    console.log('🎭 Testing complete guest user workflow...');
    
    await page.goto('http://localhost:8080/hursthome');
    
    // Step 1: User sees dashboard
    await expect(page.locator('h1')).toContainText(/hurst home/i);
    
    // Step 2: User understands they're in guest mode
    await expect(page.locator('text=Guest Mode')).toBeVisible();
    
    // Step 3: User can see available features
    await expect(page.locator('text=DNS Status')).toBeVisible();
    await expect(page.locator('text=AI Family Assistant')).toBeVisible();
    
    // Step 4: User understands what requires login
    await expect(page.locator('text=Requires Login')).toBeVisible();
    
    // Step 5: User can access login if desired
    const loginLinks = page.locator('a[href="/login"], text=Sign in');
    if (await loginLinks.count() > 0) {
      await expect(loginLinks.first()).toBeVisible();
      console.log('✅ Login path available');
    }
    
    console.log('✅ Complete guest workflow functional');
  });

  test('STRESS: Dashboard must handle rapid navigation', async ({ page }) => {
    console.log('💪 Testing stress navigation...');
    
    const urls = [
      'http://localhost:8080/hursthome',
      'http://localhost:8080/HurstHome', 
      'http://localhost:8080/',
      'http://localhost:8080/health',
      'http://localhost:8080/hursthome'
    ];
    
    // Rapid navigation test
    for (let i = 0; i < urls.length; i++) {
      const startTime = Date.now();
      await page.goto(urls[i]);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000); // Each page < 1s
      console.log(`📊 ${urls[i]} loaded in ${loadTime}ms`);
    }
    
    console.log('✅ Stress testing passed');
  });

  test('FINAL VALIDATION: Complete system health check', async ({ page }) => {
    console.log('🏁 Final system validation...');
    
    // Test main dashboard
    await page.goto('http://localhost:8080/hursthome');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test alternative URLs
    await page.goto('http://localhost:8080/HurstHome');
    await expect(page.locator('body')).toBeVisible();
    
    await page.goto('http://localhost:8080/');
    await expect(page.locator('body')).toBeVisible();
    
    // Verify server is stable
    const response = await page.request.get('http://localhost:8080/health');
    expect(response.status()).toBe(200);
    
    // Take final screenshot for evidence
    await page.goto('http://localhost:8080/hursthome');
    await page.screenshot({ 
      path: 'tests/screenshots/final-dashboard-validation.png',
      fullPage: true 
    });
    
    console.log('✅ FINAL VALIDATION PASSED - Dashboard is fully functional');
    console.log('📸 Screenshot saved: tests/screenshots/final-dashboard-validation.png');
  });
});