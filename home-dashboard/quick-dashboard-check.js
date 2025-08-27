const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Checking Home Dashboard Current State...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Check frontend
    console.log('📱 Frontend Check (http://localhost:3004)');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Get page title
    const title = await page.title();
    console.log(`   Title: ${title}`);
    
    // Check for main elements
    const hasRoot = await page.$('#root') !== null;
    console.log(`   React Root: ${hasRoot ? '✅' : '❌'}`);
    
    // Check for error messages
    const errors = await page.$$eval('.error-message, .error, [class*="error"]', 
      els => els.map(el => el.textContent.trim()).filter(t => t.length > 0)
    );
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors found: ${errors.slice(0, 3).join(', ')}`);
    }
    
    // Check for authentication
    const hasLogin = await page.$('[class*="login"], [class*="Login"], [class*="auth"], [class*="Auth"]') !== null;
    const hasPinInput = await page.$('input[type="password"], input[placeholder*="PIN"], input[placeholder*="pin"]') !== null;
    console.log(`   Login Form: ${hasLogin ? '✅' : '❌'}`);
    console.log(`   PIN Input: ${hasPinInput ? '✅' : '❌'}`);
    
    // Check for dashboard content
    const hasDashboard = await page.$('[class*="dashboard"], [class*="Dashboard"]') !== null;
    const hasWidgets = await page.$('[class*="widget"], [class*="Widget"]') !== null;
    console.log(`   Dashboard: ${hasDashboard ? '✅' : '❌'}`);
    console.log(`   Widgets: ${hasWidgets ? '✅' : '❌'}`);
    
    // Get visible text content
    const visibleText = await page.evaluate(() => {
      const body = document.body;
      const text = body.innerText || body.textContent || '';
      return text.substring(0, 200).replace(/\s+/g, ' ').trim();
    });
    console.log(`\n📄 Visible Content Preview:`);
    console.log(`   "${visibleText}..."`);
    
    // Check API connectivity
    console.log('\n🔌 API Connectivity:');
    const healthResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3000/health');
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log(`   Backend Health: ${healthResponse.ok ? '✅' : '❌'} (${healthResponse.status || healthResponse.error})`);
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-current-state.png', fullPage: true });
    console.log('\n📸 Screenshot saved: dashboard-current-state.png');
    
    // Get console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Reload to catch any console errors
    await page.reload({ waitUntil: 'networkidle2' });
    
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
    }
    
  } catch (error) {
    console.error('❌ Error checking dashboard:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Dashboard check complete');
})();