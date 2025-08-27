#!/usr/bin/env node

/**
 * Intel N100 Performance Benchmarking Script
 * 
 * Tests browser performance optimizations for:
 * - Intel N100 (4 cores, ~800MHz base, Intel UHD Graphics)  
 * - 8GB RAM total system memory
 * - x86_64 architecture
 */

const { chromium } = require('playwright');
const path = require('path');

const BENCHMARK_CONFIG = {
  // Use Playwright's default Chromium installation (optimized for Intel N100)
  
  // Test URLs
  testUrls: [
    'http://localhost:3003', // Main dashboard
    'http://localhost:3003/#/weather', // Weather widget
    'http://localhost:3003/#/meals', // Meals widget
  ],
  
  // Performance thresholds for Intel N100 (conservative targets)
  thresholds: {
    browserStartup: 5000,    // 5s browser startup
    pageLoad: 3000,          // 3s page load 
    navigation: 2000,        // 2s navigation between pages
    memoryUsage: 500,        // 500MB max per tab (reasonable for 8GB system)
  }
};

class IntelN100Benchmark {
  constructor() {
    this.results = {
      browserStartup: [],
      pageLoad: [],
      navigation: [],
      memoryUsage: [],
      errors: []
    };
  }

  async measureBrowserStartup(launchOptions) {
    console.log('\n🚀 Measuring browser startup time...');
    
    const startTime = Date.now();
    
    try {
      const browser = await chromium.launch(launchOptions);
      const context = await browser.newContext();
      const page = await context.newPage();
      
      const startupTime = Date.now() - startTime;
      this.results.browserStartup.push(startupTime);
      
      console.log(`   Browser startup: ${startupTime}ms`);
      
      await browser.close();
      return startupTime;
    } catch (error) {
      this.results.errors.push(`Browser startup failed: ${error.message}`);
      console.error(`   ❌ Browser startup failed: ${error.message}`);
      throw error;
    }
  }

  async measurePageLoad(url, launchOptions) {
    console.log(`\n📄 Measuring page load time for: ${url}`);
    
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const startTime = Date.now();
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: BENCHMARK_CONFIG.thresholds.pageLoad * 2 // 2x threshold as timeout
      });
      
      const loadTime = Date.now() - startTime;
      this.results.pageLoad.push({ url, time: loadTime });
      
      console.log(`   Page load time: ${loadTime}ms`);
      
      // Measure memory usage
      const metrics = await page.evaluate(() => {
        return {
          usedJSMemory: performance.memory?.usedJSMemory || 0,
          totalJSMemory: performance.memory?.totalJSMemory || 0,
        };
      });
      
      const memoryMB = Math.round(metrics.usedJSMemory / 1024 / 1024);
      this.results.memoryUsage.push({ url, memory: memoryMB });
      
      console.log(`   Memory usage: ${memoryMB}MB`);
      
      return { loadTime, memory: memoryMB };
    } catch (error) {
      this.results.errors.push(`Page load failed for ${url}: ${error.message}`);
      console.error(`   ❌ Page load failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  async measureNavigation(launchOptions) {
    console.log('\n🧭 Measuring navigation performance...');
    
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Load initial page
      await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
      
      // Measure navigation between different sections
      const navigationTargets = [
        { selector: '[data-testid="weather-widget"]', name: 'Weather Widget' },
        { selector: '[data-testid="meals-widget"]', name: 'Meals Widget' },
        { selector: '[data-testid="dns-widget"]', name: 'DNS Widget' },
      ];
      
      for (const target of navigationTargets) {
        try {
          const startTime = Date.now();
          
          const element = await page.waitForSelector(target.selector, { timeout: 5000 });
          if (element) {
            await element.click();
            await page.waitForLoadState('networkidle');
          }
          
          const navTime = Date.now() - startTime;
          this.results.navigation.push({ target: target.name, time: navTime });
          
          console.log(`   ${target.name} navigation: ${navTime}ms`);
        } catch (error) {
          console.log(`   ⚠️  ${target.name} not found or navigation failed`);
        }
      }
    } catch (error) {
      this.results.errors.push(`Navigation test failed: ${error.message}`);
      console.error(`   ❌ Navigation test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  createOptimizedLaunchOptions() {
    return {
      // Use Playwright's default Chromium installation
      args: [
        // Security (minimal for Intel N100)
        '--no-sandbox',
        '--disable-setuid-sandbox',
        
        // Memory optimization for 8GB system
        '--memory-pressure-off',
        '--max_old_space_size=2048',
        '--disable-dev-shm-usage',
        
        // Intel UHD Graphics acceleration
        '--enable-gpu',
        '--enable-gpu-compositing',
        '--enable-accelerated-2d-canvas',
        '--enable-accelerated-video-decode',
        '--ignore-gpu-blacklist',
        
        // CPU optimization for Intel N100
        '--renderer-process-limit=2',
        '--max-gum-fps=30',
        
        // Performance optimizations
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-web-security',
        
        // Remove unnecessary features
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-default-apps',
        
        // Headless for benchmarking
        '--headless=new'
      ],
    };
  }

  createBasicLaunchOptions() {
    return {
      // Use Playwright's default Chromium installation
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--headless=new'
      ],
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 INTEL N100 PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(60));
    
    // Browser startup
    if (this.results.browserStartup.length > 0) {
      const avgStartup = this.results.browserStartup.reduce((a, b) => a + b, 0) / this.results.browserStartup.length;
      const startupStatus = avgStartup <= BENCHMARK_CONFIG.thresholds.browserStartup ? '✅' : '⚠️';
      console.log(`\n🚀 Browser Startup:`);
      console.log(`   Average: ${Math.round(avgStartup)}ms ${startupStatus}`);
      console.log(`   Target: ${BENCHMARK_CONFIG.thresholds.browserStartup}ms`);
    }
    
    // Page load
    if (this.results.pageLoad.length > 0) {
      console.log(`\n📄 Page Load Times:`);
      this.results.pageLoad.forEach(result => {
        const status = result.time <= BENCHMARK_CONFIG.thresholds.pageLoad ? '✅' : '⚠️';
        console.log(`   ${result.url}: ${result.time}ms ${status}`);
      });
      console.log(`   Target: ${BENCHMARK_CONFIG.thresholds.pageLoad}ms`);
    }
    
    // Memory usage
    if (this.results.memoryUsage.length > 0) {
      console.log(`\n💾 Memory Usage:`);
      this.results.memoryUsage.forEach(result => {
        const status = result.memory <= BENCHMARK_CONFIG.thresholds.memoryUsage ? '✅' : '⚠️';
        console.log(`   ${result.url}: ${result.memory}MB ${status}`);
      });
      console.log(`   Target: ${BENCHMARK_CONFIG.thresholds.memoryUsage}MB`);
    }
    
    // Navigation
    if (this.results.navigation.length > 0) {
      console.log(`\n🧭 Navigation Times:`);
      this.results.navigation.forEach(result => {
        const status = result.time <= BENCHMARK_CONFIG.thresholds.navigation ? '✅' : '⚠️';
        console.log(`   ${result.target}: ${result.time}ms ${status}`);
      });
      console.log(`   Target: ${BENCHMARK_CONFIG.thresholds.navigation}ms`);
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => console.log(`   ${error}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Overall assessment
    const hasIssues = this.results.errors.length > 0 ||
      this.results.browserStartup.some(t => t > BENCHMARK_CONFIG.thresholds.browserStartup) ||
      this.results.pageLoad.some(r => r.time > BENCHMARK_CONFIG.thresholds.pageLoad) ||
      this.results.memoryUsage.some(r => r.memory > BENCHMARK_CONFIG.thresholds.memoryUsage);
    
    if (hasIssues) {
      console.log('⚠️  Some performance targets not met - consider further optimization');
    } else {
      console.log('✅ All performance targets met for Intel N100!');
    }
    
    console.log('='.repeat(60));
  }

  async runBenchmark() {
    console.log('🔧 Starting Intel N100 Browser Performance Benchmark');
    console.log(`📊 System: Intel N100 (4 cores, ~800MHz, 8GB RAM)`);
    
    // Check if servers are running
    console.log('\n🔍 Checking if development servers are running...');
    try {
      const response = await fetch('http://localhost:3003');
      if (!response.ok) {
        throw new Error('Development server not responding');
      }
      console.log('✅ Development servers are running');
    } catch (error) {
      console.error('❌ Development servers not running. Please start with: npm run dev');
      console.error('   This benchmark requires the dashboard to be running on localhost:3003');
      process.exit(1);
    }
    
    const optimizedOptions = this.createOptimizedLaunchOptions();
    
    try {
      // Test browser startup (3 runs for average)
      console.log('\n📈 Running performance tests...');
      for (let i = 0; i < 3; i++) {
        await this.measureBrowserStartup(optimizedOptions);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      }
      
      // Test page loads
      for (const url of BENCHMARK_CONFIG.testUrls) {
        await this.measurePageLoad(url, optimizedOptions);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      }
      
      // Test navigation
      await this.measureNavigation(optimizedOptions);
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      this.results.errors.push(`Benchmark failed: ${error.message}`);
    }
    
    // Generate report
    this.generateReport();
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new IntelN100Benchmark();
  benchmark.runBenchmark().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = IntelN100Benchmark;