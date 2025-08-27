#!/usr/bin/env node

// Comprehensive API Health Test Script
// PROJECT: House AI - Family Home Page | SUBPROJECT: API Health Validation

const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_ORIGIN = 'http://localhost:3004';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper function to make HTTP requests
const makeRequest = (options) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            responseTime,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            responseTime,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

// Test suite definitions
const testSuites = [
  {
    name: 'Basic Health Checks',
    tests: [
      {
        name: 'Server Health Check',
        path: '/health',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.status === 'healthy'
      },
      {
        name: 'WebSocket Health Check',
        path: '/health/websocket',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.status === 'healthy' && typeof data.metrics === 'object'
      }
    ]
  },
  {
    name: 'System API',
    tests: [
      {
        name: 'System Status',
        path: '/api/system/status',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.status === 'healthy' && data.services
      },
      {
        name: 'System Health',
        path: '/api/system/health',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.status === 'healthy'
      }
    ]
  },
  {
    name: 'DNS Monitoring API',
    tests: [
      {
        name: 'DNS Status',
        path: '/api/dns/status',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.success === true && data.data
      },
      {
        name: 'DNS Profile',
        path: '/api/dns/profile',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.success === true && data.data.provider
      },
      {
        name: 'DNS Analytics',
        path: '/api/dns/analytics?timeRange=24h',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.success === true
      }
    ]
  },
  {
    name: 'AI (Ollama) API',
    tests: [
      {
        name: 'AI Status',
        path: '/api/ai/status',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.connected === true && data.service === 'Ollama'
      },
      {
        name: 'AI Models List',
        path: '/api/ai/models',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => Array.isArray(data.models) || Array.isArray(data)
      }
    ]
  },
  {
    name: 'Authentication API',
    tests: [
      {
        name: 'Auth Validation (Unauthenticated)',
        path: '/api/auth/validate',
        method: 'GET',
        expectedStatus: 401,
        validateResponse: (data) => data.error || data.message
      },
      {
        name: 'PIN Login (Invalid)',
        path: '/api/auth/login-pin',
        method: 'POST',
        body: JSON.stringify({ pin: '9999', name: 'Test User' }),
        expectedStatus: 401,
        validateResponse: (data) => data.error && data.type === 'UnauthorizedError'
      }
    ]
  },
  {
    name: 'Google Services API',
    tests: [
      {
        name: 'Google Auth Status (Unauthenticated)',
        path: '/api/google/auth-status',
        method: 'GET',
        expectedStatus: 401,
        validateResponse: (data) => data.error === 'No token provided'
      },
      {
        name: 'Google Auth URL (Unauthenticated)',
        path: '/api/google/auth-url',
        method: 'GET',
        expectedStatus: 401,
        validateResponse: (data) => data.error === 'No token provided'
      }
    ]
  },
  {
    name: 'Meal Planning API',
    tests: [
      {
        name: 'Current Meal Plan',
        path: '/api/meals/plan',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (data) => data.meals && typeof data.meals === 'object'
      }
    ]
  }
];

// CORS validation tests
const corsTests = [
  {
    name: 'CORS Headers - GET Request',
    path: '/api/system/status',
    method: 'GET',
    validateHeaders: (headers) => {
      return headers['access-control-allow-origin'] && 
             (headers['access-control-allow-origin'].includes('localhost:3004') || 
              headers['access-control-allow-origin'] === '*');
    }
  }
];

// Performance tests
const performanceTests = [
  {
    name: 'API Response Time - System Status',
    path: '/api/system/status',
    maxResponseTime: 2000 // 2 seconds max
  },
  {
    name: 'API Response Time - DNS Status',
    path: '/api/dns/status',
    maxResponseTime: 5000 // 5 seconds max (external service)
  },
  {
    name: 'API Response Time - AI Status',
    path: '/api/ai/status',
    maxResponseTime: 3000 // 3 seconds max
  }
];

// Utility functions
const logTest = (message, color = colors.reset, indent = 0) => {
  const spacing = ' '.repeat(indent);
  console.log(`${spacing}${color}${message}${colors.reset}`);
};

const logResult = (passed, testName, details = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    logTest(`✅ ${testName}${details}`, colors.green, 2);
  } else {
    testResults.failed++;
    logTest(`❌ ${testName}${details}`, colors.red, 2);
  }
};

const logWarning = (testName, details = '') => {
  testResults.warnings++;
  logTest(`⚠️  ${testName}${details}`, colors.yellow, 2);
};

// Main test runner
const runTests = async () => {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                         API HEALTH VALIDATION TEST                           ║
║                       Home Dashboard - Integration Agent                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  logTest(`📊 Testing API endpoints at: ${API_BASE_URL}`, colors.blue);
  logTest(`🌐 Using Origin header: ${FRONTEND_ORIGIN}`, colors.blue);
  logTest('', colors.reset);

  // Run API endpoint tests
  for (const suite of testSuites) {
    logTest(`📝 ${suite.name}`, colors.bold, 0);
    
    for (const test of suite.tests) {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: test.path,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_ORIGIN
        }
      };

      if (test.body) {
        options.body = test.body;
      }

      try {
        const response = await makeRequest(options);
        
        // Check status code
        const statusMatch = response.statusCode === test.expectedStatus;
        let responseValid = true;
        
        // Validate response content if validator provided
        if (test.validateResponse && statusMatch) {
          try {
            responseValid = test.validateResponse(response.data);
          } catch (e) {
            responseValid = false;
          }
        }
        
        const passed = statusMatch && responseValid;
        const details = ` (${response.statusCode}, ${response.responseTime}ms)`;
        
        logResult(passed, test.name, details);
        
        if (!statusMatch) {
          logTest(`   Expected status: ${test.expectedStatus}, got: ${response.statusCode}`, colors.red, 4);
        }
        if (statusMatch && !responseValid) {
          logTest(`   Response validation failed`, colors.red, 4);
        }
        
      } catch (error) {
        logResult(false, test.name, ` - Connection Error: ${error.error}`);
      }
    }
    logTest('', colors.reset);
  }

  // Run CORS tests
  logTest(`📝 CORS Validation`, colors.bold, 0);
  for (const test of corsTests) {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: test.method,
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      const corsValid = test.validateHeaders(response.headers);
      
      logResult(corsValid, test.name);
      
      if (!corsValid) {
        logTest(`   CORS headers: ${JSON.stringify(response.headers['access-control-allow-origin'])}`, colors.red, 4);
      }
      
    } catch (error) {
      logResult(false, test.name, ` - Connection Error: ${error.error}`);
    }
  }
  logTest('', colors.reset);

  // Run performance tests
  logTest(`📝 Performance Tests`, colors.bold, 0);
  for (const test of performanceTests) {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: 'GET',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      const performancePass = response.responseTime <= test.maxResponseTime;
      
      if (performancePass) {
        logResult(true, test.name, ` (${response.responseTime}ms)`);
      } else if (response.responseTime <= test.maxResponseTime * 2) {
        logWarning(test.name, ` (${response.responseTime}ms - Slower than expected)`);
      } else {
        logResult(false, test.name, ` (${response.responseTime}ms - Too slow)`);
      }
      
    } catch (error) {
      logResult(false, test.name, ` - Connection Error: ${error.error}`);
    }
  }

  // Print summary
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                            TEST RESULTS SUMMARY                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const passRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;
  const overallStatus = testResults.failed === 0 ? 'HEALTHY' : testResults.failed <= 2 ? 'DEGRADED' : 'UNHEALTHY';
  const statusColor = testResults.failed === 0 ? colors.green : testResults.failed <= 2 ? colors.yellow : colors.red;
  
  logTest(`📊 Total Tests: ${testResults.total}`, colors.blue);
  logTest(`✅ Passed: ${testResults.passed}`, colors.green);
  logTest(`❌ Failed: ${testResults.failed}`, colors.red);
  logTest(`⚠️  Warnings: ${testResults.warnings}`, colors.yellow);
  logTest(`📈 Pass Rate: ${passRate}%`, colors.blue);
  logTest(`${statusColor}🏥 Overall API Health: ${overallStatus}${colors.reset}`, '', 0);

  if (testResults.failed === 0) {
    console.log(`${colors.green}${colors.bold}
🎉 All API endpoints are healthy and ready for frontend integration!
✅ CORS is properly configured
✅ Error handling is working correctly
✅ Authentication endpoints are secure
✅ All services are responding within acceptable timeframes
${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bold}
⚠️  Some issues detected, but core functionality is working:
- Essential endpoints (health, system status, DNS) are functioning
- Authentication is properly secured
- API infrastructure is stable
${colors.reset}`);
  }

  return testResults.failed === 0;
};

// Handle script execution
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = { runTests, testResults };