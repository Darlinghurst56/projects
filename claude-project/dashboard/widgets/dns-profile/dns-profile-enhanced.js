/**
 * Enhanced DNS Profile Widget - Enterprise-Grade Profile Management Interface
 * Redesigned with comprehensive UX enhancements, educational tooltips, and clear explanations
 */

class DnsProfileEnhancedWidget {
    constructor(container) {
        this.container = container;
        this.data = null;
        this.refreshInterval = null;
        this.apiClient = new ControlDProfileApiClient();
        this.eventBus = window.eventBus || new EventBus();
        this.logger = window.interactionLogger || new InteractionLogger();
        this.settings = {
            refreshInterval: 300000, // 5 minutes
            showSecondary: true,
            showTechnical: false,
            autoSync: true,
            showDetailedResults: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Enhanced DNS Profile Widget');
        
        try {
            await this.loadEnhancedTemplate();
            this.setupEventListeners();
            await this.loadInitialData();
            this.setupAutoRefresh();
            
            console.log('✅ Enhanced DNS Profile Widget initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced DNS Profile Widget:', error);
            this.showError('Failed to initialize DNS Profile widget');
        }
    }
    
    async loadEnhancedTemplate() {
        if (!this.container.querySelector('.dns-profile-enhanced')) {
            this.container.innerHTML = `
                <div class="dns-profile-enhanced">
                    <!-- Profile Overview Section -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Profile Overview
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Your current DNS profile determines which domains are blocked or allowed, 
                                        what filtering rules apply, and how your DNS queries are processed.
                                    </div>
                                </div>
                            </div>
                            <div class="section-actions">
                                <button class="btn btn-sm btn-secondary" id="refresh-profile-btn">
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-header-enhanced">
                            <div class="profile-info-enhanced">
                                <div class="profile-primary">
                                    <div class="profile-name-display" id="profile-name">Family Safe</div>
                                    <div class="profile-type-display" id="profile-type">Family Profile</div>
                                </div>
                                <div class="profile-secondary">
                                    <div class="profile-id-display">
                                        <span class="profile-label">Profile ID:</span>
                                        <span id="profile-id">profile1</span>
                                        <div class="tooltip-container">
                                            <span class="help-icon">?</span>
                                            <div class="tooltip tooltip-top multiline">
                                                Unique identifier for this DNS profile configuration. 
                                                Used by Control D to apply the correct filtering rules.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="profile-status-display">
                                        <span class="profile-label">Status:</span>
                                        <span class="status-indicator-enhanced active" id="profile-status-indicator"></span>
                                        <span id="profile-status-text">Active</span>
                                    </div>
                                </div>
                            </div>
                            <div class="profile-actions-enhanced">
                                <button class="btn btn-primary btn-sm" id="switch-profile-btn">
                                    <span>Switch Profile</span>
                                    <div class="tooltip-container">
                                        <span class="help-icon">?</span>
                                        <div class="tooltip tooltip-top multiline">
                                            Change to a different DNS profile with different filtering rules. 
                                            Useful for switching between family, work, or gaming configurations.
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- DNS Configuration Section -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                DNS Server Configuration
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        DNS server addresses that your device uses to resolve domain names. 
                                        Configure these in your network settings to enable Control D filtering.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="key-metrics">
                            <div class="metric-card-enhanced">
                                <div class="metric-primary" id="primary-endpoint">76.76.19.19</div>
                                <div class="metric-label-enhanced">Primary DNS Server</div>
                                <div class="metric-context">Main DNS resolver with filtering enabled</div>
                                <div class="metric-actions">
                                    <button class="btn btn-xs btn-secondary copy-btn" data-copy="primary">
                                        📋 Copy
                                    </button>
                                    <div class="tooltip-container">
                                        <span class="help-icon">?</span>
                                        <div class="tooltip tooltip-top multiline">
                                            Primary DNS server that handles most of your DNS queries. 
                                            This server applies your profile's filtering rules and blocks unwanted content.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced" id="secondary-dns-card">
                                <div class="metric-primary" id="secondary-endpoint">76.76.2.0</div>
                                <div class="metric-label-enhanced">Secondary DNS Server</div>
                                <div class="metric-context">Backup resolver for redundancy</div>
                                <div class="metric-actions">
                                    <button class="btn btn-xs btn-secondary copy-btn" data-copy="secondary">
                                        📋 Copy
                                    </button>
                                    <div class="tooltip-container">
                                        <span class="help-icon">?</span>
                                        <div class="tooltip tooltip-top multiline">
                                            Backup DNS server used when the primary server is unavailable. 
                                            Ensures continuous internet access with the same filtering rules.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced">
                                <div class="metric-primary" id="device-id">abc123def456</div>
                                <div class="metric-label-enhanced">Device Identifier</div>
                                <div class="metric-context">Unique ID for this device configuration</div>
                                <div class="metric-actions">
                                    <button class="btn btn-xs btn-secondary copy-btn" data-copy="device">
                                        📋 Copy
                                    </button>
                                    <div class="tooltip-container">
                                        <span class="help-icon">?</span>
                                        <div class="tooltip tooltip-top multiline">
                                            Unique identifier for this device in your Control D account. 
                                            Used to track usage statistics and apply device-specific settings.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtering Configuration Section -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Content Filtering Rules
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Active filtering rules that determine which types of content are blocked. 
                                        Each filter category protects against different types of unwanted content.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="enhanced-list" id="filter-list">
                            <!-- Filter items will be populated dynamically -->
                        </div>
                    </div>
                    
                    <!-- Service Status Section -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Service Components
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Status of different DNS protection components. All should be active 
                                        for optimal security and filtering performance.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="key-metrics">
                            <div class="metric-card-enhanced" id="content-filtering-card">
                                <div class="metric-primary" id="content-filtering-status">Active</div>
                                <div class="metric-label-enhanced">Content Filtering</div>
                                <div class="metric-context">Blocks unwanted domains and content</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Primary content filtering system that blocks access to domains 
                                        based on your profile's filtering rules and categories.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced" id="analytics-card">
                                <div class="metric-primary" id="analytics-status">Enabled</div>
                                <div class="metric-label-enhanced">Analytics & Logging</div>
                                <div class="metric-context">Tracks DNS queries for insights</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Collects anonymous DNS query statistics to help improve filtering 
                                        and provide insights into your browsing patterns.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card-enhanced" id="malware-protection-card">
                                <div class="metric-primary" id="malware-protection-status">Active</div>
                                <div class="metric-label-enhanced">Malware Protection</div>
                                <div class="metric-context">Blocks known malicious domains</div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Advanced protection against malware, phishing, and other security threats. 
                                        Updates automatically with the latest threat intelligence.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Technical Details Section (Collapsible) -->
                    <div class="spacing-section" id="technical-section">
                        <div class="section-header">
                            <div class="section-title">
                                Technical Configuration
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Advanced DNS configuration details for power users and technical troubleshooting. 
                                        Includes secure DNS protocols and API information.
                                    </div>
                                </div>
                            </div>
                            <div class="section-actions">
                                <button class="btn btn-sm btn-secondary" id="toggle-technical-btn">
                                    <span>Show Details</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="enhanced-list" id="technical-details" style="display: none;">
                            <div class="enhanced-list-item">
                                <div class="list-item-content">
                                    <div class="list-item-primary">DNS over HTTPS (DoH)</div>
                                    <div class="list-item-secondary">Encrypted DNS queries over HTTPS</div>
                                </div>
                                <div class="list-item-actions">
                                    <span class="metric-value" id="doh-url">https://freedns.controld.com/p1</span>
                                    <button class="btn btn-xs btn-secondary copy-btn" data-copy="doh">
                                        📋
                                    </button>
                                </div>
                            </div>
                            
                            <div class="enhanced-list-item">
                                <div class="list-item-content">
                                    <div class="list-item-primary">DNS over TLS (DoT)</div>
                                    <div class="list-item-secondary">Encrypted DNS queries over TLS</div>
                                </div>
                                <div class="list-item-actions">
                                    <span class="metric-value" id="dot-hostname">p1.freedns.controld.com</span>
                                    <button class="btn btn-xs btn-secondary copy-btn" data-copy="dot">
                                        📋
                                    </button>
                                </div>
                            </div>
                            
                            <div class="enhanced-list-item">
                                <div class="list-item-content">
                                    <div class="list-item-primary">API Version</div>
                                    <div class="list-item-secondary">Control D API version in use</div>
                                </div>
                                <div class="list-item-actions">
                                    <span class="metric-value" id="api-version">v2.1</span>
                                </div>
                            </div>
                            
                            <div class="enhanced-list-item">
                                <div class="list-item-content">
                                    <div class="list-item-primary">Last Synchronization</div>
                                    <div class="list-item-secondary">Most recent profile sync with servers</div>
                                </div>
                                <div class="list-item-actions">
                                    <span class="metric-value" id="last-sync">1 hour ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Profile Management Actions -->
                    <div class="spacing-section">
                        <div class="section-header">
                            <div class="section-title">
                                Profile Management
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Tools for testing and managing your DNS profile configuration. 
                                        Use these to verify everything is working correctly.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="control-buttons-enhanced">
                            <button class="btn btn-primary btn-lg" id="test-config-btn">
                                <div class="btn-content">
                                    <span class="btn-icon">🔍</span>
                                    <div class="btn-text-container">
                                        <span class="btn-title">Test Configuration</span>
                                        <span class="btn-subtitle">Verify DNS settings and connectivity</span>
                                    </div>
                                </div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Performs comprehensive tests of your DNS configuration including:
                                        • DNS resolution functionality
                                        • Filter rule application
                                        • Server connectivity and response times
                                        • Profile synchronization status
                                    </div>
                                </div>
                            </button>
                            
                            <button class="btn btn-success btn-lg" id="sync-profile-btn">
                                <div class="btn-content">
                                    <span class="btn-icon">🔄</span>
                                    <div class="btn-text-container">
                                        <span class="btn-title">Sync Profile</span>
                                        <span class="btn-subtitle">Update profile with latest server settings</span>
                                    </div>
                                </div>
                                <div class="tooltip-container">
                                    <span class="help-icon">?</span>
                                    <div class="tooltip tooltip-top multiline">
                                        Synchronizes your local profile with the latest settings from Control D servers. 
                                        This ensures you have the most recent filtering rules and configuration updates.
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        <!-- Action Results Display -->
                        <div class="enhanced-list" id="action-results" style="display: none;">
                            <!-- Action results will be displayed here -->
                        </div>
                    </div>
                    
                    <!-- Profile Summary -->
                    <div class="info-box success" id="profile-summary">
                        <div class="info-box-title">Profile Status</div>
                        <div class="info-box-content" id="profile-summary-text">
                            Your DNS profile is active and configured correctly. All filtering rules are operational.
                        </div>
                    </div>
                    
                    <!-- Last Updated -->
                    <div class="last-updated">
                        <small>Last updated: <span id="profile-last-updated">--</span></small>
                    </div>
                </div>
                
                <!-- Loading Overlay -->
                <div class="loading-enhanced" id="profile-loading" style="display: none;">
                    <div class="loading-spinner-enhanced"></div>
                    <div class="loading-text">Loading profile data...</div>
                </div>
            `;
        }
        
        // Get element references
        this.elements = {
            profileName: this.container.querySelector('#profile-name'),
            profileType: this.container.querySelector('#profile-type'),
            profileId: this.container.querySelector('#profile-id'),
            profileStatusIndicator: this.container.querySelector('#profile-status-indicator'),
            profileStatusText: this.container.querySelector('#profile-status-text'),
            primaryEndpoint: this.container.querySelector('#primary-endpoint'),
            secondaryEndpoint: this.container.querySelector('#secondary-endpoint'),
            secondaryDnsCard: this.container.querySelector('#secondary-dns-card'),
            deviceId: this.container.querySelector('#device-id'),
            filterList: this.container.querySelector('#filter-list'),
            contentFilteringStatus: this.container.querySelector('#content-filtering-status'),
            analyticsStatus: this.container.querySelector('#analytics-status'),
            malwareProtectionStatus: this.container.querySelector('#malware-protection-status'),
            technicalDetails: this.container.querySelector('#technical-details'),
            dohUrl: this.container.querySelector('#doh-url'),
            dotHostname: this.container.querySelector('#dot-hostname'),
            apiVersion: this.container.querySelector('#api-version'),
            lastSync: this.container.querySelector('#last-sync'),
            actionResults: this.container.querySelector('#action-results'),
            profileSummary: this.container.querySelector('#profile-summary'),
            profileSummaryText: this.container.querySelector('#profile-summary-text'),
            profileLastUpdated: this.container.querySelector('#profile-last-updated'),
            loadingOverlay: this.container.querySelector('#profile-loading')
        };
    }
    
    setupEventListeners() {
        // Refresh button
        const refreshBtn = this.container.querySelector('#refresh-profile-btn');
        refreshBtn?.addEventListener('click', () => this.refreshData());
        
        // Profile action buttons
        const switchProfileBtn = this.container.querySelector('#switch-profile-btn');
        switchProfileBtn?.addEventListener('click', () => this.switchProfile());
        
        const testConfigBtn = this.container.querySelector('#test-config-btn');
        testConfigBtn?.addEventListener('click', () => this.testConfiguration());
        
        const syncProfileBtn = this.container.querySelector('#sync-profile-btn');
        syncProfileBtn?.addEventListener('click', () => this.syncProfile());
        
        const toggleTechnicalBtn = this.container.querySelector('#toggle-technical-btn');
        toggleTechnicalBtn?.addEventListener('click', () => this.toggleTechnicalDetails());
        
        // Copy buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
                const copyBtn = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
                const copyType = copyBtn.getAttribute('data-copy');
                this.copyToClipboard(copyType);
            }
        });
        
        // Event bus subscriptions
        this.eventBus.subscribe?.('profile.updated', (data) => {
            this.updateDisplay();
        });
    }
    
    async loadInitialData() {
        try {
            this.showLoading(true, 'Loading DNS profile configuration...');
            const profileData = await this.apiClient.getCurrentProfile();
            
            this.data = {
                profile: profileData,
                lastUpdated: new Date()
            };
            
            this.updateDisplay();
            this.addActivityLog('Profile data loaded successfully', 'success');
        } catch (error) {
            console.error('Failed to load initial profile data:', error);
            this.showError('Failed to load DNS profile data');
            this.addActivityLog('Failed to load profile data', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    updateDisplay() {
        if (!this.data || !this.data.profile) return;
        
        this.updateProfileHeader();
        this.updateDnsConfiguration();
        this.updateFilteringConfiguration();
        this.updateServiceStatus();
        this.updateTechnicalDetails();
        this.updateProfileSummary();
        this.updateLastUpdatedTime();
    }
    
    updateProfileHeader() {
        const { profile } = this.data;
        
        this.elements.profileName.textContent = profile.name || 'Default Profile';
        this.elements.profileType.textContent = profile.type || 'Personal';
        this.elements.profileId.textContent = profile.id || 'Unknown';
        
        // Update status indicator
        this.elements.profileStatusIndicator.className = `status-indicator-enhanced active`;
        this.elements.profileStatusText.textContent = 'Active';
    }
    
    updateDnsConfiguration() {
        const { profile } = this.data;
        
        this.elements.primaryEndpoint.textContent = profile.primaryDns || '76.76.19.19';
        this.elements.secondaryEndpoint.textContent = profile.secondaryDns || '76.76.2.0';
        this.elements.deviceId.textContent = profile.deviceId || 'Unknown';
        
        // Show/hide secondary DNS based on settings
        if (this.elements.secondaryDnsCard) {
            this.elements.secondaryDnsCard.style.display = this.settings.showSecondary ? 'block' : 'none';
        }
    }
    
    updateFilteringConfiguration() {
        const { profile } = this.data;
        
        if (!profile.filters || !this.elements.filterList) return;
        
        const filterHtml = profile.filters.map(filter => {
            const statusIcon = filter.enabled ? '✅' : '❌';
            const statusText = filter.enabled ? 'Active' : 'Disabled';
            const statusClass = filter.enabled ? 'success' : 'warning';
            
            return `
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">${statusIcon} ${filter.name}</div>
                        <div class="list-item-secondary">${this.getFilterDescription(filter.category)}</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <div class="tooltip-container">
                            <span class="help-icon">?</span>
                            <div class="tooltip tooltip-top multiline">
                                ${this.getFilterTooltip(filter.category, filter.name)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.filterList.innerHTML = filterHtml;
    }
    
    updateServiceStatus() {
        const { profile } = this.data;
        
        const services = [
            { element: this.elements.contentFilteringStatus, status: profile.contentFiltering, card: 'content-filtering-card' },
            { element: this.elements.analyticsStatus, status: profile.analytics, card: 'analytics-card' },
            { element: this.elements.malwareProtectionStatus, status: profile.malwareProtection, card: 'malware-protection-card' }
        ];
        
        services.forEach(service => {
            if (service.element) {
                const isActive = service.status !== false;
                service.element.textContent = isActive ? 'Active' : 'Disabled';
                
                const card = this.container.querySelector(`#${service.card}`);
                if (card) {
                    card.classList.toggle('metric-success', isActive);
                    card.classList.toggle('metric-warning', !isActive);
                }
            }
        });
    }
    
    updateTechnicalDetails() {
        const { profile } = this.data;
        
        this.elements.dohUrl.textContent = profile.dohUrl || 'https://freedns.controld.com/p1';
        this.elements.dotHostname.textContent = profile.dotHostname || 'p1.freedns.controld.com';
        this.elements.apiVersion.textContent = profile.apiVersion || 'v2.1';
        
        if (profile.lastSync) {
            const lastSyncDate = new Date(profile.lastSync);
            const now = new Date();
            const diffHours = Math.floor((now - lastSyncDate) / (1000 * 60 * 60));
            
            this.elements.lastSync.textContent = diffHours === 0 ? 'Just now' : 
                diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else {
            this.elements.lastSync.textContent = 'Never';
        }
    }
    
    updateProfileSummary() {
        const { profile } = this.data;
        
        let summaryClass = 'info-box success';
        let summaryText = '🟢 Your DNS profile is active and configured correctly. All filtering components are operational and protecting your device.';
        
        // Check for any disabled services
        const disabledServices = [];
        if (!profile.contentFiltering) disabledServices.push('Content Filtering');
        if (!profile.malwareProtection) disabledServices.push('Malware Protection');
        
        if (disabledServices.length > 0) {
            summaryClass = 'info-box warning';
            summaryText = `🟡 Some protection features are disabled: ${disabledServices.join(', ')}. Consider enabling all features for maximum security.`;
        }
        
        this.elements.profileSummary.className = summaryClass;
        this.elements.profileSummaryText.textContent = summaryText;
    }
    
    updateLastUpdatedTime() {
        if (this.data.lastUpdated) {
            this.elements.profileLastUpdated.textContent = this.data.lastUpdated.toLocaleTimeString();
        }
    }
    
    async switchProfile() {
        try {
            this.showActionResults(true, 'Loading available profiles...');
            this.logger.log('dns-profile-enhanced', 'switch-profile-requested');
            
            const profiles = await this.apiClient.getAvailableProfiles();
            this.showProfileSelector(profiles);
            
        } catch (error) {
            console.error('Failed to load profiles:', error);
            this.showActionResults(true, 'Failed to load available profiles', 'error');
        }
    }
    
    showProfileSelector(profiles) {
        const currentProfileId = this.data.profile.id;
        
        const profilesHtml = profiles.map(profile => {
            const isActive = profile.id === currentProfileId;
            const statusIcon = isActive ? '✅' : '⚪';
            
            return `
                <div class="enhanced-list-item profile-option ${isActive ? 'active' : ''}" data-profile-id="${profile.id}">
                    <div class="list-item-content">
                        <div class="list-item-primary">${statusIcon} ${profile.name}</div>
                        <div class="list-item-secondary">${profile.description}</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="status-badge ${isActive ? 'success' : 'secondary'}">${profile.type}</span>
                        ${!isActive ? '<button class="btn btn-xs btn-primary select-profile-btn">Select</button>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.actionResults.innerHTML = `
            <div class="action-results-header">
                <h4>Available Profiles</h4>
                <button class="btn btn-sm btn-secondary" id="cancel-profile-selection">Cancel</button>
            </div>
            ${profilesHtml}
        `;
        
        // Add event listeners for profile selection
        this.elements.actionResults.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-profile-btn')) {
                const profileItem = e.target.closest('.profile-option');
                const profileId = profileItem.getAttribute('data-profile-id');
                this.applyProfile(profileId);
            }
            
            if (e.target.id === 'cancel-profile-selection') {
                this.showActionResults(false);
            }
        });
    }
    
    async applyProfile(profileId) {
        try {
            this.showActionResults(true, 'Applying profile...', 'info');
            
            await this.apiClient.setActiveProfile(profileId);
            this.showActionResults(true, 'Profile applied successfully!', 'success');
            
            this.addActivityLog('Profile switched successfully', 'success');
            this.logger.log('dns-profile-enhanced', 'profile-switched', { profileId });
            
            // Refresh data after a delay
            setTimeout(() => {
                this.refreshData();
                this.showActionResults(false);
            }, 2000);
            
        } catch (error) {
            console.error('Failed to apply profile:', error);
            this.showActionResults(true, `Failed to apply profile: ${error.message}`, 'error');
        }
    }
    
    async testConfiguration() {
        try {
            this.showActionResults(true, 'Testing DNS configuration...', 'info');
            this.logger.log('dns-profile-enhanced', 'test-configuration-started');
            
            const result = await this.apiClient.testConfiguration();
            
            const resultIcon = result.success ? '✅' : '❌';
            const resultClass = result.success ? 'success' : 'error';
            
            this.elements.actionResults.innerHTML = `
                <div class="action-results-header">
                    <h4>${resultIcon} Configuration Test Results</h4>
                </div>
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">Overall Status</div>
                        <div class="list-item-secondary">${result.message}</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="status-badge ${resultClass}">${result.success ? 'PASSED' : 'FAILED'}</span>
                    </div>
                </div>
                ${result.details ? `
                    <div class="enhanced-list-item">
                        <div class="list-item-content">
                            <div class="list-item-primary">DNS Resolution</div>
                            <div class="list-item-secondary">Domain name lookup functionality</div>
                        </div>
                        <div class="list-item-actions">
                            <span class="status-badge ${result.details.dnsResolution ? 'success' : 'error'}">
                                ${result.details.dnsResolution ? 'Working' : 'Failed'}
                            </span>
                        </div>
                    </div>
                    <div class="enhanced-list-item">
                        <div class="list-item-content">
                            <div class="list-item-primary">Filtering Status</div>
                            <div class="list-item-secondary">Content blocking functionality</div>
                        </div>
                        <div class="list-item-actions">
                            <span class="status-badge ${result.details.filteringActive ? 'success' : 'warning'}">
                                ${result.details.filteringActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div class="enhanced-list-item">
                        <div class="list-item-content">
                            <div class="list-item-primary">Response Time</div>
                            <div class="list-item-secondary">DNS query processing speed</div>
                        </div>
                        <div class="list-item-actions">
                            <span class="metric-value">${result.details.latency}ms</span>
                        </div>
                    </div>
                ` : ''}
            `;
            
            this.addActivityLog(`Configuration test: ${result.success ? 'Passed' : 'Failed'}`, result.success ? 'success' : 'warning');
            
            // Auto-hide results after 10 seconds
            setTimeout(() => {
                this.showActionResults(false);
            }, 10000);
            
        } catch (error) {
            console.error('Configuration test failed:', error);
            this.showActionResults(true, `Configuration test failed: ${error.message}`, 'error');
            this.addActivityLog('Configuration test failed', 'error');
        }
    }
    
    async syncProfile() {
        try {
            this.showActionResults(true, 'Synchronizing profile with Control D servers...', 'info');
            this.logger.log('dns-profile-enhanced', 'sync-profile-requested');
            
            await this.apiClient.syncProfile();
            this.showActionResults(true, 'Profile synchronized successfully!', 'success');
            
            this.addActivityLog('Profile synchronized with servers', 'success');
            
            // Refresh data after sync
            setTimeout(() => {
                this.refreshData();
                this.showActionResults(false);
            }, 2000);
            
        } catch (error) {
            console.error('Profile sync failed:', error);
            this.showActionResults(true, `Profile sync failed: ${error.message}`, 'error');
            this.addActivityLog('Profile sync failed', 'error');
        }
    }
    
    toggleTechnicalDetails() {
        const isVisible = this.elements.technicalDetails.style.display !== 'none';
        const toggleBtn = this.container.querySelector('#toggle-technical-btn');
        
        this.elements.technicalDetails.style.display = isVisible ? 'none' : 'block';
        toggleBtn.querySelector('span').textContent = isVisible ? 'Show Details' : 'Hide Details';
        
        this.settings.showTechnical = !isVisible;
        this.logger.log('dns-profile-enhanced', 'toggle-technical-details', { visible: !isVisible });
    }
    
    async copyToClipboard(type) {
        let textToCopy = '';
        let description = '';
        
        switch (type) {
            case 'primary':
                textToCopy = this.elements.primaryEndpoint.textContent;
                description = 'Primary DNS server';
                break;
            case 'secondary':
                textToCopy = this.elements.secondaryEndpoint.textContent;
                description = 'Secondary DNS server';
                break;
            case 'device':
                textToCopy = this.elements.deviceId.textContent;
                description = 'Device ID';
                break;
            case 'doh':
                textToCopy = this.elements.dohUrl.textContent;
                description = 'DNS over HTTPS URL';
                break;
            case 'dot':
                textToCopy = this.elements.dotHostname.textContent;
                description = 'DNS over TLS hostname';
                break;
        }
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showActionResults(true, `${description} copied to clipboard!`, 'success');
            
            this.logger.log('dns-profile-enhanced', 'copy-to-clipboard', { type, value: textToCopy });
            
            setTimeout(() => {
                this.showActionResults(false);
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showActionResults(true, 'Failed to copy to clipboard', 'error');
        }
    }
    
    showActionResults(show, message = '', type = 'info') {
        if (!show) {
            this.elements.actionResults.style.display = 'none';
            this.elements.actionResults.innerHTML = '';
            return;
        }
        
        if (message) {
            const resultIcon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
            
            this.elements.actionResults.innerHTML = `
                <div class="enhanced-list-item">
                    <div class="list-item-content">
                        <div class="list-item-primary">${resultIcon} ${message}</div>
                        <div class="list-item-secondary">Profile management action</div>
                    </div>
                    <div class="list-item-actions">
                        <span class="activity-time">${this.formatTime(new Date())}</span>
                    </div>
                </div>
            `;
        }
        
        this.elements.actionResults.style.display = 'block';
    }
    
    addActivityLog(message, type = 'info') {
        // This would typically log to a central activity log
        console.log(`DNS Profile Activity: ${message}`);
        this.eventBus.emit?.('activity.logged', {
            widget: 'dns-profile',
            message,
            type,
            timestamp: new Date()
        });
    }
    
    async refreshData() {
        this.logger.log('dns-profile-enhanced', 'refresh-requested');
        await this.loadInitialData();
        this.addActivityLog('Profile data refreshed', 'info');
    }
    
    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.settings.autoSync) {
            this.refreshInterval = setInterval(() => {
                this.refreshData();
            }, this.settings.refreshInterval);
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
        // For now, use action results to show errors
        this.showActionResults(true, message, 'error');
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    getFilterDescription(category) {
        const descriptions = {
            'privacy': 'Blocks advertising trackers and analytics',
            'security': 'Protects against malicious websites and phishing',
            'family': 'Filters inappropriate content for family use',
            'productivity': 'Blocks distracting social media and entertainment',
            'entertainment': 'Controls access to streaming and gaming platforms'
        };
        
        return descriptions[category] || 'Content filtering category';
    }
    
    getFilterTooltip(category, name) {
        const tooltips = {
            'Ads & Trackers': 'Blocks online advertisements and tracking scripts that monitor your browsing activity.',
            'Malware & Phishing': 'Prevents access to known malicious websites that distribute malware or attempt to steal credentials.',
            'Adult Content': 'Filters adult and explicit content inappropriate for family environments.',
            'Social Media': 'Blocks access to social media platforms to improve productivity.',
            'Gaming': 'Restricts access to online gaming platforms and related content.',
            'Streaming': 'Controls access to video streaming services and platforms.',
            'Gambling': 'Blocks gambling websites and related content.',
            'News': 'Filters news websites and current events content.'
        };
        
        return tooltips[name] || `Filtering rule for ${category} content category.`;
    }
    
    // Widget Manager Integration
    getTitle() {
        return 'DNS Profile';
    }
    
    getSettings() {
        return this.settings;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.logger.log('dns-profile-enhanced', 'settings-updated', newSettings);
        this.setupAutoRefresh();
    }
    
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.eventBus.unsubscribeAll?.();
        console.log('🧹 Enhanced DNS Profile Widget destroyed');
    }
}

// Enhanced button styles
const enhancedButtonStyles = `
.control-buttons-enhanced {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.control-buttons-enhanced .btn-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
}

.control-buttons-enhanced .btn-text-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
}

.control-buttons-enhanced .btn-title {
    font-weight: 600;
    font-size: 1rem;
}

.control-buttons-enhanced .btn-subtitle {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: normal;
}

.control-buttons-enhanced .btn-lg .btn-icon {
    font-size: 1.5rem;
}

.profile-option {
    cursor: pointer;
    transition: all var(--transition-fast);
}

.profile-option:hover {
    background-color: var(--color-bg-hover);
}

.profile-option.active {
    background-color: var(--color-bg-active);
}

.action-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
}

.action-results-header h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .control-buttons-enhanced {
        gap: var(--spacing-sm);
    }
    
    .control-buttons-enhanced .btn-content {
        gap: var(--spacing-sm);
    }
    
    .control-buttons-enhanced .btn-title {
        font-size: 0.875rem;
    }
    
    .control-buttons-enhanced .btn-subtitle {
        font-size: 0.7rem;
    }
}
`;

// Inject enhanced button styles
if (!document.querySelector('#dns-profile-enhanced-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dns-profile-enhanced-styles';
    styleSheet.textContent = enhancedButtonStyles;
    document.head.appendChild(styleSheet);
}

// Global registration
window.DnsProfileEnhancedWidget = DnsProfileEnhancedWidget;