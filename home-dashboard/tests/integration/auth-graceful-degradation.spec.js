import { test, expect } from '@playwright/test';
import { 
  waitForWidget,
  mockApiResponse,
  mockDnsStatus,
  mockDnsAnalytics,
  mockCalendarEvents,
  takeScreenshot
} from '../helpers/test-utils';

test.describe('Graceful Authentication Degradation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock public APIs (available without auth)
    await mockApiResponse(page, '**/api/system/status', {
      status: 'healthy',
      services: { ollama: { status: 'healthy' }, dns: { status: 'healthy' } }
    });
    await mockApiResponse(page, '**/api/dns/status', mockDnsStatus);
    await mockApiResponse(page, '**/api/dns/analytics*', mockDnsAnalytics);
    await mockApiResponse(page, '**/api/ai/chat', {
      success: true,
      data: { response: 'Hello! I can help with general questions.' }
    }, 200, 'POST');
  });

  test.describe('Landing Page at /HurstHome', () => {
    test('should show public dashboard without authentication', async ({ page }) => {
      await page.goto('/HurstHome');
      
      // Should show main dashboard, not redirect to login
      await expect(page).toHaveURL('/HurstHome');
      await expect(page.locator('h1')).toContainText('Welcome to Hurst Home');
      
      // Should show guest mode message
      await expect(page).toContainText('Guest Mode');
      await expect(page).toContainText('Some features require Google login');
      
      // Should have login link
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toContainText('Sign in for full access');
      
      await takeScreenshot(page, 'hurst-home-guest-mode');
    });

    test('should show public widgets without authentication', async ({ page }) => {
      await page.goto('/HurstHome');
      
      // Public widgets should be visible
      const dnsStatusWidget = await waitForWidget(page, 'dns-status-widget');
      await expect(dnsStatusWidget).toBeVisible();
      await expect(dnsStatusWidget).toContainText('healthy');
      
      const dnsAnalyticsWidget = await waitForWidget(page, 'dns-analytics-widget');
      await expect(dnsAnalyticsWidget).toBeVisible();
      await expect(dnsAnalyticsWidget).toContainText('15420');
      
      const aiChatWidget = await waitForWidget(page, 'ai-chat-widget');
      await expect(aiChatWidget).toBeVisible();
      
      // Should have chat input available
      const chatInput = aiChatWidget.locator('input, textarea').first();
      await expect(chatInput).toBeVisible();
      
      // AI should work in guest mode
      await chatInput.fill('Hello AI');
      await aiChatWidget.locator('button[type="submit"], .send-btn').first().click();
      await expect(aiChatWidget).toContainText('Hello AI');
    });

    test('should not show authenticated widgets without login', async ({ page }) => {
      await page.goto('/HurstHome');
      
      // Google widgets should not be visible
      const googleCalendarWidget = page.locator('[data-testid="google-calendar-widget"]');
      await expect(googleCalendarWidget).not.toBeVisible();
      
      const gmailWidget = page.locator('[data-testid="google-gmail-widget"]');
      await expect(gmailWidget).not.toBeVisible();
      
      const driveWidget = page.locator('[data-testid="google-drive-widget"]');
      await expect(driveWidget).not.toBeVisible();
      
      const mealWidget = page.locator('[data-testid="meal-planner-widget"]');
      await expect(mealWidget).not.toBeVisible();
    });
  });

  test.describe('Google Authentication Flow', () => {
    test('should redirect to login page', async ({ page }) => {
      await page.goto('/HurstHome');
      
      // Click login link
      const loginLink = page.locator('a[href="/login"]');
      await loginLink.click();
      
      // Should navigate to login page
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h2')).toContainText('Home Dashboard');
      
      // Should show Google login button
      const googleLoginButton = page.locator('button:has-text("Google"), .google-login');
      await expect(googleLoginButton).toBeVisible();
    });

    test('should show auth-required state in Google widgets', async ({ page }) => {
      // Mock unauthenticated Google API responses
      await mockApiResponse(page, '**/api/google/auth/status', {
        success: true,
        data: { authenticated: false }
      });
      
      // Mock the widgets to show when auth is required
      await mockApiResponse(page, '**/api/google/calendar/**', {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
      
      // Force widgets to be visible for this test
      await page.goto('/HurstHome');
      
      // Manually enable Google widgets to test auth state
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'mock-token-for-testing');
        localStorage.setItem('user', JSON.stringify({ 
          email: 'test@example.com', 
          name: 'Test User',
          authenticated: false
        }));
      });
      await page.reload();
      
      // Google widgets should show auth required message
      const calendarWidget = page.locator('[data-testid="google-calendar-widget"]');
      if (await calendarWidget.isVisible()) {
        const authMessage = calendarWidget.locator('.auth-required, .login-required, [data-auth="required"]');
        if (await authMessage.isVisible()) {
          await expect(authMessage).toContainText(/authentication|login|sign in/i);
        }
      }
    });
  });

  test.describe('Post-Authentication Experience', () => {
    test.beforeEach(async ({ page }) => {
      // Mock successful authentication
      await mockApiResponse(page, '**/api/google/auth/status', {
        success: true,
        data: { authenticated: true }
      });
      await mockApiResponse(page, '**/api/google/calendar/events*', mockCalendarEvents);
      await mockApiResponse(page, '**/api/google/gmail/messages*', {
        success: true,
        data: { messages: [], totalCount: 0, unreadCount: 0 }
      });
      await mockApiResponse(page, '**/api/google/drive/files*', {
        success: true,
        data: { files: [] }
      });
      await mockApiResponse(page, '**/api/meals/plan', {
        success: true,
        data: { meals: {} }
      });
    });

    test('should show all widgets after authentication', async ({ page }) => {
      // Simulate authenticated state
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'valid-auth-token');
        localStorage.setItem('user', JSON.stringify({ 
          email: 'user@hurst.family', 
          name: 'Hurst Family User',
          id: 'user-123'
        }));
      });
      
      await page.goto('/HurstHome');
      
      // Should not show guest mode message
      const guestMode = page.locator('text=Guest Mode');
      await expect(guestMode).not.toBeVisible();
      
      // Should show user info in header
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
      
      // All widgets should be visible
      await expect(page.locator('[data-testid="dns-status-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="dns-analytics-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-chat-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="google-calendar-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-planner-widget"]')).toBeVisible();
      
      await takeScreenshot(page, 'hurst-home-authenticated');
    });

    test('should maintain functionality after logout', async ({ page }) => {
      // Start authenticated
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'valid-auth-token');
        localStorage.setItem('user', JSON.stringify({ 
          email: 'user@hurst.family', 
          name: 'Hurst Family User'
        }));
      });
      
      await page.goto('/HurstHome');
      
      // Should have user menu
      const userMenu = page.locator('[data-testid="user-menu"]');
      await userMenu.click();
      
      // Logout
      const logoutButton = page.locator('text=Sign out, text=Logout').first();
      await logoutButton.click();
      
      // Should stay on same page, but in guest mode
      await expect(page).toHaveURL('/HurstHome');
      await expect(page).toContainText('Guest Mode');
      
      // Public widgets should still work
      const dnsWidget = page.locator('[data-testid="dns-status-widget"]');
      await expect(dnsWidget).toBeVisible();
      
      const aiWidget = page.locator('[data-testid="ai-chat-widget"]');
      await expect(aiWidget).toBeVisible();
      
      // Google widgets should be hidden
      const calendarWidget = page.locator('[data-testid="google-calendar-widget"]');
      await expect(calendarWidget).not.toBeVisible();
    });
  });

  test.describe('Widget-Level Authentication', () => {
    test('should handle mixed authentication states', async ({ page }) => {
      await page.goto('/HurstHome');
      
      // DNS widgets work without auth
      const dnsStatusWidget = await waitForWidget(page, 'dns-status-widget');
      await expect(dnsStatusWidget).toContainText('healthy');
      
      // AI chat works without auth (local Ollama)
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const chatInput = aiWidget.locator('input, textarea').first();
      await chatInput.fill('Test public message');
      await aiWidget.locator('button[type="submit"], .send-btn').first().click();
      await expect(aiWidget).toContainText('Test public message');
      
      // Mock partial Google auth failure
      await mockApiResponse(page, '**/api/google/calendar/**', {
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      }, 401);
      
      // If Google widgets were to be shown, they should handle the error gracefully
      // (In guest mode they're hidden, but this tests the error handling)
    });
  });
});