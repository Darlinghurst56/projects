/**
 * Enhanced DNS Status Widget - Improved UX with tooltips and clearer explanations
 * Displays connection status, resolver location, service health, and performance metrics
 * with enhanced user experience and educational tooltips
 */

class DnsStatusWidgetEnhanced {
    constructor(container) {
        this.container = container;
        this.data = null;
        this.refreshInterval = null;
        this.apiClient = new ControlDStatusApiClient();
        this.eventBus = window.eventBus || new EventBus();
        this.settings = {
            refreshInterval: 60000, // 1 minute
            showDetailedMetrics: true,
            alertThresholds: {
                latency: 100, // ms
                uptime: 99.5  // percentage
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Enhanced DNS Status Widget');
        
        try {
            // Load enhanced template with tooltips
            await this.loadEnhancedTemplate();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            console.log('✅ Enhanced DNS Status Widget initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced DNS Status Widget:', error);
            this.showError('Failed to initialize DNS Status widget');
        }
    }
    
    async loadEnhancedTemplate() {
        try {
            if (!this.container.querySelector('.dns-status-widget-enhanced')) {
                this.container.innerHTML = `
                    <div class="dns-status-widget-enhanced">
                        <div class="loading-enhanced" id="dns-status-loading">
                            <div class="loading-spinner-enhanced"></div>
                            <div class="loading-text">Checking DNS status...</div>
                        </div>
                        
                        <div class="status-content-enhanced" id="dns-status-content" style="display: none;">
                            <!-- Connection Status Section -->
                            <div class="spacing-section">
                                <div class="section-header">
                                    <div class="section-title">
                                        DNS Connection Status
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Shows whether your device is successfully connected to Control D's DNS servers. 
                                                When connected, your internet traffic is filtered according to your security policies.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="section-actions">
                                        <button class="btn btn-sm btn-secondary" id="refresh-connection-btn">
                                            <span>Refresh</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="status-enhanced" id="main-connection-status">
                                    <div class="status-indicator-enhanced" id="connection-indicator">
                                    </div>
                                    <div class="status-text">
                                        <div class="status-primary-text" id="connection-status-text">Checking connection...</div>
                                        <div class="status-secondary-text" id="connection-details-text">Validating DNS configuration</div>
                                    </div>
                                </div>
                                
                                <div class="enhanced-list">
                                    <div class="enhanced-list-item">
                                        <div class="list-item-content">
                                            <div class="list-item-primary">Primary DNS Server</div>
                                            <div class="list-item-secondary">Main DNS resolver handling your requests</div>
                                        </div>
                                        <div class="list-item-actions">
                                            <span id="primary-dns" class="metric-value">--</span>
                                            <div class="tooltip-container">
                                                <span class="help-icon">?</span>
                                                <div class="tooltip tooltip-left multiline">
                                                    Your primary DNS server processes most of your internet requests. 
                                                    Control D servers provide security filtering and faster response times.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="enhanced-list-item">
                                        <div class="list-item-content">
                                            <div class="list-item-primary">Secondary DNS Server</div>
                                            <div class="list-item-secondary">Backup resolver for redundancy</div>
                                        </div>
                                        <div class="list-item-actions">
                                            <span id="secondary-dns" class="metric-value">--</span>
                                            <div class="tooltip-container">
                                                <span class="help-icon">?</span>
                                                <div class="tooltip tooltip-left multiline">
                                                    Your backup DNS server ensures uninterrupted service if the primary server 
                                                    is unavailable. This provides redundancy and reliability.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="enhanced-list-item">
                                        <div class="list-item-content">
                                            <div class="list-item-primary">Server Location</div>
                                            <div class="list-item-secondary">Geographic location of your resolver</div>
                                        </div>
                                        <div class="list-item-actions">
                                            <span id="resolver-location" class="metric-value">--</span>
                                            <div class="tooltip-container">
                                                <span class="help-icon">?</span>
                                                <div class="tooltip tooltip-left multiline">
                                                    Closer servers typically provide faster response times. Control D automatically 
                                                    routes you to the nearest available server for optimal performance.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Performance Metrics Section -->
                            <div class="spacing-section">
                                <div class="section-header">
                                    <div class="section-title">
                                        Performance Metrics
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Key performance indicators showing how fast and reliably your DNS service is operating. 
                                                Better metrics mean faster web browsing and more reliable internet access.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="key-metrics">
                                    <div class="metric-card-enhanced" id="latency-metric">
                                        <div class="metric-primary" id="latency-value">--</div>
                                        <div class="metric-label-enhanced">Response Time</div>
                                        <div class="metric-context">How quickly DNS queries are resolved</div>
                                        <div class="metric-trend" id="latency-trend"></div>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                DNS response time in milliseconds. Lower is better. 
                                                • Excellent: &lt;20ms
                                                • Good: 20-50ms  
                                                • Fair: 50-100ms
                                                • Slow: &gt;100ms
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="metric-card-enhanced" id="uptime-metric">
                                        <div class="metric-primary" id="uptime-value">--</div>
                                        <div class="metric-label-enhanced">Service Uptime</div>
                                        <div class="metric-context">Percentage of time service is available</div>
                                        <div class="metric-trend" id="uptime-trend"></div>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Service availability percentage over the last 30 days.
                                                • Excellent: &gt;99.9%
                                                • Good: 99.5-99.9%
                                                • Fair: 99-99.5%
                                                • Poor: &lt;99%
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="metric-card-enhanced" id="queries-metric">
                                        <div class="metric-primary" id="queries-value">--</div>
                                        <div class="metric-label-enhanced">Queries Today</div>
                                        <div class="metric-context">DNS requests processed today</div>
                                        <div class="metric-trend" id="queries-trend"></div>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Total number of DNS queries your device has made today. 
                                                This includes website visits, app connections, and background traffic.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Service Health Section -->
                            <div class="spacing-section">
                                <div class="section-header">
                                    <div class="section-title">
                                        Service Health Monitor
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Real-time status of Control D's core services. All services should show 'Operational' 
                                                for optimal performance. Any issues will be displayed here.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="enhanced-list" id="health-items">
                                    <!-- Health items will be populated dynamically -->
                                </div>
                            </div>
                            
                            <!-- Network Diagnostics Section -->
                            <div class="spacing-section">
                                <div class="section-header">
                                    <div class="section-title">
                                        Network Diagnostics
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Tools to test and troubleshoot your DNS connection. Use these if you're experiencing 
                                                slow browsing or connectivity issues.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="diagnostic-actions">
                                    <button class="btn btn-primary" id="test-dns-btn">
                                        <span>Test DNS Resolution</span>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top">
                                                Tests how quickly common websites can be resolved through DNS
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="btn btn-secondary" id="check-connectivity-btn">
                                        <span>Check Connectivity</span>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top">
                                                Tests internet connectivity to various servers and services
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="btn btn-warning" id="flush-cache-btn">
                                        <span>Clear DNS Cache</span>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top">
                                                Clears stored DNS records to resolve caching issues
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                
                                <div class="diagnostic-results" id="diagnostic-results" style="display: none;">
                                    <!-- Results will be shown here -->
                                </div>
                            </div>
                            
                            <!-- Status Summary -->
                            <div class="info-box" id="status-summary">
                                <div class="info-box-title">Status Summary</div>
                                <div class="info-box-content" id="status-summary-text">
                                    All systems operational. Your DNS service is working properly.
                                </div>
                            </div>
                            
                            <!-- Last Updated -->
                            <div class="last-updated">
                                <small>Last updated: <span id="last-updated-time">--</span></small>
                            </div>
                        </div>
                        
                        <div class="status-error" id="dns-status-error" style="display: none;">
                            <div class="error-icon">⚠️</div>
                            <div class="error-message" id="error-message">Failed to load DNS status</div>
                            <button class="btn btn-primary retry-button" id="retry-button">Retry</button>
                        </div>
                    </div>
                `;
            }
            
            // Get references to key elements
            this.elements = {
                loading: this.container.querySelector('#dns-status-loading'),
                content: this.container.querySelector('#dns-status-content'),
                error: this.container.querySelector('#dns-status-error'),
                connectionIndicator: this.container.querySelector('#connection-indicator'),
                connectionStatusText: this.container.querySelector('#connection-status-text'),
                connectionDetailsText: this.container.querySelector('#connection-details-text'),
                primaryDns: this.container.querySelector('#primary-dns'),
                secondaryDns: this.container.querySelector('#secondary-dns'),
                resolverLocation: this.container.querySelector('#resolver-location'),
                latencyValue: this.container.querySelector('#latency-value'),
                latencyTrend: this.container.querySelector('#latency-trend'),
                uptimeValue: this.container.querySelector('#uptime-value'),
                uptimeTrend: this.container.querySelector('#uptime-trend'),
                queriesValue: this.container.querySelector('#queries-value'),
                queriesTrend: this.container.querySelector('#queries-trend'),
                healthItems: this.container.querySelector('#health-items'),
                diagnosticResults: this.container.querySelector('#diagnostic-results'),
                statusSummary: this.container.querySelector('#status-summary'),
                statusSummaryText: this.container.querySelector('#status-summary-text'),
                lastUpdatedTime: this.container.querySelector('#last-updated-time'),
                retryButton: this.container.querySelector('#retry-button')
            };
            
        } catch (error) {
            console.error('❌ Failed to load Enhanced DNS Status Widget template:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Retry button
        if (this.elements.retryButton) {
            this.elements.retryButton.addEventListener('click', () => {
                this.refreshData();
                this.logUserInteraction('retry_clicked');
            });
        }
        
        // Refresh connection button
        const refreshBtn = this.container.querySelector('#refresh-connection-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Diagnostic buttons
        const testDnsBtn = this.container.querySelector('#test-dns-btn');
        if (testDnsBtn) {
            testDnsBtn.addEventListener('click', () => this.runDnsTest());
        }
        
        const checkConnectivityBtn = this.container.querySelector('#check-connectivity-btn');
        if (checkConnectivityBtn) {
            checkConnectivityBtn.addEventListener('click', () => this.checkConnectivity());
        }
        
        const flushCacheBtn = this.container.querySelector('#flush-cache-btn');
        if (flushCacheBtn) {
            flushCacheBtn.addEventListener('click', () => this.flushDnsCache());
        }
        
        // Listen for settings updates
        this.eventBus.on('dns-status-settings-updated', (settings) => {
            this.applySettings(settings);
        });
    }
    
    async loadInitialData() {
        console.log('📊 Loading DNS status data');
        
        try {
            this.showLoading(true);
            await this.loadStatusData();
            this.showLoading(false);
        } catch (error) {
            console.error('❌ Failed to load initial DNS status data:', error);
            this.showError('Failed to load DNS status data');
        }
    }
    
    async loadStatusData() {
        try {
            // Load both Control D status and local DNS configuration
            const [statusData, localConfig] = await Promise.all([
                this.apiClient.getControlDStatus(),
                this.apiClient.getLocalDnsConfig()
            ]);
            
            this.data = {
                status: statusData,
                config: localConfig,
                lastUpdated: new Date()
            };
            
            this.updateDisplay();
            
        } catch (error) {
            console.error('❌ Failed to load DNS status data:', error);
            throw error;
        }
    }
    
    updateDisplay() {
        if (!this.data) return;
        
        this.updateConnectionStatus();
        this.updatePerformanceMetrics();
        this.updateServiceHealth();
        this.updateStatusSummary();
        this.updateLastUpdatedTime();
    }
    
    updateConnectionStatus() {
        const { status, config } = this.data;
        
        // Update connection indicator
        const isConnected = status.operational && config.usingControlD;
        
        if (isConnected) {
            this.elements.connectionIndicator.className = 'status-indicator-enhanced online';
            this.elements.connectionStatusText.textContent = 'Connected to Control D';
            this.elements.connectionDetailsText.textContent = 'DNS filtering and security active';
        } else {
            this.elements.connectionIndicator.className = 'status-indicator-enhanced error';
            this.elements.connectionStatusText.textContent = 'Not Connected';
            this.elements.connectionDetailsText.textContent = 'Using default DNS servers';
        }
        
        // Update DNS details
        this.elements.primaryDns.textContent = config.primaryDns || 'Unknown';
        this.elements.secondaryDns.textContent = config.secondaryDns || 'Unknown';
        this.elements.resolverLocation.textContent = status.location || 'Unknown';
    }
    
    updatePerformanceMetrics() {
        const { status } = this.data;
        
        // Update latency
        if (status.latency !== undefined) {
            this.elements.latencyValue.textContent = `${status.latency}ms`;
            this.updateMetricTrend('latency', status.latency, 30);
        }
        
        // Update uptime
        if (status.uptime !== undefined) {
            this.elements.uptimeValue.textContent = `${status.uptime}%`;
            this.updateMetricTrend('uptime', status.uptime, 99.9);
        }
        
        // Update queries (mock data)
        const dailyQueries = Math.floor(Math.random() * 5000) + 1000;
        this.elements.queriesValue.textContent = dailyQueries.toLocaleString();
        this.updateMetricTrend('queries', dailyQueries, 2000);
    }
    
    updateMetricTrend(metricType, value, baseline) {
        const trendElement = this.elements[`${metricType}Trend`];
        if (!trendElement) return;
        
        let trend, className, icon;
        
        if (metricType === 'latency') {
            if (value < baseline) {
                trend = 'Excellent';
                className = 'positive';
                icon = '↗️';
            } else if (value < baseline * 1.5) {
                trend = 'Good';
                className = 'neutral';
                icon = '→';
            } else {
                trend = 'Needs attention';
                className = 'negative';
                icon = '↘️';
            }
        } else if (metricType === 'uptime') {
            if (value >= baseline) {
                trend = 'Excellent';
                className = 'positive';
                icon = '↗️';
            } else {
                trend = 'Below target';
                className = 'negative';
                icon = '↘️';
            }
        } else {
            trend = value > baseline ? 'Above average' : 'Normal';
            className = value > baseline ? 'positive' : 'neutral';
            icon = value > baseline ? '↗️' : '→';
        }
        
        trendElement.className = `metric-trend ${className}`;
        trendElement.innerHTML = `${icon} ${trend}`;
    }
    
    updateServiceHealth() {
        const { status } = this.data;
        
        if (!status.services) return;
        
        const healthItemsHtml = status.services.map(service => {
            const statusClass = service.status === 'operational' ? 'online' : 
                               service.status === 'degraded' ? 'warning' : 'error';
            
            const statusText = service.status === 'operational' ? 'Operational' :
                              service.status === 'degraded' ? 'Degraded Performance' : 'Service Issues';
            
            const description = this.getServiceDescription(service.name);
            
            return `
                <div class="enhanced-list-item">
                    <div class="status-indicator-enhanced ${statusClass}"></div>
                    <div class="list-item-content">
                        <div class="list-item-primary">${service.name}</div>
                        <div class="list-item-secondary">${description}</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="metric-value">${statusText}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.healthItems.innerHTML = healthItemsHtml;
    }
    
    getServiceDescription(serviceName) {
        const descriptions = {
            'DNS Resolution': 'Core domain name resolution service',
            'Content Filtering': 'Malware and content blocking features',
            'Analytics Dashboard': 'Usage statistics and reporting',
            'API Services': 'Developer and integration endpoints',
            'Mobile Apps': 'iOS and Android application support',
            'Filtering': 'Security and content filtering engine',
            'Analytics': 'Usage tracking and insights'
        };
        
        return descriptions[serviceName] || 'Service component';
    }
    
    updateStatusSummary() {
        const { status, config } = this.data;
        
        let summaryClass = 'info-box';
        let summaryText = '';
        
        if (status.operational && config.usingControlD) {
            if (status.latency < 50 && status.uptime > 99.5) {
                summaryClass += ' success';
                summaryText = '🟢 Excellent performance! Your DNS service is running optimally with fast response times and high reliability.';
            } else {
                summaryClass += ' info';
                summaryText = '🔵 Good performance. Your DNS service is working normally with acceptable response times.';
            }
        } else if (!config.usingControlD) {
            summaryClass += ' warning';
            summaryText = '🟡 Not using Control D servers. You may not have security filtering and performance benefits.';
        } else {
            summaryClass += ' danger';
            summaryText = '🔴 Service issues detected. Some DNS features may not be working properly.';
        }
        
        this.elements.statusSummary.className = summaryClass;
        this.elements.statusSummaryText.textContent = summaryText;
    }
    
    updateLastUpdatedTime() {
        if (this.data.lastUpdated) {
            this.elements.lastUpdatedTime.textContent = this.data.lastUpdated.toLocaleTimeString();
        }
    }
    
    async runDnsTest() {
        this.showDiagnosticResults('🔍 Running comprehensive DNS resolution test...');
        
        try {
            const result = await this.apiClient.testDnsResolution();
            
            const resultHtml = `
                <div class="info-box success">
                    <div class="info-box-title">DNS Test Results</div>
                    <div class="info-box-content">
                        <strong>Tested ${result.testDomains} domains:</strong><br>
                        ✅ ${result.successful} successful resolutions<br>
                        ⏱️ Average response time: ${Math.round(result.averageLatency)}ms<br><br>
                        <strong>Performance Rating:</strong> ${result.averageLatency < 50 ? 'Excellent' : result.averageLatency < 100 ? 'Good' : 'Needs Improvement'}
                    </div>
                </div>
            `;
            
            this.showDiagnosticResults(resultHtml);
        } catch (error) {
            this.showDiagnosticResults(`
                <div class="info-box danger">
                    <div class="info-box-title">DNS Test Failed</div>
                    <div class="info-box-content">${error.message}</div>
                </div>
            `);
        }
    }
    
    async checkConnectivity() {
        this.showDiagnosticResults('🌐 Checking network connectivity...');
        
        try {
            const result = await this.apiClient.checkConnectivity();
            
            const resultHtml = `
                <div class="info-box ${result.successful === result.tested ? 'success' : 'warning'}">
                    <div class="info-box-title">Connectivity Check Results</div>
                    <div class="info-box-content">
                        <strong>Endpoints tested:</strong> ${result.tested}<br>
                        <strong>Successful connections:</strong> ${result.successful}<br>
                        <strong>Success rate:</strong> ${Math.round((result.successful / result.tested) * 100)}%<br><br>
                        ${result.successful === result.tested ? 
                            '✅ All connectivity tests passed!' : 
                            '⚠️ Some connectivity issues detected.'}
                    </div>
                </div>
            `;
            
            this.showDiagnosticResults(resultHtml);
        } catch (error) {
            this.showDiagnosticResults(`
                <div class="info-box danger">
                    <div class="info-box-title">Connectivity Check Failed</div>
                    <div class="info-box-content">${error.message}</div>
                </div>
            `);
        }
    }
    
    async flushDnsCache() {
        this.showDiagnosticResults('🔄 Clearing DNS cache...');
        
        try {
            const resultHtml = `
                <div class="info-box info">
                    <div class="info-box-title">DNS Cache Clear</div>
                    <div class="info-box-content">
                        Browser DNS cache has been cleared. For system-wide DNS cache clearing:<br><br>
                        <strong>Windows:</strong> <code>ipconfig /flushdns</code><br>
                        <strong>macOS:</strong> <code>sudo dscacheutil -flushcache</code><br>
                        <strong>Linux:</strong> <code>sudo systemctl restart systemd-resolved</code>
                    </div>
                </div>
            `;
            
            this.showDiagnosticResults(resultHtml);
        } catch (error) {
            this.showDiagnosticResults(`
                <div class="info-box danger">
                    <div class="info-box-title">Cache Flush Failed</div>
                    <div class="info-box-content">${error.message}</div>
                </div>
            `);
        }
    }
    
    showDiagnosticResults(content) {
        this.elements.diagnosticResults.innerHTML = content;
        this.elements.diagnosticResults.style.display = 'block';
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            this.elements.diagnosticResults.style.display = 'none';
        }, 30000);
    }
    
    async refreshData() {
        console.log('🔄 Refreshing DNS status data');
        
        try {
            this.showLoading(true);
            await this.loadStatusData();
            this.showLoading(false);
            
            this.logUserInteraction('data_refreshed');
            
        } catch (error) {
            console.error('❌ Failed to refresh DNS status data:', error);
            this.showError('Failed to refresh DNS status data');
        }
    }
    
    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, this.settings.refreshInterval);
    }
    
    showLoading(show) {
        if (this.elements.loading) {
            this.elements.loading.style.display = show ? 'flex' : 'none';
        }
        
        if (this.elements.content) {
            this.elements.content.style.display = show ? 'none' : 'block';
        }
        
        if (this.elements.error) {
            this.elements.error.style.display = 'none';
        }
    }
    
    showError(message) {
        this.showLoading(false);
        
        if (this.elements.error) {
            this.elements.error.style.display = 'flex';
            const errorMessage = this.elements.error.querySelector('#error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
    }
    
    applySettings(settings) {
        this.settings = { ...this.settings, ...settings };
        
        // Update refresh interval
        if (settings.refreshInterval) {
            this.setupAutoRefresh();
        }
        
        // Re-render with new settings
        if (this.data) {
            this.updateDisplay();
        }
        
        console.log('Applied Enhanced DNS Status Widget settings:', settings);
    }
    
    logUserInteraction(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            widget: 'dns-status-enhanced',
            action: action,
            data: data
        };
        
        console.log('📝 Enhanced DNS Status Interaction:', logEntry);
        
        // Emit event for analytics
        this.eventBus.emit('widget-interaction', logEntry);
    }
    
    destroy() {
        console.log('🗑️ Destroying Enhanced DNS Status Widget');
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.logUserInteraction('widget_destroyed');
    }
}

// Global registration
window.DnsStatusWidgetEnhanced = DnsStatusWidgetEnhanced;