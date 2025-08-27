import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  waitForWidget,
  mockApiResponse,
  mockDnsStatus,
  mockDnsAnalytics
} from '../helpers/test-utils';

test.describe('DNS Widgets Testing', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithGoogle(page);
  });

  test.describe('DNS Status Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/status', mockDnsStatus);
    });

    test('should display DNS status correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-status-widget');
      
      // Should show healthy status
      await expect(widget.locator('.status, [data-status]')).toContainText(/healthy|connected/i);
      
      // Should show uptime percentage
      await expect(widget).toContainText('99.9%');
      
      // Should show response time
      await expect(widget).toContainText('45');
      
      // Should show resolver information
      await expect(widget).toContainText('Google');
    });

    test('should show error state when DNS fails', async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/status', {
        success: false,
        message: 'DNS service unavailable'
      }, 503);
      
      await page.reload();
      
      const widget = await waitForWidget(page, 'dns-status-widget');
      
      // Should show error state
      const errorElement = widget.locator('.error-message, .error, [data-error="true"]');
      await expect(errorElement).toBeVisible();
      await expect(errorElement).toContainText(/unavailable|error/i);
    });

    test('should refresh data when refresh button clicked', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-status-widget');
      
      // Look for refresh button
      const refreshBtn = widget.locator('button[title*="refresh"], button[aria-label*="refresh"], .refresh-btn');
      
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        
        // Should show loading state briefly
        const loadingIndicator = widget.locator('.loading-spinner, .loading');
        await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
        await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
      }
    });

    test('should handle network disconnection gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/dns/status', route => route.abort());
      
      await page.reload();
      
      const widget = await waitForWidget(page, 'dns-status-widget');
      
      // Should show error or offline state
      const errorElement = widget.locator('.error-message, .offline, [data-offline="true"]');
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('DNS Analytics Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/analytics*', mockDnsAnalytics);
    });

    test('should display analytics data correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Should show total queries
      await expect(widget).toContainText('15420');
      
      // Should show blocked queries
      await expect(widget).toContainText('3855');
      
      // Should show block rate percentage
      await expect(widget).toContainText('25%');
      
      // Should render charts
      const chart = widget.locator('.recharts-wrapper, .chart, svg');
      await expect(chart.first()).toBeVisible();
    });

    test('should allow time range selection', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Look for time range selector
      const timeRangeButtons = widget.locator('button:has-text("1H"), button:has-text("24H"), button:has-text("7D")');
      
      if (await timeRangeButtons.first().isVisible()) {
        // Click on 24H option
        const dayButton = widget.locator('button:has-text("24H")');
        await dayButton.click();
        
        // Should become active
        await expect(dayButton).toHaveClass(/active|selected/);
        
        // Should trigger new API call
        await page.waitForResponse(response => 
          response.url().includes('/api/dns/analytics') && 
          response.url().includes('timeRange=24h')
        );
      }
    });

    test('should display top domains list', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Should show domain lists
      await expect(widget).toContainText('google.com');
      await expect(widget).toContainText('youtube.com');
      await expect(widget).toContainText('facebook.com');
      
      // Should show query counts
      await expect(widget).toContainText('2342');
      await expect(widget).toContainText('1876');
    });

    test('should display blocked domains list', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Should show blocked domains
      await expect(widget).toContainText('doubleclick.net');
      await expect(widget).toContainText('googlesyndication.com');
      
      // Should show blocked counts
      await expect(widget).toContainText('876');
      await expect(widget).toContainText('543');
    });

    test('should handle empty analytics data', async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/analytics*', {
        success: true,
        data: {
          totalQueries: 0,
          blockedQueries: 0,
          allowedQueries: 0,
          blockRate: 0,
          timelineData: [],
          topDomains: [],
          topBlocked: []
        }
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'dns-analytics-widget');
      
      // Should show zero state
      await expect(widget).toContainText('0');
      await expect(widget).toContainText(/no data|empty/i);
    });
  });

  test.describe('DNS Profile Widget', () => {
    const mockProfileData = {
      success: true,
      data: {
        provider: 'Control D',
        primaryDns: '76.76.19.19',
        secondaryDns: '76.76.2.2',
        domain: 'family.local',
        ttl: 3600,
        recordType: 'A'
      }
    };

    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/profile', mockProfileData);
    });

    test('should display DNS profile information', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Should show provider
      await expect(widget).toContainText('Control D');
      
      // Should show DNS servers
      await expect(widget).toContainText('76.76.19.19');
      await expect(widget).toContainText('76.76.2.2');
      
      // Should show domain
      await expect(widget).toContainText('family.local');
      
      // Should show TTL
      await expect(widget).toContainText('3600');
    });

    test('should enable edit mode', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Click edit button
      const editBtn = widget.locator('button:has-text("Edit"), .edit-btn, button[title*="edit"]');
      await expect(editBtn).toBeVisible();
      await editBtn.click();
      
      // Should switch to edit mode
      const editForm = widget.locator('form, .profile-editor');
      await expect(editForm).toBeVisible();
      
      // Should show input fields
      const inputs = widget.locator('input[type="text"], select');
      expect(await inputs.count()).toBeGreaterThan(0);
      
      // Primary DNS input should be editable
      const primaryDnsInput = widget.locator('input[placeholder*="primary" i], input[name*="primary"]');
      await expect(primaryDnsInput).toBeEditable();
    });

    test('should validate DNS IP addresses', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Enter edit mode
      const editBtn = widget.locator('button:has-text("Edit"), .edit-btn');
      await editBtn.click();
      
      // Enter invalid IP
      const primaryDnsInput = widget.locator('input[placeholder*="primary" i], input[name*="primary"]').first();
      await primaryDnsInput.clear();
      await primaryDnsInput.fill('invalid-ip');
      
      // Try to save
      const saveBtn = widget.locator('button:has-text("Save"), .save-btn');
      await saveBtn.click();
      
      // Should show validation error
      const errorMessage = widget.locator('.error-text, .error, [data-error="true"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/invalid|format/i);
    });

    test('should save profile changes', async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/profile', mockProfileData, 'PUT');
      
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Enter edit mode
      const editBtn = widget.locator('button:has-text("Edit"), .edit-btn');
      await editBtn.click();
      
      // Change primary DNS
      const primaryDnsInput = widget.locator('input[placeholder*="primary" i], input[name*="primary"]').first();
      await primaryDnsInput.clear();
      await primaryDnsInput.fill('8.8.8.8');
      
      // Save changes
      const saveBtn = widget.locator('button:has-text("Save"), .save-btn');
      await saveBtn.click();
      
      // Should send API request
      await page.waitForResponse(response => 
        response.url().includes('/api/dns/profile') && 
        response.request().method() === 'PUT'
      );
      
      // Should exit edit mode
      await expect(widget.locator('form, .profile-editor')).toBeHidden({ timeout: 5000 });
      
      // Should show updated value
      await expect(widget).toContainText('8.8.8.8');
    });

    test('should cancel edit mode without saving', async ({ page }) => {
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Enter edit mode
      const editBtn = widget.locator('button:has-text("Edit"), .edit-btn');
      await editBtn.click();
      
      // Change a value
      const primaryDnsInput = widget.locator('input[placeholder*="primary" i], input[name*="primary"]').first();
      await primaryDnsInput.clear();
      await primaryDnsInput.fill('8.8.8.8');
      
      // Cancel changes
      const cancelBtn = widget.locator('button:has-text("Cancel"), .cancel-btn');
      await cancelBtn.click();
      
      // Should exit edit mode
      await expect(widget.locator('form, .profile-editor')).toBeHidden();
      
      // Should revert to original value
      await expect(widget).toContainText('76.76.19.19'); // Original value
      await expect(widget).not.toContainText('8.8.8.8'); // Changed value shouldn't be saved
    });

    test('should handle save errors gracefully', async ({ page }) => {
      await mockApiResponse(page, '**/api/dns/profile', {
        success: false,
        message: 'Failed to update DNS profile'
      }, 500, 'PUT');
      
      const widget = await waitForWidget(page, 'dns-profile-widget');
      
      // Enter edit mode and make changes
      const editBtn = widget.locator('button:has-text("Edit"), .edit-btn');
      await editBtn.click();
      
      const primaryDnsInput = widget.locator('input[placeholder*="primary" i], input[name*="primary"]').first();
      await primaryDnsInput.clear();
      await primaryDnsInput.fill('8.8.8.8');
      
      // Try to save
      const saveBtn = widget.locator('button:has-text("Save"), .save-btn');
      await saveBtn.click();
      
      // Should show error message
      const errorMessage = widget.locator('.error-message, .error');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toContainText(/failed|error/i);
      
      // Should remain in edit mode
      await expect(widget.locator('form, .profile-editor')).toBeVisible();
    });
  });

  test.describe('DNS Widgets Integration', () => {
    test('should update all DNS widgets when profile changes', async ({ page }) => {
      // Mock all DNS endpoints
      await mockApiResponse(page, '**/api/dns/status', mockDnsStatus);
      await mockApiResponse(page, '**/api/dns/analytics*', mockDnsAnalytics);
      await mockApiResponse(page, '**/api/dns/profile', {
        success: true,
        data: {
          provider: 'Custom',
          primaryDns: '1.1.1.1',
          secondaryDns: '1.0.0.1'
        }
      }, 'PUT');
      
      // Wait for all widgets to load
      await waitForWidget(page, 'dns-status-widget');
      await waitForWidget(page, 'dns-analytics-widget');
      const profileWidget = await waitForWidget(page, 'dns-profile-widget');
      
      // Change DNS provider in profile widget
      const editBtn = profileWidget.locator('button:has-text("Edit"), .edit-btn');
      await editBtn.click();
      
      const providerSelect = profileWidget.locator('select[name*="provider"], select option:has-text("Custom")');
      if (await providerSelect.isVisible()) {
        await providerSelect.click();
      }
      
      const primaryDnsInput = profileWidget.locator('input[placeholder*="primary" i]').first();
      await primaryDnsInput.clear();
      await primaryDnsInput.fill('1.1.1.1');
      
      const saveBtn = profileWidget.locator('button:has-text("Save"), .save-btn');
      await saveBtn.click();
      
      // Should trigger refresh of other widgets
      await page.waitForTimeout(1000);
      
      // Profile should show updated values
      await expect(profileWidget).toContainText('1.1.1.1');
    });
  });
});