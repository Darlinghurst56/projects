#!/usr/bin/env node

/**
 * Google Integration Test Script
 * 
 * Tests the complete Google OAuth flow and API integration
 * for the Home Dashboard project.
 * 
 * Usage:
 *   node scripts/test-google-integration.js
 * 
 * Prerequisites:
 *   - Home Dashboard server running on localhost:3000
 *   - Real Google OAuth credentials configured in .env
 *   - Test user authenticated (PIN or Google)
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE = 'http://localhost:3000/api';
const CLIENT_URL = 'http://localhost:3003';

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function waitForInput(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

class GoogleIntegrationTester {
  constructor() {
    this.token = null;
    this.user = null;
  }

  async run() {
    log('🧪 Google Integration Test Suite', 'bold');
    log('=====================================', 'blue');
    console.log();

    try {
      // Step 1: Check server health
      await this.checkServerHealth();
      
      // Step 2: Authenticate
      await this.authenticate();
      
      // Step 3: Test Google services
      await this.testGoogleServices();
      
      log('✅ All tests completed successfully!', 'green');
    } catch (error) {
      log(`❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async checkServerHealth() {
    log('📊 Checking server health...', 'blue');
    
    try {
      const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
      log(`✅ Server is healthy: ${response.data.status}`, 'green');
    } catch (error) {
      throw new Error(`Server health check failed: ${error.message}`);
    }
  }

  async authenticate() {
    log('🔐 Setting up authentication...', 'blue');
    
    const method = await waitForInput('Choose authentication method (pin/google): ');
    
    if (method.toLowerCase() === 'pin') {
      await this.authenticateWithPin();
    } else if (method.toLowerCase() === 'google') {
      log('⚠️ Google authentication requires manual browser interaction', 'yellow');
      log('Please complete the OAuth flow manually and provide the JWT token', 'yellow');
      this.token = await waitForInput('Enter JWT token: ');
    } else {
      throw new Error('Invalid authentication method');
    }
  }

  async authenticateWithPin() {
    const pin = await waitForInput('Enter PIN (default 123456): ') || '123456';
    const name = await waitForInput('Enter name (default Test User): ') || 'Test User';
    
    try {
      const response = await axios.post(`${API_BASE}/auth/login-pin`, {
        pin: pin,
        name: name
      });
      
      this.token = response.data.token;
      this.user = response.data.user;
      
      log(`✅ PIN authentication successful for: ${this.user.name}`, 'green');
      log(`   Has Google tokens: ${response.data.hasGoogleTokens}`, 'blue');
    } catch (error) {
      throw new Error(`PIN authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async testGoogleServices() {
    log('🔍 Testing Google integration...', 'blue');
    
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${this.token}` };

    // Test auth status
    await this.testAuthStatus(headers);
    
    // Test auth URL generation
    await this.testAuthUrl(headers);
    
    // Test Google APIs (Calendar, Gmail, Drive)
    await this.testGoogleApis(headers);
  }

  async testAuthStatus(headers) {
    log('  📋 Testing auth status...', 'blue');
    
    try {
      const response = await axios.get(`${API_BASE}/google/auth/status`, { headers });
      
      log(`    ✅ Auth status retrieved`, 'green');
      log(`       Authenticated: ${response.data.authenticated}`, 'blue');
      log(`       Method: ${response.data.method}`, 'blue');
      log(`       Services available:`, 'blue');
      log(`         Calendar: ${response.data.services.calendar}`, 'blue');
      log(`         Gmail: ${response.data.services.gmail}`, 'blue');
      log(`         Drive: ${response.data.services.drive}`, 'blue');
    } catch (error) {
      log(`    ❌ Auth status failed: ${error.response?.data?.error || error.message}`, 'red');
    }
  }

  async testAuthUrl(headers) {
    log('  🔗 Testing auth URL generation...', 'blue');
    
    try {
      const response = await axios.get(`${API_BASE}/google/auth-url`, { headers });
      
      log(`    ✅ Auth URL generated successfully`, 'green');
      
      const authUrl = response.data.authUrl;
      
      // Check if using real credentials
      if (authUrl.includes('your-google-client-id-here')) {
        log(`    ⚠️ Using placeholder credentials - configure real Google OAuth credentials`, 'yellow');
        log(`    💡 See GOOGLE_OAUTH_SETUP.md for setup instructions`, 'yellow');
      } else {
        log(`    ✅ Real Google OAuth credentials detected`, 'green');
        log(`    🌐 OAuth URL: ${authUrl.substring(0, 100)}...`, 'blue');
      }
    } catch (error) {
      log(`    ❌ Auth URL generation failed: ${error.response?.data?.error || error.message}`, 'red');
    }
  }

  async testGoogleApis(headers) {
    log('  📊 Testing Google API endpoints...', 'blue');
    
    const apis = [
      { name: 'Calendar Events', endpoint: '/google/calendar/events' },
      { name: 'Gmail Messages', endpoint: '/google/gmail/messages' },
      { name: 'Drive Files', endpoint: '/google/drive/files' }
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(`${API_BASE}${api.endpoint}`, { headers });
        
        if (response.data.fallback) {
          log(`    ⚡ ${api.name}: Circuit breaker fallback active`, 'yellow');
        } else {
          log(`    ✅ ${api.name}: API accessible`, 'green');
        }
      } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        if (status === 401) {
          log(`    ⚠️ ${api.name}: Authentication required (${errorData?.error})`, 'yellow');
        } else if (status === 403) {
          log(`    ⚠️ ${api.name}: Google tokens required (${errorData?.error})`, 'yellow');
        } else if (errorData?.fallback) {
          log(`    ⚡ ${api.name}: Circuit breaker fallback (${errorData?.error})`, 'yellow');
        } else {
          log(`    ❌ ${api.name}: Failed (${errorData?.error || error.message})`, 'red');
        }
      }
    }
  }
}

// Check if we're being run directly
if (require.main === module) {
  const tester = new GoogleIntegrationTester();
  tester.run().catch(error => {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = GoogleIntegrationTester;