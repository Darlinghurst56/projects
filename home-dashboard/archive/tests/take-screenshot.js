const puppeteer = require('puppeteer');

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Listen for console logs and errors
  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', error => console.log('Page Error:', error.message));
  
  try {
    console.log('Navigating to http://localhost:3003/...');
    await page.goto('http://localhost:3003/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React app to render
    console.log('Waiting for React app to render...');
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait for widgets to load
    console.log('Waiting for widgets to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'family-dashboard-widgets-working-2025-08-08.png',
      fullPage: true
    });
    
    console.log('Screenshot saved as family-dashboard-widgets-working-2025-08-08.png');
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();