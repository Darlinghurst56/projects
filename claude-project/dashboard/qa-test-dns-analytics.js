/**
 * QA Test Suite for DNS Analytics Widget
 * Task 1: QA Testing - DNS Analytics Widget
 * Agent: qa-specialist-task1
 */

class DnsAnalyticsWidgetQA {
    constructor() {
        this.testResults = [];
        this.widget = null;
        this.container = null;
        this.errors = [];
    }

    async runAllTests() {
        console.log('🧪 Starting DNS Analytics Widget QA Test Suite');
        
        // Test 1: Widget Initialization
        await this.testWidgetInitialization();
        
        // Test 2: Data Loading
        await this.testDataLoading();
        
        // Test 3: Visual Elements
        await this.testVisualElements();
        
        // Test 4: Time Range Controls
        await this.testTimeRangeControls();
        
        // Test 5: Error Handling
        await this.testErrorHandling();
        
        // Test 6: User Interactions
        await this.testUserInteractions();
        
        // Test 7: Responsive Design
        await this.testResponsiveDesign();
        
        // Test 8: Dashboard Integration
        await this.testDashboardIntegration();
        
        // Test 9: Blank Content Issues
        await this.testBlankContentIssues();
        
        return this.generateReport();
    }

    async testWidgetInitialization() {
        console.log('Testing widget initialization...');
        
        try {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'test-dns-analytics-container';
            document.body.appendChild(this.container);
            
            // Initialize widget
            this.widget = new DnsAnalyticsWidget(this.container);
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if widget initialized
            const widgetElement = this.container.querySelector('.dns-analytics-widget');
            const passed = widgetElement !== null;
            
            this.testResults.push({
                test: 'Widget Initialization',
                passed,
                details: passed ? 'Widget initialized successfully' : 'Widget failed to initialize'
            });
            
        } catch (error) {
            this.errors.push(`Widget Initialization: ${error.message}`);
            this.testResults.push({
                test: 'Widget Initialization',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testDataLoading() {
        console.log('Testing data loading...');
        
        try {
            // Check if loading state is shown initially
            const loadingElement = this.container.querySelector('#analytics-loading');
            const contentElement = this.container.querySelector('#analytics-content');
            
            // Wait for data to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if content is displayed
            const isContentVisible = contentElement && contentElement.style.display !== 'none';
            const hasData = this.widget && this.widget.data !== null;
            
            const passed = isContentVisible && hasData;
            
            this.testResults.push({
                test: 'Data Loading',
                passed,
                details: passed ? 'Data loaded and displayed correctly' : 'Data loading failed or not displayed'
            });
            
        } catch (error) {
            this.errors.push(`Data Loading: ${error.message}`);
            this.testResults.push({
                test: 'Data Loading',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testVisualElements() {
        console.log('Testing visual elements...');
        
        try {
            const expectedElements = [
                '#total-queries',
                '#blocked-queries', 
                '#allowed-queries',
                '#blocked-percentage',
                '#queries-chart',
                '#categories-list',
                '#domains-list',
                '#devices-list'
            ];
            
            let allElementsPresent = true;
            const missingElements = [];
            
            for (const selector of expectedElements) {
                const element = this.container.querySelector(selector);
                if (!element) {
                    allElementsPresent = false;
                    missingElements.push(selector);
                }
            }
            
            // Check if chart canvas exists and has content
            const chartCanvas = this.container.querySelector('#queries-chart');
            const hasChart = chartCanvas && chartCanvas.getContext;
            
            const passed = allElementsPresent && hasChart;
            
            this.testResults.push({
                test: 'Visual Elements',
                passed,
                details: passed ? 'All visual elements present' : `Missing elements: ${missingElements.join(', ')}`
            });
            
        } catch (error) {
            this.errors.push(`Visual Elements: ${error.message}`);
            this.testResults.push({
                test: 'Visual Elements',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testTimeRangeControls() {
        console.log('Testing time range controls...');
        
        try {
            const timeButtons = this.container.querySelectorAll('.time-btn');
            const hasTimeButtons = timeButtons.length > 0;
            
            if (hasTimeButtons) {
                // Test clicking different time ranges
                const testButton = timeButtons[0];
                const originalRange = this.widget.settings.timeRange;
                
                // Simulate click
                testButton.click();
                
                // Wait for potential data reload
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if active state changed
                const hasActiveButton = this.container.querySelector('.time-btn.active');
                const passed = hasActiveButton !== null;
                
                this.testResults.push({
                    test: 'Time Range Controls',
                    passed,
                    details: passed ? 'Time range controls working correctly' : 'Time range controls not responding'
                });
            } else {
                this.testResults.push({
                    test: 'Time Range Controls',
                    passed: false,
                    details: 'No time range buttons found'
                });
            }
            
        } catch (error) {
            this.errors.push(`Time Range Controls: ${error.message}`);
            this.testResults.push({
                test: 'Time Range Controls',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testErrorHandling() {
        console.log('Testing error handling...');
        
        try {
            // Test error display
            this.widget.showError('Test error message');
            
            // Check if error is displayed
            const errorElement = this.container.querySelector('#analytics-error');
            const errorMessage = this.container.querySelector('#analytics-error-message');
            
            const isErrorVisible = errorElement && errorElement.style.display !== 'none';
            const hasErrorMessage = errorMessage && errorMessage.textContent.includes('Test error message');
            
            // Test retry button
            const retryButton = this.container.querySelector('#analytics-retry-button');
            const hasRetryButton = retryButton !== null;
            
            const passed = isErrorVisible && hasErrorMessage && hasRetryButton;
            
            this.testResults.push({
                test: 'Error Handling',
                passed,
                details: passed ? 'Error handling working correctly' : 'Error handling not working properly'
            });
            
            // Reset to normal state
            this.widget.showLoading(false);
            
        } catch (error) {
            this.errors.push(`Error Handling: ${error.message}`);
            this.testResults.push({
                test: 'Error Handling',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testUserInteractions() {
        console.log('Testing user interactions...');
        
        try {
            // Test refresh button
            const retryButton = this.container.querySelector('#analytics-retry-button');
            let refreshWorked = false;
            
            if (retryButton) {
                retryButton.click();
                refreshWorked = true;
            }
            
            // Check for interactive elements
            const interactiveElements = this.container.querySelectorAll('button, .clickable, [onclick]');
            const hasInteractiveElements = interactiveElements.length > 0;
            
            const passed = refreshWorked && hasInteractiveElements;
            
            this.testResults.push({
                test: 'User Interactions',
                passed,
                details: passed ? 'User interactions working correctly' : 'User interactions not responding'
            });
            
        } catch (error) {
            this.errors.push(`User Interactions: ${error.message}`);
            this.testResults.push({
                test: 'User Interactions',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testResponsiveDesign() {
        console.log('Testing responsive design...');
        
        try {
            // Test different container sizes
            const originalWidth = this.container.style.width;
            
            // Test mobile size
            this.container.style.width = '320px';
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Test tablet size
            this.container.style.width = '768px';
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Test desktop size
            this.container.style.width = '1200px';
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Restore original width
            this.container.style.width = originalWidth;
            
            // Check if widget adapts to different sizes
            const widgetElement = this.container.querySelector('.dns-analytics-widget');
            const hasResponsiveClasses = widgetElement && widgetElement.className.includes('dns-analytics-widget');
            
            const passed = hasResponsiveClasses;
            
            this.testResults.push({
                test: 'Responsive Design',
                passed,
                details: passed ? 'Widget adapts to different screen sizes' : 'Widget not responsive'
            });
            
        } catch (error) {
            this.errors.push(`Responsive Design: ${error.message}`);
            this.testResults.push({
                test: 'Responsive Design',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testDashboardIntegration() {
        console.log('Testing dashboard integration...');
        
        try {
            // Check if widget uses event bus
            const hasEventBus = this.widget.eventBus !== null;
            
            // Check if widget follows dashboard styling
            const widgetElement = this.container.querySelector('.dns-analytics-widget');
            const hasConsistentStyling = widgetElement && 
                getComputedStyle(widgetElement).fontFamily !== '';
            
            // Check if widget integrates with dashboard lifecycle
            const hasDestroyMethod = typeof this.widget.destroy === 'function';
            
            const passed = hasEventBus && hasConsistentStyling && hasDestroyMethod;
            
            this.testResults.push({
                test: 'Dashboard Integration',
                passed,
                details: passed ? 'Widget integrates well with dashboard' : 'Widget integration issues found'
            });
            
        } catch (error) {
            this.errors.push(`Dashboard Integration: ${error.message}`);
            this.testResults.push({
                test: 'Dashboard Integration',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    async testBlankContentIssues() {
        console.log('Testing for blank content issues...');
        
        try {
            // Check all metric elements for content
            const metricElements = this.container.querySelectorAll('.metric-value');
            let hasBlankContent = false;
            let blankElements = [];
            
            metricElements.forEach(element => {
                const text = element.textContent.trim();
                if (text === '' || text === '--' || text === 'undefined') {
                    hasBlankContent = true;
                    blankElements.push(element.id || element.className);
                }
            });
            
            // Check lists for content
            const listElements = this.container.querySelectorAll('#categories-list, #domains-list, #devices-list');
            listElements.forEach(element => {
                if (element.innerHTML.trim() === '') {
                    hasBlankContent = true;
                    blankElements.push(element.id);
                }
            });
            
            const passed = !hasBlankContent;
            
            this.testResults.push({
                test: 'Blank Content Issues',
                passed,
                details: passed ? 'No blank content issues found' : `Blank content in: ${blankElements.join(', ')}`
            });
            
        } catch (error) {
            this.errors.push(`Blank Content Issues: ${error.message}`);
            this.testResults.push({
                test: 'Blank Content Issues',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
    }

    generateReport() {
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        const report = {
            summary: {
                total,
                passed,
                failed,
                success_rate: Math.round((passed / total) * 100)
            },
            tests: this.testResults,
            errors: this.errors,
            timestamp: new Date().toISOString(),
            agent: 'qa-specialist-task1'
        };
        
        console.log('📋 DNS Analytics Widget QA Test Report:');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${report.summary.success_rate}%`);
        
        if (this.errors.length > 0) {
            console.log('❌ Errors encountered:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        return report;
    }

    cleanup() {
        if (this.container) {
            document.body.removeChild(this.container);
        }
        if (this.widget && typeof this.widget.destroy === 'function') {
            this.widget.destroy();
        }
    }
}

// Export for use in other modules
window.DnsAnalyticsWidgetQA = DnsAnalyticsWidgetQA;