#!/usr/bin/env node

/**
 * Quick Intel N100 Performance Test
 * Tests the optimized Playwright configuration
 */

const { chromium } = require('playwright');

async function quickTest() {
  console.log('🔧 Testing Intel N100 Optimized Browser Configuration');
  console.log('📊 System: Intel N100 (4 cores, ~800MHz, 8GB RAM)');
  
  const optimizedOptions = {
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
      
      // Headless for testing
      '--headless=new'
    ],
  };
  
  console.log('\n🚀 Starting browser...');
  const startTime = Date.now();
  
  try {
    const browser = await chromium.launch(optimizedOptions);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const startupTime = Date.now() - startTime;
    console.log(`✅ Browser started in ${startupTime}ms`);
    
    // Test frontend connection
    console.log('🌐 Testing frontend connection...');
    const pageStartTime = Date.now();
    
    await page.goto('http://localhost:3003', { 
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    const pageLoadTime = Date.now() - pageStartTime;
    console.log(`✅ Page loaded in ${pageLoadTime}ms`);
    
    // Get page title to verify it loaded
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Test memory usage
    const metrics = await page.evaluate(() => {
      return {
        usedJSMemory: performance.memory?.usedJSMemory || 0,
        totalJSMemory: performance.memory?.totalJSMemory || 0,
      };
    });
    
    const memoryMB = Math.round(metrics.usedJSMemory / 1024 / 1024);
    console.log(`💾 Memory usage: ${memoryMB}MB`);
    
    await browser.close();
    
    // Performance assessment
    console.log('\n🎯 Intel N100 Performance Results:');
    console.log(`   Browser startup: ${startupTime}ms ${startupTime <= 5000 ? '✅' : '⚠️'} (target: ≤5000ms)`);
    console.log(`   Page load: ${pageLoadTime}ms ${pageLoadTime <= 3000 ? '✅' : '⚠️'} (target: ≤3000ms)`);
    console.log(`   Memory usage: ${memoryMB}MB ${memoryMB <= 500 ? '✅' : '⚠️'} (target: ≤500MB)`);
    
    const allGood = startupTime <= 5000 && pageLoadTime <= 3000 && memoryMB <= 500;
    console.log(`\n${allGood ? '🎉 All targets met!' : '⚠️  Some targets missed - may need further optimization'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('localhost:3003')) {
      console.error('\n💡 Make sure the development server is running:');
      console.error('   npm run client:dev');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  quickTest();
}

module.exports = quickTest;