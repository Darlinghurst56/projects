/**
 * Pause/Test Connection Widget - Interactive DNS Connection Testing and Management
 * Provides controls for testing and managing DNS connections with status feedback
 */

class PauseTestWidget {
    constructor(container) {
        this.container = container;
        this.data = null;
        this.testInProgress = false;
        this.isPaused = false;
        this.apiClient = new ControlDApiClient();
        this.eventBus = window.eventBus || new EventBus();
        this.logger = window.interactionLogger || new InteractionLogger();
        this.settings = {
            testTimeout: 10000, // 10 seconds
            autoRefresh: true,
            showDetailedResults: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Pause/Test Connection Widget');
        
        try {
            // Load widget template
            await this.loadTemplate();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial status
            await this.loadInitialStatus();
            
            console.log('✅ Pause/Test Connection Widget initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Pause/Test Widget:', error);
            this.showError('Failed to initialize Pause/Test Connection widget');
        }
    }
    
    async loadTemplate() {
        if (!this.container.querySelector('.pause-test-widget')) {
            this.container.innerHTML = `
                <div class="pause-test-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">Connection Control</h3>
                        <div class="widget-controls">
                            <button class="widget-refresh" data-action="refresh" title="Refresh status">↻</button>
                            <button class="widget-settings" data-action="settings" title="Widget settings">⚙</button>
                        </div>
                    </div>
                    
                    <div class="widget-content">
                        <div class="connection-status">
                            <div class="status-indicator">
                                <span class="status-dot" id="connection-dot"></span>
                                <span class="status-text" id="connection-status">Checking...</span>
                            </div>
                        </div>
                        
                        <div class="control-buttons">
                            <button class="btn btn-primary test-connection" id="test-btn" data-tooltip="Test your DNS connection">
                                <span class="btn-icon">🔍</span>
                                <span class="btn-text">Test Connection</span>
                            </button>
                            
                            <button class="btn btn-warning pause-connection" id="pause-btn" data-tooltip="Temporarily pause DNS filtering">
                                <span class="btn-icon">⏸️</span>
                                <span class="btn-text">Pause Protection</span>
                            </button>
                            
                            <button class="btn btn-success resume-connection" id="resume-btn" style="display: none;" data-tooltip="Resume DNS protection">
                                <span class="btn-icon">▶️</span>
                                <span class="btn-text">Resume Protection</span>
                            </button>
                        </div>
                        
                        <div class="test-results" id="test-results" style="display: none;">
                            <h4>Test Results</h4>
                            <div class="results-content">
                                <div class="result-item">
                                    <span class="result-label">DNS Resolution:</span>
                                    <span class="result-value" id="dns-resolution">-</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Response Time:</span>
                                    <span class="result-value" id="response-time">-</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Filter Status:</span>
                                    <span class="result-value" id="filter-status">-</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Current Resolver:</span>
                                    <span class="result-value" id="current-resolver">-</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="recent-activity">
                            <h4>Recent Activity</h4>
                            <div class="activity-list" id="activity-list">
                                <div class="activity-item">
                                    <span class="activity-time">Just now</span>
                                    <span class="activity-text">Widget initialized</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="widget-footer">
                        <div class="status-info">
                            <span class="last-updated">Last updated: <span id="last-updated-time">-</span></span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    setupEventListeners() {
        // Test connection button
        const testBtn = this.container.querySelector('#test-btn');
        testBtn?.addEventListener('click', () => this.testConnection());
        
        // Pause button
        const pauseBtn = this.container.querySelector('#pause-btn');
        pauseBtn?.addEventListener('click', () => this.pauseConnection());
        
        // Resume button
        const resumeBtn = this.container.querySelector('#resume-btn');
        resumeBtn?.addEventListener('click', () => this.resumeConnection());
        
        // Refresh button
        const refreshBtn = this.container.querySelector('.widget-refresh');
        refreshBtn?.addEventListener('click', () => this.refresh());
        
        // Settings button
        const settingsBtn = this.container.querySelector('.widget-settings');
        settingsBtn?.addEventListener('click', () => this.openSettings());
        
        // Event bus subscriptions
        this.eventBus.subscribe('connection.status.changed', (data) => {
            this.updateConnectionStatus(data);
        });
        
        this.eventBus.subscribe('widget.refresh.all', () => {
            this.refresh();
        });
    }
    
    async loadInitialStatus() {
        try {
            this.showLoading(true);
            const status = await this.apiClient.getConnectionStatus();
            this.updateConnectionStatus(status);
            this.addActivity('Connection status loaded');
        } catch (error) {
            console.error('Failed to load initial status:', error);
            this.showError('Failed to load connection status');
            this.addActivity('Failed to load status', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async testConnection() {
        if (this.testInProgress) return;
        
        this.testInProgress = true;
        this.showLoading(true);
        this.logger.log('pause-test-widget', 'test-connection-started');
        
        const testBtn = this.container.querySelector('#test-btn');
        const resultsDiv = this.container.querySelector('#test-results');
        
        try {
            testBtn.disabled = true;
            testBtn.querySelector('.btn-text').textContent = 'Testing...';
            testBtn.querySelector('.btn-icon').textContent = '⏳';
            
            this.addActivity('DNS connection test started');
            
            // Perform DNS test
            const testResult = await this.apiClient.testConnection();
            
            // Update test results
            this.updateTestResults(testResult);
            resultsDiv.style.display = 'block';
            
            this.addActivity(`Test completed: ${testResult.success ? 'Success' : 'Failed'}`, 
                           testResult.success ? 'success' : 'error');
            
            this.logger.log('pause-test-widget', 'test-connection-completed', {
                success: testResult.success,
                responseTime: testResult.responseTime
            });
            
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showError('Connection test failed');
            this.addActivity('Connection test failed', 'error');
            this.logger.log('pause-test-widget', 'test-connection-failed', { error: error.message });
        } finally {
            this.testInProgress = false;
            this.showLoading(false);
            testBtn.disabled = false;
            testBtn.querySelector('.btn-text').textContent = 'Test Connection';
            testBtn.querySelector('.btn-icon').textContent = '🔍';
        }
    }
    
    async pauseConnection() {
        try {
            this.showLoading(true);
            this.logger.log('pause-test-widget', 'pause-connection-requested');
            
            await this.apiClient.pauseProtection();
            this.isPaused = true;
            
            // Update UI
            const pauseBtn = this.container.querySelector('#pause-btn');
            const resumeBtn = this.container.querySelector('#resume-btn');
            
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'inline-flex';
            
            this.updateConnectionStatus({
                status: 'paused',
                message: 'DNS protection paused'
            });
            
            this.addActivity('DNS protection paused', 'warning');
            
            // Emit event
            this.eventBus.emit('connection.paused', { timestamp: new Date() });
            
        } catch (error) {
            console.error('Failed to pause connection:', error);
            this.showError('Failed to pause protection');
            this.addActivity('Failed to pause protection', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async resumeConnection() {
        try {
            this.showLoading(true);
            this.logger.log('pause-test-widget', 'resume-connection-requested');
            
            await this.apiClient.resumeProtection();
            this.isPaused = false;
            
            // Update UI
            const pauseBtn = this.container.querySelector('#pause-btn');
            const resumeBtn = this.container.querySelector('#resume-btn');
            
            pauseBtn.style.display = 'inline-flex';
            resumeBtn.style.display = 'none';
            
            this.updateConnectionStatus({
                status: 'active',
                message: 'DNS protection active'
            });
            
            this.addActivity('DNS protection resumed', 'success');
            
            // Emit event
            this.eventBus.emit('connection.resumed', { timestamp: new Date() });
            
        } catch (error) {
            console.error('Failed to resume connection:', error);
            this.showError('Failed to resume protection');
            this.addActivity('Failed to resume protection', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    updateTestResults(testResult) {
        const resultsContainer = this.container.querySelector('.results-content');
        
        if (resultsContainer) {
            resultsContainer.querySelector('#dns-resolution').textContent = 
                testResult.dnsResolution ? 'Working' : 'Failed';
            resultsContainer.querySelector('#response-time').textContent = 
                `${testResult.responseTime}ms`;
            resultsContainer.querySelector('#filter-status').textContent = 
                testResult.filterActive ? 'Active' : 'Inactive';
            resultsContainer.querySelector('#current-resolver').textContent = 
                testResult.resolver || 'Unknown';
                
            // Add result status classes
            resultsContainer.querySelector('#dns-resolution').className = 
                `result-value ${testResult.dnsResolution ? 'success' : 'error'}`;
            resultsContainer.querySelector('#filter-status').className = 
                `result-value ${testResult.filterActive ? 'success' : 'warning'}`;
        }
    }
    
    updateConnectionStatus(status) {
        const statusDot = this.container.querySelector('#connection-dot');
        const statusText = this.container.querySelector('#connection-status');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status.status || 'unknown'}`;
            statusText.textContent = status.message || 'Status unknown';
        }
        
        this.updateLastUpdated();
    }
    
    addActivity(text, type = 'info') {
        const activityList = this.container.querySelector('#activity-list');
        
        if (activityList) {
            const activityItem = document.createElement('div');
            activityItem.className = `activity-item ${type}`;
            activityItem.innerHTML = `
                <span class="activity-time">${this.formatTime(new Date())}</span>
                <span class="activity-text">${text}</span>
            `;
            
            // Add to top of list
            activityList.insertBefore(activityItem, activityList.firstChild);
            
            // Keep only last 5 activities
            const items = activityList.querySelectorAll('.activity-item');
            if (items.length > 5) {
                items[items.length - 1].remove();
            }
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    updateLastUpdated() {
        const lastUpdatedElement = this.container.querySelector('#last-updated-time');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = this.formatTime(new Date());
        }
    }
    
    showLoading(show) {
        const widget = this.container.querySelector('.pause-test-widget');
        if (widget) {
            widget.classList.toggle('loading', show);
        }
    }
    
    showError(message) {
        // Create or update error display
        let errorDiv = this.container.querySelector('.widget-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'widget-error';
            this.container.querySelector('.widget-content').appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-dismiss" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }
    
    async refresh() {
        this.logger.log('pause-test-widget', 'refresh-requested');
        await this.loadInitialStatus();
        this.addActivity('Widget refreshed');
    }
    
    openSettings() {
        this.logger.log('pause-test-widget', 'settings-opened');
        // TODO: Implement settings modal
        alert('Settings panel coming soon!');
    }
    
    // Widget Manager Integration Methods
    getTitle() {
        return 'Connection Control';
    }
    
    getSettings() {
        return this.settings;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.logger.log('pause-test-widget', 'settings-updated', newSettings);
    }
    
    destroy() {
        // Clean up event listeners and intervals
        this.eventBus.unsubscribeAll();
        console.log('🧹 Pause/Test Widget destroyed');
    }
}

// Create API client if it doesn't exist
if (typeof ControlDApiClient === 'undefined') {
    class ControlDApiClient {
        async getConnectionStatus() {
            // Mock implementation - replace with real API calls
            await this.delay(500);
            return {
                status: 'active',
                message: 'DNS protection active'
            };
        }
        
        async testConnection() {
            await this.delay(2000);
            return {
                success: true,
                dnsResolution: true,
                responseTime: Math.floor(Math.random() * 50) + 10,
                filterActive: true,
                resolver: '76.76.19.19'
            };
        }
        
        async pauseProtection() {
            await this.delay(1000);
            return { success: true };
        }
        
        async resumeProtection() {
            await this.delay(1000);
            return { success: true };
        }
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
}

// Create logger if it doesn't exist
if (typeof InteractionLogger === 'undefined') {
    class InteractionLogger {
        log(widget, action, data = {}) {
            console.log(`[${widget}] ${action}:`, data);
        }
    }
}

// Create event bus if it doesn't exist
if (typeof EventBus === 'undefined') {
    class EventBus {
        constructor() {
            this.events = {};
        }
        
        subscribe(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        }
        
        emit(event, data) {
            if (this.events[event]) {
                this.events[event].forEach(callback => callback(data));
            }
        }
        
        unsubscribeAll() {
            this.events = {};
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PauseTestWidget;
}

// Register with window for global access
if (typeof window !== 'undefined') {
    window.PauseTestWidget = PauseTestWidget;
}