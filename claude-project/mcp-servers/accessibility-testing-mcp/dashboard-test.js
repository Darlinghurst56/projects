#!/usr/bin/env node

/**
 * Test Accessibility MCP with the improved dashboard
 * Tests the demo-dashboard.html file directly
 */

import { AccessibilityTestingMCP } from './index.js';
import fs from 'fs';
import path from 'path';

async function testDashboard() {
    console.log('🚀 Testing Improved Dashboard Accessibility...\n');
    
    const mcp = new AccessibilityTestingMCP();
    const dashboardPath = path.join(process.cwd(), '..', '..', 'dashboard', 'demo-dashboard.html');
    
    if (!fs.existsSync(dashboardPath)) {
        console.error('❌ Dashboard file not found:', dashboardPath);
        return;
    }
    
    const testUrl = `file://${dashboardPath}`;
    
    try {
        // Test 1: Keyboard navigation
        console.log('⌨️  Test 1: Keyboard Navigation Analysis');
        console.log('='.repeat(50));
        
        const keyboardResult = await mcp.checkKeyboardNavigation(testUrl);
        const keyboardData = JSON.parse(keyboardResult.content[0].text);
        
        console.log('📊 Keyboard Navigation Results:');
        console.log(`   - Total focusable elements: ${keyboardData.totalFocusableElements}`);
        console.log(`   - Has skip links: ${keyboardData.hasSkipLinks ? '✅' : '❌'}`);
        console.log(`   - Tab sequence captured: ${keyboardData.tabSequence.length} elements`);
        console.log(`   - Accessibility score: ${keyboardData.accessibilityScore}/100`);
        
        if (keyboardData.tabSequence.length > 0) {
            console.log('🔍 Tab sequence:');
            keyboardData.tabSequence.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.tag}${item.id ? '#' + item.id : ''} - "${item.text}"`);
            });
        }
        
        console.log('💡 Recommendations:');
        keyboardData.recommendations.forEach(rec => console.log(`   - ${rec}`));
        console.log('');
        
        // Test 2: Color contrast
        console.log('🎨 Test 2: Color Contrast Analysis');
        console.log('='.repeat(50));
        
        const contrastResult = await mcp.validateColorContrast(testUrl);
        const contrastData = JSON.parse(contrastResult.content[0].text);
        
        console.log('📊 Color Contrast Results:');
        console.log(`   - Elements checked: ${contrastData.elementsChecked}`);
        console.log(`   - Potential issues: ${contrastData.potentialIssues}`);
        
        console.log('💡 Recommendations:');
        contrastData.recommendations.forEach(rec => console.log(`   - ${rec}`));
        console.log('');
        
        // Summary
        console.log('📋 Dashboard Accessibility Summary');
        console.log('='.repeat(50));
        
        const overallScore = Math.round((keyboardData.accessibilityScore + 
            (contrastData.potentialIssues === 0 ? 100 : 70)) / 2);
        
        console.log(`🎯 Overall Accessibility Score: ${overallScore}/100`);
        
        if (overallScore >= 90) {
            console.log('✅ EXCELLENT - Dashboard meets high accessibility standards');
        } else if (overallScore >= 70) {
            console.log('⚠️  GOOD - Dashboard is accessible but has room for improvement');
        } else {
            console.log('❌ NEEDS WORK - Dashboard requires accessibility improvements');
        }
        
        console.log('🎉 Dashboard accessibility test completed!');
        
    } catch (error) {
        console.error('❌ Dashboard test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDashboard();
}