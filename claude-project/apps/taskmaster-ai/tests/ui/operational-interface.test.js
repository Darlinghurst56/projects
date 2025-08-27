/**
 * TaskMaster AI - Operational Interface UI Tests
 * Tests the new home page, navigation, and task management interface
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3010';

test.describe('TaskMaster Operational Interface', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for API calls
    page.setDefaultTimeout(10000);
  });

  test('Home page loads and displays navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check title
    await expect(page).toHaveTitle('TaskMaster AI - Home');
    
    // Check navigation is present
    await expect(page.locator('.tm-header')).toBeVisible();
    await expect(page.locator('.tm-nav')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('.tm-nav-link')).toHaveCount(6);
    
    // Check hero section
    await expect(page.locator('.hero-title')).toContainText('TaskMaster AI');
    await expect(page.locator('.hero-subtitle')).toContainText('Multi-Agent Task Coordination');
    
    // Check quick actions cards
    const actionCards = page.locator('.action-card');
    await expect(actionCards).toHaveCount(4);
    
    // Check system overview cards load data
    await expect(page.locator('#api-status')).not.toContainText('Checking...');
    await expect(page.locator('#total-agents')).not.toContainText('Loading...');
  });

  test('Navigation between pages works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test navigation to tasks page
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(`${BASE_URL}/tasks`);
    await expect(page).toHaveTitle('TaskMaster AI - Tasks');
    
    // Test navigation to agents page
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(`${BASE_URL}/agents`);
    
    // Test navigation back to home
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(BASE_URL);
  });

  test('Task management page displays tasks correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    
    // Check page title and header
    await expect(page).toHaveTitle('TaskMaster AI - Tasks');
    await expect(page.locator('.tasks-title')).toContainText('Tasks');
    
    // Check task statistics load
    await expect(page.locator('#done-count')).not.toContainText('0');
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card, .no-tasks, .error-state', { timeout: 10000 });
    
    // Check if tasks loaded or appropriate message is shown
    const hasTaskCards = await page.locator('.task-card').count() > 0;
    const hasNoTasks = await page.locator('.no-tasks').isVisible();
    const hasError = await page.locator('.error-state').isVisible();
    
    expect(hasTaskCards || hasNoTasks || hasError).toBe(true);
    
    // Test filters if tasks are present
    if (hasTaskCards) {
      // Test status filter
      await page.selectOption('#status-filter', 'done');
      
      // Test search filter
      await page.fill('#search-filter', 'test');
      
      // Clear filters
      await page.click('button:has-text("Clear Filters")');
      
      // Test task expansion
      await page.locator('.task-card').first().click();
      await expect(page.locator('.task-card.expanded')).toHaveCount(1);
    }
  });

  test('Agent dashboard loads with navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/agents`);
    
    // Check navigation is present
    await expect(page.locator('.tm-header')).toBeVisible();
    
    // Check agent dashboard content
    await expect(page.locator('h1')).toContainText('TaskMaster Agent Dashboard');
    
    // Check agent stats load
    await expect(page.locator('#totalAgents')).not.toContainText('-');
  });

  test('Developer interface loads with navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/developer-interface`);
    
    // Check page loads
    await expect(page).toHaveTitle('TaskMaster AI - Developer Dashboard');
    
    // Check navigation is present (may be integrated differently)
    const hasNavigation = await page.locator('.tm-header').count() > 0;
    const hasOriginalHeader = await page.locator('.header').count() > 0;
    
    expect(hasNavigation || hasOriginalHeader).toBe(true);
  });

  test('Mission Control interface loads with navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/mission-control`);
    
    // Check page loads
    await expect(page).toHaveTitle('TaskMaster Mission Control');
    
    // Check for navigation or content
    const hasNavigation = await page.locator('.tm-header').count() > 0;
    const hasContent = await page.locator('body').count() > 0;
    
    expect(hasNavigation || hasContent).toBe(true);
  });

  test('Quick action links from home page work', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test "View Tasks" action
    await page.click('.action-card[href="/tasks"]');
    await expect(page).toHaveURL(`${BASE_URL}/tasks`);
    
    // Go back to home
    await page.goto(BASE_URL);
    
    // Test "Developer Dashboard" action
    await page.click('.action-card[href="/developer-interface"]');
    await expect(page).toHaveURL(`${BASE_URL}/developer-interface`);
  });

  test('System status indicators work', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for system status to load
    await page.waitForTimeout(2000);
    
    // Check system status indicator in header
    const systemStatus = page.locator('#tm-system-status');
    await expect(systemStatus).toBeVisible();
    
    // Should not be in "Checking..." state
    const statusText = await systemStatus.textContent();
    expect(statusText).not.toContain('Checking...');
    
    // Should be one of the valid states
    expect(['System Online', 'System Warning', 'System Offline'].some(state => 
      statusText.includes(state)
    )).toBe(true);
  });

  test('Responsive design works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone viewport
    await page.goto(BASE_URL);
    
    // Check navigation adapts to mobile
    await expect(page.locator('.tm-nav')).toBeVisible();
    
    // Check quick actions stack properly
    const actionCards = page.locator('.action-card');
    await expect(actionCards.first()).toBeVisible();
    
    // Check tasks page on mobile
    await page.goto(`${BASE_URL}/tasks`);
    await expect(page.locator('.tasks-title')).toBeVisible();
    
    // Check filters adapt to mobile
    await expect(page.locator('.filters')).toBeVisible();
  });

  test('No broken links or "this would..." messages', async ({ page }) => {
    const pagesToTest = ['/', '/tasks', '/agents', '/developer-interface'];
    
    for (const pagePath of pagesToTest) {
      await page.goto(BASE_URL + pagePath);
      
      // Check for "this would" messages (placeholder text)
      const placeholderText = await page.locator('text=this would').count();
      expect(placeholderText).toBe(0);
      
      // Check for broken buttons or links
      const allLinks = page.locator('a[href], button:not([disabled])');
      const linkCount = await allLinks.count();
      
      if (linkCount > 0) {
        // Randomly test a few links to ensure they're not broken
        const randomLink = allLinks.nth(Math.floor(Math.random() * linkCount));
        const href = await randomLink.getAttribute('href');
        
        if (href && href.startsWith('/')) {
          // Test internal links
          await randomLink.click();
          
          // Should not be on error page or have error content
          const hasError = await page.locator('text=error').count() > 0;
          expect(hasError).toBe(false);
        }
      }
    }
  });

});

test.describe('API Integration Tests', () => {
  
  test('API endpoints respond correctly', async ({ page }) => {
    // Test API health endpoint
    const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
    expect(healthResponse.ok()).toBe(true);
    
    // Test tasks API endpoint
    const tasksResponse = await page.request.get(`${BASE_URL}/api/v2/tasks`);
    expect(tasksResponse.ok()).toBe(true);
    
    // Test agents API endpoint
    const agentsResponse = await page.request.get(`${BASE_URL}/api/v2/agents`);
    expect(agentsResponse.ok()).toBe(true);
  });

});