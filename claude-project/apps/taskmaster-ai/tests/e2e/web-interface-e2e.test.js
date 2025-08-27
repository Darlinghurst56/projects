/**
 * End-to-End Tests for Web Interface and SSE Integration
 * Tests responsiveness, SSE connections, and real-time updates
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { testUtils } from '../setup.js';

describe('Web Interface E2E Tests', () => {
  let browser;
  let page;
  let serverProcess;
  const baseUrl = 'http://localhost:3010';

  beforeEach(async () => {
    // Start the TaskMaster API server
    serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true,
      cwd: process.cwd()
    });

    // Wait for server to start
    await testUtils.waitFor(async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        return response.ok;
      } catch {
        return false;
      }
    }, 15000);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set viewport for responsive testing
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
    
    if (serverProcess) {
      process.kill(-serverProcess.pid);
    }
  });

  describe('Web Interface Layout and Responsiveness', () => {
    it('should load developer dashboard successfully', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Check for main elements
      await page.waitForSelector('.dashboard-container');
      await page.waitForSelector('.connection-status');
      await page.waitForSelector('.stats-grid');
      
      const title = await page.title();
      expect(title).toBe('TaskMaster AI - Developer Dashboard');
    });

    it('should show connection status indicators', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for connection status to update
      await page.waitForSelector('.connection-status');
      
      const connectionStatus = await page.$eval('.connection-status', el => {
        return {
          classes: el.className,
          text: el.textContent
        };
      });
      
      expect(connectionStatus.classes).toContain('connection-status');
      expect(connectionStatus.text).toContain('TaskMaster');
    });

    it('should display agent statistics', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for stats to load
      await page.waitForSelector('.stats-grid');
      
      const stats = await page.$$eval('.stat-card', cards => {
        return cards.map(card => ({
          label: card.querySelector('.stat-label')?.textContent,
          value: card.querySelector('.stat-value')?.textContent
        }));
      });
      
      expect(stats).toHaveLength(4);
      expect(stats.some(stat => stat.label === 'Total Agents')).toBe(true);
      expect(stats.some(stat => stat.label === 'Available')).toBe(true);
    });

    it('should be responsive on mobile viewport', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Check if mobile-responsive elements are present
      await page.waitForSelector('.dashboard-container');
      
      const isVisible = await page.evaluate(() => {
        const container = document.querySelector('.dashboard-container');
        return container && container.offsetWidth <= 375;
      });
      
      expect(isVisible).toBe(true);
    });
  });

  describe('SSE Integration Tests', () => {
    it('should establish SSE connection', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for SSE connection to establish
      await page.waitForFunction(() => {
        return window.eventSource && window.eventSource.readyState === EventSource.OPEN;
      }, { timeout: 10000 });
      
      const sseState = await page.evaluate(() => {
        return {
          readyState: window.eventSource?.readyState,
          url: window.eventSource?.url
        };
      });
      
      expect(sseState.readyState).toBe(EventSource.OPEN);
      expect(sseState.url).toContain('/api/events');
    });

    it('should receive orchestrator handoff events', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for SSE connection
      await page.waitForFunction(() => {
        return window.eventSource && window.eventSource.readyState === EventSource.OPEN;
      });
      
      // Listen for SSE messages
      const sseMessages = [];
      await page.evaluateOnNewDocument(() => {
        window.sseMessages = [];
        if (window.eventSource) {
          window.eventSource.addEventListener('message', (event) => {
            window.sseMessages.push(JSON.parse(event.data));
          });
        }
      });
      
      // Trigger orchestrator handoff
      await fetch(`${baseUrl}/api/events/orchestrator/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'analysis',
          taskId: 'test-sse-001',
          agentId: 'orchestrator-agent',
          message: 'Testing SSE integration'
        })
      });
      
      // Wait for SSE message
      await page.waitForFunction(() => {
        return window.sseMessages && window.sseMessages.length > 0;
      }, { timeout: 5000 });
      
      const messages = await page.evaluate(() => window.sseMessages);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should handle SSE connection errors gracefully', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for initial connection
      await page.waitForSelector('.connection-status');
      
      // Simulate connection error by closing server
      if (serverProcess) {
        process.kill(-serverProcess.pid);
      }
      
      // Wait for error state
      await page.waitForFunction(() => {
        const status = document.querySelector('.connection-status');
        return status && status.classList.contains('disconnected');
      }, { timeout: 10000 });
      
      const errorState = await page.$eval('.connection-status', el => el.className);
      expect(errorState).toContain('disconnected');
    });
  });

  describe('Visual Flow Interface Tests', () => {
    it('should display orchestrator handoff stages', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for visual flow tabs
      await page.waitForSelector('.flow-stage-selector');
      
      const stages = await page.$$eval('.stage-tab', tabs => {
        return tabs.map(tab => ({
          stage: tab.dataset.stage,
          text: tab.textContent.trim()
        }));
      });
      
      expect(stages).toHaveLength(4);
      expect(stages.some(stage => stage.stage === 'analysis')).toBe(true);
      expect(stages.some(stage => stage.stage === 'handoff')).toBe(true);
      expect(stages.some(stage => stage.stage === 'execution')).toBe(true);
      expect(stages.some(stage => stage.stage === 'completion')).toBe(true);
    });

    it('should switch between flow stages', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for flow interface
      await page.waitForSelector('.flow-stage-selector');
      
      // Click on handoff stage
      await page.click('[data-stage="handoff"]');
      
      // Wait for stage content to load
      await page.waitForSelector('.handoff-content');
      
      const activeStage = await page.$eval('.stage-tab.active', tab => tab.dataset.stage);
      expect(activeStage).toBe('handoff');
    });
  });

  describe('Real-time Updates Tests', () => {
    it('should update agent status in real-time', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for agents grid
      await page.waitForSelector('.agents-grid');
      
      // Get initial agent count
      const initialCount = await page.$eval('#total-agents', el => el.textContent);
      
      // Register a new agent via API
      await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'test-e2e-agent',
          role: 'frontend-agent'
        })
      });
      
      // Wait for UI to update
      await page.waitForFunction((initial) => {
        const current = document.querySelector('#total-agents')?.textContent;
        return current && current !== initial;
      }, {}, initialCount);
      
      const updatedCount = await page.$eval('#total-agents', el => el.textContent);
      expect(parseInt(updatedCount)).toBeGreaterThan(parseInt(initialCount));
    });

    it('should display notifications for events', async () => {
      await page.goto(`${baseUrl}/developer-interface`);
      
      // Wait for page to load
      await page.waitForSelector('.dashboard-container');
      
      // Trigger an event that should show a notification
      await page.evaluate(() => {
        if (window.showNotification) {
          window.showNotification('Test notification', 'success');
        }
      });
      
      // Check for notification
      await page.waitForSelector('.notification');
      
      const notification = await page.$eval('.notification', el => ({
        text: el.textContent,
        classes: el.className
      }));
      
      expect(notification.text).toContain('Test notification');
      expect(notification.classes).toContain('success');
    });
  });

  describe('Performance Tests', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto(`${baseUrl}/developer-interface`);
      await page.waitForSelector('.dashboard-container');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    it('should handle multiple concurrent SSE connections', async () => {
      // Open multiple pages
      const pages = await Promise.all([
        browser.newPage(),
        browser.newPage(),
        browser.newPage()
      ]);
      
      // Navigate all pages to dashboard
      await Promise.all(pages.map(p => p.goto(`${baseUrl}/developer-interface`)));
      
      // Wait for all SSE connections
      await Promise.all(pages.map(p => 
        p.waitForFunction(() => {
          return window.eventSource && window.eventSource.readyState === EventSource.OPEN;
        })
      ));
      
      // Check server status shows multiple connections
      const serverStatus = await fetch(`${baseUrl}/api/server/status`);
      const status = await serverStatus.json();
      
      expect(status.connectivity.serverSentEvents.connections).toBeGreaterThan(0);
      
      // Clean up
      await Promise.all(pages.map(p => p.close()));
    });
  });
});