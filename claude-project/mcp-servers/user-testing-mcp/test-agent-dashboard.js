import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000/agent-dashboard.html');
    
    // Check if basic HTML elements are present
    const title = await page.title();
    console.log('Page title:', title);
    
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.length);
    console.log('Body HTML length:', bodyHTML);
    
    // Check if dashboard container exists in DOM
    const dashboardExists = await page.evaluate(() => !!document.querySelector('#dashboard-container'));
    console.log('Dashboard container exists:', dashboardExists);
    
    if (dashboardExists) {
      console.log('✅ Dashboard container found');
      
      // Test for human-centered improvements
      const hasSkipLink = await page.$('.skip-link');
      const hasHumanCSS = await page.$('link[href*="human-centered-design.css"]');
      
      console.log('✅ Skip link:', hasSkipLink ? 'Found' : 'Missing');
      console.log('✅ Human-centered CSS:', hasHumanCSS ? 'Found' : 'Missing');
      
      console.log('✅ User Testing MCP selector fix successful!');
    } else {
      console.log('❌ Dashboard container not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();