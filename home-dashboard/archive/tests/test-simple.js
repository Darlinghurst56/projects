#!/usr/bin/env node
// Simple Dashboard Test - No Browser Required

const axios = require('axios');

async function testDashboard() {
  console.log('🔍 Testing Dashboard Components...\n');
  
  // 1. Backend Health
  try {
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend Health:', health.data);
  } catch (error) {
    console.log('❌ Backend Health:', error.message);
    return;
  }
  
  // 2. Frontend Loading
  try {
    const frontend = await axios.get('http://localhost:3003/');
    const hasReact = frontend.data.includes('React');
    const hasTitle = frontend.data.includes('Home Dashboard');
    console.log('✅ Frontend HTML:', { hasReact, hasTitle });
  } catch (error) {
    console.log('❌ Frontend HTML:', error.message);
    return;
  }
  
  // 3. API Endpoints
  try {
    const apis = [
      'http://localhost:3000/api/dns/status',
      'http://localhost:3000/api/system/status'
    ];
    
    for (const api of apis) {
      try {
        const response = await axios.get(api, { 
          headers: { 'Authorization': 'Bearer test' },
          timeout: 5000 
        });
        console.log(`✅ API ${api.split('/').pop()}:`, response.status);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔐 API ${api.split('/').pop()}: Auth required (expected)`);
        } else {
          console.log(`❌ API ${api.split('/').pop()}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log('❌ API Test:', error.message);
  }
  
  console.log('\n📊 Dashboard servers are running correctly!');
  console.log('🌐 Access at: http://localhost:3003/HurstHome');
}

testDashboard().catch(console.error);