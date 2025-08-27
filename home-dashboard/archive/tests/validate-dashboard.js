#!/usr/bin/env node
// Live Dashboard Validation Script
// This script MUST pass or the dashboard is not working

const axios = require('axios');
const { chromium } = require('playwright');

const DASHBOARD_URL = 'http://localhost:3003';
const TESTS_PASSED = [];
const TESTS_FAILED = [];

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    TESTS_PASSED.push(name);
    if (details) console.log(`   ${details}`);
  } else {
    console.log(`❌ FAIL: ${name}`);
    TESTS_FAILED.push(name);
    if (details) console.log(`   ${details}`);
  }
}

async function validateServer() {
  console.log('🚀 Starting Live Dashboard Validation...\n');
  
  // Test 1: Server Health Check
  try {
    const response = await axios.get(`http://localhost:3000/health`, { timeout: 5000 });
    logTest('Server Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    logTest('Server Health Check', false, `Error: ${error.message}`);
  }

  // Test 2: Dashboard Page Load
  try {
    const response = await axios.get(`${DASHBOARD_URL}/HurstHome`, { timeout: 5000 });
    const containsTitle = response.data.includes('Home Dashboard');
    logTest('Dashboard Page Load', response.status === 200 && containsTitle, 
           `Status: ${response.status}, Contains Title: ${containsTitle}`);
  } catch (error) {
    logTest('Dashboard Page Load', false, `Error: ${error.message}`);
  }

  // Test 3: Browser Validation
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('\n🌐 Running Browser Tests...');
    
    // Load dashboard
    await page.goto(`${DASHBOARD_URL}/HurstHome`, { waitUntil: 'domcontentloaded' });
    
    // Check title
    const title = await page.textContent('h1');
    logTest('Browser Title Check', title && title.includes('Hurst Home'), `Title: "${title}"`);
    
    // Check guest mode indicator
    const guestMode = await page.textContent('body');
    logTest('Guest Mode Indicator', guestMode.includes('Guest Mode'), 'Guest mode text found');
    
    // Check responsive layout
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileTitle = await page.isVisible('h1');
    logTest('Mobile Responsiveness', mobileTitle, 'H1 visible on mobile');
    
    // Take screenshot as evidence
    await page.screenshot({ path: 'tests/screenshots/live-validation.png', fullPage: true });
    console.log('📸 Screenshot saved: tests/screenshots/live-validation.png');
    
    await browser.close();
    
  } catch (error) {
    logTest('Browser Validation', false, `Error: ${error.message}`);
    if (browser) await browser.close();
  }
}

async function main() {
  await validateServer();
  
  console.log('\n📊 VALIDATION RESULTS:');
  console.log(`✅ Passed: ${TESTS_PASSED.length}`);
  console.log(`❌ Failed: ${TESTS_FAILED.length}`);
  
  if (TESTS_FAILED.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    TESTS_FAILED.forEach(test => console.log(`   • ${test}`));
    console.log('\n🚨 DASHBOARD VALIDATION FAILED - Fix issues before deployment');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED - Dashboard is fully functional!');
    console.log(`🌐 Dashboard URL: ${DASHBOARD_URL}/HurstHome`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('💥 Validation script error:', error);
  process.exit(1);
});