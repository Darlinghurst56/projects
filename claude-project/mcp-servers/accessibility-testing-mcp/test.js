#!/usr/bin/env node

/**
 * Test script for Accessibility Testing MCP
 * Tests the three main tools with the improved dashboard
 */

import { AccessibilityTestingMCP } from './index.js';

async function runTests() {
    console.log('🚀 Starting Accessibility Testing MCP Tests...\n');
    
    const mcp = new AccessibilityTestingMCP();
    const testUrl = 'http://localhost:8000/demo-dashboard.html';
    
    try {
        // Test 1: Full accessibility test
        console.log('📋 Test 1: Full Accessibility Test');
        console.log('='.repeat(50));
        
        const accessibilityResult = await mcp.testAccessibility(testUrl);
        console.log('✅ Accessibility test completed');
        console.log('Results:', JSON.parse(accessibilityResult.content[0].text));
        console.log('\n');
        
        // Test 2: Keyboard navigation test
        console.log('⌨️  Test 2: Keyboard Navigation Test');
        console.log('='.repeat(50));
        
        const keyboardResult = await mcp.checkKeyboardNavigation(testUrl);
        console.log('✅ Keyboard navigation test completed');
        console.log('Results:', JSON.parse(keyboardResult.content[0].text));
        console.log('\n');
        
        // Test 3: Color contrast test
        console.log('🎨 Test 3: Color Contrast Test');
        console.log('='.repeat(50));
        
        const contrastResult = await mcp.validateColorContrast(testUrl);
        console.log('✅ Color contrast test completed');
        console.log('Results:', JSON.parse(contrastResult.content[0].text));
        console.log('\n');
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}