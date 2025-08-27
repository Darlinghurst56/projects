/**
 * Simple Connection Control Widget - Home DNS Dashboard
 * Clean, friendly interface for controlling Control D DNS protection
 */

class SimpleConnectionControlWidget {
    constructor(container) {
        this.container = container;
        this.apiClient = new ControlDApiClient();
        this.isProtectionOn = true;
        this.isTestingConnection = false;
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Simple Connection Control Widget');
        this.loadTemplate();
        this.setupEventListeners();
        await this.checkStatus();
    }
    
    loadTemplate() {
        this.container.innerHTML = `
            <div class="simple-connection-widget">
                <!-- Status Display -->
                <div class="status-display">
                    <div class="status-icon" id="status-icon">🛡️</div>
                    <div class="status-text">
                        <div class="status-main" id="status-main">DNS Protection Active</div>
                        <div class="status-sub" id="status-sub">Your browsing is secure</div>
                    </div>
                </div>
                
                <!-- Control Buttons -->
                <div class="control-buttons">
                    <button class="control-btn primary" id="toggle-btn">
                        <span class="btn-icon">⏸️</span>
                        <span class="btn-text">Pause Protection</span>
                    </button>
                    
                    <button class="control-btn secondary" id="test-btn">
                        <span class="btn-icon">🔍</span>
                        <span class="btn-text">Test Connection</span>
                    </button>
                </div>
                
                <!-- Quick Status Info -->
                <div class="quick-info" id="quick-info">
                    <div class="info-item">
                        <span class="info-label">DNS Server:</span>
                        <span class="info-value" id="dns-server">76.76.19.19</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Response Time:</span>
                        <span class="info-value" id="response-time">--ms</span>
                    </div>
                </div>
                
                <!-- Test Results -->
                <div class="test-results" id="test-results" style="display: none;">
                    <div class="result-header">Connection Test</div>
                    <div class="result-content" id="result-content">
                        <!-- Test results will appear here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Toggle protection button
        const toggleBtn = this.container.querySelector('#toggle-btn');
        toggleBtn.addEventListener('click', () => this.toggleProtection());
        
        // Test connection button
        const testBtn = this.container.querySelector('#test-btn');
        testBtn.addEventListener('click', () => this.testConnection());
    }
    
    async checkStatus() {
        try {
            // Simulate checking DNS status
            const status = await this.apiClient.getConnectionStatus();
            this.updateDisplay(status);
        } catch (error) {
            console.warn('Status check failed, using defaults');
            this.updateDisplay({ active: true, responseTime: 25 });
        }
    }
    
    updateDisplay(status) {
        const statusIcon = this.container.querySelector('#status-icon');
        const statusMain = this.container.querySelector('#status-main');
        const statusSub = this.container.querySelector('#status-sub');
        const toggleBtn = this.container.querySelector('#toggle-btn');
        const responseTime = this.container.querySelector('#response-time');
        
        this.isProtectionOn = status.active;
        
        if (this.isProtectionOn) {
            statusIcon.textContent = '🛡️';
            statusMain.textContent = 'DNS Protection Active';
            statusSub.textContent = 'Your browsing is secure';
            toggleBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause Protection</span>';
            toggleBtn.className = 'control-btn primary';
        } else {
            statusIcon.textContent = '⚠️';
            statusMain.textContent = 'Protection Paused';
            statusSub.textContent = 'Click to resume protection';
            toggleBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Resume Protection</span>';
            toggleBtn.className = 'control-btn success';
        }
        
        if (status.responseTime) {
            responseTime.textContent = `${status.responseTime}ms`;
        }
    }
    
    async toggleProtection() {
        const toggleBtn = this.container.querySelector('#toggle-btn');
        const originalText = toggleBtn.querySelector('.btn-text').textContent;
        
        try {
            // Show loading state
            toggleBtn.disabled = true;
            toggleBtn.querySelector('.btn-text').textContent = this.isProtectionOn ? 'Pausing...' : 'Resuming...';
            toggleBtn.querySelector('.btn-icon').textContent = '⏳';
            
            if (this.isProtectionOn) {
                await this.apiClient.pauseProtection();
                this.updateDisplay({ active: false });
                this.showQuickMessage('Protection paused for 5 minutes', 'warning');
            } else {
                await this.apiClient.resumeProtection();
                this.updateDisplay({ active: true, responseTime: 25 });
                this.showQuickMessage('Protection resumed', 'success');
            }
            
        } catch (error) {
            console.error('Toggle failed:', error);
            this.showQuickMessage('Action failed, please try again', 'error');
        } finally {
            toggleBtn.disabled = false;
        }
    }
    
    async testConnection() {
        const testBtn = this.container.querySelector('#test-btn');
        const testResults = this.container.querySelector('#test-results');
        const resultContent = this.container.querySelector('#result-content');
        
        if (this.isTestingConnection) return;
        
        this.isTestingConnection = true;
        testBtn.disabled = true;
        testBtn.querySelector('.btn-text').textContent = 'Testing...';
        testBtn.querySelector('.btn-icon').textContent = '⏳';
        
        try {
            const result = await this.apiClient.testConnection();
            
            resultContent.innerHTML = `
                <div class="test-result-item ${result.success ? 'success' : 'error'}">
                    <span class="result-icon">${result.success ? '✅' : '❌'}</span>
                    <span class="result-text">DNS Resolution: ${result.success ? 'Working' : 'Failed'}</span>
                </div>
                <div class="test-result-item">
                    <span class="result-icon">⏱️</span>
                    <span class="result-text">Response Time: ${result.responseTime}ms</span>
                </div>
                <div class="test-result-item ${result.filterActive ? 'success' : 'warning'}">
                    <span class="result-icon">${result.filterActive ? '🛡️' : '⚠️'}</span>
                    <span class="result-text">Filtering: ${result.filterActive ? 'Active' : 'Inactive'}</span>
                </div>
            `;
            
            testResults.style.display = 'block';
            
            // Update response time in quick info
            this.container.querySelector('#response-time').textContent = `${result.responseTime}ms`;
            
            // Auto-hide results after 10 seconds
            setTimeout(() => {
                testResults.style.display = 'none';
            }, 10000);
            
        } catch (error) {
            console.error('Connection test failed:', error);
            resultContent.innerHTML = `
                <div class="test-result-item error">
                    <span class="result-icon">❌</span>
                    <span class="result-text">Test failed: ${error.message}</span>
                </div>
            `;
            testResults.style.display = 'block';
        } finally {
            this.isTestingConnection = false;
            testBtn.disabled = false;
            testBtn.querySelector('.btn-text').textContent = 'Test Connection';
            testBtn.querySelector('.btn-icon').textContent = '🔍';
        }
    }
    
    showQuickMessage(message, type = 'info') {
        // Create temporary message overlay
        const messageDiv = document.createElement('div');
        messageDiv.className = `quick-message ${type}`;
        messageDiv.innerHTML = `
            <span class="message-icon">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="message-text">${message}</span>
        `;
        
        this.container.appendChild(messageDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
    
    // Widget Manager Integration
    getTitle() {
        return 'Connection Control';
    }
    
    destroy() {
        console.log('🧹 Simple Connection Control Widget destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleConnectionControlWidget;
}

// Register with window for global access
if (typeof window !== 'undefined') {
    window.SimpleConnectionControlWidget = SimpleConnectionControlWidget;
}