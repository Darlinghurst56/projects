#!/usr/bin/env node
// Debug Frontend Loading

const axios = require('axios');

async function debugFrontend() {
  console.log('🔍 Debugging Frontend Loading...\n');
  
  try {
    // Test 1: Basic HTML loading
    console.log('1. Testing basic HTML loading...');
    const html = await axios.get('http://localhost:3003/HurstHome');
    console.log('✅ HTML response length:', html.data.length);
    
    // Test 2: Check HTML structure
    console.log('\n2. Analyzing HTML structure...');
    const htmlContent = html.data;
    
    const hasRoot = htmlContent.includes('id="root"');
    const hasMainScript = htmlContent.includes('/src/main.jsx');
    const hasViteClient = htmlContent.includes('/@vite/client');
    const hasReactRefresh = htmlContent.includes('React');
    const hasTitle = htmlContent.includes('Home Dashboard');
    
    console.log('  - Has root element:', hasRoot ? '✅' : '❌');
    console.log('  - Has main script:', hasMainScript ? '✅' : '❌');
    console.log('  - Has Vite client:', hasViteClient ? '✅' : '❌');
    console.log('  - Has React mentions:', hasReactRefresh ? '✅' : '❌');
    console.log('  - Has title:', hasTitle ? '✅' : '❌');
    
    // Test 3: Check main.jsx loading
    console.log('\n3. Testing main.jsx loading...');
    try {
      const mainJs = await axios.get('http://localhost:3003/src/main.jsx');
      console.log('✅ main.jsx loads, length:', mainJs.data.length);
      console.log('  - Contains App import:', mainJs.data.includes('App') ? '✅' : '❌');
      console.log('  - Contains ReactDOM:', mainJs.data.includes('ReactDOM') ? '✅' : '❌');
    } catch (e) {
      console.log('❌ main.jsx failed to load:', e.message);
    }
    
    // Test 4: Check App.jsx loading
    console.log('\n4. Testing App.jsx loading...');
    try {
      const appJs = await axios.get('http://localhost:3003/src/App.jsx');
      console.log('✅ App.jsx loads, length:', appJs.data.length);
      console.log('  - Contains routes:', appJs.data.includes('Route') ? '✅' : '❌');
      console.log('  - Contains Dashboard:', appJs.data.includes('Dashboard') ? '✅' : '❌');
    } catch (e) {
      console.log('❌ App.jsx failed to load:', e.message);
    }
    
    // Test 5: Check if Vite is transforming properly
    console.log('\n5. Testing Vite dev server status...');
    try {
      const viteClient = await axios.get('http://localhost:3003/@vite/client');
      console.log('✅ Vite client loads, length:', viteClient.data.length);
    } catch (e) {
      console.log('❌ Vite client failed:', e.message);
    }
    
    // Test 6: Backend API connectivity
    console.log('\n6. Testing backend API connectivity...');
    try {
      const health = await axios.get('http://localhost:3000/health');
      console.log('✅ Backend health:', health.data);
      
      // Test API endpoint that frontend would call
      const dnsStatus = await axios.get('http://localhost:3000/api/dns/status', {
        headers: { 'Authorization': 'Bearer test' },
        validateStatus: function (status) {
          return status < 500; // Don't throw for 4xx errors
        }
      });
      console.log('✅ DNS API response status:', dnsStatus.status);
      if (dnsStatus.status === 401) {
        console.log('  (401 is expected - auth required)');
      }
    } catch (e) {
      console.log('❌ Backend API test failed:', e.message);
    }
    
    console.log('\n📊 Frontend Diagnosis:');
    
    if (hasRoot && hasMainScript && hasViteClient) {
      console.log('✅ React app should be loading in browser');
      console.log('🌐 Try opening: http://localhost:3003/HurstHome');
      console.log('📝 If blank, check browser console for JavaScript errors');
    } else {
      console.log('❌ Frontend has structural issues');
      if (!hasRoot) console.log('  - Missing React root element');
      if (!hasMainScript) console.log('  - Missing main.jsx script');
      if (!hasViteClient) console.log('  - Missing Vite client');
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugFrontend().catch(console.error);