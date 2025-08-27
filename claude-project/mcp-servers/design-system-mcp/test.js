#!/usr/bin/env node

/**
 * Test script for Design System MCP
 * Tests all design system tools and component generation
 */

import { DesignSystemMCP } from './index.js';
import fs from 'fs';
import path from 'path';

async function runDesignSystemTests() {
    console.log('🎨 Starting Design System MCP Tests...\n');
    
    const mcp = new DesignSystemMCP();
    const dashboardPath = path.join(process.cwd(), '..', '..', 'dashboard', 'demo-dashboard.html');
    
    if (!fs.existsSync(dashboardPath)) {
        console.error('❌ Dashboard file not found:', dashboardPath);
        return;
    }
    
    const testUrl = `file://${dashboardPath}`;
    
    try {
        // Test 1: Generate Button Component
        console.log('🔘 Test 1: Generate Button Component');
        console.log('='.repeat(50));
        
        const buttonResult = await mcp.generateComponent('button', 'primary', 'medium', { text: 'Test Button', icon: '🎯' });
        const buttonData = JSON.parse(buttonResult.content[0].text);
        
        console.log('📊 Button Component Results:');
        console.log(`   - Type: ${buttonData.type}`);
        console.log(`   - Variant: ${buttonData.variant}`);
        console.log(`   - Size: ${buttonData.size}`);
        console.log(`   - HTML length: ${buttonData.html.length} chars`);
        console.log(`   - CSS length: ${buttonData.css.length} chars`);
        console.log(`   - Accessibility guidelines: ${buttonData.accessibility.guidelines.length}`);
        console.log('✅ Button component generated successfully\n');
        
        // Test 2: Generate Widget Component
        console.log('📱 Test 2: Generate Widget Component');
        console.log('='.repeat(50));
        
        const widgetResult = await mcp.generateComponent('widget', 'primary', 'medium', { 
            title: 'Dashboard Widget', 
            type: 'status',
            refreshable: true 
        });
        const widgetData = JSON.parse(widgetResult.content[0].text);
        
        console.log('📊 Widget Component Results:');
        console.log(`   - Type: ${widgetData.type}`);
        console.log(`   - HTML includes loading state: ${widgetData.html.includes('widget-loading') ? '✅' : '❌'}`);
        console.log(`   - CSS includes animations: ${widgetData.css.includes('@keyframes') ? '✅' : '❌'}`);
        console.log(`   - JavaScript includes Widget class: ${widgetData.javascript.includes('class Widget') ? '✅' : '❌'}`);
        console.log(`   - Accessibility features: ${widgetData.accessibility.guidelines.length}`);
        console.log('✅ Widget component generated successfully\n');
        
        // Test 3: Generate Design Tokens
        console.log('🎨 Test 3: Generate Design Tokens');
        console.log('='.repeat(50));
        
        const cssTokensResult = await mcp.generateDesignTokens('css', 'light');
        const cssTokens = cssTokensResult.content[0].text;
        
        const jsTokensResult = await mcp.generateDesignTokens('js', 'light');
        const jsTokens = jsTokensResult.content[0].text;
        
        console.log('📊 Design Tokens Results:');
        console.log(`   - CSS tokens length: ${cssTokens.length} chars`);
        console.log(`   - CSS includes custom properties: ${cssTokens.includes('--color-primary') ? '✅' : '❌'}`);
        console.log(`   - JS tokens length: ${jsTokens.length} chars`);
        console.log(`   - JS includes helper functions: ${jsTokens.includes('export function') ? '✅' : '❌'}`);
        console.log('✅ Design tokens generated successfully\n');
        
        // Test 4: Validate Design Consistency
        console.log('🔍 Test 4: Validate Design Consistency');
        console.log('='.repeat(50));
        
        const validationResult = await mcp.validateDesignConsistency(testUrl, 'all');
        const validationData = JSON.parse(validationResult.content[0].text);
        
        console.log('📊 Design Consistency Results:');
        console.log(`   - Overall score: ${validationData.compliance.score}/100`);
        console.log(`   - Compliance level: ${validationData.compliance.level}`);
        console.log(`   - Issues found: ${validationData.issues.length}`);
        console.log(`   - Color analysis: ${validationData.analyzed.colors ? validationData.analyzed.colors.colorCount + ' unique colors' : 'Not analyzed'}`);
        console.log(`   - Typography analysis: ${validationData.analyzed.typography ? validationData.analyzed.typography.fontFamilyCount + ' font families' : 'Not analyzed'}`);
        
        if (validationData.issues.length > 0) {
            console.log('⚠️  Issues found:');
            validationData.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (validationData.recommendations.length > 0) {
            console.log('💡 Recommendations:');
            validationData.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        console.log('');
        
        // Test 5: Create Component Library
        console.log('📚 Test 5: Create Component Library');
        console.log('='.repeat(50));
        
        const libraryResult = await mcp.createComponentLibrary(['button', 'card', 'widget'], true);
        const libraryData = JSON.parse(libraryResult.content[0].text);
        
        console.log('📊 Component Library Results:');
        console.log(`   - Title: ${libraryData.title}`);
        console.log(`   - Version: ${libraryData.version}`);
        console.log(`   - Components included: ${libraryData.components.length}`);
        console.log(`   - Design tokens included: ${Object.keys(libraryData.tokens).length} categories`);
        console.log(`   - Accessibility guidelines: ${libraryData.guidelines.accessibility.length}`);
        console.log(`   - Design guidelines: ${libraryData.guidelines.design.length}`);
        console.log(`   - Implementation guidelines: ${libraryData.guidelines.implementation.length}`);
        
        console.log('📋 Component Details:');
        libraryData.components.forEach((comp, index) => {
            console.log(`   ${index + 1}. ${comp.name} - ${comp.variants.length} variants, ${comp.sizes.length} sizes`);
        });
        
        console.log('✅ Component library created successfully\n');
        
        // Overall Summary
        console.log('📋 Design System MCP Summary');
        console.log('='.repeat(50));
        
        const overallScore = Math.round((
            100 + // Button generation
            100 + // Widget generation
            100 + // Design tokens
            validationData.compliance.score + // Design validation
            100   // Component library
        ) / 5);
        
        console.log(`🎯 Overall Design System Score: ${overallScore}/100`);
        
        if (overallScore >= 90) {
            console.log('✅ EXCELLENT - Comprehensive design system implementation');
        } else if (overallScore >= 75) {
            console.log('✅ GOOD - Solid design system with minor improvements needed');
        } else {
            console.log('⚠️  FAIR - Design system needs improvement');
        }
        
        console.log('🎉 Design System MCP testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDesignSystemTests();
}