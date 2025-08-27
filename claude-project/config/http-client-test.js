/**
 * HTTP Client Test Suite
 * Tests for HTTP client functionality with various endpoints
 */

import { HttpClient } from './http-client.js';

/**
 * Test suite for HTTP client functionality
 */
class HttpClientTest {
  constructor() {
    this.client = new HttpClient();
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  /**
   * Assert helper function
   */
  assert(condition, message) {
    if (condition) {
      this.passed++;
      this.results.push({ status: 'PASS', message });
      console.log(`✅ PASS: ${message}`);
    } else {
      this.failed++;
      this.results.push({ status: 'FAIL', message });
      console.log(`❌ FAIL: ${message}`);
    }
  }

  /**
   * Test basic HTTP GET request
   */
  async testBasicGet() {
    console.log('\n🧪 Testing basic HTTP GET request...');
    try {
      const result = await this.client.fetch('https://httpbin.org/get');
      this.assert(typeof result === 'object', 'GET request returns object');
      this.assert(result.url === 'https://httpbin.org/get', 'GET request returns correct URL');
      this.assert(result.headers, 'GET request includes headers');
    } catch (error) {
      this.assert(false, `GET request failed: ${error.message}`);
    }
  }

  /**
   * Test HTTP POST request
   */
  async testPost() {
    console.log('\n🧪 Testing HTTP POST request...');
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      const result = await this.client.fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      this.assert(typeof result === 'object', 'POST request returns object');
      this.assert(result.url === 'https://httpbin.org/post', 'POST request returns correct URL');
      this.assert(result.json, 'POST request includes posted data');
      this.assert(result.json.test === 'data', 'POST data is correctly sent');
    } catch (error) {
      this.assert(false, `POST request failed: ${error.message}`);
    }
  }

  /**
   * Test caching functionality
   */
  async testCaching() {
    console.log('\n🧪 Testing caching functionality...');
    try {
      // Clear cache first
      this.client.clearCache();
      
      const url = 'https://httpbin.org/delay/1';
      
      // First request (should hit the network)
      const start1 = Date.now();
      const result1 = await this.client.fetch(url);
      const time1 = Date.now() - start1;
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const result2 = await this.client.fetch(url);
      const time2 = Date.now() - start2;
      
      this.assert(time2 < time1, `Cache request faster than network (${time2}ms < ${time1}ms)`);
      this.assert(JSON.stringify(result1) === JSON.stringify(result2), 'Cached result matches original');
      
      const cacheStats = this.client.getCacheStats();
      this.assert(cacheStats.size > 0, 'Cache contains entries');
    } catch (error) {
      this.assert(false, `Caching test failed: ${error.message}`);
    }
  }

  /**
   * Test error handling with invalid URL
   */
  async testErrorHandling() {
    console.log('\n🧪 Testing error handling...');
    try {
      await this.client.fetch('https://httpbin.org/status/404');
      this.assert(false, 'Should have thrown error for 404');
    } catch (error) {
      this.assert(error.status === 404, `Correctly handles 404 error: ${error.status}`);
    }

    try {
      await this.client.fetch('https://httpbin.org/status/500');
      this.assert(false, 'Should have thrown error for 500');
    } catch (error) {
      this.assert(error.status === 500, `Correctly handles 500 error: ${error.status}`);
    }
  }

  /**
   * Test timeout functionality
   */
  async testTimeout() {
    console.log('\n🧪 Testing timeout functionality...');
    try {
      const shortTimeout = new HttpClient();
      await shortTimeout.fetch('https://httpbin.org/delay/5', { timeout: 1000 });
      this.assert(false, 'Should have timed out');
    } catch (error) {
      this.assert(error.name === 'AbortError' || error.message.includes('timeout'), 
                 `Request correctly timed out: ${error.message}`);
    }
  }

  /**
   * Test API client functionality
   */
  async testApiClient() {
    console.log('\n🧪 Testing API client functionality...');
    try {
      // Test JSONPlaceholder API (no auth required)
      const posts = await this.client.apiRequest('jsonPlaceholder', '/posts/1');
      this.assert(typeof posts === 'object', 'API client returns object');
      this.assert(posts.id === 1, 'API client returns correct data');
      this.assert(posts.title, 'API client returns post title');
    } catch (error) {
      this.assert(false, `API client test failed: ${error.message}`);
    }
  }

  /**
   * Test URL building with parameters
   */
  async testUrlBuilding() {
    console.log('\n🧪 Testing URL building...');
    try {
      const params = { param1: 'value1', param2: 'value2' };
      const url = this.client.buildUrl('https://httpbin.org', '/get', params);
      
      this.assert(url.includes('param1=value1'), 'URL includes first parameter');
      this.assert(url.includes('param2=value2'), 'URL includes second parameter');
      this.assert(url.includes('?'), 'URL includes query separator');
      
      // Test the actual request with parameters
      const result = await this.client.fetch(url);
      this.assert(result.args.param1 === 'value1', 'Parameters correctly sent to server');
      this.assert(result.args.param2 === 'value2', 'All parameters correctly sent to server');
    } catch (error) {
      this.assert(false, `URL building test failed: ${error.message}`);
    }
  }

  /**
   * Test security validation
   */
  async testSecurity() {
    console.log('\n🧪 Testing security validation...');
    try {
      // Test blocked domain (should fail)
      await this.client.fetch('https://malicious-site.com/test');
      this.assert(false, 'Should have blocked malicious domain');
    } catch (error) {
      this.assert(error.message.includes('blocked'), `Correctly blocks malicious domain: ${error.message}`);
    }

    try {
      // Test HTTPS requirement with HTTP URL (should fail if enforced)
      const httpClient = new HttpClient({
        security: { requireHttps: true, allowedDomains: ['httpbin.org'] }
      });
      await httpClient.fetch('http://httpbin.org/get');
      this.assert(false, 'Should have required HTTPS');
    } catch (error) {
      this.assert(error.message.includes('HTTPS'), `Correctly enforces HTTPS: ${error.message}`);
    }
  }

  /**
   * Test JSON and text response handling
   */
  async testResponseTypes() {
    console.log('\n🧪 Testing response type handling...');
    try {
      // Test JSON response
      const jsonResult = await this.client.fetch('https://httpbin.org/json');
      this.assert(typeof jsonResult === 'object', 'JSON response parsed as object');
      
      // Test HTML response
      const htmlResult = await this.client.fetch('https://httpbin.org/html');
      this.assert(typeof htmlResult === 'string', 'HTML response returned as string');
      this.assert(htmlResult.includes('<html>'), 'HTML response contains HTML tags');
    } catch (error) {
      this.assert(false, `Response type test failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting HTTP Client Test Suite\n');
    
    const tests = [
      this.testBasicGet,
      this.testPost,
      this.testCaching,
      this.testErrorHandling,
      this.testTimeout,
      this.testApiClient,
      this.testUrlBuilding,
      this.testSecurity,
      this.testResponseTypes
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.assert(false, `Test execution failed: ${error.message}`);
      }
    }

    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📝 Total: ${this.passed + this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.message}`));
    }
    
    return this.failed === 0;
  }
}

// Export test class and provide a run function
export { HttpClientTest };

// If run directly, execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new HttpClientTest();
  test.runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}