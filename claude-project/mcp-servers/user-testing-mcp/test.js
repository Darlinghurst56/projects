#!/usr/bin/env node

/**
 * Test script for User Testing MCP
 * Tests all user journey validation tools
 */

import { UserTestingMCP } from './index.js';
import fs from 'fs';
import path from 'path';

async function runUserJourneyTests() {
    console.log('🚀 Starting User Journey Testing MCP Tests...\n');
    
    const mcp = new UserTestingMCP();
    const dashboardPath = path.join(process.cwd(), '..', '..', 'dashboard', 'demo-dashboard.html');
    
    if (!fs.existsSync(dashboardPath)) {
        console.error('❌ Dashboard file not found:', dashboardPath);
        return;
    }
    
    const testUrl = `file://${dashboardPath}`;
    
    try {
        // Test 1: Task Assignment Journey
        console.log('🎯 Test 1: Task Assignment Journey');
        console.log('='.repeat(50));
        
        const journeyResult = await mcp.testTaskAssignmentJourney(testUrl, 'urgent');
        const journeyData = JSON.parse(journeyResult.content[0].text);
        
        console.log('📊 Journey Results:');
        console.log(`   - Success: ${journeyData.journey.success ? '✅' : '❌'}`);
        console.log(`   - Steps completed: ${journeyData.journey.steps.length}`);
        console.log(`   - Interactions: ${journeyData.journey.interactions.length}`);
        console.log(`   - Errors: ${journeyData.journey.errors.length}`);
        console.log(`   - Usability score: ${journeyData.metrics.usabilityScore}/100`);
        
        if (journeyData.journey.timings.pageLoad) {
            console.log(`   - Page load time: ${journeyData.journey.timings.pageLoad}ms`);
        }
        
        if (journeyData.journey.errors.length > 0) {
            console.log('❌ Errors found:');
            journeyData.journey.errors.forEach(error => console.log(`   - ${error}`));
        }
        console.log('');
        
        // Test 2: Dashboard Navigation
        console.log('🧭 Test 2: Dashboard Navigation');
        console.log('='.repeat(50));
        
        const navResult = await mcp.testDashboardNavigation(testUrl, 'quick-actions');
        const navData = JSON.parse(navResult.content[0].text);
        
        console.log('📊 Navigation Results:');
        console.log(`   - Scenario: ${navData.scenario}`);
        console.log(`   - Steps completed: ${navData.steps.length}`);
        console.log(`   - Quick actions found: ${navData.usability.quickActionCount || 0}`);
        console.log(`   - Keyboard navigable: ${navData.accessibility.keyboardNavigable ? '✅' : '❌'}`);
        console.log(`   - Has skip links: ${navData.accessibility.hasSkipLinks ? '✅' : '❌'}`);
        console.log(`   - Total time: ${navData.timings.total}ms`);
        console.log('');
        
        // Test 3: User Feedback Flow
        console.log('💬 Test 3: User Feedback Flow');
        console.log('='.repeat(50));
        
        const feedbackResult = await mcp.testUserFeedbackFlow(testUrl, 3);
        const feedbackData = JSON.parse(feedbackResult.content[0].text);
        
        console.log('📊 Feedback Results:');
        console.log(`   - Interactions tested: ${feedbackData.totalInteractions}`);
        console.log(`   - Average response time: ${Math.round(feedbackData.averageResponseTime)}ms`);
        console.log(`   - Feedback quality score: ${feedbackData.feedbackQuality.score}/100`);
        console.log(`   - Excellent feedback: ${feedbackData.feedbackQuality.excellent} interactions`);
        console.log(`   - Good feedback: ${feedbackData.feedbackQuality.good} interactions`);
        console.log(`   - Poor feedback: ${feedbackData.feedbackQuality.poor} interactions`);
        console.log('');
        
        // Test 4: User Experience Validation
        console.log('👤 Test 4: User Experience Validation (New User)');
        console.log('='.repeat(50));
        
        const uxResult = await mcp.validateUserExperience(testUrl, 'new-user');
        const uxData = JSON.parse(uxResult.content[0].text);
        
        console.log('📊 UX Validation Results:');
        console.log(`   - Overall UX score: ${uxData.overallScore}/100`);
        console.log(`   - User type: ${uxData.userType}`);
        console.log(`   - Has clear title: ${uxData.metrics.hasTitle ? '✅' : '❌'}`);
        console.log(`   - Priority visible: ${uxData.metrics.priorityVisible ? '✅' : '❌'}`);
        console.log(`   - Button clarity: ${uxData.metrics.buttonClarityScore}/100`);
        console.log(`   - Text density: ${uxData.metrics.textDensity}`);
        console.log(`   - Visual hierarchy: ${uxData.metrics.visualHierarchy ? '✅' : '❌'}`);
        
        console.log('💪 Strengths:');
        uxData.strengths.forEach(strength => console.log(`   - ${strength}`));
        
        if (uxData.usabilityIssues.length > 0) {
            console.log('⚠️  Issues:');
            uxData.usabilityIssues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (uxData.recommendations.length > 0) {
            console.log('💡 Recommendations:');
            uxData.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        console.log('');
        
        // Overall Summary
        console.log('📋 Overall User Testing Summary');
        console.log('='.repeat(50));
        
        const overallScore = Math.round((
            journeyData.metrics.usabilityScore +
            (navData.accessibility.keyboardNavigable ? 80 : 40) +
            feedbackData.feedbackQuality.score +
            uxData.overallScore
        ) / 4);
        
        console.log(`🎯 Overall User Experience Score: ${overallScore}/100`);
        
        if (overallScore >= 90) {
            console.log('✅ EXCELLENT - Outstanding user experience');
        } else if (overallScore >= 75) {
            console.log('✅ GOOD - Solid user experience with minor improvements needed');
        } else if (overallScore >= 60) {
            console.log('⚠️  FAIR - User experience needs improvement');
        } else {
            console.log('❌ POOR - Significant user experience issues need addressing');
        }
        
        console.log('🎉 User journey testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runUserJourneyTests();
}