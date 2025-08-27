#!/usr/bin/env node

/**
 * Simple test for Accessibility Testing MCP
 * Tests with static HTML content to avoid server dependency
 */

import { AccessibilityTestingMCP } from './index.js';
import fs from 'fs';
import path from 'path';

async function runSimpleTest() {
    console.log('🚀 Starting Simple Accessibility Test...\n');
    
    // Create a simple HTML file for testing
    const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .btn { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        .btn:focus { outline: 2px solid #0056b3; }
        .skip-link { position: absolute; top: -40px; left: 6px; background: #000; color: white; padding: 8px; }
        .skip-link:focus { top: 6px; }
    </style>
</head>
<body>
    <a href="#main" class="skip-link">Skip to main content</a>
    <header>
        <h1>Test Dashboard</h1>
    </header>
    <main id="main">
        <h2>Tasks</h2>
        <button class="btn" onclick="alert('Task started')">Start Task</button>
        <button class="btn" onclick="alert('Task assigned')">Assign Task</button>
        <p>This is a test page for accessibility validation.</p>
    </main>
</body>
</html>`;
    
    const testFile = path.join(process.cwd(), 'test-page.html');
    fs.writeFileSync(testFile, testHtml);
    
    const mcp = new AccessibilityTestingMCP();
    const testUrl = `file://${testFile}`;
    
    try {
        // Test keyboard navigation only (simpler test)
        console.log('⌨️  Testing Keyboard Navigation...');
        console.log('='.repeat(40));
        
        const keyboardResult = await mcp.checkKeyboardNavigation(testUrl);
        const results = JSON.parse(keyboardResult.content[0].text);
        
        console.log('✅ Keyboard navigation test completed');
        console.log('📊 Results:');
        console.log(`   - Focusable elements: ${results.totalFocusableElements}`);
        console.log(`   - Has skip links: ${results.hasSkipLinks}`);
        console.log(`   - Tab sequence length: ${results.tabSequence.length}`);
        console.log(`   - Accessibility score: ${results.accessibilityScore}/100`);
        console.log('💡 Recommendations:');
        results.recommendations.forEach(rec => console.log(`   - ${rec}`));
        
        console.log('\n🎉 Simple test completed successfully!');
        
        // Clean up
        fs.unlinkSync(testFile);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Clean up on error
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSimpleTest();
}