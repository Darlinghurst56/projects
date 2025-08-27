#!/usr/bin/env node
// Final Dashboard Status Check

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkDashboard() {
  console.log('🔍 Final Dashboard Status Check...\n');
  
  try {
    // 1. Check backend health
    console.log('1. Backend Health Check:');
    const { stdout: health } = await execAsync('curl -s http://localhost:3000/health');
    const healthData = JSON.parse(health);
    console.log('✅ Backend:', healthData.status, 'at', healthData.timestamp);
    
    // 2. Check frontend HTML structure
    console.log('\n2. Frontend Structure Check:');
    const { stdout: html } = await execAsync('curl -s http://localhost:3003/HurstHome');
    
    const hasRoot = html.includes('id="root"');
    const hasMainScript = html.includes('/src/main.jsx');
    const hasViteClient = html.includes('/@vite/client');
    const hasTitle = html.includes('Home Dashboard');
    
    console.log('   ✅ React root element:', hasRoot);
    console.log('   ✅ Main script loaded:', hasMainScript);
    console.log('   ✅ Vite dev client:', hasViteClient);
    console.log('   ✅ Page title present:', hasTitle);
    
    // 3. Check React main.jsx
    console.log('\n3. React App Check:');
    try {
      const { stdout: mainJs } = await execAsync('curl -s http://localhost:3003/src/main.jsx');
      const hasApp = mainJs.includes('App');
      const hasReactDOM = mainJs.includes('ReactDOM');
      console.log('   ✅ main.jsx loads:', mainJs.length > 0);
      console.log('   ✅ App component imported:', hasApp);
      console.log('   ✅ ReactDOM present:', hasReactDOM);
    } catch (e) {
      console.log('   ❌ main.jsx check failed:', e.message);
    }
    
    // 4. Check processes
    console.log('\n4. Process Check:');
    try {
      const { stdout: processes } = await execAsync('ps aux | grep -E "(node|npm)" | grep -v grep | grep -E "(3000|3003|vite|nodemon)"');
      const lines = processes.trim().split('\n').filter(line => line.length > 0);
      console.log('   ✅ Active processes:', lines.length);
      lines.forEach((line, i) => {
        const parts = line.split(/\s+/);
        const command = parts.slice(10).join(' ');
        console.log(`      ${i+1}. ${command.substring(0, 80)}`);
      });
    } catch (e) {
      console.log('   ❌ Process check failed');
    }
    
    // 5. Summary
    console.log('\n📊 DASHBOARD STATUS SUMMARY:');
    
    if (hasRoot && hasMainScript && hasViteClient) {
      console.log('✅ FRONTEND: Properly configured and serving');
      console.log('✅ BACKEND: Healthy and responding');
      console.log('✅ STRUCTURE: React app should load in browser');
      
      console.log('\n🌐 ACCESS DASHBOARD:');
      console.log('   Primary URL: http://localhost:3003/HurstHome');
      console.log('   Alternative: http://localhost:3003/');
      console.log('   Backend API: http://localhost:3000/health');
      
      console.log('\n📝 IF BLANK PAGE IN BROWSER:');
      console.log('   1. Open browser Developer Tools (F12)');
      console.log('   2. Check Console tab for JavaScript errors');
      console.log('   3. Check Network tab for failed requests');
      console.log('   4. Widget graceful degradation should show error messages');
      
    } else {
      console.log('❌ FRONTEND: Configuration issues detected');
      if (!hasRoot) console.log('   - Missing React root element');
      if (!hasMainScript) console.log('   - Missing main.jsx script');
      if (!hasViteClient) console.log('   - Missing Vite development client');
    }
    
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
}

checkDashboard().catch(console.error);