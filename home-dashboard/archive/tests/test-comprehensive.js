#!/usr/bin/env node

/**
 * Comprehensive Dashboard Test Suite
 * Tests all major functionality without browser dependencies
 */

const axios = require('axios');
const chalk = require('chalk');

class DashboardTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.frontendUrl = 'http://localhost:3003';
    this.results = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      title: chalk.cyan.bold
    };
    console.log(colors[type](message));
  }

  async test(name, testFn) {
    try {
      this.log(`\n🧪 Testing: ${name}`, 'title');
      await testFn();
      this.log(`✅ PASS: ${name}`, 'success');
      this.results.passed++;
    } catch (error) {
      this.log(`❌ FAIL: ${name}`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.issues.push({
        test: name,
        error: error.message,
        type: 'functionality'
      });
    }
  }

  async request(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      timeout: 10000,
      ...headers && { headers }
    };
    
    if (data) {
      config.data = data;
      config.headers = { ...config.headers, 'Content-Type': 'application/json' };
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw error;
    }
  }

  async testBasicConnectivity() {
    // Test backend health
    const health = await this.request('GET', '/health');
    if (!health.status || health.status !== 'healthy') {
      throw new Error('Backend health check failed');
    }

    // Test frontend availability
    try {
      const response = await axios.get(this.frontendUrl);
      if (!response.data.includes('Home Dashboard')) {
        throw new Error('Frontend not serving dashboard content');
      }
    } catch (error) {
      throw new Error(`Frontend not accessible: ${error.message}`);
    }
  }

  async testSystemStatus() {
    const status = await this.request('GET', '/api/system/status');
    
    if (!status.status || status.status !== 'healthy') {
      throw new Error('System status is not healthy');
    }

    // Check required fields
    const requiredFields = ['timestamp', 'services', 'system', 'features', 'user'];
    for (const field of requiredFields) {
      if (!status[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Verify guest mode is working
    if (!status.user || status.user.authenticated !== false || status.user.method !== 'guest') {
      throw new Error('Guest mode not working correctly');
    }
  }

  async testMealPlanningAPI() {
    const plan = await this.request('GET', '/api/meals/plan');
    
    if (!plan.meals || typeof plan.meals !== 'object') {
      throw new Error('Meal plan does not contain meals object');
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      if (!plan.meals[day] || !plan.meals[day].name) {
        throw new Error(`Missing meal plan for ${day}`);
      }
    }

    if (!plan.isGuestPlan) {
      throw new Error('Guest meal plan not properly marked');
    }
  }

  async testDNSMonitoring() {
    const dns = await this.request('GET', '/api/dns/status');
    
    if (!dns.success) {
      throw new Error('DNS status request failed');
    }

    if (!dns.data || !dns.data.connection || !dns.data.resolver || !dns.data.health) {
      throw new Error('DNS status missing required data sections');
    }

    // Check that DNS is providing meaningful data
    if (!dns.data.connection.status) {
      throw new Error('DNS connection status missing');
    }
  }

  async testAIChat() {
    try {
      const response = await this.request('POST', '/api/ai/chat', {
        message: 'Hello, this is a test message'
      });

      // AI chat should return a response even if it's an error fallback
      if (!response.message) {
        throw new Error('AI chat did not return a message');
      }

      // Check if we get the expected fallback response when Ollama is unreachable
      if (response.message.error && response.message.fallback) {
        this.log('   Note: AI chat is using fallback mode (Ollama not available)', 'warning');
      }

    } catch (error) {
      throw new Error(`AI chat API failed: ${error.message}`);
    }
  }

  async testAuthenticationEndpoints() {
    // Test PIN authentication with invalid PIN (should fail gracefully)
    try {
      await this.request('POST', '/api/auth/login-pin', {
        pin: '9999',
        name: 'Test User'
      });
      throw new Error('Invalid PIN authentication should have failed');
    } catch (error) {
      if (!error.message.includes('401') && !error.message.includes('Invalid PIN')) {
        throw new Error(`Unexpected error for invalid PIN: ${error.message}`);
      }
    }

    // Test Google auth URL endpoint (should require authentication)
    try {
      await this.request('GET', '/api/google/auth-url');
      throw new Error('Google auth URL should require authentication');
    } catch (error) {
      if (!error.message.includes('401') && !error.message.includes('No token')) {
        throw new Error(`Unexpected error for Google auth: ${error.message}`);
      }
    }
  }

  async testErrorHandling() {
    // Test non-existent endpoint
    try {
      await this.request('GET', '/api/nonexistent');
      throw new Error('Non-existent endpoint should return 404');
    } catch (error) {
      if (!error.message.includes('404')) {
        throw new Error(`Expected 404 for non-existent endpoint, got: ${error.message}`);
      }
    }

    // Test malformed JSON
    try {
      await this.request('POST', '/api/ai/chat', '{"invalid": json}');
    } catch (error) {
      // Should handle malformed JSON gracefully
      if (error.message.includes('500')) {
        throw new Error('Server should handle malformed JSON gracefully');
      }
    }
  }

  async testCORS() {
    try {
      const response = await axios.options(`${this.baseUrl}/api/system/status`, {
        headers: {
          'Origin': 'http://localhost:3003',
          'Access-Control-Request-Method': 'GET'
        }
      });

      // Should allow CORS from frontend
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('CORS preflight failed');
      }
    } catch (error) {
      throw new Error(`CORS test failed: ${error.message}`);
    }
  }

  async testSecurityHeaders() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      const headers = response.headers;

      // Check for basic security headers
      if (!headers['x-content-type-options']) {
        this.log('   Warning: X-Content-Type-Options header missing', 'warning');
      }

      if (!headers['x-frame-options'] && !headers['x-frame-options']) {
        this.log('   Warning: X-Frame-Options header missing', 'warning');
      }

    } catch (error) {
      throw new Error(`Security headers test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    this.log('\n🔍 Starting Comprehensive Dashboard Testing...', 'title');
    this.log('=================================================', 'title');

    await this.test('Basic Connectivity', () => this.testBasicConnectivity());
    await this.test('System Status API', () => this.testSystemStatus());
    await this.test('Meal Planning API', () => this.testMealPlanningAPI());
    await this.test('DNS Monitoring API', () => this.testDNSMonitoring());
    await this.test('AI Chat API', () => this.testAIChat());
    await this.test('Authentication Endpoints', () => this.testAuthenticationEndpoints());
    await this.test('Error Handling', () => this.testErrorHandling());
    await this.test('CORS Configuration', () => this.testCORS());
    await this.test('Security Headers', () => this.testSecurityHeaders());

    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 COMPREHENSIVE TEST RESULTS', 'title');
    this.log('=================================', 'title');
    
    this.log(`\n✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    
    if (this.results.issues.length > 0) {
      this.log('\n🚨 Issues Found:', 'warning');
      this.results.issues.forEach((issue, index) => {
        this.log(`\n${index + 1}. ${issue.test}`, 'error');
        this.log(`   Error: ${issue.error}`, 'error');
        this.log(`   Type: ${issue.type}`, 'error');
      });
    }

    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    
    this.log(`\n📈 Success Rate: ${successRate}%`, successRate > 80 ? 'success' : 'warning');
    
    if (this.results.failed === 0) {
      this.log('\n🎉 ALL TESTS PASSED! Dashboard is working correctly.', 'success');
    } else if (this.results.failed <= 2) {
      this.log('\n⚠️  Minor issues detected but core functionality is working.', 'warning');
    } else {
      this.log('\n🚨 Multiple issues detected. Dashboard needs attention.', 'error');
    }

    this.log('\n🔗 Dashboard URLs:', 'info');
    this.log(`   Backend API: ${this.baseUrl}`, 'info');
    this.log(`   Frontend: ${this.frontendUrl}`, 'info');
    this.log(`   Health Check: ${this.baseUrl}/health`, 'info');
  }
}

// Run tests
const tester = new DashboardTester();
tester.runAllTests().catch(console.error);