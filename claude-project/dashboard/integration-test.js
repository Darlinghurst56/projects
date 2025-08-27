/**
 * Integration Test for DNS Widgets in Dashboard
 * Tests widget loading, initialization, and functionality
 */

// Test configuration
const TEST_CONFIG = {
    timeout: 10000,
    expectedWidgets: ['dns-info', 'dns-status', 'dns-profile'],
    testUrl: 'dashboard.html'
};

class DashboardIntegrationTest {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        this.results.push({ timestamp, type, message });
    }

    async test(description, testFn) {
        try {
            this.log(`Testing: ${description}`, 'test');
            await testFn();
            this.log(`✅ PASS: ${description}`, 'pass');
            this.passed++;
        } catch (error) {
            this.log(`❌ FAIL: ${description} - ${error.message}`, 'fail');
            this.failed++;
        }
    }

    async runTests() {
        this.log('🚀 Starting Dashboard Integration Tests');

        // Test 1: Widget Manager Initialization
        await this.test('WidgetManager class is available', async () => {
            if (typeof WidgetManager === 'undefined') {
                throw new Error('WidgetManager class not found');
            }
        });

        // Test 2: DNS Widget Classes Available
        await this.test('DNS Status Widget class is available', async () => {
            if (typeof DnsStatusWidget === 'undefined') {
                throw new Error('DnsStatusWidget class not found');
            }
        });

        await this.test('DNS Profile Widget class is available', async () => {
            if (typeof DnsProfileWidget === 'undefined') {
                throw new Error('DnsProfileWidget class not found');
            }
        });

        // Test 3: EventBus Availability
        await this.test('EventBus class is available', async () => {
            if (typeof EventBus === 'undefined') {
                throw new Error('EventBus class not found');
            }
        });

        // Test 4: Widget Manager Instantiation
        let widgetManager;
        await this.test('WidgetManager can be instantiated', async () => {
            widgetManager = new WidgetManager();
            if (!widgetManager) {
                throw new Error('Failed to create WidgetManager instance');
            }
        });

        // Test 5: Widget Registration
        await this.test('DNS widgets are registered in WidgetManager', async () => {
            // Create a test container
            const testContainer = document.createElement('div');
            testContainer.id = 'test-widget-grid';
            document.body.appendChild(testContainer);
            
            // Initialize WidgetManager
            widgetManager.container = testContainer;
            widgetManager.registerDnsWidgets();
            
            const registeredWidgets = Array.from(widgetManager.widgets.keys());
            for (const expectedWidget of TEST_CONFIG.expectedWidgets) {
                if (!registeredWidgets.includes(expectedWidget)) {
                    throw new Error(`Widget ${expectedWidget} not registered`);
                }
            }
        });

        // Test 6: Widget Creation
        await this.test('DNS widgets can be created and initialized', async () => {
            for (const widgetName of ['dns-status', 'dns-profile']) {
                try {
                    const widget = widgetManager.addWidget(widgetName);
                    if (!widget || !widget.isInitialized) {
                        throw new Error(`Widget ${widgetName} failed to initialize`);
                    }
                } catch (error) {
                    throw new Error(`Failed to create ${widgetName}: ${error.message}`);
                }
            }
        });

        // Test 7: DOM Structure Validation
        await this.test('Widget DOM structures are correct', async () => {
            const widgets = document.querySelectorAll('.widget');
            if (widgets.length === 0) {
                throw new Error('No widgets found in DOM');
            }

            widgets.forEach((widget, index) => {
                const header = widget.querySelector('.widget-header');
                const content = widget.querySelector('.widget-content');
                
                if (!header) {
                    throw new Error(`Widget ${index} missing header`);
                }
                if (!content) {
                    throw new Error(`Widget ${index} missing content`);
                }
            });
        });

        // Test 8: CSS Classes Application
        await this.test('Widget CSS classes are properly applied', async () => {
            const statusWidget = document.querySelector('.widget-dns-status');
            const profileWidget = document.querySelector('.widget-dns-profile');
            
            if (!statusWidget) {
                throw new Error('DNS Status widget CSS class not applied');
            }
            if (!profileWidget) {
                throw new Error('DNS Profile widget CSS class not applied');
            }
        });

        // Test 9: Refresh Functionality
        await this.test('Widget refresh functionality works', async () => {
            const widgets = document.querySelectorAll('.widget');
            
            for (const widget of widgets) {
                const refreshBtn = widget.querySelector('.widget-refresh');
                if (!refreshBtn) {
                    throw new Error('Refresh button not found');
                }
                
                // Simulate click
                refreshBtn.click();
                
                // Check for loading state
                if (!widget.classList.contains('widget-loading')) {
                    // Some widgets might load too fast to catch loading state
                    this.log('⚠️ Widget loading state not detected (might be too fast)', 'warn');
                }
            }
        });

        // Test 10: Settings Modal Integration
        await this.test('Settings functionality is accessible', async () => {
            const widgets = document.querySelectorAll('.widget');
            
            for (const widget of widgets) {
                const settingsBtn = widget.querySelector('.widget-settings');
                if (!settingsBtn) {
                    throw new Error('Settings button not found');
                }
            }
        });

        // Generate test report
        this.generateReport();
    }

    generateReport() {
        this.log('📊 Test Results Summary');
        this.log(`Total Tests: ${this.passed + this.failed}`);
        this.log(`Passed: ${this.passed}`, 'pass');
        this.log(`Failed: ${this.failed}`, this.failed > 0 ? 'fail' : 'info');
        
        const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
        this.log(`Success Rate: ${successRate}%`);

        if (this.failed === 0) {
            this.log('🎉 All integration tests passed!', 'pass');
        } else {
            this.log('⚠️ Some tests failed. Check implementation.', 'fail');
        }

        // Save results to console for debugging
        console.table(this.results);
    }
}

// Auto-run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for all scripts to load
    setTimeout(async () => {
        const tester = new DashboardIntegrationTest();
        await tester.runTests();
    }, 2000);
});

// Export for manual testing
window.DashboardIntegrationTest = DashboardIntegrationTest;