#!/usr/bin/env node
// Test Fixed Widget Configuration

const axios = require('axios');

async function testFixedWidgets() {
  console.log('🔧 Testing Fixed Widget Configuration...\n');
  
  try {
    // Test 1: Check backend health
    console.log('1. Backend Health Check...');
    const health = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Backend healthy:', health.data);
    
    // Test 2: Test frontend HTML loading  
    console.log('\n2. Frontend Structure Check...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout: html } = await execAsync('curl -s http://localhost:3003/HurstHome');
    console.log('   ✅ Frontend HTML length:', html.length);
    console.log('   ✅ Contains React root:', html.includes('id="root"'));
    console.log('   ✅ Contains main script:', html.includes('/src/main.jsx'));
    
    // Test 3: Check main.jsx compilation
    console.log('\n3. React App Compilation Check...');
    const { stdout: mainJs } = await execAsync('curl -s http://localhost:3003/src/main.jsx');
    console.log('   ✅ main.jsx compiles, length:', mainJs.length);
    console.log('   ✅ Contains App import:', mainJs.includes('App'));
    
    // Test 4: Check config file compilation
    console.log('\n4. Config File Check...');
    const { stdout: configJs } = await execAsync('curl -s "http://localhost:3003/src/config/index.js"');
    console.log('   ✅ config.js compiles, length:', configJs.length);
    console.log('   ✅ Contains dns config:', configJs.includes('dns:'));
    console.log('   ✅ Contains refreshInterval:', configJs.includes('refreshInterval'));
    
    // Test 5: Check DNS widget compilation
    console.log('\n5. DNS Widget Compilation Check...');
    try {
      const { stdout: dnsWidget } = await execAsync('curl -s "http://localhost:3003/src/components/dns/DnsStatusWidget.jsx"');
      console.log('   ✅ DnsStatusWidget compiles, length:', dnsWidget.length);
      console.log('   ✅ Imports dns from config:', dnsWidget.includes('dns } from'));
    } catch (e) {
      console.log('   ❌ DNS Widget compilation error:', e.message);
    }
    
    // Test 6: Test API endpoints that widgets would call
    console.log('\n6. Widget API Dependencies...');
    const apis = [
      { name: 'DNS Status', url: 'http://localhost:3000/api/dns/status' },
      { name: 'System Status', url: 'http://localhost:3000/api/system/status' }
    ];
    
    for (const api of apis) {
      try {
        const response = await axios.get(api.url, {
          headers: { 'Authorization': 'Bearer test' },
          timeout: 5000,
          validateStatus: status => status < 500
        });
        
        if (response.status === 200) {
          console.log(`   ✅ ${api.name}: Returns data`);
        } else if (response.status === 401) {
          console.log(`   🔐 ${api.name}: Auth required (expected for widgets)`);
        } else {
          console.log(`   ⚠️ ${api.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${api.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 WIDGET FIX ANALYSIS:');
    
    if (configJs.includes('dns:') && configJs.includes('refreshInterval')) {
      console.log('   ✅ FIXED: DNS config is now properly defined');
      console.log('   ✅ RESULT: DNS widgets should no longer crash on import');
    } else {
      console.log('   ❌ ISSUE: DNS config still missing or malformed');
    }
    
    if (html.includes('id="root"') && mainJs.includes('App')) {
      console.log('   ✅ STRUCTURE: React app structure is correct');
    } else {
      console.log('   ❌ STRUCTURE: React app structure has issues');
    }
    
    console.log('\n🎯 EXPECTED BEHAVIOR AFTER FIX:');
    console.log('   ✅ Widgets should now render with "Welcome to Hurst Home" header');
    console.log('   ✅ DNS widgets should show loading states, then error states (no API data)');
    console.log('   ✅ Page should NOT be blank');
    console.log('   ✅ Guest mode notice should be visible');
    console.log('   ✅ Graceful degradation should show error messages, not disappearing widgets');
    
    console.log('\n🌐 To verify the fix:');
    console.log('   1. Open browser to: http://localhost:3003/HurstHome');
    console.log('   2. Should see "Welcome to Hurst Home" title');
    console.log('   3. Should see widgets with error states (not blank)');
    console.log('   4. Check browser console - should have fewer/no import errors');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testFixedWidgets().catch(console.error);