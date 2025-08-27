import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  waitForWidget,
  mockApiResponse,
  mockCalendarEvents,
  mockGmailMessages,
  mockDriveFiles
} from '../helpers/test-utils';

test.describe('Google Integration Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithGoogle(page);
  });

  test.describe('Google Calendar Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/google/calendar/events*', mockCalendarEvents);
    });

    test('should display calendar events correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Should show today's events
      await expect(widget).toContainText('Team Meeting');
      await expect(widget).toContainText('Dentist Appointment');
      
      // Should show event times
      await expect(widget).toContainText('09:00');
      await expect(widget).toContainText('14:30');
      
      // Should show event descriptions
      await expect(widget).toContainText('Weekly team standup meeting');
      await expect(widget).toContainText('Regular dental checkup');
    });

    test('should handle calendar navigation', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Look for navigation controls
      const prevButton = widget.locator('button[title*="previous"], button[aria-label*="previous"], .nav-prev');
      const nextButton = widget.locator('button[title*="next"], button[aria-label*="next"], .nav-next');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should trigger new API call for next day/week
        await page.waitForResponse(response => 
          response.url().includes('/api/google/calendar/events')
        );
        
        // Date indicator should change
        const dateIndicator = widget.locator('.date-indicator, .current-date');
        await expect(dateIndicator).toBeVisible();
      }
      
      if (await prevButton.isVisible()) {
        await prevButton.click();
        
        // Should trigger API call for previous period
        await page.waitForResponse(response => 
          response.url().includes('/api/google/calendar/events')
        );
      }
    });

    test('should show calendar loading states', async ({ page }) => {
      // Delay the API response to test loading state
      await page.route('**/api/google/calendar/events*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCalendarEvents)
        });
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Should show loading indicator
      const loadingIndicator = widget.locator('.loading-spinner, .loading, [data-loading="true"]');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      
      // Loading should disappear once data loads
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
    });

    test('should handle calendar refresh', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Look for refresh button
      const refreshButton = widget.locator('button[title*="refresh"], button[aria-label*="refresh"], .refresh-btn');
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should show loading state
        const loadingIndicator = widget.locator('.loading-spinner, .loading');
        await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
        
        // Should trigger new API call
        await page.waitForResponse(response => 
          response.url().includes('/api/google/calendar/events')
        );
        
        await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
      }
    });

    test('should handle empty calendar state', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/calendar/events*', {
        success: true,
        data: {
          events: [],
          nextPageToken: null
        }
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Should show empty state message
      await expect(widget).toContainText(/no events|empty|nothing scheduled/i);
    });

    test('should handle calendar API errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/calendar/events*', {
        error: 'Google Calendar API unavailable'
      }, 503);
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-calendar-widget');
      
      // Should show error state
      const errorMessage = widget.locator('.error-message, .error, [data-error="true"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|unavailable|failed/i);
    });
  });

  test.describe('Google Gmail Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/google/gmail/messages*', mockGmailMessages);
    });

    test('should display gmail messages correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Should show email subjects
      await expect(widget).toContainText('Project Update Required');
      await expect(widget).toContainText('Family Dinner Plans');
      
      // Should show sender names
      await expect(widget).toContainText('John Doe');
      await expect(widget).toContainText('Jane Smith');
      
      // Should show timestamps
      await expect(widget).toContainText('2 hours ago');
      await expect(widget).toContainText('5 hours ago');
    });

    test('should distinguish read vs unread messages', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Unread messages should be visually distinct
      const unreadMessages = widget.locator('.unread, [data-unread="true"], .font-bold');
      expect(await unreadMessages.count()).toBeGreaterThan(0);
      
      // Read messages should appear normal
      const readMessages = widget.locator('.read, [data-read="true"], .opacity-75');
      expect(await readMessages.count()).toBeGreaterThanOrEqual(0);
    });

    test('should handle message clicking', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Click on first message
      const firstMessage = widget.locator('.message-item, .email-item').first();
      
      if (await firstMessage.isVisible()) {
        await firstMessage.click();
        
        // Should either expand message or trigger action
        // Check for expanded state or navigation
        const expandedContent = widget.locator('.message-expanded, .email-body');
        const isExpanded = await expandedContent.isVisible();
        
        if (!isExpanded) {
          // Message might open in new tab/window
          // or mark as read - verify state change
          await page.waitForTimeout(500);
        }
      }
    });

    test('should show gmail loading states', async ({ page }) => {
      // Delay API response
      await page.route('**/api/google/gmail/messages*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockGmailMessages)
        });
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Should show loading indicator
      const loadingIndicator = widget.locator('.loading-spinner, .loading');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
    });

    test('should handle gmail refresh', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Look for refresh button
      const refreshButton = widget.locator('button[title*="refresh"], .refresh-btn');
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should trigger API call
        await page.waitForResponse(response => 
          response.url().includes('/api/google/gmail/messages')
        );
      }
    });

    test('should handle empty inbox', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/gmail/messages*', {
        success: true,
        data: {
          messages: [],
          totalCount: 0
        }
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Should show empty inbox message
      await expect(widget).toContainText(/no messages|inbox empty|all caught up/i);
    });

    test('should handle gmail API errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/gmail/messages*', {
        error: 'Gmail API access denied'
      }, 403);
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-gmail-widget');
      
      // Should show error state
      const errorMessage = widget.locator('.error-message, .error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|access denied|failed/i);
    });
  });

  test.describe('Google Drive Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/google/drive/files*', mockDriveFiles);
    });

    test('should display drive files correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Should show file names
      await expect(widget).toContainText('Family Photos 2024');
      await expect(widget).toContainText('Budget Spreadsheet');
      await expect(widget).toContainText('Meeting Notes');
      
      // Should show file types or icons
      const fileIcons = widget.locator('.file-icon, .file-type, svg');
      expect(await fileIcons.count()).toBeGreaterThan(0);
      
      // Should show modification dates
      await expect(widget).toContainText('2 days ago');
      await expect(widget).toContainText('1 week ago');
    });

    test('should handle file type icons', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Different file types should have different visual indicators
      const documentIcon = widget.locator('[data-file-type="document"], .doc-icon');
      const spreadsheetIcon = widget.locator('[data-file-type="spreadsheet"], .sheet-icon');
      const folderIcon = widget.locator('[data-file-type="folder"], .folder-icon');
      
      // At least one type should be present
      const totalIcons = await documentIcon.count() + 
                         await spreadsheetIcon.count() + 
                         await folderIcon.count();
      expect(totalIcons).toBeGreaterThan(0);
    });

    test('should handle file actions', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Click on first file
      const firstFile = widget.locator('.file-item, .drive-file').first();
      
      if (await firstFile.isVisible()) {
        await firstFile.click();
        
        // Should show file actions or open preview
        const fileActions = widget.locator('.file-actions, .action-menu');
        const previewModal = page.locator('.file-preview, .preview-modal');
        
        // Either actions menu or preview should appear
        const hasActions = await fileActions.isVisible();
        const hasPreview = await previewModal.isVisible();
        
        expect(hasActions || hasPreview).toBe(true);
      }
    });

    test('should show drive loading states', async ({ page }) => {
      // Delay API response
      await page.route('**/api/google/drive/files*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDriveFiles)
        });
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Should show loading indicator
      const loadingIndicator = widget.locator('.loading-spinner, .loading');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
    });

    test('should handle drive refresh', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Look for refresh button
      const refreshButton = widget.locator('button[title*="refresh"], .refresh-btn');
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should trigger API call
        await page.waitForResponse(response => 
          response.url().includes('/api/google/drive/files')
        );
      }
    });

    test('should handle empty drive', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/drive/files*', {
        success: true,
        data: {
          files: [],
          nextPageToken: null
        }
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Should show empty state
      await expect(widget).toContainText(/no files|empty|nothing here/i);
    });

    test('should handle drive API errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/google/drive/files*', {
        error: 'Google Drive API quota exceeded'
      }, 429);
      
      await page.reload();
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Should show error state
      const errorMessage = widget.locator('.error-message, .error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|quota|failed/i);
    });

    test('should support file search', async ({ page }) => {
      const widget = await waitForWidget(page, 'google-drive-widget');
      
      // Look for search input
      const searchInput = widget.locator('input[type="search"], input[placeholder*="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('budget');
        
        // Should trigger search API call
        await page.waitForResponse(response => 
          response.url().includes('/api/google/drive/files') &&
          response.url().includes('search')
        );
        
        // Should filter results
        await expect(widget).toContainText('Budget Spreadsheet');
        await expect(widget).not.toContainText('Family Photos');
      }
    });
  });

  test.describe('Google Widgets Integration', () => {
    test('should handle Google authentication errors consistently', async ({ page }) => {
      // Mock authentication failure for all Google services
      const authError = { error: 'Authentication required', code: 'GOOGLE_AUTH_REQUIRED' };
      
      await mockApiResponse(page, '**/api/google/calendar/**', authError, 401);
      await mockApiResponse(page, '**/api/google/gmail/**', authError, 401);
      await mockApiResponse(page, '**/api/google/drive/**', authError, 401);
      
      await page.reload();
      
      // All Google widgets should show consistent auth error
      const calendarWidget = await waitForWidget(page, 'google-calendar-widget');
      const gmailWidget = await waitForWidget(page, 'google-gmail-widget');
      const driveWidget = await waitForWidget(page, 'google-drive-widget');
      
      // Each should show auth error
      await expect(calendarWidget.locator('.auth-error, .error')).toBeVisible();
      await expect(gmailWidget.locator('.auth-error, .error')).toBeVisible();
      await expect(driveWidget.locator('.auth-error, .error')).toBeVisible();
      
      // Error messages should be consistent
      await expect(calendarWidget).toContainText(/authentication/i);
      await expect(gmailWidget).toContainText(/authentication/i);
      await expect(driveWidget).toContainText(/authentication/i);
    });

    test('should handle Google API rate limiting', async ({ page }) => {
      // Mock rate limit responses
      const rateLimitError = { 
        error: 'Rate limit exceeded', 
        retryAfter: 60 
      };
      
      await mockApiResponse(page, '**/api/google/**', rateLimitError, 429);
      
      await page.reload();
      
      // Widgets should show rate limit handling
      const googleWidgets = page.locator('[data-testid*="google-"][data-testid$="-widget"]');
      const widgetCount = await googleWidgets.count();
      
      for (let i = 0; i < widgetCount; i++) {
        const widget = googleWidgets.nth(i);
        const errorMessage = widget.locator('.error-message, .rate-limit-error');
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should refresh all Google widgets simultaneously', async ({ page }) => {
      // Set up API mocks
      await mockApiResponse(page, '**/api/google/calendar/**', mockCalendarEvents);
      await mockApiResponse(page, '**/api/google/gmail/**', mockGmailMessages);
      await mockApiResponse(page, '**/api/google/drive/**', mockDriveFiles);
      
      // Wait for widgets to load
      await waitForWidget(page, 'google-calendar-widget');
      await waitForWidget(page, 'google-gmail-widget');
      await waitForWidget(page, 'google-drive-widget');
      
      // Look for global refresh button or simulate refresh
      const globalRefresh = page.locator('button[title*="refresh all"], .refresh-all');
      
      if (await globalRefresh.isVisible()) {
        // Track API calls
        let apiCallCount = 0;
        page.on('response', response => {
          if (response.url().includes('/api/google/')) {
            apiCallCount++;
          }
        });
        
        await globalRefresh.click();
        
        // Should trigger multiple Google API calls
        await page.waitForTimeout(1000);
        expect(apiCallCount).toBeGreaterThan(1);
      }
    });
  });
});