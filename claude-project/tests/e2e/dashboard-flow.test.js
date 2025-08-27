/**
 * End-to-End Tests for Dashboard User Flow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { testUtils } from '../setup.js';

describe('Dashboard E2E Flow', () => {
  let browser;
  let page;
  let serverProcess;
  const baseUrl = 'http://localhost:8000';

  beforeEach(async () => {
    // Start the development server
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: true
    });

    // Wait for server to start
    await testUtils.waitFor(async () => {
      try {
        const response = await fetch(`${baseUrl}/health`);
        return response.ok;
      } catch {
        return false;
      }
    }, 10000);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
    
    if (serverProcess) {
      process.kill(-serverProcess.pid, 'SIGTERM');
    }
  });

  describe('Authentication Flow', () => {
    it('should require PIN authentication', async () => {
      await page.goto(`${baseUrl}/dashboard.html`);
      
      // Should redirect to auth page or show auth form
      await page.waitForSelector('.pin-login, #auth-form', { timeout: 5000 });
      
      // Check if PIN input is present
      const pinInput = await page.$('input[type="password"], input[placeholder*="PIN"]');
      expect(pinInput).toBeTruthy();
    });

    it('should authenticate with correct PIN', async () => {
      await page.goto(`${baseUrl}/auth.html`);
      
      // Wait for auth form
      await page.waitForSelector('#auth-form');
      
      // Enter correct PIN (assuming 1234 is configured)
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForNavigation();
      expect(page.url()).toContain('dashboard.html');
    });

    it('should reject incorrect PIN', async () => {
      await page.goto(`${baseUrl}/auth.html`);
      
      await page.waitForSelector('#auth-form');
      
      // Enter incorrect PIN
      await page.type('input[name="pin"]', '0000');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await page.waitForSelector('.error-message, .alert-danger');
      
      const errorText = await page.$eval('.error-message, .alert-danger', el => el.textContent);
      expect(errorText.toLowerCase()).toContain('incorrect');
    });
  });

  describe('Dashboard Loading and Layout', () => {
    beforeEach(async () => {
      // Authenticate first
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('should load dashboard with all widgets', async () => {
      // Wait for dashboard to load
      await page.waitForSelector('.widget-container');
      
      // Check for essential widgets
      const widgets = await page.$$('.widget');
      expect(widgets.length).toBeGreaterThan(0);
      
      // Verify specific widgets are present
      const widgetTitles = await page.$$eval('.widget h3, .widget h2', 
        elements => elements.map(el => el.textContent)
      );
      
      expect(widgetTitles).toEqual(
        expect.arrayContaining(['DNS Status', 'Task Assignment'])
      );
    });

    it('should be responsive on mobile', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      
      await page.waitForSelector('.widget-container');
      
      // Check that widgets stack vertically on mobile
      const widgetContainer = await page.$('.widget-container');
      const containerStyles = await page.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          flexDirection: styles.flexDirection
        };
      }, widgetContainer);
      
      expect(containerStyles.flexDirection).toBe('column');
    });
  });

  describe('Widget Functionality', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.waitForSelector('.widget-container');
    });

    it('should display DNS status correctly', async () => {
      const dnsWidget = await page.$('.dns-status-widget');
      expect(dnsWidget).toBeTruthy();
      
      // Wait for status to load
      await page.waitForSelector('.status-indicator');
      
      const statusClass = await page.$eval('.status-indicator', 
        el => el.className
      );
      
      expect(statusClass).toMatch(/status-(active|inactive|error)/);
    });

    it('should refresh widget data on button click', async () => {
      // Find and click refresh button
      const refreshBtn = await page.$('.refresh-btn');
      expect(refreshBtn).toBeTruthy();
      
      // Monitor network requests
      const responses = [];
      page.on('response', response => {
        if (response.url().includes('/api/widgets/')) {
          responses.push(response.url());
        }
      });
      
      await refreshBtn.click();
      
      // Wait for API call
      await testUtils.waitFor(() => responses.length > 0, 3000);
      
      expect(responses.length).toBeGreaterThan(0);
    });

    it('should show task assignment data', async () => {
      const taskWidget = await page.$('.task-assignment-widget');
      expect(taskWidget).toBeTruthy();
      
      // Wait for task data to load
      await page.waitForSelector('.agent-assignment');
      
      const assignments = await page.$$('.agent-assignment');
      expect(assignments.length).toBeGreaterThan(0);
      
      // Check assignment data structure
      const assignmentData = await page.$eval('.agent-assignment', el => ({
        agentId: el.querySelector('.agent-id')?.textContent,
        taskCount: el.querySelector('.task-count')?.textContent,
        role: el.querySelector('.role')?.textContent
      }));
      
      expect(assignmentData.agentId).toBeTruthy();
      expect(assignmentData.taskCount).toBeTruthy();
      expect(assignmentData.role).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.waitForSelector('.widget-container');
    });

    it('should connect to WebSocket for live updates', async () => {
      // Monitor WebSocket connections
      const wsConnections = [];
      
      page.on('websocket', ws => {
        wsConnections.push(ws.url());
      });
      
      // Trigger WebSocket connection (usually happens automatically)
      await page.evaluate(() => {
        if (window.connectWebSocket) {
          window.connectWebSocket();
        }
      });
      
      // Wait for WebSocket connection
      await testUtils.waitFor(() => wsConnections.length > 0, 5000);
      
      expect(wsConnections[0]).toContain('ws://');
    });

    it('should update widget data from WebSocket', async () => {
      // Get initial task count
      const initialCount = await page.$eval('.task-count', 
        el => parseInt(el.textContent)
      );
      
      // Simulate WebSocket message (this would normally come from server)
      await page.evaluate(() => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'task-update',
            data: { agentId: 'frontend-1', taskCount: 5 }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Wait for UI update
      await page.waitForFunction(
        (oldCount) => {
          const newCount = parseInt(document.querySelector('.task-count')?.textContent || '0');
          return newCount !== oldCount;
        },
        {},
        initialCount
      );
      
      const updatedCount = await page.$eval('.task-count', 
        el => parseInt(el.textContent)
      );
      
      expect(updatedCount).not.toBe(initialCount);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('should handle API failures gracefully', async () => {
      // Block API requests to simulate failure
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        if (request.url().includes('/api/widgets/')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      await page.reload();
      await page.waitForSelector('.widget-container');
      
      // Should show error state in widgets
      const errorIndicators = await page.$$('.error-state, .status-error');
      expect(errorIndicators.length).toBeGreaterThan(0);
    });

    it('should recover from network errors', async () => {
      // Initially block requests
      await page.setRequestInterception(true);
      let blockRequests = true;
      
      page.on('request', request => {
        if (request.url().includes('/api/widgets/') && blockRequests) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      await page.reload();
      await page.waitForSelector('.error-state, .status-error');
      
      // Unblock requests and retry
      blockRequests = false;
      
      const retryBtn = await page.$('.retry-btn, .refresh-btn');
      if (retryBtn) {
        await retryBtn.click();
        
        // Should recover and show normal status
        await page.waitForSelector('.status-active, .status-indicator:not(.error)');
      }
    });
  });

  describe('Performance', () => {
    it('should load dashboard within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.waitForSelector('.widget-container');
      
      // Wait for all widgets to finish loading
      await page.waitForFunction(() => {
        const widgets = document.querySelectorAll('.widget');
        return Array.from(widgets).every(widget => 
          !widget.classList.contains('loading')
        );
      });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should have good lighthouse performance score', async () => {
      // This would require lighthouse CI integration
      // For now, we'll test basic performance metrics
      
      await page.goto(`${baseUrl}/auth.html`);
      await page.type('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      const metrics = await page.metrics();
      
      // Basic performance checks
      expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB
      expect(metrics.Nodes).toBeLessThan(1000); // DOM nodes
    });
  });
});