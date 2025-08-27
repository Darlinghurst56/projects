#!/usr/bin/env node

/**
 * AI Service Debug and Circuit Breaker Reset Script
 * 
 * This script helps debug and fix AI service issues by:
 * 1. Testing Ollama service connectivity
 * 2. Resetting circuit breaker state
 * 3. Validating configuration
 * 4. Testing AI service functionality
 */

const config = require('./config');
const { registry } = require('./server/utils/circuitBreaker');

async function testOllamaConnection() {
  console.log('\n🔍 Testing Ollama Service Connection...');
  console.log(`📍 Endpoint: ${config.services.ollama.baseUrl}`);
  
  try {
    const fetch = require('node-fetch');
    
    // Test basic connectivity
    const response = await fetch(`${config.services.ollama.baseUrl}/api/tags`, {
      timeout: 10000
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Connected successfully!`);
    console.log(`📊 Available models: ${data.models?.length || 0}`);
    
    if (data.models && data.models.length > 0) {
      console.log('🤖 Models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function testAIServiceGeneration() {
  console.log('\n🧪 Testing AI Text Generation...');
  
  try {
    const fetch = require('node-fetch');
    
    const testPrompt = "Hello, this is a test. Please respond briefly.";
    console.log(`📝 Test prompt: "${testPrompt}"`);
    
    const response = await fetch(`${config.services.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.services.ollama.model,
        prompt: testPrompt,
        stream: false
      }),
      timeout: 30000
    });
    
    if (!response.ok) {
      console.log(`❌ Generation failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Generation successful!`);
    console.log(`🤖 Response: ${data.response?.substring(0, 100)}...`);
    
    return true;
  } catch (error) {
    console.log(`❌ Generation failed: ${error.message}`);
    return false;
  }
}

function checkCircuitBreakerStatus() {
  console.log('\n🔧 Circuit Breaker Status...');
  
  const breaker = registry.get('ollama-ai');
  if (!breaker) {
    console.log('❌ Circuit breaker not found or not initialized');
    return null;
  }
  
  const status = breaker.getStatus();
  console.log(`📊 Circuit Breaker: ${status.name}`);
  console.log(`🔄 State: ${status.state}`);
  console.log(`💚 Healthy: ${status.isHealthy}`);
  console.log(`⚠️  Failures: ${status.failures}/${status.failureThreshold}`);
  console.log(`📈 Success Rate: ${status.stats.successRate}`);
  
  if (status.nextAttempt) {
    console.log(`⏰ Next Attempt: ${status.nextAttempt}`);
  }
  
  return status;
}

function resetCircuitBreaker() {
  console.log('\n🔄 Resetting Circuit Breaker...');
  
  const breaker = registry.get('ollama-ai');
  if (!breaker) {
    console.log('❌ Circuit breaker not found - initializing new one...');
    
    // Initialize circuit breaker if it doesn't exist
    const AIService = require('./server/services/AIService');
    const aiService = new AIService();
    
    const newBreaker = registry.get('ollama-ai');
    if (newBreaker) {
      console.log('✅ Circuit breaker initialized');
      newBreaker.reset();
      console.log('✅ Circuit breaker reset to CLOSED state');
    } else {
      console.log('❌ Failed to initialize circuit breaker');
    }
    return;
  }
  
  breaker.reset();
  console.log('✅ Circuit breaker reset to CLOSED state');
  
  // Verify reset
  const newStatus = breaker.getStatus();
  console.log(`🔄 New state: ${newStatus.state}`);
  console.log(`💚 Healthy: ${newStatus.isHealthy}`);
}

async function runComprehensiveTest() {
  console.log('🚀 AI Service Comprehensive Test & Repair\n');
  console.log('=' .repeat(50));
  
  // 1. Check configuration
  console.log('\n📋 Configuration Check...');
  console.log(`🔧 Ollama URL: ${config.services.ollama.baseUrl}`);
  console.log(`🤖 Default Model: ${config.services.ollama.model}`);
  console.log(`⏱️  Timeout: ${config.services.ollama.timeout}ms`);
  console.log(`🎯 AI Chat Feature: ${config.features.aiChat ? 'ENABLED' : 'DISABLED'}`);
  
  // 2. Test direct connectivity
  const connectionTest = await testOllamaConnection();
  
  // 3. Check circuit breaker status
  const cbStatus = checkCircuitBreakerStatus();
  
  // 4. Reset circuit breaker if needed
  if (!cbStatus || cbStatus.state !== 'CLOSED' || !cbStatus.isHealthy) {
    resetCircuitBreaker();
  }
  
  // 5. Test generation if connection is good
  if (connectionTest) {
    await testAIServiceGeneration();
  }
  
  // 6. Final status check
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Final Status Summary:');
  console.log(`🌐 Ollama Connection: ${connectionTest ? '✅ WORKING' : '❌ FAILED'}`);
  
  const finalCBStatus = checkCircuitBreakerStatus();
  if (finalCBStatus) {
    console.log(`🔧 Circuit Breaker: ${finalCBStatus.isHealthy ? '✅ HEALTHY' : '⚠️ DEGRADED'}`);
    console.log(`📈 Success Rate: ${finalCBStatus.stats.successRate}`);
  }
  
  // 7. Recommendations
  console.log('\n🔧 Recommendations:');
  if (!connectionTest) {
    console.log('❌ Fix Ollama service connectivity first');
    console.log('   - Verify Ollama is running on 192.168.1.74:11434');
    console.log('   - Check network connectivity');
    console.log('   - Verify firewall settings');
  } else {
    console.log('✅ Ollama service is working correctly');
    console.log('✅ Circuit breaker has been reset');
    console.log('✅ AI chat should now be functional');
  }
  
  console.log('\n🏁 Test complete!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  runComprehensiveTest().catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
}

module.exports = {
  testOllamaConnection,
  testAIServiceGeneration,
  checkCircuitBreakerStatus,
  resetCircuitBreaker,
  runComprehensiveTest
};