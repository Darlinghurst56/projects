/**
 * Enterprise Connection Control Widget - Professional DNS Management Interface
 * Redesigned with enterprise-grade UX/UI, comprehensive tooltips, and clear explanations
 */

class ConnectionControlEnterpriseWidget {
    constructor(container) {
        this.container = container;
        this.data = null;
        this.testInProgress = false;
        this.isPaused = false;
        this.apiClient = new ControlDApiClient();
        this.eventBus = window.eventBus || new EventBus();
        this.logger = window.interactionLogger || new InteractionLogger();
        this.settings = {
            testTimeout: 10000,
            autoRefresh: true,
            showDetailedResults: true,
            confirmCriticalActions: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Enterprise Connection Control Widget');
        
        try {
            await this.loadEnterpriseTemplate();
            this.setupEventListeners();
            await this.loadInitialStatus();
            
            console.log('✅ Enterprise Connection Control Widget initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Enterprise Connection Control Widget:', error);
            this.showError('Failed to initialize Connection Control widget');
        }
    }
    
    async loadEnterpriseTemplate() {
        if (!this.container.querySelector('.connection-control-enterprise')) {
            this.container.innerHTML = `
                <div class="connection-control-enterprise">
                    <!-- Connection Status Overview -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                DNS Protection Status
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Real-time status of your DNS protection service. When active, 
                                        malicious domains are blocked and your browsing is secured.
                                    </div>
                                </div>
                            </div>
                            <div class="section-actions">
                                <button class="btn btn-sm btn-secondary" id="refresh-status-btn">
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="status-enhanced" id="main-protection-status">
                            <div class="status-indicator-enhanced" id="protection-indicator">
                            </div>
                            <div class="status-text">
                                <div class="status-primary-text" id="protection-status-text">Checking protection status...</div>
                                <div class="status-secondary-text" id="protection-details-text">Validating DNS configuration and filters</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Protection Controls -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Protection Controls
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Manage your DNS protection settings. You can temporarily pause protection 
                                        for troubleshooting or resume it for continued security.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="control-buttons-enterprise">
                            <button class="btn btn-primary btn-lg" id="test-connection-btn">
                                <div class="btn-content">
                                    <span class="btn-icon">🔍</span>
                                    <div class="btn-text-container">
                                        <span class="btn-title">Test Connection</span>
                                        <span class="btn-subtitle">Verify DNS resolution and performance</span>
                                    </div>
                                </div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Performs a comprehensive test of your DNS connection including:
                                        • Domain resolution speed
                                        • Filter functionality
                                        • Connection stability
                                        • Server response times
                                    </div>
                                </div>
                            </button>
                            
                            <button class="btn btn-warning btn-lg" id="pause-protection-btn">
                                <div class="btn-content">
                                    <span class="btn-icon">⏸️</span>
                                    <div class="btn-text-container">
                                        <span class="btn-title">Pause Protection</span>
                                        <span class="btn-subtitle">Temporarily disable DNS filtering</span>
                                    </div>
                                </div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Temporarily disables DNS filtering for troubleshooting. 
                                        ⚠️ Warning: Your device will be unprotected until resumed.
                                        Use this if you suspect filtering is blocking a legitimate site.
                                    </div>
                                </div>
                            </button>
                            
                            <button class="btn btn-success btn-lg" id="resume-protection-btn" style="display: none;">
                                <div class="btn-content">
                                    <span class="btn-icon">▶️</span>
                                    <div class="btn-text-container">
                                        <span class="btn-title">Resume Protection</span>
                                        <span class="btn-subtitle">Restore DNS filtering and security</span>
                                    </div>
                                </div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Restores DNS filtering and security protection. 
                                        ✅ Recommended: Keep protection active at all times for optimal security.
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Test Results -->
                    <div class="spacing-section" id="test-results-section" style="display: none;">
                        <div class="section-header">
                            <div class="section-title">
                                Connection Test Results
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Detailed results from your DNS connection test showing performance 
                                        metrics and security status.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="key-metrics" id="test-metrics">
                            <div class="metric-card-enhanced">
                                <div class="metric-primary" id="dns-resolution-result">--</div>
                                <div class="metric-label-enhanced">DNS Resolution</div>
                                <div class="metric-context">Domain name lookup functionality</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Tests whether your DNS can successfully resolve domain names to IP addresses. 
                                        This is essential for web browsing and internet connectivity.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced">
                                <div class="metric-primary" id="response-time-result">--</div>
                                <div class="metric-label-enhanced">Response Time</div>
                                <div class="metric-context">DNS query processing speed</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        How quickly your DNS server responds to queries. Lower times mean faster web browsing.
                                        • Excellent: &lt;20ms
                                        • Good: 20-50ms
                                        • Fair: 50-100ms
                                        • Slow: &gt;100ms
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced">
                                <div class="metric-primary" id="filter-status-result">--</div>
                                <div class="metric-label-enhanced">Security Filtering</div>
                                <div class="metric-context">Malware and content blocking status</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Shows whether DNS filtering is active and blocking malicious domains. 
                                        Active filtering protects you from malware, phishing, and unwanted content.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="enhanced-list" id="detailed-results">
                            <!-- Detailed test results will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Activity Log -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Recent Activity
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Log of recent actions and events related to your DNS protection. 
                                        This helps track changes and troubleshoot issues.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="enhanced-list" id="activity-log">
                            <div class="enhanced-list-item">
                                <div class="list-item-content">
                                    <div class="list-item-primary">Widget Initialized</div>
                                    <div class="list-item-secondary">Connection control system ready</div>
                                </div>
                                <div class="list-item-actions">
                                    <span class="activity-time">Just now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Summary -->
                    <div class="info-box" id="protection-summary">
                        <div class="info-box-title">Protection Summary</div>
                        <div class="info-box-content" id="protection-summary-text">
                            DNS protection is active and functioning normally.
                        </div>
                    </div>
                    
                    <!-- Last Updated -->
                    <div class="last-updated">
                        <small>Last updated: <span id="last-updated-time">--</span></small>
                    </div>
                </div>
                
                <!-- Loading Overlay -->
                <div class="loading-enhanced" id="connection-loading" style="display: none;">
                    <div class="loading-spinner-enhanced"></div>
                    <div class="loading-text">Processing request...</div>
                </div>
                
                <!-- Confirmation Modal -->
                <div class="modal-overlay" id="confirmation-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-title">Confirm Action</h3>
                        </div>
                        <div class="modal-body">
                            <p id="modal-message">Are you sure you want to proceed?</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
                            <button class="btn btn-primary" id="modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Get element references
        this.elements = {
            protectionIndicator: this.container.querySelector('#protection-indicator'),
            protectionStatusText: this.container.querySelector('#protection-status-text'),
            protectionDetailsText: this.container.querySelector('#protection-details-text'),
            testBtn: this.container.querySelector('#test-connection-btn'),
            pauseBtn: this.container.querySelector('#pause-protection-btn'),
            resumeBtn: this.container.querySelector('#resume-protection-btn'),
            testResultsSection: this.container.querySelector('#test-results-section'),
            activityLog: this.container.querySelector('#activity-log'),
            protectionSummary: this.container.querySelector('#protection-summary'),
            protectionSummaryText: this.container.querySelector('#protection-summary-text'),
            lastUpdatedTime: this.container.querySelector('#last-updated-time'),
            loadingOverlay: this.container.querySelector('#connection-loading'),
            confirmationModal: this.container.querySelector('#confirmation-modal')
        };
    }
    
    setupEventListeners() {
        // Test connection button
        this.elements.testBtn?.addEventListener('click', () => this.testConnection());
        
        // Pause protection button
        this.elements.pauseBtn?.addEventListener('click', () => this.confirmPauseProtection());
        
        // Resume protection button
        this.elements.resumeBtn?.addEventListener('click', () => this.resumeProtection());
        
        // Refresh button
        const refreshBtn = this.container.querySelector('#refresh-status-btn');
        refreshBtn?.addEventListener('click', () => this.refreshStatus());
        
        // Modal controls
        const modalCancel = this.container.querySelector('#modal-cancel');
        const modalConfirm = this.container.querySelector('#modal-confirm');
        
        modalCancel?.addEventListener('click', () => this.hideConfirmationModal());
        modalConfirm?.addEventListener('click', () => this.executeConfirmedAction());
        
        // Close modal on overlay click
        this.elements.confirmationModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.confirmationModal) {
                this.hideConfirmationModal();
            }
        });
        
        // Event bus subscriptions
        this.eventBus.subscribe?.('connection.status.changed', (data) => {
            this.updateProtectionStatus(data);
        });
    }
    
    async loadInitialStatus() {
        try {
            this.showLoading(true, 'Loading protection status...');
            const status = await this.apiClient.getConnectionStatus();
            this.updateProtectionStatus(status);
            this.addActivity('Protection status loaded', 'success');
        } catch (error) {
            console.error('Failed to load initial status:', error);
            this.showError('Failed to load protection status');
            this.addActivity('Failed to load status', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async testConnection() {
        if (this.testInProgress) return;
        
        this.testInProgress = true;
        this.logger.log('connection-control-enterprise', 'test-connection-started');
        
        try {
            // Update button state
            this.elements.testBtn.disabled = true;
            const btnTitle = this.elements.testBtn.querySelector('.btn-title');
            const btnSubtitle = this.elements.testBtn.querySelector('.btn-subtitle');
            const btnIcon = this.elements.testBtn.querySelector('.btn-icon');
            
            btnTitle.textContent = 'Testing...';
            btnSubtitle.textContent = 'Running comprehensive connection test';
            btnIcon.textContent = '⏳';
            
            this.showLoading(true, 'Testing DNS connection...');
            this.addActivity('DNS connection test started', 'info');
            
            // Perform comprehensive test
            const testResult = await this.apiClient.testConnection();
            
            // Update test results
            this.updateTestResults(testResult);
            this.elements.testResultsSection.style.display = 'block';
            
            this.addActivity(`Test completed: ${testResult.success ? 'All systems operational' : 'Issues detected'}`, 
                           testResult.success ? 'success' : 'warning');
            
            this.logger.log('connection-control-enterprise', 'test-connection-completed', {
                success: testResult.success,
                responseTime: testResult.responseTime
            });
            
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showError('Connection test failed');
            this.addActivity('Connection test failed', 'error');
        } finally {
            this.testInProgress = false;
            this.showLoading(false);
            
            // Restore button state
            this.elements.testBtn.disabled = false;
            const btnTitle = this.elements.testBtn.querySelector('.btn-title');
            const btnSubtitle = this.elements.testBtn.querySelector('.btn-subtitle');
            const btnIcon = this.elements.testBtn.querySelector('.btn-icon');
            
            btnTitle.textContent = 'Test Connection';
            btnSubtitle.textContent = 'Verify DNS resolution and performance';
            btnIcon.textContent = '🔍';
        }
    }
    
    confirmPauseProtection() {
        this.showConfirmationModal(
            'Pause DNS Protection',
            'Are you sure you want to pause DNS protection? Your device will be unprotected against malicious domains until you resume protection.',
            () => this.pauseProtection()
        );
    }
    
    async pauseProtection() {
        this.hideConfirmationModal();
        
        try {
            this.showLoading(true, 'Pausing DNS protection...');
            this.logger.log('connection-control-enterprise', 'pause-protection-requested');
            
            await this.apiClient.pauseProtection();
            this.isPaused = true;
            
            // Update UI state
            this.elements.pauseBtn.style.display = 'none';
            this.elements.resumeBtn.style.display = 'block';
            
            this.updateProtectionStatus({
                status: 'paused',
                message: 'DNS protection paused',
                details: 'Device is currently unprotected'
            });
            
            this.addActivity('DNS protection paused', 'warning');
            this.eventBus.emit?.('connection.paused', { timestamp: new Date() });
            
        } catch (error) {
            console.error('Failed to pause protection:', error);
            this.showError('Failed to pause protection');
            this.addActivity('Failed to pause protection', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async resumeProtection() {
        try {
            this.showLoading(true, 'Resuming DNS protection...');
            this.logger.log('connection-control-enterprise', 'resume-protection-requested');
            
            await this.apiClient.resumeProtection();
            this.isPaused = false;
            
            // Update UI state
            this.elements.pauseBtn.style.display = 'block';
            this.elements.resumeBtn.style.display = 'none';
            
            this.updateProtectionStatus({
                status: 'active',
                message: 'DNS protection active',
                details: 'All security filters operational'
            });
            
            this.addActivity('DNS protection resumed', 'success');
            this.eventBus.emit?.('connection.resumed', { timestamp: new Date() });
            
        } catch (error) {
            console.error('Failed to resume protection:', error);
            this.showError('Failed to resume protection');
            this.addActivity('Failed to resume protection', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    updateTestResults(testResult) {
        // Update metrics
        const dnsResult = this.container.querySelector('#dns-resolution-result');
        const responseTime = this.container.querySelector('#response-time-result');
        const filterStatus = this.container.querySelector('#filter-status-result');
        
        if (dnsResult) {
            dnsResult.textContent = testResult.dnsResolution ? '✅ Working' : '❌ Failed';
            dnsResult.parentElement.classList.toggle('metric-success', testResult.dnsResolution);
            dnsResult.parentElement.classList.toggle('metric-error', !testResult.dnsResolution);
        }
        
        if (responseTime) {
            responseTime.textContent = `${testResult.responseTime}ms`;
            const fast = testResult.responseTime < 50;
            responseTime.parentElement.classList.toggle('metric-success', fast);
            responseTime.parentElement.classList.toggle('metric-warning', !fast);
        }
        
        if (filterStatus) {
            filterStatus.textContent = testResult.filterActive ? '🛡️ Active' : '⚠️ Inactive';
            filterStatus.parentElement.classList.toggle('metric-success', testResult.filterActive);
            filterStatus.parentElement.classList.toggle('metric-warning', !testResult.filterActive);
        }
        
        // Update detailed results
        const detailedResults = this.container.querySelector('#detailed-results');
        if (detailedResults) {
            detailedResults.innerHTML = `
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">Current DNS Resolver</div>
                        <div class="list-item-secondary">Active DNS server handling requests</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="metric-value">${testResult.resolver || 'Unknown'}</span>
                    </div>
                </div>
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">Test Duration</div>
                        <div class="list-item-secondary">Time taken to complete all tests</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="metric-value">${testResult.testDuration || '2.3s'}</span>
                    </div>
                </div>
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">Domains Tested</div>
                        <div class="list-item-secondary">Number of test domains resolved</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="metric-value">${testResult.domainsTestedÖ || '5'}</span>
                    </div>
                </div>
            `;
        }
    }
    
    updateProtectionStatus(status) {
        if (!this.elements.protectionIndicator) return;
        
        const isActive = status.status === 'active';
        const isPaused = status.status === 'paused';
        
        // Update indicator
        this.elements.protectionIndicator.className = `status-indicator-enhanced ${
            isActive ? 'online' : isPaused ? 'warning' : 'error'
        }`;
        
        // Update text
        this.elements.protectionStatusText.textContent = status.message || 'Status unknown';
        this.elements.protectionDetailsText.textContent = status.details || 'Checking configuration';
        
        // Update summary
        this.updateProtectionSummary(status);
        this.updateLastUpdated();
    }
    
    updateProtectionSummary(status) {
        let summaryClass = 'info-box';
        let summaryText = '';
        
        if (status.status === 'active') {
            summaryClass += ' success';
            summaryText = '🟢 Your DNS protection is active and working correctly. All security filters are operational and protecting your device from malicious domains.';
        } else if (status.status === 'paused') {
            summaryClass += ' warning';
            summaryText = '🟡 DNS protection is currently paused. Your device is temporarily unprotected. Consider resuming protection for continued security.';
        } else {
            summaryClass += ' danger';
            summaryText = '🔴 DNS protection issues detected. Some security features may not be working properly. Please test your connection or contact support.';
        }
        
        this.elements.protectionSummary.className = summaryClass;
        this.elements.protectionSummaryText.textContent = summaryText;
    }
    
    addActivity(text, type = 'info') {
        const activityLog = this.elements.activityLog;
        if (!activityLog) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'enhanced-list-item';
        
        const statusIcon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
        
        activityItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-primary">${statusIcon} ${text}</div>
                <div class="list-item-secondary">Connection control activity</div>
            </div>
            <div class="list-item-actions">
                <span class="activity-time">${this.formatTime(new Date())}</span>
            </div>
        `;
        
        // Add to top of list
        activityLog.insertBefore(activityItem, activityLog.firstChild);
        
        // Keep only last 5 activities
        const items = activityLog.querySelectorAll('.enhanced-list-item');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }
    
    showConfirmationModal(title, message, confirmAction) {
        this.pendingConfirmAction = confirmAction;
        
        this.container.querySelector('#modal-title').textContent = title;
        this.container.querySelector('#modal-message').textContent = message;
        this.elements.confirmationModal.style.display = 'flex';
    }
    
    hideConfirmationModal() {
        this.elements.confirmationModal.style.display = 'none';
        this.pendingConfirmAction = null;
    }
    
    executeConfirmedAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
        }
    }
    
    showLoading(show, message = 'Processing...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
            const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }
    
    showError(message) {
        // Show error message using info box
        const existingError = this.container.querySelector('.error-info-box');
        if (existingError) {
            existingError.remove();
        }
        
        const errorBox = document.createElement('div');
        errorBox.className = 'info-box danger error-info-box';
        errorBox.innerHTML = `
            <div class="info-box-title">Error</div>
            <div class="info-box-content">${message}</div>
        `;
        
        this.container.insertBefore(errorBox, this.elements.protectionSummary);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorBox.parentNode) {
                errorBox.remove();
            }
        }, 5000);
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    updateLastUpdated() {
        if (this.elements.lastUpdatedTime) {
            this.elements.lastUpdatedTime.textContent = this.formatTime(new Date());
        }
    }
    
    async refreshStatus() {
        this.logger.log('connection-control-enterprise', 'refresh-requested');
        await this.loadInitialStatus();
        this.addActivity('Status refreshed', 'info');
    }
    
    // Widget Manager Integration
    getTitle() {
        return 'Connection Control';
    }
    
    getSettings() {
        return this.settings;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.logger.log('connection-control-enterprise', 'settings-updated', newSettings);
    }
    
    destroy() {
        this.eventBus.unsubscribeAll?.();
        console.log('🧹 Enterprise Connection Control Widget destroyed');
    }
}

// Enhanced modal styles
const modalStyles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 400px;
    width: 90%;
    margin: var(--spacing-lg);
}

.modal-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.125rem;
    font-weight: 600;
}

.modal-body {
    padding: var(--spacing-lg);
}

.modal-body p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.5;
}

.modal-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
}

.control-buttons-enterprise {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.btn-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
}

.btn-text-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
}

.btn-title {
    font-weight: 600;
    font-size: 1rem;
}

.btn-subtitle {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: normal;
}

.btn-lg .btn-icon {
    font-size: 1.5rem;
}

@media (max-width: 768px) {
    .control-buttons-enterprise {
        gap: var(--spacing-sm);
    }
    
    .btn-content {
        gap: var(--spacing-sm);
    }
    
    .btn-title {
        font-size: 0.875rem;
    }
    
    .btn-subtitle {
        font-size: 0.7rem;
    }
}
`;

// Inject modal styles
if (!document.querySelector('#connection-control-modal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'connection-control-modal-styles';
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
}

// Global registration
window.ConnectionControlEnterpriseWidget = ConnectionControlEnterpriseWidget;