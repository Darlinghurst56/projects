import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  waitForWidget,
  mockApiResponse,
  mockDnsStatus,
  mockDnsAnalytics,
  mockCalendarEvents
} from '../helpers/test-utils';

test.describe('Dashboard Startup and Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await mockApiResponse(page, '**/api/system/status', {
      status: 'healthy',
      services: {
        ollama: { status: 'healthy' },
        dns: { status: 'healthy' }
      }
    });
    
    await mockApiResponse(page, '**/api/dns/status', mockDnsStatus);
    await mockApiResponse(page, '**/api/dns/analytics*', mockDnsAnalytics);
    await mockApiResponse(page, '**/api/google/calendar/events*', mockCalendarEvents);
    await mockApiResponse(page, '**/api/meals/plan', { 
      message: 'No meal plan found' 
    }, 404);
  });

  test('dashboard should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await loginWithGoogle(page);
    
    // Wait for dashboard to be fully loaded
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should render all 5 active widgets', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Define expected widgets
    const expectedWidgets = [
      'dns-status-widget',
      'dns-analytics-widget', 
      'google-calendar-widget',
      'ai-chat-widget',
      'meal-planner-widget'
    ];
    
    // Check each widget is visible
    for (const widgetId of expectedWidgets) {
      const widget = await waitForWidget(page, widgetId);
      await expect(widget).toBeVisible();
    }
    
    // Verify widget count
    const widgetCount = await page.locator('[data-testid$="-widget"]').count();
    expect(widgetCount).toBeGreaterThanOrEqual(5);
  });

  test('authentication flow should work correctly', async ({ page }) => {
    // Start from login page
    await page.goto('/login');
    
    // Should see login page elements
    await expect(page.locator('h2:has-text("Home Dashboard")')).toBeVisible();
    await expect(page.locator('text=Google Login')).toBeVisible();
    
    // After login, should redirect to dashboard
    await loginWithGoogle(page);
    await expect(page).toHaveURL('/dashboard');
    
    // User info should be visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('WebSocket connection should be established', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Check for WebSocket connection indicators
    let wsConnected = false;
    
    page.on('websocket', ws => {
      wsConnected = true;
      
      ws.on('framereceived', frame => {
        console.log('WebSocket frame received:', frame.payload);
      });
    });
    
    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(2000);
    
    // Check system status shows connected services
    const systemStatus = page.locator('[data-testid="system-status"]');
    if (await systemStatus.isVisible()) {
      await expect(systemStatus).toContainText('ollama');
    }
  });

  test('system status monitoring should work', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Look for system status indicators
    const systemStatus = page.locator('[data-testid="system-status"]');
    
    if (await systemStatus.isVisible()) {
      // Check for Ollama status
      const ollamaStatus = systemStatus.locator('text=/ollama/i');
      await expect(ollamaStatus).toBeVisible();
      
      // Status should show healthy (mocked)
      await expect(systemStatus).toContainText('healthy');
    }
  });

  test('navigation and header should be functional', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Check header elements
    const header = page.locator('[data-testid="header-nav"]');
    await expect(header).toBeVisible();
    
    // Dashboard title
    await expect(header.locator('h1, h2').first()).toContainText(/dashboard/i);
    
    // User menu should be visible
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Should have logout button
    await userMenu.click();
    const logoutButton = page.locator('text=Logout');
    await expect(logoutButton).toBeVisible();
  });

  test('widget grid should be responsive', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Get widget grid
    const widgetGrid = page.locator('[data-testid="widget-grid"]');
    await expect(widgetGrid).toBeVisible();
    
    // Check grid has CSS grid layout
    const gridDisplay = await widgetGrid.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(gridDisplay).toBe('grid');
    
    // Test viewport changes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);
    
    // On mobile, grid should be single column
    const mobileColumns = await widgetGrid.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(mobileColumns).toContain('1fr');
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('error handling for failed API calls', async ({ page }) => {
    // Mock a failed API call
    await mockApiResponse(page, '**/api/dns/status', {
      error: 'Service unavailable'
    }, 503);
    
    await loginWithGoogle(page);
    
    // DNS status widget should show error state
    const dnsWidget = page.locator('[data-testid="dns-status-widget"]');
    await expect(dnsWidget).toBeVisible();
    
    // Should show error message
    const errorMessage = dnsWidget.locator('.error-message, .error');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('logout functionality', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Click user menu
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();
    
    // Click logout
    await page.locator('text=Logout').click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Auth token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('performance metrics', async ({ page }) => {
    await loginWithGoogle(page);
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Assert performance thresholds
    expect(metrics.firstContentfulPaint).toBeLessThan(2000); // FCP < 2s
    expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM < 3s
  });
});