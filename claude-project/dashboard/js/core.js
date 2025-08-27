/**
 * Core Widget Management System
 * Handles widget lifecycle, registration, and communication
 */

class WidgetManager {
    constructor() {
        this.widgets = new Map();
        this.eventListeners = new Map();
        this.container = null;
        this.logger = new InteractionLogger();
        this.settingsManager = new SettingsManager();
        this.apiClient = new ApiClient();
        this.eventBus = new EventBus();
    }

    /**
     * Initialize the widget manager
     */
    init() {
        console.log('Initializing WidgetManager');
        this.container = document.getElementById('widget-grid');
        
        if (!this.container) {
            throw new Error('Widget container not found');
        }

        this.setupEventListeners();
        this.loadWidgets();
        this.logger.log('dashboard', 'initialized');
    }

    /**
     * Register a new widget type
     */
    registerWidget(name, widgetClass) {
        if (this.widgets.has(name)) {
            console.warn(`Widget ${name} already registered, overwriting`);
        }
        
        this.widgets.set(name, {
            class: widgetClass,
            instances: []
        });
        
        console.log(`Registered widget: ${name}`);
    }

    /**
     * Create and add a widget instance
     */
    addWidget(name, config = {}) {
        const widget = this.widgets.get(name);
        if (!widget) {
            throw new Error(`Widget ${name} not registered`);
        }

        const instance = new widget.class(config);
        const widgetElement = this.createWidgetElement(name, instance);
        
        // Initialize the widget
        instance.init(widgetElement);
        
        // Store instance
        widget.instances.push(instance);
        
        // Add to DOM
        this.container.appendChild(widgetElement);
        
        this.logger.log('widget', 'added', { name, config });
        return instance;
    }

    /**
     * Create widget DOM element
     */
    createWidgetElement(name, instance) {
        const element = document.createElement('div');
        element.className = `widget widget-${name}`;
        element.id = `widget-${name}-${Date.now()}`;
        
        // Add widget header
        const header = document.createElement('div');
        header.className = 'widget-header';
        
        const title = document.createElement('h3');
        title.textContent = instance.getTitle();
        title.className = 'widget-title';
        
        const controls = document.createElement('div');
        controls.className = 'widget-controls';
        controls.innerHTML = `
            <button class="widget-refresh" data-action="refresh">↻</button>
            <button class="widget-settings" data-action="settings">⚙</button>
        `;
        
        header.appendChild(title);
        header.appendChild(controls);
        
        // Add widget content area
        const content = document.createElement('div');
        content.className = 'widget-content';
        
        element.appendChild(header);
        element.appendChild(content);
        
        return element;
    }

    /**
     * Remove a widget instance
     */
    removeWidget(instance) {
        for (const [name, widget] of this.widgets) {
            const index = widget.instances.indexOf(instance);
            if (index > -1) {
                widget.instances.splice(index, 1);
                instance.destroy();
                this.logger.log('widget', 'removed', { name });
                break;
            }
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Widget control handlers
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.widget-refresh')) {
                const widget = e.target.closest('.widget');
                this.refreshWidget(widget);
            } else if (e.target.matches('.widget-settings')) {
                const widget = e.target.closest('.widget');
                this.showWidgetSettings(widget);
            }
        });

        // Global refresh button
        const refreshButton = document.getElementById('refresh-all');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshAllWidgets();
            });
        }

        // Settings button
        const settingsButton = document.getElementById('settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showGlobalSettings();
            });
        }
    }

    /**
     * Load default widgets
     */
    loadWidgets() {
        // Register and load DNS widgets
        this.registerDnsWidgets();
        
        // Add default widget instances
        this.addWidget('dns-info');
        this.addWidget('dns-status');
        this.addWidget('dns-profile');
        this.addWidget('dns-analytics');
        this.addWidget('pause-test');
    }

    /**
     * Register DNS-related widgets
     */
    registerDnsWidgets() {
        // Load the actual DNS Info Widget implementation
        this.registerWidget('dns-info', class DnsInfoWidgetWrapper extends BaseWidget {
            constructor(config) {
                super(config);
                this.dnsInfoWidget = null;
            }
            
            getTitle() { return 'DNS Analytics'; }
            
            async init(element) {
                this.element = element;
                
                // Load DNS Info Widget CSS
                await this.loadCSS('/widgets/dns-info/dns-info.css');
                
                // Load DNS Info Widget HTML template
                const content = this.element.querySelector('.widget-content');
                if (content) {
                    const response = await fetch('/widgets/dns-info/dns-info.html');
                    const html = await response.text();
                    content.innerHTML = html;
                    
                    // Initialize the actual DNS Info Widget
                    if (window.DnsInfoWidget) {
                        this.dnsInfoWidget = new window.DnsInfoWidget(content);
                    }
                }
                
                this.isInitialized = true;
            }
            
            async loadCSS(href) {
                if (document.querySelector(`link[href="${href}"]`)) {
                    return; // Already loaded
                }
                
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
                
                return new Promise((resolve) => {
                    link.onload = resolve;
                });
            }
            
            destroy() {
                if (this.dnsInfoWidget) {
                    this.dnsInfoWidget.destroy();
                }
                super.destroy();
            }
            
            refresh() {
                if (this.dnsInfoWidget) {
                    this.dnsInfoWidget.refreshData();
                }
            }
        });

        this.registerWidget('dns-status', class DnsStatusWidgetWrapper extends BaseWidget {
            constructor(config) {
                super(config);
                this.dnsStatusWidget = null;
            }
            
            getTitle() { return 'DNS Status'; }
            
            async init(element) {
                this.element = element;
                
                // Initialize the actual DNS Status Widget
                const content = this.element.querySelector('.widget-content');
                if (content && window.DnsStatusWidget) {
                    this.dnsStatusWidget = new window.DnsStatusWidget(content);
                }
                
                this.isInitialized = true;
            }
            
            destroy() {
                if (this.dnsStatusWidget) {
                    this.dnsStatusWidget.destroy();
                }
                super.destroy();
            }
            
            async refresh() {
                if (this.dnsStatusWidget) {
                    await this.dnsStatusWidget.refreshData();
                }
            }
            
            applySettings(settings) {
                super.applySettings(settings);
                if (this.dnsStatusWidget) {
                    this.dnsStatusWidget.applySettings(settings);
                }
            }
        });

        this.registerWidget('dns-profile', class DnsProfileWidgetWrapper extends BaseWidget {
            constructor(config) {
                super(config);
                this.dnsProfileWidget = null;
            }
            
            getTitle() { return 'DNS Profile'; }
            
            async init(element) {
                this.element = element;
                
                // Initialize the actual DNS Profile Widget
                const content = this.element.querySelector('.widget-content');
                if (content && window.DnsProfileWidget) {
                    this.dnsProfileWidget = new window.DnsProfileWidget(content);
                }
                
                this.isInitialized = true;
            }
            
            destroy() {
                if (this.dnsProfileWidget) {
                    this.dnsProfileWidget.destroy();
                }
                super.destroy();
            }
            
            async refresh() {
                if (this.dnsProfileWidget) {
                    await this.dnsProfileWidget.refreshData();
                }
            }
            
            applySettings(settings) {
                super.applySettings(settings);
                if (this.dnsProfileWidget) {
                    this.dnsProfileWidget.applySettings(settings);
                }
            }
        });

        this.registerWidget('dns-analytics', class DnsAnalyticsWidgetWrapper extends BaseWidget {
            constructor(config) {
                super(config);
                this.dnsAnalyticsWidget = null;
            }
            
            getTitle() { return 'DNS Analytics'; }
            
            async init(element) {
                this.element = element;
                
                // Initialize the actual DNS Analytics Widget
                const content = this.element.querySelector('.widget-content');
                if (content && window.DnsAnalyticsWidget) {
                    this.dnsAnalyticsWidget = new window.DnsAnalyticsWidget(content);
                }
                
                this.isInitialized = true;
            }
            
            destroy() {
                if (this.dnsAnalyticsWidget) {
                    this.dnsAnalyticsWidget.destroy();
                }
                super.destroy();
            }
            
            async refresh() {
                if (this.dnsAnalyticsWidget) {
                    await this.dnsAnalyticsWidget.refreshData();
                }
            }
            
            applySettings(settings) {
                super.applySettings(settings);
                if (this.dnsAnalyticsWidget) {
                    this.dnsAnalyticsWidget.applySettings(settings);
                }
            }
        });

        // Register Pause/Test Connection Widget
        this.registerWidget('pause-test', class PauseTestWidgetWrapper extends BaseWidget {
            constructor(config) {
                super(config);
                this.pauseTestWidget = null;
            }
            
            getTitle() { return 'Connection Control'; }
            
            async init(element) {
                this.element = element;
                
                // Initialize the actual Pause/Test Widget
                const content = this.element.querySelector('.widget-content');
                if (content && window.PauseTestWidget) {
                    this.pauseTestWidget = new window.PauseTestWidget(content);
                }
                
                this.isInitialized = true;
            }
            
            destroy() {
                if (this.pauseTestWidget) {
                    this.pauseTestWidget.destroy();
                }
                super.destroy();
            }
            
            async refresh() {
                if (this.pauseTestWidget) {
                    await this.pauseTestWidget.refresh();
                }
            }
            
            applySettings(settings) {
                super.applySettings(settings);
                if (this.pauseTestWidget) {
                    this.pauseTestWidget.updateSettings(settings);
                }
            }
        });

    }

    /**
     * Refresh a specific widget
     */
    async refreshWidget(widgetElement) {
        const widgetId = widgetElement.id;
        this.logger.log('widget', 'refresh', { widgetId });
        console.log(`Refreshing widget: ${widgetId}`);
        
        try {
            // Show loading state
            this.setWidgetLoadingState(widgetElement, true);
            
            // Find the widget instance and call its refresh method
            const instance = this.findWidgetInstance(widgetElement);
            if (instance && typeof instance.refresh === 'function') {
                await instance.refresh();
                this.showWidgetSuccess(widgetElement, 'Widget refreshed successfully');
            } else {
                console.warn(`No refresh method found for widget: ${widgetId}`);
                this.showWidgetMessage(widgetElement, 'Refresh not available for this widget', 'warning');
            }
        } catch (error) {
            console.error(`Failed to refresh widget ${widgetId}:`, error);
            this.showWidgetError(widgetElement, 'Failed to refresh widget data');
        } finally {
            // Hide loading state
            this.setWidgetLoadingState(widgetElement, false);
        }
    }

    /**
     * Refresh all widgets
     */
    async refreshAllWidgets() {
        this.logger.log('dashboard', 'refresh_all');
        console.log('🔄 Refreshing all widgets');
        
        const widgets = this.container.querySelectorAll('.widget');
        const refreshButton = document.getElementById('refresh-all');
        
        try {
            // Disable refresh button during operation
            if (refreshButton) {
                refreshButton.disabled = true;
                refreshButton.textContent = 'Refreshing...';
            }
            
            // Refresh all widgets in parallel for better performance
            const refreshPromises = Array.from(widgets).map(widget => 
                this.refreshWidget(widget).catch(error => {
                    console.error(`Failed to refresh widget ${widget.id}:`, error);
                    return null; // Continue with other widgets
                })
            );
            
            await Promise.all(refreshPromises);
            
            this.showGlobalMessage('All widgets refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Failed to refresh all widgets:', error);
            this.showGlobalMessage('Some widgets failed to refresh', 'error');
        } finally {
            // Re-enable refresh button
            if (refreshButton) {
                refreshButton.disabled = false;
                refreshButton.textContent = 'Refresh All';
            }
        }
    }

    /**
     * Show widget settings
     */
    showWidgetSettings(widgetElement) {
        const widgetId = widgetElement.id;
        this.logger.log('widget', 'settings', { widgetId });
        console.log(`Opening settings for widget: ${widgetId}`);
        
        // Find the widget instance
        const instance = this.findWidgetInstance(widgetElement);
        const widgetType = this.getWidgetType(widgetElement);
        
        // Create and show settings modal
        this.settingsManager.showWidgetSettings(widgetType, instance, widgetElement);
    }

    /**
     * Show global settings
     */
    showGlobalSettings() {
        this.logger.log('dashboard', 'global_settings');
        console.log('Opening global settings');
        
        // Show global settings modal
        this.settingsManager.showGlobalSettings();
    }

    /**
     * Find widget instance from DOM element
     */
    findWidgetInstance(widgetElement) {
        const widgetType = this.getWidgetType(widgetElement);
        const widget = this.widgets.get(widgetType);
        
        if (widget && widget.instances) {
            // Find the instance that matches this element
            return widget.instances.find(instance => 
                instance.element === widgetElement || 
                instance.element === widgetElement.querySelector('.widget-content')
            );
        }
        
        return null;
    }

    /**
     * Get widget type from DOM element
     */
    getWidgetType(widgetElement) {
        const classList = Array.from(widgetElement.classList);
        const widgetClass = classList.find(cls => cls.startsWith('widget-'));
        return widgetClass ? widgetClass.replace('widget-', '') : 'unknown';
    }

    /**
     * Set loading state for a widget
     */
    setWidgetLoadingState(widgetElement, isLoading) {
        const refreshBtn = widgetElement.querySelector('.widget-refresh');
        if (refreshBtn) {
            refreshBtn.disabled = isLoading;
            refreshBtn.innerHTML = isLoading ? '⏳' : '↻';
        }
        
        // Add/remove loading class
        if (isLoading) {
            widgetElement.classList.add('widget-loading');
        } else {
            widgetElement.classList.remove('widget-loading');
        }
    }

    /**
     * Show widget success message
     */
    showWidgetSuccess(widgetElement, message) {
        this.showWidgetMessage(widgetElement, message, 'success');
    }

    /**
     * Show widget error message
     */
    showWidgetError(widgetElement, message) {
        this.showWidgetMessage(widgetElement, message, 'error');
    }

    /**
     * Show widget message with type
     */
    showWidgetMessage(widgetElement, message, type = 'info') {
        // Remove any existing message
        const existingMessage = widgetElement.querySelector('.widget-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `widget-message widget-message-${type}`;
        messageElement.textContent = message;
        
        // Insert after header
        const header = widgetElement.querySelector('.widget-header');
        if (header) {
            header.insertAdjacentElement('afterend', messageElement);
        }
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    /**
     * Show global dashboard message
     */
    showGlobalMessage(message, type = 'info') {
        // Create global message container if it doesn't exist
        let messageContainer = document.getElementById('global-messages');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'global-messages';
            messageContainer.className = 'global-messages';
            
            const header = document.querySelector('.dashboard-header');
            if (header) {
                header.insertAdjacentElement('afterend', messageContainer);
            }
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `global-message global-message-${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
}

/**
 * Base Widget Class
 * All widgets should extend this class
 */
class BaseWidget {
    constructor(config = {}) {
        this.config = config;
        this.element = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the widget
     */
    init(element) {
        this.element = element;
        this.render();
        this.attachEventListeners();
        this.isInitialized = true;
    }

    /**
     * Render widget content
     */
    render() {
        const content = this.element.querySelector('.widget-content');
        if (content) {
            content.innerHTML = this.getContent();
        }
    }

    /**
     * Get widget content HTML
     */
    getContent() {
        return '<div>Base widget content</div>';
    }

    /**
     * Get widget title
     */
    getTitle() {
        return 'Base Widget';
    }

    /**
     * Attach widget-specific event listeners
     */
    attachEventListeners() {
        // Override in subclasses
    }

    /**
     * Destroy the widget
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.isInitialized = false;
    }

    /**
     * Refresh widget data
     */
    async refresh() {
        if (this.isInitialized) {
            console.log(`Refreshing ${this.getTitle()} widget`);
            await this.loadData();
            this.render();
        }
    }

    /**
     * Load widget data (override in subclasses)
     */
    async loadData() {
        // Override in subclasses to load actual data
        console.log('Loading data for', this.getTitle());
    }

    /**
     * Apply settings to widget
     */
    applySettings(settings) {
        this.config = { ...this.config, ...settings };
        console.log(`Applied settings to ${this.getTitle()}:`, settings);
        
        // Re-render with new settings
        if (this.isInitialized) {
            this.render();
        }
    }

    /**
     * Get current widget settings
     */
    getSettings() {
        return this.config;
    }
}

/**
 * Interaction Logger
 * Logs all user interactions for debugging and analytics
 */
class InteractionLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    /**
     * Log an interaction
     */
    log(category, action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            category,
            action,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(logEntry);
        
        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Log to console in development
        console.log('Interaction:', logEntry);
        
        // Could send to analytics service here
        this.sendToAnalytics(logEntry);
    }

    /**
     * Send log to analytics (placeholder)
     */
    sendToAnalytics(logEntry) {
        // Implementation for sending to analytics service
        // This could use the HTTP MCP in the future
    }

    /**
     * Get recent logs
     */
    getLogs(limit = 100) {
        return this.logs.slice(-limit);
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
    }
}

/**
 * Settings Manager
 * Handles widget and global settings persistence and UI
 */
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.modal = null;
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('dashboard-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('dashboard-settings', JSON.stringify(this.settings));
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            global: {
                theme: 'light',
                autoRefresh: true,
                refreshInterval: 300000, // 5 minutes
                notifications: true
            },
            widgets: {
                'dns-info': {
                    defaultTimeRange: '24h',
                    autoRefresh: true,
                    showAdvanced: false
                },
                'dns-status': {
                    showDetails: true,
                    alertThresholds: {
                        latency: 100,
                        uptime: 99
                    }
                },
                'dns-profile': {
                    showSecondary: true,
                    showTechnical: false
                },
                'pause-test': {
                    confirmActions: true,
                    showAdvanced: false
                }
            }
        };
    }

    /**
     * Show widget settings modal
     */
    showWidgetSettings(widgetType, instance, widgetElement) {
        const widgetSettings = this.settings.widgets[widgetType] || {};
        
        const settingsConfig = this.getWidgetSettingsConfig(widgetType);
        if (!settingsConfig) {
            this.showMessage('No settings available for this widget', 'info');
            return;
        }

        this.showSettingsModal(`${widgetType} Settings`, settingsConfig, widgetSettings, (newSettings) => {
            // Update settings
            this.settings.widgets[widgetType] = { ...this.settings.widgets[widgetType], ...newSettings };
            this.saveSettings();
            
            // Apply settings to widget instance
            if (instance && typeof instance.applySettings === 'function') {
                instance.applySettings(newSettings);
            }
            
            console.log(`Settings updated for ${widgetType}:`, newSettings);
        });
    }

    /**
     * Show global settings modal
     */
    showGlobalSettings() {
        const globalConfig = [
            {
                key: 'theme',
                label: 'Theme',
                type: 'select',
                options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]
            },
            {
                key: 'autoRefresh',
                label: 'Auto Refresh',
                type: 'checkbox'
            },
            {
                key: 'refreshInterval',
                label: 'Refresh Interval (minutes)',
                type: 'number',
                min: 1,
                max: 60,
                transform: {
                    toUI: (value) => value / 60000,
                    fromUI: (value) => value * 60000
                }
            },
            {
                key: 'notifications',
                label: 'Show Notifications',
                type: 'checkbox'
            }
        ];

        this.showSettingsModal('Global Settings', globalConfig, this.settings.global, (newSettings) => {
            this.settings.global = { ...this.settings.global, ...newSettings };
            this.saveSettings();
            this.applyGlobalSettings();
            console.log('Global settings updated:', newSettings);
        });
    }

    /**
     * Get widget-specific settings configuration
     */
    getWidgetSettingsConfig(widgetType) {
        const configs = {
            'dns-info': [
                {
                    key: 'defaultTimeRange',
                    label: 'Default Time Range',
                    type: 'select',
                    options: [
                        { value: '24h', label: '24 Hours' },
                        { value: '7d', label: '7 Days' },
                        { value: '30d', label: '30 Days' }
                    ]
                },
                {
                    key: 'autoRefresh',
                    label: 'Auto Refresh',
                    type: 'checkbox'
                },
                {
                    key: 'showAdvanced',
                    label: 'Show Advanced Analytics',
                    type: 'checkbox'
                }
            ],
            'dns-status': [
                {
                    key: 'showDetails',
                    label: 'Show Detailed Metrics',
                    type: 'checkbox'
                },
                {
                    key: 'alertThresholds.latency',
                    label: 'Latency Alert Threshold (ms)',
                    type: 'number',
                    min: 1,
                    max: 1000
                },
                {
                    key: 'alertThresholds.uptime',
                    label: 'Uptime Alert Threshold (%)',
                    type: 'number',
                    min: 90,
                    max: 100,
                    step: 0.1
                }
            ],
            'dns-profile': [
                {
                    key: 'showSecondary',
                    label: 'Show Secondary DNS',
                    type: 'checkbox'
                },
                {
                    key: 'showTechnical',
                    label: 'Show Technical Details',
                    type: 'checkbox'
                }
            ],
            'pause-test': [
                {
                    key: 'confirmActions',
                    label: 'Confirm Destructive Actions',
                    type: 'checkbox'
                },
                {
                    key: 'showAdvanced',
                    label: 'Show Advanced Controls',
                    type: 'checkbox'
                }
            ]
        };

        return configs[widgetType];
    }

    /**
     * Show settings modal
     */
    showSettingsModal(title, config, currentSettings, onSave) {
        // Remove existing modal
        this.closeModal();

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'settings-modal-overlay';
        this.modal.innerHTML = `
            <div class="settings-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="settings-form">
                        ${this.renderSettingsForm(config, currentSettings)}
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                    <button type="button" class="btn btn-primary modal-save">Save</button>
                </div>
            </div>
        `;

        // Add event listeners
        this.modal.querySelector('.modal-close').onclick = () => this.closeModal();
        this.modal.querySelector('.modal-cancel').onclick = () => this.closeModal();
        this.modal.querySelector('.modal-save').onclick = () => {
            const formData = this.getFormData(config);
            onSave(formData);
            this.closeModal();
        };

        // Close on overlay click
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        };

        document.body.appendChild(this.modal);
    }

    /**
     * Render settings form
     */
    renderSettingsForm(config, currentSettings) {
        return config.map(field => {
            const value = this.getNestedValue(currentSettings, field.key);
            const displayValue = field.transform?.toUI ? field.transform.toUI(value) : value;

            switch (field.type) {
                case 'checkbox':
                    return `
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="${field.key}" ${displayValue ? 'checked' : ''}>
                                ${field.label}
                            </label>
                        </div>
                    `;
                
                case 'select':
                    const options = field.options.map(opt => 
                        `<option value="${opt.value}" ${opt.value === displayValue ? 'selected' : ''}>${opt.label}</option>`
                    ).join('');
                    return `
                        <div class="form-group">
                            <label>${field.label}</label>
                            <select name="${field.key}">${options}</select>
                        </div>
                    `;
                
                case 'number':
                    return `
                        <div class="form-group">
                            <label>${field.label}</label>
                            <input type="number" name="${field.key}" value="${displayValue}" 
                                   ${field.min ? `min="${field.min}"` : ''} 
                                   ${field.max ? `max="${field.max}"` : ''}
                                   ${field.step ? `step="${field.step}"` : ''}>
                        </div>
                    `;
                
                default:
                    return `
                        <div class="form-group">
                            <label>${field.label}</label>
                            <input type="text" name="${field.key}" value="${displayValue}">
                        </div>
                    `;
            }
        }).join('');
    }

    /**
     * Get form data
     */
    getFormData(config) {
        const form = this.modal.querySelector('.settings-form');
        const formData = new FormData(form);
        const result = {};

        config.forEach(field => {
            let value;
            
            if (field.type === 'checkbox') {
                value = form.querySelector(`[name="${field.key}"]`).checked;
            } else if (field.type === 'number') {
                value = Number(formData.get(field.key));
            } else {
                value = formData.get(field.key);
            }

            if (field.transform?.fromUI) {
                value = field.transform.fromUI(value);
            }

            this.setNestedValue(result, field.key, value);
        });

        return result;
    }

    /**
     * Get nested object value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Set nested object value
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    /**
     * Apply global settings
     */
    applyGlobalSettings() {
        // Apply theme
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${this.settings.global.theme}`;
        
        // Other global settings would be applied here
        console.log('Global settings applied');
    }

    /**
     * Show message
     */
    showMessage(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Could integrate with notification system
    }
}

/**
 * API Client
 * Centralized API communication layer
 */
class ApiClient {
    constructor() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000
        };
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(url, options = {}) {
        const config = {
            ...options,
            headers: { ...this.defaultHeaders, ...options.headers }
        };

        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryConfig.maxRetries) {
                    console.warn(`Request failed (attempt ${attempt + 1}), retrying in ${this.retryConfig.retryDelay}ms...`);
                    await this.delay(this.retryConfig.retryDelay * (attempt + 1));
                } else {
                    console.error(`Request failed after ${this.retryConfig.maxRetries + 1} attempts:`, error);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET request
     */
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

/**
 * Event Bus
 * Cross-widget communication system
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from events
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event) {
        this.listeners.delete(event);
    }

    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
    }
}

// Make classes globally available
window.WidgetManager = WidgetManager;
window.BaseWidget = BaseWidget;
window.InteractionLogger = InteractionLogger;
window.SettingsManager = SettingsManager;
window.ApiClient = ApiClient;
window.EventBus = EventBus;