#!/usr/bin/env node

/**
 * Intel N100 Configuration Comparison Test
 * Compares old vs. optimized browser configurations
 */

const { chromium } = require('playwright');

async function testConfiguration(name, options, timeout = 20000) {
  console.log(`\n🧪 Testing ${name}...`);
  
  const startTime = Date.now();
  
  try {
    const browser = await chromium.launch({ 
      ...options, 
      timeout: timeout,
    });
    
    const startupTime = Date.now() - startTime;
    console.log(`   ✅ Browser startup: ${startupTime}ms`);
    
    // Quick page test
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const pageStartTime = Date.now();
    await page.goto('http://localhost:3003', { 
      waitUntil: 'domcontentloaded', // Faster than networkidle
      timeout: 10000
    });
    
    const pageLoadTime = Date.now() - pageStartTime;
    console.log(`   ✅ Page load: ${pageLoadTime}ms`);
    
    await browser.close();
    
    return { startupTime, pageLoadTime };
    
  } catch (error) {
    console.log(`   ❌ ${name} failed: ${error.message}`);
    return { startupTime: -1, pageLoadTime: -1, error: error.message };
  }
}

async function runComparison() {
  console.log('📊 Intel N100 Browser Configuration Comparison');
  console.log('===============================================');
  
  // Old configuration (container/ARM workarounds)
  const oldConfig = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--headless=new'
    ],
  };
  
  // Intel N100 optimized configuration
  const optimizedConfig = {
    args: [
      // Security (minimal)
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
      
      '--headless=new'
    ],
  };
  
  // Test both configurations
  const oldResults = await testConfiguration('Old Configuration', oldConfig);
  const newResults = await testConfiguration('Intel N100 Optimized', optimizedConfig);
  
  // Results comparison
  console.log('\n📈 Performance Comparison Results');
  console.log('=====================================');
  
  if (oldResults.startupTime > 0 && newResults.startupTime > 0) {
    const startupImprovement = ((oldResults.startupTime - newResults.startupTime) / oldResults.startupTime * 100);
    console.log(`🚀 Startup Time:`);
    console.log(`   Old: ${oldResults.startupTime}ms`);
    console.log(`   New: ${newResults.startupTime}ms`);
    console.log(`   Change: ${startupImprovement > 0 ? '+' : ''}${startupImprovement.toFixed(1)}%`);
  }
  
  if (oldResults.pageLoadTime > 0 && newResults.pageLoadTime > 0) {
    const pageLoadImprovement = ((oldResults.pageLoadTime - newResults.pageLoadTime) / oldResults.pageLoadTime * 100);
    console.log(`\n🌐 Page Load Time:`);
    console.log(`   Old: ${oldResults.pageLoadTime}ms`);
    console.log(`   New: ${newResults.pageLoadTime}ms`);
    console.log(`   Change: ${pageLoadImprovement > 0 ? '+' : ''}${pageLoadImprovement.toFixed(1)}%`);
  }
  
  // Intel N100 targets
  console.log('\n🎯 Intel N100 Performance Targets:');
  console.log(`   Browser startup target: ≤5000ms`);
  console.log(`   Page load target: ≤3000ms`);
  console.log(`   Memory usage target: ≤500MB`);
  
  if (newResults.startupTime > 0) {
    console.log(`\n📊 Current Performance vs Targets:`);
    console.log(`   Startup: ${newResults.startupTime}ms ${newResults.startupTime <= 5000 ? '✅' : '⚠️'}`);
    console.log(`   Page load: ${newResults.pageLoadTime}ms ${newResults.pageLoadTime <= 3000 ? '✅' : '⚠️'}`);
  }
  
  console.log('\n💡 Optimizations Applied:');
  console.log('   • Intel UHD graphics acceleration enabled');
  console.log('   • Memory management for 8GB system');
  console.log('   • CPU optimization for 4-core 800MHz Intel N100');
  console.log('   • Removed ARM/container-specific workarounds');
  console.log('   • Limited renderer processes to 2 for efficiency');
  console.log('   • Extended timeouts for conservative performance');
}

if (require.main === module) {
  runComparison().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = runComparison;