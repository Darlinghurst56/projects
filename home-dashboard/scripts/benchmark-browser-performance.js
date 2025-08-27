#!/usr/bin/env node

/**
 * Intel N100 Browser Performance Benchmarking Tool
 * 
 * Measures browser startup time, memory usage, and page load performance
 * Compares original vs optimized Playwright configurations
 * 
 * Usage:
 *   node scripts/benchmark-browser-performance.js
 *   node scripts/benchmark-browser-performance.js --config optimized
 *   node scripts/benchmark-browser-performance.js --compare
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration files to test
const CONFIGS = {
  original: require('../playwright.config.js'),
  optimized: require('../playwright.config.optimized.js'),
};

class BrowserPerformanceBenchmark {
  constructor() {
    this.results = {};
    this.testUrl = 'http://localhost:3003';
  }

  async measureBrowserStartup(configName, launchOptions) {
    console.log(`\n📊 Measuring browser startup performance: ${configName}`);
    
    const startupTimes = [];
    const memoryUsages = [];
    
    // Run multiple iterations for accurate measurement
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      try {
        const browser = await chromium.launch(launchOptions);
        const startupTime = Date.now() - startTime;
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Measure memory usage
        const memoryInfo = await page.evaluate(() => {
          return {
            usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
            totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
            jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,
          };
        });
        
        startupTimes.push(startupTime);
        memoryUsages.push(memoryInfo);
        
        await browser.close();
        
        console.log(`  Iteration ${i + 1}: ${startupTime}ms startup`);
        
        // Wait between iterations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  Iteration ${i + 1} failed:`, error.message);
      }
    }
    
    const avgStartup = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length;
    const avgMemory = memoryUsages.reduce((acc, mem) => ({
      usedJSHeapSize: acc.usedJSHeapSize + mem.usedJSHeapSize,
      totalJSHeapSize: acc.totalJSHeapSize + mem.totalJSHeapSize,
      jsHeapSizeLimit: acc.jsHeapSizeLimit + mem.jsHeapSizeLimit,
    }), { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 });
    
    Object.keys(avgMemory).forEach(key => {
      avgMemory[key] = Math.round(avgMemory[key] / memoryUsages.length);
    });
    
    return {
      startupTime: {
        average: Math.round(avgStartup),
        min: Math.min(...startupTimes),
        max: Math.max(...startupTimes),
        samples: startupTimes,
      },
      memory: avgMemory,
    };
  }

  async measurePageLoadPerformance(configName, launchOptions) {
    console.log(`\n🚀 Measuring page load performance: ${configName}`);
    
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const loadTimes = [];
    const paintTimes = [];
    
    try {
      // Measure multiple page loads
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        await page.goto(this.testUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        
        // Get paint timing metrics
        const paintMetrics = await page.evaluate(() => {
          const perfEntries = performance.getEntriesByType('paint');
          const firstPaint = perfEntries.find(entry => entry.name === 'first-paint');
          const firstContentfulPaint = perfEntries.find(entry => entry.name === 'first-contentful-paint');
          
          return {
            firstPaint: firstPaint ? Math.round(firstPaint.startTime) : null,
            firstContentfulPaint: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : null,
          };
        });
        
        loadTimes.push(loadTime);
        paintTimes.push(paintMetrics);
        
        console.log(`  Load ${i + 1}: ${loadTime}ms (FCP: ${paintMetrics.firstContentfulPaint}ms)`);
        
        // Clear cache between loads
        await context.clearCookies();
      }
      
    } catch (error) {
      console.error('Page load measurement failed:', error.message);
      return null;
    } finally {
      await browser.close();
    }
    
    const avgLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
    const avgFCP = Math.round(paintTimes.reduce((acc, paint) => 
      acc + (paint.firstContentfulPaint || 0), 0) / paintTimes.filter(p => p.firstContentfulPaint).length
    );
    
    return {
      loadTime: {
        average: avgLoadTime,
        min: Math.min(...loadTimes),
        max: Math.max(...loadTimes),
        samples: loadTimes,
      },
      firstContentfulPaint: avgFCP,
      samples: paintTimes,
    };
  }

  async runBenchmark(configName) {
    console.log(`\n🔧 Running benchmark for: ${configName.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const config = CONFIGS[configName];
    const chromiumProject = config.projects.find(p => p.name === 'chromium');
    
    if (!chromiumProject) {
      throw new Error(`No chromium project found in ${configName} config`);
    }
    
    const launchOptions = {
      headless: true,
      ...chromiumProject.use.launchOptions,
    };
    
    const startupResults = await this.measureBrowserStartup(configName, launchOptions);
    const pageLoadResults = await this.measurePageLoadPerformance(configName, launchOptions);
    
    this.results[configName] = {
      startup: startupResults,
      pageLoad: pageLoadResults,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`\n✅ ${configName} benchmark completed`);
    this.printResults(configName);
    
    return this.results[configName];
  }

  printResults(configName) {
    const result = this.results[configName];
    
    console.log(`\n📈 Results for ${configName.toUpperCase()}:`);
    console.log(`  Browser Startup: ${result.startup.startupTime.average}ms (${result.startup.startupTime.min}-${result.startup.startupTime.max}ms)`);
    console.log(`  Memory Usage: ${Math.round(result.startup.memory.usedJSHeapSize / 1024 / 1024)}MB JS heap`);
    
    if (result.pageLoad) {
      console.log(`  Page Load: ${result.pageLoad.loadTime.average}ms (${result.pageLoad.loadTime.min}-${result.pageLoad.loadTime.max}ms)`);
      console.log(`  First Contentful Paint: ${result.pageLoad.firstContentfulPaint}ms`);
    }
  }

  printComparison() {
    if (!this.results.original || !this.results.optimized) {
      console.log('❌ Cannot compare - run both original and optimized benchmarks first');
      return;
    }
    
    console.log(`\n🏆 PERFORMANCE COMPARISON`);
    console.log('='.repeat(50));
    
    const orig = this.results.original;
    const opt = this.results.optimized;
    
    const startupImprovement = ((orig.startup.startupTime.average - opt.startup.startupTime.average) / orig.startup.startupTime.average * 100);
    const memoryImprovement = ((orig.startup.memory.usedJSHeapSize - opt.startup.memory.usedJSHeapSize) / orig.startup.memory.usedJSHeapSize * 100);
    
    console.log(`Browser Startup:`);
    console.log(`  Original: ${orig.startup.startupTime.average}ms`);
    console.log(`  Optimized: ${opt.startup.startupTime.average}ms`);
    console.log(`  Improvement: ${startupImprovement > 0 ? '📈 ' : '📉 '}${Math.abs(startupImprovement).toFixed(1)}%`);
    
    console.log(`\nMemory Usage:`);
    console.log(`  Original: ${Math.round(orig.startup.memory.usedJSHeapSize / 1024 / 1024)}MB`);
    console.log(`  Optimized: ${Math.round(opt.startup.memory.usedJSHeapSize / 1024 / 1024)}MB`);
    console.log(`  Improvement: ${memoryImprovement > 0 ? '📈 ' : '📉 '}${Math.abs(memoryImprovement).toFixed(1)}%`);
    
    if (orig.pageLoad && opt.pageLoad) {
      const pageLoadImprovement = ((orig.pageLoad.loadTime.average - opt.pageLoad.loadTime.average) / orig.pageLoad.loadTime.average * 100);
      const fcpImprovement = ((orig.pageLoad.firstContentfulPaint - opt.pageLoad.firstContentfulPaint) / orig.pageLoad.firstContentfulPaint * 100);
      
      console.log(`\nPage Load:`);
      console.log(`  Original: ${orig.pageLoad.loadTime.average}ms`);
      console.log(`  Optimized: ${opt.pageLoad.loadTime.average}ms`);
      console.log(`  Improvement: ${pageLoadImprovement > 0 ? '📈 ' : '📉 '}${Math.abs(pageLoadImprovement).toFixed(1)}%`);
      
      console.log(`\nFirst Contentful Paint:`);
      console.log(`  Original: ${orig.pageLoad.firstContentfulPaint}ms`);
      console.log(`  Optimized: ${opt.pageLoad.firstContentfulPaint}ms`);
      console.log(`  Improvement: ${fcpImprovement > 0 ? '📈 ' : '📉 '}${Math.abs(fcpImprovement).toFixed(1)}%`);
    }
    
    console.log(`\n🎯 Intel N100 Performance Summary:`);
    console.log(`  - Browser startup ${startupImprovement > 0 ? 'improved' : 'regressed'} by ${Math.abs(startupImprovement).toFixed(1)}%`);
    console.log(`  - Memory usage ${memoryImprovement > 0 ? 'reduced' : 'increased'} by ${Math.abs(memoryImprovement).toFixed(1)}%`);
    console.log(`  - Target: <3s startup ${opt.startup.startupTime.average < 3000 ? '✅' : '❌'}`);
    console.log(`  - Target: <2GB memory ${opt.startup.memory.usedJSHeapSize < 2000000000 ? '✅' : '❌'}`);
  }

  saveResults() {
    const resultsDir = path.join(__dirname, '..', 'benchmark-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(resultsDir, `intel-n100-performance-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify({
      system: {
        processor: 'Intel N100',
        cores: 4,
        memory: '8GB',
        architecture: 'x86_64',
      },
      results: this.results,
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const configArg = args.find(arg => arg.startsWith('--config='))?.split('=')[1];
  const isCompare = args.includes('--compare');
  
  const benchmark = new BrowserPerformanceBenchmark();
  
  try {
    if (isCompare) {
      console.log('🔄 Running comparison benchmark...');
      await benchmark.runBenchmark('original');
      await benchmark.runBenchmark('optimized');
      benchmark.printComparison();
    } else if (configArg) {
      if (!CONFIGS[configArg]) {
        console.error(`❌ Unknown config: ${configArg}`);
        console.log('Available configs:', Object.keys(CONFIGS).join(', '));
        process.exit(1);
      }
      await benchmark.runBenchmark(configArg);
    } else {
      console.log('🚀 Running optimized configuration benchmark...');
      await benchmark.runBenchmark('optimized');
    }
    
    benchmark.saveResults();
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 Make sure the development servers are running:');
      console.log('  npm run server:dev  # Terminal 1');
      console.log('  npm run client:dev  # Terminal 2');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BrowserPerformanceBenchmark;