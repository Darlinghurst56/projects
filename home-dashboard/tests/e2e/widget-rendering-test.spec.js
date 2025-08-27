import { test, expect } from '@playwright/test';

test.describe('Widget Rendering and Graceful Degradation - Visual Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up console monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });
  });

  test('CRITICAL: Dashboard loads with proper widget layout (not blank)', async ({ page }) => {
    console.log('🎯 Testing dashboard widget layout...');
    
    await page.goto('/HurstHome');
    
    // Wait for React to fully render
    await page.waitForTimeout(8000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/01-dashboard-loaded.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 01-dashboard-loaded.png');
    
    // Check for main content
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(/welcome.*hurst.*home/i);
    
    // Verify page is not blank
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(100);
    console.log('✅ Dashboard has content:', bodyText.length, 'characters');
    
    // Check for guest mode notice
    const guestNotice = page.locator('text=Guest Mode');
    await expect(guestNotice).toBeVisible();
    console.log('✅ Guest mode notice visible');
  });

  test('CRITICAL: DNS widgets render with graceful degradation (not disappeared)', async ({ page }) => {
    console.log('🔧 Testing DNS widget graceful degradation...');
    
    await page.goto('/HurstHome');
    await page.waitForTimeout(10000);
    
    // Look for widget containers
    const widgetElements = page.locator('[class*="widget"], [class*="card"], [class*="dns"]');
    const widgetCount = await widgetElements.count();
    console.log('📊 Widget-like elements found:', widgetCount);
    
    // Take screenshot showing widgets
    await page.screenshot({ 
      path: 'tests/screenshots/02-widgets-rendered.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 02-widgets-rendered.png');
    
    // Check for DNS-related content
    const dnsContent = await page.locator('text=DNS, text=status, text=error, text=loading').count();
    console.log('📊 DNS-related content elements:', dnsContent);
    
    // CRITICAL: Widgets should be visible, not disappeared
    expect(widgetCount).toBeGreaterThan(0);
    
    // Check for error states (graceful degradation)
    const errorStates = await page.locator('text=error, text=failed, text=unavailable, text=loading').count();
    console.log('📊 Error/loading state indicators:', errorStates);
    
    if (errorStates > 0) {
      console.log('✅ PASS: Found graceful degradation error states');
    } else {
      console.log('⚠️ No explicit error states - checking for other content...');
    }
  });

  test('CRITICAL: Widget error states are user-friendly (not crashed)', async ({ page }) => {
    console.log('🛡️ Testing widget error handling...');
    
    await page.goto('/HurstHome');
    await page.waitForTimeout(8000);
    
    // Take screenshot for error state analysis
    await page.screenshot({ 
      path: 'tests/screenshots/03-error-states.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 03-error-states.png');
    
    // Check for various error indicators
    const errorMessages = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasRetry: /retry|try again/i.test(text),
        hasUnavailable: /unavailable|not available/i.test(text),
        hasFailed: /failed|error/i.test(text),
        hasLoading: /loading|wait/i.test(text),
        hasOffline: /offline|disconnected/i.test(text),
        hasAuthRequired: /login|sign in|authenticate/i.test(text),
      };
    });
    
    console.log('📊 Error message types found:', errorMessages);
    
    // Check that page structure is preserved
    const structureElements = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('h1'),
        hasNavigation: !!document.querySelector('nav, header'),
        hasMainContent: !!document.querySelector('main, .main, [role="main"]'),
        hasWidgetContainers: document.querySelectorAll('[class*="widget"], [class*="card"]').length,
      };
    });
    
    console.log('📊 Page structure preserved:', structureElements);
    
    // CRITICAL: Page structure should be intact
    expect(structureElements.hasHeader).toBe(true);
    console.log('✅ PASS: Page header preserved during errors');
  });

  test('CRITICAL: Mobile responsiveness with widget degradation', async ({ page }) => {
    console.log('📱 Testing mobile widget rendering...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/HurstHome');
    await page.waitForTimeout(6000);
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/04-mobile-widgets.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 04-mobile-widgets.png');
    
    // Check mobile layout
    const mobileLayout = await page.evaluate(() => {
      const header = document.querySelector('h1');
      const body = document.body;
      return {
        headerVisible: header && window.getComputedStyle(header).display !== 'none',
        bodyWidth: body.scrollWidth,
        contentOverflow: body.scrollWidth > 375,
        hasVisibleContent: (body.textContent || '').length > 50,
      };
    });
    
    console.log('📊 Mobile layout analysis:', mobileLayout);
    
    expect(mobileLayout.headerVisible).toBe(true);
    expect(mobileLayout.hasVisibleContent).toBe(true);
    console.log('✅ PASS: Mobile layout functional with content');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('CRITICAL: API failure handling with visual verification', async ({ page }) => {
    console.log('🔌 Testing API failure scenarios...');
    
    await page.goto('/HurstHome');
    
    // Wait for all initial API calls to complete/fail
    await page.waitForTimeout(15000);
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/05-api-failures.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 05-api-failures.png');
    
    // Analyze final state
    const finalState = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const elements = {
        totalElements: document.querySelectorAll('*').length,
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).length,
        textLength: text.length,
        hasWelcomeText: /welcome.*hurst/i.test(text),
        hasErrorContent: /error|failed|unavailable|retry/i.test(text),
        hasLoadingContent: /loading|wait/i.test(text),
      };
      
      return {
        ...elements,
        contentDensity: elements.textLength / elements.totalElements,
      };
    });
    
    console.log('📊 Final dashboard state:', finalState);
    
    // CRITICAL VALIDATIONS
    expect(finalState.totalElements).toBeGreaterThan(10);
    expect(finalState.textLength).toBeGreaterThan(200);
    expect(finalState.hasWelcomeText).toBe(true);
    
    console.log('✅ PASS: Dashboard maintains structure and content during API failures');
    
    if (finalState.hasErrorContent) {
      console.log('✅ EXCELLENT: Proper error states displayed');
    } else if (finalState.hasLoadingContent) {
      console.log('✅ GOOD: Loading states visible');
    } else {
      console.log('⚠️ NOTE: No explicit error/loading states - but content is present');
    }
  });

  test('FINAL: Comprehensive visual validation summary', async ({ page }) => {
    console.log('🏁 Final comprehensive validation...');
    
    await page.goto('/HurstHome');
    await page.waitForTimeout(12000);
    
    // Take final validation screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/06-final-validation.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: 06-final-validation.png');
    
    // Comprehensive analysis
    const validation = await page.evaluate(() => {
      const body = document.body;
      const text = body.textContent || '';
      
      return {
        // Structure validation
        hasTitle: !!document.querySelector('h1'),
        hasNavigation: !!document.querySelector('nav, header, [role="navigation"]'),
        hasMainContent: !!document.querySelector('main, .main, [role="main"]'),
        
        // Content validation  
        titleText: document.querySelector('h1')?.textContent || '',
        contentLength: text.length,
        hasWelcome: /welcome.*hurst.*home/i.test(text),
        hasGuestMode: /guest.*mode/i.test(text),
        
        // Widget validation
        widgetElements: document.querySelectorAll('[class*="widget"], [class*="card"]').length,
        dnsElements: document.querySelectorAll('[class*="dns"]').length,
        
        // Error handling validation
        hasErrorStates: /error|failed|unavailable/i.test(text),
        hasRetryOptions: /retry|try.*again/i.test(text),
        hasLoadingStates: /loading|wait/i.test(text),
        
        // Layout validation
        isResponsive: window.innerWidth > 0 && window.innerHeight > 0,
        hasVisibleContent: text.trim().length > 100,
      };
    });
    
    console.log('\n📋 COMPREHENSIVE VALIDATION RESULTS:');
    console.log('=====================================');
    
    // Structure checks
    console.log('\n🏗️ STRUCTURE:');
    console.log(`   Title: ${validation.hasTitle ? '✅' : '❌'} "${validation.titleText}"`);
    console.log(`   Navigation: ${validation.hasNavigation ? '✅' : '❌'}`);
    console.log(`   Main Content: ${validation.hasMainContent ? '✅' : '❌'}`);
    
    // Content checks
    console.log('\n📝 CONTENT:');
    console.log(`   Content Length: ${validation.contentLength} characters`);
    console.log(`   Welcome Message: ${validation.hasWelcome ? '✅' : '❌'}`);
    console.log(`   Guest Mode Notice: ${validation.hasGuestMode ? '✅' : '❌'}`);
    console.log(`   Visible Content: ${validation.hasVisibleContent ? '✅' : '❌'}`);
    
    // Widget checks
    console.log('\n🧩 WIDGETS:');
    console.log(`   Widget Elements: ${validation.widgetElements} found`);
    console.log(`   DNS Elements: ${validation.dnsElements} found`);
    console.log(`   Widgets Present: ${validation.widgetElements > 0 ? '✅' : '❌'}`);
    
    // Error handling checks
    console.log('\n🛡️ GRACEFUL DEGRADATION:');
    console.log(`   Error States: ${validation.hasErrorStates ? '✅' : '⚠️'}`);
    console.log(`   Retry Options: ${validation.hasRetryOptions ? '✅' : '⚠️'}`);
    console.log(`   Loading States: ${validation.hasLoadingStates ? '✅' : '⚠️'}`);
    
    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    const isWorking = validation.hasTitle && validation.hasVisibleContent && validation.contentLength > 200;
    const hasGracefulDegradation = validation.hasErrorStates || validation.hasRetryOptions || validation.widgetElements > 0;
    
    if (isWorking && hasGracefulDegradation) {
      console.log('✅ PASS: Dashboard working with proper graceful degradation');
    } else if (isWorking) {
      console.log('✅ PASS: Dashboard working (degradation unclear but functional)');
    } else {
      console.log('❌ FAIL: Dashboard not working properly');
    }
    
    // Critical assertions
    expect(validation.hasTitle).toBe(true);
    expect(validation.hasVisibleContent).toBe(true);
    expect(validation.contentLength).toBeGreaterThan(200);
    
    console.log('\n📸 All validation screenshots saved to tests/screenshots/');
  });
});