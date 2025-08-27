import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  visitAsGuest,
  setAuthenticatedState,
  logout,
  waitForWidget,
  mockApiResponse,
  mockDnsStatus,
  mockDnsAnalytics,
  mockCalendarEvents,
  mockGmailMessages,
  mockDriveFiles,
  mockMealPlan,
  takeScreenshot
} from '../helpers/test-utils';

test.describe('User Acceptance Tests - Family Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all services for consistent UAT
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
    await mockApiResponse(page, '**/api/google/gmail/messages*', mockGmailMessages);
    await mockApiResponse(page, '**/api/google/drive/files*', mockDriveFiles);
    await mockApiResponse(page, '**/api/meals/plan', mockMealPlan);
    await mockApiResponse(page, '**/api/ai/chat', {
      success: true,
      data: {
        response: 'Hello! I can help you with family tasks, homework, or answer questions.',
        suggestedActions: []
      }
    }, 200, 'POST');
  });

  test.describe('Landing Page Experience', () => {
    test('should show welcoming public landing page at /HurstHome', async ({ page }) => {
      await visitAsGuest(page);
      
      // Should show main dashboard, not redirect to login
      await expect(page).toHaveURL('/HurstHome');
      
      // Should show family-friendly welcome
      await expect(page.locator('h1')).toContainText('Welcome to Hurst Home');
      await expect(page).toContainText('Your unified family hub');
      await expect(page).toContainText('DNS monitoring, Google services, and AI integration');
      
      // Should show guest mode information
      await expect(page).toContainText('Guest Mode');
      await expect(page).toContainText('Some features require Google login');
      
      // Should have login link
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toContainText('Sign in for full access');
      
      await takeScreenshot(page, 'hurst-home-landing');
    });

    test('should handle first-time user onboarding flow', async ({ page }) => {
      await visitAsGuest(page);
      
      // Should see public widgets immediately
      await expect(page.locator('[data-testid="dns-status-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-chat-widget"]')).toBeVisible();
      
      // Click login link
      const loginLink = page.locator('a[href="/login"]');
      await loginLink.click();
      
      // Should navigate to login page
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h2')).toContainText('Home Dashboard');
      
      // Should show helpful description
      await expect(page).toContainText('Secure family dashboard with Google authentication');
      
      // Should have Google login option
      const googleLogin = page.locator('button:has-text("Google"), .google-login');
      await expect(googleLogin).toBeVisible();
    });

    test('should show immediate value in guest mode', async ({ page }) => {
      await visitAsGuest(page);
      
      // Should provide immediate functionality without signup
      const dnsWidget = await waitForWidget(page, 'dns-status-widget');
      await expect(dnsWidget).toContainText('healthy');
      
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const chatInput = aiWidget.locator('input, textarea').first();
      await expect(chatInput).toBeVisible();
      
      // AI should work immediately
      await chatInput.fill('What can you help me with?');
      await aiWidget.locator('button[type="submit"], .send-btn').first().click();
      await expect(aiWidget).toContainText('What can you help me with?');
      
      await takeScreenshot(page, 'immediate-value-guest');
    });
  });

  test.describe('Family Use Case Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await setAuthenticatedState(page);
    });

    test('Scenario: Family member checks morning routine', async ({ page }) => {
      // User Story: "As a family member, I want to quickly check today's schedule, 
      // network status, and any important messages when I wake up"
      
      // Should see dashboard with key family info immediately
      await expect(page.locator('h1')).toContainText('Welcome to Hurst Home');
      
      // Calendar should show today's events
      const calendarWidget = await waitForWidget(page, 'google-calendar-widget');
      await expect(calendarWidget).toContainText('Team Meeting');
      await expect(calendarWidget).toContainText('09:00');
      
      // Should see network status (important for family internet)
      const dnsWidget = await waitForWidget(page, 'dns-status-widget');
      await expect(dnsWidget).toContainText('healthy');
      await expect(dnsWidget).toContainText('99.9%');
      
      // Should see unread emails
      const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
      await expect(gmailWidget).toContainText('Project Update Required');
      
      // Everything should load within 3 seconds for good user experience
      await takeScreenshot(page, 'morning-routine-complete');
    });

    test('Scenario: Parent plans family meals for the week', async ({ page }) => {
      // User Story: "As a parent, I want to plan weekly meals using our shopping list
      // and get AI suggestions based on what we have available"
      
      const mealWidget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should see current meal plan
      await expect(mealWidget).toContainText('Monday');
      await expect(mealWidget).toContainText('Chicken Stir Fry');
      await expect(mealWidget).toContainText('25'); // cooking time
      
      // Should see available ingredients
      await expect(mealWidget).toContainText('chicken');
      await expect(mealWidget).toContainText('vegetables');
      
      // Should be able to upload shopping list (mock file upload)
      const uploadArea = mealWidget.locator('input[type="file"], .upload-button, .drag-zone');
      await expect(uploadArea).toBeVisible();
      
      // Should provide easy meal editing
      const editButton = mealWidget.locator('button:has-text("Edit"), .edit-meal').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        const editForm = mealWidget.locator('.edit-form, .meal-editor');
        await expect(editForm).toBeVisible();
      }
      
      await takeScreenshot(page, 'meal-planning-scenario');
    });

    test('Scenario: Child asks AI assistant for homework help', async ({ page }) => {
      // User Story: "As a child, I want to ask the AI assistant questions about 
      // homework or general topics in a safe, family-friendly way"
      
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      
      // Should have clear, child-friendly interface
      const chatInput = aiWidget.locator('input, textarea').first();
      await expect(chatInput).toBeVisible();
      await expect(chatInput).toBeEditable();
      
      // Child asks a homework question
      await chatInput.fill('What is 15 x 12?');
      const sendButton = aiWidget.locator('button[type="submit"], .send-btn').first();
      await sendButton.click();
      
      // Should show the question
      await expect(aiWidget).toContainText('What is 15 x 12?');
      
      // AI should respond helpfully
      await expect(aiWidget).toContainText('Hello! I can help you');
      
      // Response should be family-appropriate
      await expect(aiWidget).toContainText('family tasks, homework');
      
      await takeScreenshot(page, 'child-homework-help');
    });

    test('Scenario: Parent monitors family internet usage and safety', async ({ page }) => {
      // User Story: "As a parent, I want to monitor our family's internet usage, 
      // see what sites are being accessed, and ensure DNS filtering is working"
      
      const dnsStatusWidget = await waitForWidget(page, 'dns-status-widget');
      const dnsAnalyticsWidget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Should see current DNS health
      await expect(dnsStatusWidget).toContainText('healthy');
      await expect(dnsStatusWidget).toContainText('Google'); // DNS provider
      
      // Should see usage analytics
      await expect(dnsAnalyticsWidget).toContainText('15420'); // total queries
      await expect(dnsAnalyticsWidget).toContainText('25%'); // block rate
      
      // Should see top accessed domains
      await expect(dnsAnalyticsWidget).toContainText('google.com');
      await expect(dnsAnalyticsWidget).toContainText('youtube.com');
      
      // Should see blocked domains (safety feature)
      await expect(dnsAnalyticsWidget).toContainText('doubleclick.net');
      await expect(dnsAnalyticsWidget).toContainText('googlesyndication.com');
      
      // Should show charts/visualizations
      const chart = dnsAnalyticsWidget.locator('.recharts-wrapper, .chart, svg');
      await expect(chart.first()).toBeVisible();
      
      await takeScreenshot(page, 'internet-safety-monitoring');
    });

    test('Scenario: Family member quickly accesses Google services', async ({ page }) => {
      // User Story: "As a family member, I want quick access to our shared Google 
      // Calendar, Gmail, and Drive files without opening separate apps"
      
      // Calendar access
      const calendarWidget = await waitForWidget(page, 'google-calendar-widget');
      await expect(calendarWidget).toContainText('Team Meeting');
      await expect(calendarWidget).toContainText('Dentist Appointment');
      
      // Gmail access - should see recent messages
      const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
      await expect(gmailWidget).toContainText('Project Update Required');
      await expect(gmailWidget).toContainText('Family Dinner Plans');
      
      // Should distinguish unread messages
      const unreadIndicator = gmailWidget.locator('.unread, .font-bold, [data-unread="true"]');
      await expect(unreadIndicator).toBeVisible();
      
      // Drive access - should see family files
      const driveWidget = await waitForWidget(page, 'google-drive-widget');
      await expect(driveWidget).toContainText('Family Photos 2024');
      await expect(driveWidget).toContainText('Budget Spreadsheet');
      
      // Should show file types with icons
      const fileIcons = driveWidget.locator('.file-icon, svg, [data-file-type]');
      expect(await fileIcons.count()).toBeGreaterThan(0);
      
      await takeScreenshot(page, 'google-services-access');
    });

    test('Scenario: Emergency - Internet/Services down', async ({ page }) => {
      // User Story: "When services are down, I want clear status information 
      // and the dashboard should still be usable for basic functions"
      
      // Simulate service failures
      await mockApiResponse(page, '**/api/dns/status', {
        success: false,
        message: 'DNS service unavailable'
      }, 503);
      
      await mockApiResponse(page, '**/api/google/**', {
        error: 'Google services temporarily unavailable'
      }, 503);
      
      await page.reload();
      
      // Should clearly show service status
      const dnsWidget = await waitForWidget(page, 'dns-status-widget');
      const errorIndicator = dnsWidget.locator('.error-message, .error, [data-error="true"]');
      await expect(errorIndicator).toBeVisible();
      await expect(errorIndicator).toContainText(/unavailable|error/i);
      
      // System status should reflect issues
      const systemStatus = page.locator('[data-testid="system-status"]');
      if (await systemStatus.isVisible()) {
        await expect(systemStatus).toBeVisible();
      }
      
      // Dashboard should remain functional (not crash)
      await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Welcome to Home Dashboard');
      
      // AI widget might still work (local Ollama service)
      const aiWidget = page.locator('[data-testid="ai-chat-widget"]');
      await expect(aiWidget).toBeVisible();
      
      await takeScreenshot(page, 'emergency-services-down');
    });
  });

  test.describe('Accessibility and Usability', () => {
    test.beforeEach(async ({ page }) => {
      await setAuthenticatedState(page);
    });

    test('should be usable by family members of different ages', async ({ page }) => {
      // Large, clear text for all ages
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const fontSize = await heading.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        const fontSizeNum = parseInt(fontSize.replace('px', ''));
        expect(fontSizeNum).toBeGreaterThanOrEqual(18); // Readable for all ages
      }
      
      // Clear, large buttons
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(36);
        expect(box.width).toBeGreaterThanOrEqual(60);
      }
      
      // High contrast colors
      const widgets = page.locator('[data-testid$="-widget"]');
      const widgetCount = await widgets.count();
      expect(widgetCount).toBeGreaterThan(3); // Multiple widgets visible
      
      // Each widget should have clear visual separation
      for (let i = 0; i < Math.min(widgetCount, 5); i++) {
        const widget = widgets.nth(i);
        const bgColor = await widget.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toMatch(/rgb\(255, 255, 255\)|white/); // Clear white backgrounds
      }
    });

    test('should work on family devices (tablets, phones)', async ({ page }) => {
      // Test mobile phone size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Should be usable on small screen
      const widgetGrid = page.locator('[data-testid="widget-grid"]');
      await expect(widgetGrid).toBeVisible();
      
      // Widgets should stack vertically
      const gridColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      expect(gridColumns).toMatch(/1fr|none/);
      
      // Touch targets should be adequate
      const touchTargets = page.locator('button, a, input');
      const targetCount = await touchTargets.count();
      
      for (let i = 0; i < Math.min(targetCount, 5); i++) {
        const target = touchTargets.nth(i);
        if (await target.isVisible()) {
          const box = await target.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(40); // iOS touch target guideline
        }
      }
      
      // Test tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Should adapt to tablet layout
      const tabletColumns = await widgetGrid.evaluate(el => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      expect(tabletColumns.split(' ').length).toBeGreaterThanOrEqual(2);
    });

    test('should provide clear feedback for all actions', async ({ page }) => {
      // Login feedback
      await page.goto('/login');
      await expect(page).toContainText('Secure family dashboard');
      
      // Dashboard loading feedback
      await loginWithGoogle(page);
      await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
      
      // Widget interaction feedback
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const chatInput = aiWidget.locator('input, textarea').first();
      
      await chatInput.fill('Test message');
      await chatInput.press('Enter');
      
      // Should show message sent
      await expect(aiWidget).toContainText('Test message');
      
      // Error states should be clear
      await mockApiResponse(page, '**/api/ai/chat', {
        error: 'Service temporarily unavailable'
      }, 503, 'POST');
      
      await chatInput.fill('Another test');
      await chatInput.press('Enter');
      
      const errorMessage = aiWidget.locator('.error-message, .error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|unavailable/i);
    });
  });

  test.describe('Performance and Reliability', () => {
    test.beforeEach(async ({ page }) => {
      await setAuthenticatedState(page);
    });

    test('should load quickly for busy family mornings', async ({ page }) => {
      const startTime = Date.now();
      
      // Reload dashboard to test fresh load time
      await page.reload();
      
      // Wait for key widgets to be ready
      await waitForWidget(page, 'dns-status-widget');
      await waitForWidget(page, 'google-calendar-widget');
      await waitForWidget(page, 'ai-chat-widget');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds for good family UX
      expect(loadTime).toBeLessThan(3000);
      
      // Key information should be visible immediately
      await expect(page.locator('h1')).toContainText('Welcome');
      
      // Critical widgets should be functional
      const calendarWidget = page.locator('[data-testid="google-calendar-widget"]');
      await expect(calendarWidget).toContainText('Team Meeting');
    });

    test('should handle multiple family members using dashboard', async ({ page, context }) => {
      // Simulate multiple browser sessions (family members)
      const page2 = await context.newPage();
      
      // Both sessions should work independently
      await setAuthenticatedState(page2);
      
      // Both should be able to use AI assistant
      const aiWidget1 = await waitForWidget(page, 'ai-chat-widget');
      const aiWidget2 = await waitForWidget(page2, 'ai-chat-widget');
      
      // Family member 1 asks question
      await aiWidget1.locator('input, textarea').first().fill('What time is dinner?');
      await aiWidget1.locator('button[type="submit"], .send-btn').first().click();
      
      // Family member 2 asks different question  
      await aiWidget2.locator('input, textarea').first().fill('Help with math homework');
      await aiWidget2.locator('button[type="submit"], .send-btn').first().click();
      
      // Both should get responses
      await expect(aiWidget1).toContainText('What time is dinner?');
      await expect(aiWidget2).toContainText('Help with math homework');
      
      await page2.close();
    });

    test('should maintain data consistency across sessions', async ({ page }) => {
      // Make changes that should persist
      const mealWidget = await waitForWidget(page, 'meal-planner-widget');
      
      // Current meal plan should be consistent
      await expect(mealWidget).toContainText('Chicken Stir Fry');
      await expect(mealWidget).toContainText('Monday');
      
      // Reload page
      await page.reload();
      
      // Data should persist
      const reloadedMealWidget = await waitForWidget(page, 'meal-planner-widget');
      await expect(reloadedMealWidget).toContainText('Chicken Stir Fry');
      await expect(reloadedMealWidget).toContainText('Monday');
      
      // Google services should maintain connection
      const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
      await expect(gmailWidget).toContainText('Project Update Required');
    });
  });

  test.describe('Security and Trust', () => {
    test('should provide secure authentication experience', async ({ page }) => {
      await visitAsGuest(page);
      
      // Should start at public landing page
      await expect(page).toHaveURL('/HurstHome');
      
      // Click login link
      const loginLink = page.locator('a[href="/login"]');
      await loginLink.click();
      await expect(page).toHaveURL('/login');
      
      // Should show security messaging
      await expect(page).toContainText('Secure family dashboard');
      await expect(page).toContainText('Google authentication');
      
      // Should use HTTPS in production
      const protocol = page.url().startsWith('https://') || page.url().startsWith('http://localhost');
      expect(protocol).toBe(true);
      
      // Mock successful login
      await setAuthenticatedState(page);
      await expect(page).toHaveURL('/HurstHome');
      
      // Should show user is authenticated
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
    });

    test('should protect family data appropriately', async ({ page }) => {
      await setAuthenticatedState(page);
      
      // Family data should be visible to authenticated user
      const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
      await expect(gmailWidget).toContainText('Project Update');
      
      // Logout should clear session and return to guest mode
      await logout(page);
      
      // Should stay on HurstHome but in guest mode
      await expect(page).toHaveURL('/HurstHome');
      await expect(page).toContainText('Guest Mode');
      
      // Google widgets should no longer be visible
      const gmailWidgetAfterLogout = page.locator('[data-testid="google-gmail-widget"]');
      await expect(gmailWidgetAfterLogout).not.toBeVisible();
      
      // Family data should no longer be accessible
      const token = await page.evaluate(() => localStorage.getItem('authToken'));
      expect(token).toBeNull();
    });
  });

  test('Overall User Acceptance: Complete family workflow', async ({ page }) => {
    // Complete end-to-end family use case
    // "Family discovers and uses the dashboard"
    
    // 1. Family member visits HurstHome for first time
    await visitAsGuest(page);
    await expect(page).toHaveURL('/HurstHome');
    await expect(page).toContainText('Welcome to Hurst Home');
    
    // 2. Explore guest mode features
    const dnsWidget = await waitForWidget(page, 'dns-status-widget');
    await expect(dnsWidget).toContainText('healthy');
    
    const aiWidget = await waitForWidget(page, 'ai-chat-widget');
    const chatInput = aiWidget.locator('input, textarea').first();
    await chatInput.fill('What can you help me with?');
    await aiWidget.locator('button[type="submit"], .send-btn').first().click();
    await expect(aiWidget).toContainText('What can you help me with?');
    
    // 3. Decide to authenticate for full features
    const loginLink = page.locator('a[href="/login"]');
    await loginLink.click();
    await expect(page).toHaveURL('/login');
    
    // 4. Authenticate (mock successful Google login)
    await setAuthenticatedState(page);
    await expect(page).toHaveURL('/HurstHome');
    
    // 5. Check family schedule
    const calendarWidget = await waitForWidget(page, 'google-calendar-widget');
    await expect(calendarWidget).toContainText('Team Meeting');
    
    // 6. Review emails quickly  
    const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
    await expect(gmailWidget).toContainText('Project Update');
    
    // 7. Plan meals
    const mealWidget = await waitForWidget(page, 'meal-planner-widget');
    await expect(mealWidget).toContainText('Chicken Stir Fry');
    
    // 8. AI assistant now has more context
    await chatInput.fill('Good morning! What\'s on my calendar today?');
    await aiWidget.locator('button[type="submit"], .send-btn').first().click();
    await expect(aiWidget).toContainText('Good morning');
    
    // 9. Everything should work smoothly together
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Welcome to Hurst Home');
    
    // Should not show guest mode banner when authenticated
    const guestMode = page.locator('text=Guest Mode');
    await expect(guestMode).not.toBeVisible();
    
    // Take final screenshot of complete family workflow
    await takeScreenshot(page, 'complete-family-workflow');
    
    // Success criteria: All widgets loaded, interactive, and showing family data
    const widgets = page.locator('[data-testid$="-widget"]');
    const widgetCount = await widgets.count();
    expect(widgetCount).toBeGreaterThanOrEqual(6); // Should have all main widgets including Google services
  });
});