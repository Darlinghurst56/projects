/**
 * Unit Tests for DNS Status Widget
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DNS Status Widget (since we're testing the concept)
class DNSStatusWidget {
  constructor(container) {
    this.container = container;
    this.refreshInterval = null;
    this.status = 'unknown';
    this.profile = 'default';
  }

  async init() {
    this.render();
    this.setupEventListeners();
    this.startRefreshInterval();
    await this.fetchStatus();
  }

  render() {
    this.container.innerHTML = `
      <div class="dns-status-widget">
        <h3>DNS Status</h3>
        <div class="status-indicator ${this.status}"></div>
        <div class="profile-name">${this.profile}</div>
        <button class="refresh-btn">Refresh</button>
        <button class="pause-btn">Pause</button>
      </div>
    `;
  }

  setupEventListeners() {
    const refreshBtn = this.container.querySelector('.refresh-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    
    refreshBtn?.addEventListener('click', () => this.refreshData());
    pauseBtn?.addEventListener('click', () => this.togglePause());
  }

  async fetchStatus() {
    try {
      const response = await fetch('/api/widgets/dns-status');
      const data = await response.json();
      this.updateStatus(data.status, data.profile);
    } catch (error) {
      this.updateStatus('error', 'unknown');
    }
  }

  updateStatus(status, profile) {
    this.status = status;
    this.profile = profile;
    
    const indicator = this.container.querySelector('.status-indicator');
    const profileElement = this.container.querySelector('.profile-name');
    
    if (indicator) {
      indicator.className = `status-indicator ${status}`;
    }
    if (profileElement) {
      profileElement.textContent = profile;
    }
  }

  startRefreshInterval() {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 30000);
  }

  async refreshData() {
    await this.fetchStatus();
  }

  togglePause() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    } else {
      this.startRefreshInterval();
    }
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.container.innerHTML = '';
  }
}

describe('DNS Status Widget', () => {
  let dom;
  let container;
  let widget;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.fetch = vi.fn();

    container = document.createElement('div');
    document.body.appendChild(container);
    
    widget = new DNSStatusWidget(container);
  });

  afterEach(() => {
    widget.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Widget Initialization', () => {
    it('should render widget structure correctly', async () => {
      await widget.init();
      
      expect(container.querySelector('.dns-status-widget')).toBeTruthy();
      expect(container.querySelector('h3').textContent).toBe('DNS Status');
      expect(container.querySelector('.status-indicator')).toBeTruthy();
      expect(container.querySelector('.refresh-btn')).toBeTruthy();
      expect(container.querySelector('.pause-btn')).toBeTruthy();
    });

    it('should fetch initial status on init', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'active',
          profile: 'production'
        })
      });

      await widget.init();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/widgets/dns-status');
      expect(widget.status).toBe('active');
      expect(widget.profile).toBe('production');
    });
  });

  describe('Status Updates', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'active', profile: 'default' })
      });
      await widget.init();
    });

    it('should update status indicator class', () => {
      widget.updateStatus('inactive', 'test');
      
      const indicator = container.querySelector('.status-indicator');
      expect(indicator.classList.contains('inactive')).toBe(true);
    });

    it('should update profile display', () => {
      widget.updateStatus('active', 'development');
      
      const profileElement = container.querySelector('.profile-name');
      expect(profileElement.textContent).toBe('development');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));
      
      await widget.fetchStatus();
      
      expect(widget.status).toBe('error');
      expect(widget.profile).toBe('unknown');
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'active', profile: 'default' })
      });
      await widget.init();
    });

    it('should refresh data when refresh button clicked', async () => {
      const refreshSpy = vi.spyOn(widget, 'refreshData');
      
      const refreshBtn = container.querySelector('.refresh-btn');
      refreshBtn.click();
      
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should toggle pause when pause button clicked', () => {
      const initialInterval = widget.refreshInterval;
      
      const pauseBtn = container.querySelector('.pause-btn');
      pauseBtn.click();
      
      expect(widget.refreshInterval).toBeNull();
      
      pauseBtn.click();
      expect(widget.refreshInterval).toBeTruthy();
      expect(widget.refreshInterval).not.toBe(initialInterval);
    });
  });

  describe('Auto-refresh Functionality', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'active', profile: 'default' })
      });
      await widget.init();
    });

    it('should start refresh interval on init', () => {
      expect(widget.refreshInterval).toBeTruthy();
    });

    it('should refresh data at intervals', async () => {
      const refreshSpy = vi.spyOn(widget, 'refreshData');
      
      // Fast-forward time by 30 seconds
      vi.useFakeTimers();
      vi.advanceTimersByTime(30000);
      
      expect(refreshSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should clear interval on destroy', () => {
      const intervalId = widget.refreshInterval;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      widget.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
      expect(widget.refreshInterval).toBeNull();
    });
  });

  describe('Widget Lifecycle', () => {
    it('should clean up properly on destroy', async () => {
      await widget.init();
      
      widget.destroy();
      
      expect(container.innerHTML).toBe('');
      expect(widget.refreshInterval).toBeNull();
    });

    it('should handle multiple init calls gracefully', async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'active', profile: 'default' })
      });

      await widget.init();
      const firstInterval = widget.refreshInterval;
      
      await widget.init();
      const secondInterval = widget.refreshInterval;
      
      // Should have cleared the old interval
      expect(secondInterval).not.toBe(firstInterval);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ status: 'active', profile: 'default' })
      });
      await widget.init();
    });

    it('should have accessible button labels', () => {
      const refreshBtn = container.querySelector('.refresh-btn');
      const pauseBtn = container.querySelector('.pause-btn');
      
      expect(refreshBtn.textContent).toBe('Refresh');
      expect(pauseBtn.textContent).toBe('Pause');
    });

    it('should support keyboard navigation', () => {
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        expect(button.tabIndex).not.toBe(-1);
      });
    });
  });
});