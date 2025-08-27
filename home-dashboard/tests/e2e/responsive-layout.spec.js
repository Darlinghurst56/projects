import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  waitForWidget,
  mockApiResponse,
  mockDnsStatus,
  mockDnsAnalytics,
  mockCalendarEvents,
  mockGmailMessages,
  mockDriveFiles,
  mockMealPlan,
  viewports,
  takeScreenshot
} from '../helpers/test-utils';

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all API responses for consistent testing
    await mockApiResponse(page, '**/api/system/status', {
      status: 'healthy',
      services: { ollama: { status: 'healthy' }, dns: { status: 'healthy' } }
    });
    await mockApiResponse(page, '**/api/dns/status', mockDnsStatus);
    await mockApiResponse(page, '**/api/dns/analytics*', mockDnsAnalytics);
    await mockApiResponse(page, '**/api/google/calendar/events*', mockCalendarEvents);
    await mockApiResponse(page, '**/api/google/gmail/messages*', mockGmailMessages);
    await mockApiResponse(page, '**/api/google/drive/files*', mockDriveFiles);
    await mockApiResponse(page, '**/api/meals/plan', mockMealPlan);
    
    await loginWithGoogle(page);
  });

  test.describe('Mobile Layout (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
    });

    test('should display single column layout', async ({ page }) => {
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      await expect(widgetGrid).toBeVisible();
      
      // Grid should use single column on mobile
      const gridColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should be single column (1fr) or similar
      expect(gridColumns).toMatch(/^1fr$|^none$|^\d+px$/);
      
      // Take screenshot for visual verification
      await takeScreenshot(page, 'mobile-single-column');
    });

    test('should stack widgets vertically', async ({ page }) => {
      const widgets = page.locator('[data-testid$="-widget"]');
      const widgetCount = await widgets.count();
      
      if (widgetCount >= 2) {
        const firstWidget = widgets.nth(0);
        const secondWidget = widgets.nth(1);
        
        const firstRect = await firstWidget.boundingBox();
        const secondRect = await secondWidget.boundingBox();
        
        // Second widget should be below first widget
        expect(secondRect.y).toBeGreaterThan(firstRect.y + firstRect.height - 10);
      }
    });

    test('should have proper touch targets', async ({ page }) => {
      // All clickable elements should be at least 44px (iOS guideline)
      const clickableElements = page.locator('button, a, input[type="submit"], .clickable');
      const count = await clickableElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = clickableElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow 4px tolerance
          expect(box.width).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should hide or collapse navigation on mobile', async ({ page }) => {
      const header = page.locator('[data-testid="header-nav"]');
      await expect(header).toBeVisible();
      
      // Check if navigation is collapsed or hamburger menu is present
      const hamburgerMenu = header.locator('.hamburger, .mobile-menu, [aria-label*="menu"]');
      const fullNavigation = header.locator('.nav-links, .desktop-nav');
      
      const hasHamburger = await hamburgerMenu.isVisible();
      const hasFullNav = await fullNavigation.isVisible();
      
      // Either should have hamburger menu or hidden full navigation
      expect(hasHamburger || !hasFullNav).toBe(true);
    });

    test('should have readable font sizes', async ({ page }) => {
      // Text should be at least 16px on mobile for readability
      const textElements = page.locator('p, span, div:not(:empty), h1, h2, h3, h4, h5, h6');
      const count = await textElements.count();
      
      let checkedElements = 0;
      for (let i = 0; i < Math.min(count, 20); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const fontSize = await element.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          const fontSizeNum = parseInt(fontSize.replace('px', ''));
          
          if (fontSizeNum > 0) { // Only check elements with explicit font size
            expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable size
            checkedElements++;
          }
        }
        
        if (checkedElements >= 10) break; // Check reasonable sample
      }
    });
  });

  test.describe('Tablet Layout (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
    });

    test('should display two column layout', async ({ page }) => {
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      await expect(widgetGrid).toBeVisible();
      
      const gridColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should have 2 columns or similar multi-column layout
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBeGreaterThanOrEqual(2);
      expect(columnCount).toBeLessThanOrEqual(3);
      
      await takeScreenshot(page, 'tablet-two-column');
    });

    test('should accommodate medium-sized widgets', async ({ page }) => {
      const mediumWidgets = page.locator('[data-testid$="-widget"]').filter({
        has: page.locator('.col-span-2, [data-size="medium"]')
      });
      
      if (await mediumWidgets.count() > 0) {
        const widget = mediumWidgets.first();
        const widgetBox = await widget.boundingBox();
        
        // Medium widgets should take reasonable space on tablet
        expect(widgetBox.width).toBeGreaterThan(300);
        expect(widgetBox.width).toBeLessThan(600);
      }
    });

    test('should maintain proper spacing', async ({ page }) => {
      const widgets = page.locator('[data-testid$="-widget"]');
      const count = await widgets.count();
      
      if (count >= 2) {
        const firstWidget = widgets.nth(0);
        const secondWidget = widgets.nth(1);
        
        const firstRect = await firstWidget.boundingBox();
        const secondRect = await secondWidget.boundingBox();
        
        // Widgets should have proper gap
        const horizontalGap = Math.abs(secondRect.x - (firstRect.x + firstRect.width));
        const verticalGap = Math.abs(secondRect.y - (firstRect.y + firstRect.height));
        
        const hasProperSpacing = horizontalGap >= 16 || verticalGap >= 16;
        expect(hasProperSpacing).toBe(true);
      }
    });
  });

  test.describe('Desktop Layout (1280px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
    });

    test('should display multi-column layout', async ({ page }) => {
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      await expect(widgetGrid).toBeVisible();
      
      const gridColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should have 3+ columns on desktop
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBeGreaterThanOrEqual(3);
      
      await takeScreenshot(page, 'desktop-multi-column');
    });

    test('should display all widget sizes properly', async ({ page }) => {
      // Check small widgets
      const smallWidgets = page.locator('[data-testid="dns-status-widget"], [data-testid="dns-profile-widget"]');
      if (await smallWidgets.count() > 0) {
        const smallWidget = smallWidgets.first();
        const smallBox = await smallWidget.boundingBox();
        expect(smallBox.width).toBeLessThan(400);
      }
      
      // Check medium widgets  
      const mediumWidgets = page.locator('[data-testid="dns-analytics-widget"], [data-testid="google-calendar-widget"]');
      if (await mediumWidgets.count() > 0) {
        const mediumWidget = mediumWidgets.first();
        const mediumBox = await mediumWidget.boundingBox();
        expect(mediumBox.width).toBeGreaterThan(400);
        expect(mediumBox.width).toBeLessThan(800);
      }
      
      // Check large widgets
      const largeWidgets = page.locator('[data-testid="ai-chat-widget"], [data-testid="meal-planner-widget"]');
      if (await largeWidgets.count() > 0) {
        const largeWidget = largeWidgets.first();
        const largeBox = await largeWidget.boundingBox();
        expect(largeBox.width).toBeGreaterThan(600);
      }
    });

    test('should show full navigation', async ({ page }) => {
      const header = page.locator('[data-testid="header-nav"]');
      await expect(header).toBeVisible();
      
      // Desktop should show full navigation, not hamburger menu
      const hamburgerMenu = header.locator('.hamburger, .mobile-menu');
      if (await hamburgerMenu.isVisible()) {
        // If hamburger exists, it should be hidden on desktop
        const isHidden = await hamburgerMenu.evaluate(el => 
          window.getComputedStyle(el).display === 'none'
        );
        expect(isHidden).toBe(true);
      }
    });

    test('should have optimal content density', async ({ page }) => {
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      const gridBox = await widgetGrid.boundingBox();
      const widgets = page.locator('[data-testid$="-widget"]');
      const widgetCount = await widgets.count();
      
      // Desktop should efficiently use horizontal space
      const widgetsPerRow = Math.floor(gridBox.width / 300); // Estimate widgets per row
      expect(widgetsPerRow).toBeGreaterThanOrEqual(3);
      
      // Should not have excessive empty space
      const contentHeight = gridBox.height;
      const avgWidgetHeight = contentHeight / Math.ceil(widgetCount / widgetsPerRow);
      expect(avgWidgetHeight).toBeLessThan(600); // Widgets shouldn't be unnecessarily tall
    });
  });

  test.describe('Wide Screen Layout (1920px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewports.wide);
    });

    test('should maximize horizontal space usage', async ({ page }) => {
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      await expect(widgetGrid).toBeVisible();
      
      const gridColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should have 4+ columns on wide screens
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBeGreaterThanOrEqual(4);
      
      await takeScreenshot(page, 'wide-screen-layout');
    });

    test('should maintain readable content width', async ({ page }) => {
      // Content should not stretch beyond readable width
      const mainContent = page.locator('main, .main-content, [data-testid="dashboard-container"] > div').first();
      const contentBox = await mainContent.boundingBox();
      
      // Should have reasonable max-width (not full screen width)
      expect(contentBox.width).toBeLessThan(1600); // Max-width constraint
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape transition', async ({ page, isMobile }) => {
      if (!isMobile) return; // Only test on mobile contexts
      
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="widget-grid"]')).toBeVisible();
      
      const portraitColumns = await page.locator('[data-testid="widget-grid"]').evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(300); // Allow layout to adjust
      
      const landscapeColumns = await page.locator('[data-testid="widget-grid"]').evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Layout should adapt to landscape
      const portraitColumnCount = portraitColumns.split(' ').length;
      const landscapeColumnCount = landscapeColumns.split(' ').length;
      
      expect(landscapeColumnCount).toBeGreaterThanOrEqual(portraitColumnCount);
    });
  });

  test.describe('Content Overflow', () => {
    test('should handle content overflow gracefully', async ({ page }) => {
      // Test with very small viewport
      await page.setViewportSize({ width: 320, height: 480 });
      await expect(page.locator('[data-testid="widget-grid"]')).toBeVisible();
      
      // Should not have horizontal scrollbar on main content
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
      
      // Widgets should be contained within viewport
      const widgets = page.locator('[data-testid$="-widget"]');
      const count = await widgets.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const widget = widgets.nth(i);
        if (await widget.isVisible()) {
          const box = await widget.boundingBox();
          expect(box.x + box.width).toBeLessThanOrEqual(320 + 10); // Allow small margin
        }
      }
    });

    test('should handle long text content', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      
      // Check text content doesn't overflow containers
      const textElements = page.locator('p, span, div:has-text("a"), h1, h2, h3');
      const count = await textElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const parentBox = await element.locator('..').boundingBox();
          const elementBox = await element.boundingBox();
          
          if (parentBox && elementBox) {
            // Text should not overflow parent container
            expect(elementBox.x + elementBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + 5);
          }
        }
      }
    });
  });

  test.describe('Interactive Elements on Different Screens', () => {
    Object.entries(viewports).forEach(([screenName, viewport]) => {
      test(`should have usable controls on ${screenName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        
        // Wait for widgets to load
        await waitForWidget(page, 'dns-status-widget');
        
        // Test button accessibility
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();
          
          // Buttons should be reasonably sized for the screen
          if (viewport.width <= 768) {
            expect(box.height).toBeGreaterThanOrEqual(36); // Mobile minimum
          } else {
            expect(box.height).toBeGreaterThanOrEqual(32); // Desktop minimum
          }
        }
        
        // Test input field usability
        const inputs = page.locator('input:visible, textarea:visible');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i);
          const box = await input.boundingBox();
          
          // Inputs should be appropriately sized
          expect(box.width).toBeGreaterThan(100);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      });
    });
  });

  test.describe('Performance on Different Screen Sizes', () => {
    test('should maintain performance across viewports', async ({ page }) => {
      const performanceResults = {};
      
      for (const [screenName, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        
        const startTime = Date.now();
        await page.reload();
        await waitForWidget(page, 'dns-status-widget');
        const loadTime = Date.now() - startTime;
        
        performanceResults[screenName] = loadTime;
        
        // Load time should be reasonable for all screen sizes
        expect(loadTime).toBeLessThan(5000);
      }
      
      // Performance shouldn't vary dramatically between screen sizes
      const loadTimes = Object.values(performanceResults);
      const maxTime = Math.max(...loadTimes);
      const minTime = Math.min(...loadTimes);
      const variance = maxTime - minTime;
      
      // Variance should be reasonable (less than 2 seconds)
      expect(variance).toBeLessThan(2000);
    });
  });
});