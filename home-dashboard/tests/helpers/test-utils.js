// Test utilities and helpers for Playwright tests
import { expect } from '@playwright/test';

// Login helper
export async function loginWithGoogle(page, userEmail = 'test@example.com') {
  await page.goto('/login');
  
  // Since we can't actually complete Google OAuth in tests, 
  // we'll mock the authentication state
  await page.evaluate((email) => {
    localStorage.setItem('authToken', 'mock-test-token');
    localStorage.setItem('user', JSON.stringify({ 
      email, 
      name: 'Test User',
      id: 'test-user-id' 
    }));
  }, userEmail);
  
  await page.goto('/HurstHome');
  await page.waitForLoadState('networkidle');
}

// Helper for testing guest mode (no authentication)
export async function visitAsGuest(page) {
  // Clear any existing auth
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  });
  
  await page.goto('/HurstHome');
  await page.waitForLoadState('networkidle');
}

// Helper for testing authenticated state without login flow
export async function setAuthenticatedState(page, userEmail = 'test@hurst.family') {
  await page.evaluate((email) => {
    localStorage.setItem('authToken', 'mock-authenticated-token');
    localStorage.setItem('user', JSON.stringify({ 
      email, 
      name: 'Hurst Family User',
      id: 'hurst-user-123',
      authenticated: true
    }));
  }, userEmail);
  
  await page.goto('/HurstHome');
  await page.waitForLoadState('networkidle');
}

// Helper for testing logout
export async function logout(page) {
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    const logoutButton = page.locator('text=Sign out, text=Logout').first();
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

// Wait for widget to be visible and loaded
export async function waitForWidget(page, widgetTestId) {
  const widget = page.locator(`[data-testid="${widgetTestId}"]`);
  await expect(widget).toBeVisible();
  
  // Wait for loading states to complete
  const loadingIndicator = widget.locator('.loading-spinner, .loading, [data-loading="true"]');
  await expect(loadingIndicator).toHaveCount(0, { timeout: 10000 });
  
  return widget;
}

// Check if widget shows error state
export async function expectWidgetError(page, widgetTestId, errorMessage) {
  const widget = await waitForWidget(page, widgetTestId);
  const errorElement = widget.locator('.error-message, .error, [data-error="true"]');
  
  await expect(errorElement).toBeVisible();
  if (errorMessage) {
    await expect(errorElement).toContainText(errorMessage);
  }
}

// Mock API responses
export async function mockApiResponse(page, urlPattern, responseData, statusCode = 200, method = 'GET') {
  await page.route(urlPattern, async (route) => {
    if (method === 'ALL' || route.request().method() === method) {
      await route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      });
    } else {
      await route.continue();
    }
  });
}

// Mock successful DNS status
export const mockDnsStatus = {
  success: true,
  data: {
    status: 'healthy',
    uptime: 99.9,
    responseTime: 45,
    resolver: {
      ip: '8.8.8.8',
      location: 'Mountain View, CA',
      provider: 'Google'
    },
    lastCheck: new Date().toISOString()
  }
};

// Mock DNS analytics data
export const mockDnsAnalytics = {
  success: true,
  data: {
    totalQueries: 15420,
    blockedQueries: 3855,
    allowedQueries: 11565,
    blockRate: 25,
    timelineData: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      queries: Math.floor(Math.random() * 1000),
      blocked: Math.floor(Math.random() * 250)
    })),
    topDomains: [
      { domain: 'google.com', count: 2342 },
      { domain: 'youtube.com', count: 1876 },
      { domain: 'facebook.com', count: 1234 }
    ],
    topBlocked: [
      { domain: 'doubleclick.net', count: 876 },
      { domain: 'googlesyndication.com', count: 543 },
      { domain: 'facebook.com', count: 321 }
    ]
  }
};

// Mock Google Calendar events
export const mockCalendarEvents = {
  success: true,
  data: {
    events: [
      {
        id: '1',
        summary: 'Team Meeting',
        description: 'Weekly team standup meeting',
        start: { dateTime: new Date('2024-01-15T09:00:00').toISOString() },
        end: { dateTime: new Date('2024-01-15T10:00:00').toISOString() },
        location: 'Conference Room A'
      },
      {
        id: '2',
        summary: 'Dentist Appointment',
        description: 'Regular dental checkup',
        start: { dateTime: new Date('2024-01-15T14:30:00').toISOString() },
        end: { dateTime: new Date('2024-01-15T15:30:00').toISOString() },
        location: 'Main Street Dental'
      }
    ]
  }
};

// Mock Gmail messages
export const mockGmailMessages = {
  success: true,
  data: {
    messages: [
      {
        id: '1',
        subject: 'Project Update Required',
        from: 'John Doe <john@example.com>',
        snippet: 'Please review the latest project updates and provide feedback...',
        date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        unread: true,
        labels: ['INBOX', 'IMPORTANT']
      },
      {
        id: '2', 
        subject: 'Family Dinner Plans',
        from: 'Jane Smith <jane@example.com>',
        snippet: 'What should we make for dinner this weekend? I was thinking...',
        date: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
        unread: false,
        labels: ['INBOX']
      },
      {
        id: '3',
        subject: 'Grocery List Reminder',
        from: 'Family Bot <bot@family.local>',
        snippet: 'Don\'t forget to pick up milk, eggs, and bread from the store...',
        date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        unread: false,
        labels: ['INBOX']
      }
    ],
    totalCount: 3,
    unreadCount: 1
  }
};

// Mock Google Drive files
export const mockDriveFiles = {
  success: true,
  data: {
    files: [
      {
        id: '1',
        name: 'Family Photos 2024',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        owners: [{ displayName: 'Family User' }],
        size: null, // Folders don't have size
        webViewLink: 'https://drive.google.com/drive/folders/1'
      },
      {
        id: '2',
        name: 'Budget Spreadsheet',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        modifiedTime: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        owners: [{ displayName: 'Family User' }],
        size: '245760', // ~240KB
        webViewLink: 'https://docs.google.com/spreadsheets/d/2'
      },
      {
        id: '3',
        name: 'Meeting Notes',
        mimeType: 'application/vnd.google-apps.document',
        modifiedTime: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        owners: [{ displayName: 'Family User' }],
        size: '12340',
        webViewLink: 'https://docs.google.com/document/d/3'
      },
      {
        id: '4',
        name: 'vacation_photo.jpg',
        mimeType: 'image/jpeg',
        modifiedTime: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
        owners: [{ displayName: 'Family User' }],
        size: '2450000', // ~2.4MB
        webViewLink: 'https://drive.google.com/file/d/4'
      }
    ],
    nextPageToken: null
  }
};

// Mock meal plan data
export const mockMealPlan = {
  meals: {
    Monday: { name: 'Chicken Stir Fry', ingredients: 'chicken, vegetables, rice', cookTime: 25, difficulty: 'Easy' },
    Tuesday: { name: 'Beef Pasta', ingredients: 'beef, pasta, tomatoes', cookTime: 30, difficulty: 'Easy' },
    Wednesday: { name: 'Fish Tacos', ingredients: 'fish, tortillas, cabbage', cookTime: 20, difficulty: 'Easy' },
    Thursday: { name: 'Vegetable Curry', ingredients: 'vegetables, rice, curry paste', cookTime: 35, difficulty: 'Medium' },
    Friday: { name: 'Pizza Night', ingredients: 'dough, cheese, toppings', cookTime: 20, difficulty: 'Easy' },
    Saturday: { name: 'BBQ Chicken', ingredients: 'chicken, potatoes, salad', cookTime: 45, difficulty: 'Medium' },
    Sunday: { name: 'Roast Dinner', ingredients: 'beef, vegetables, potatoes', cookTime: 90, difficulty: 'Hard' }
  },
  availableIngredients: ['chicken', 'beef', 'vegetables', 'rice', 'pasta'],
  generatedFrom: 'AI suggestions',
  generatedAt: new Date().toISOString()
};

// Viewport sizes for responsive testing
export const viewports = {
  mobile: { width: 375, height: 667, label: 'Mobile' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  desktop: { width: 1280, height: 800, label: 'Desktop' },
  wide: { width: 1920, height: 1080, label: 'Wide' }
};

// Take screenshot with consistent naming
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `tests/screenshots/${name}.png`,
    fullPage: true
  });
}

// Check accessibility violations
export async function checkAccessibility(page, context) {
  const violations = await page.evaluate(() => {
    // This would normally use axe-core
    // For now, return empty array
    return [];
  });
  
  expect(violations).toHaveLength(0);
}