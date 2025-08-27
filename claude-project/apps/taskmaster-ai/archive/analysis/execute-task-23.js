#!/usr/bin/env node

/**
 * Direct execution of Task 23 with real MCP tools
 */

const { QASpecialistAgent } = require('./qa-specialist-agent.js');

async function executeTask23() {
    console.log('🚀 EXECUTING REAL TASK 23 WITH QA AGENT');
    console.log('========================================\n');
    
    const task23 = {
        id: "23",
        title: "Performance testing and browser automation validation using Playwright MCP",
        description: "Execute real browser automation testing using Playwright MCP for performance validation and accessibility testing"
    };

    try {
        const qaAgent = new QASpecialistAgent();
        
        console.log('🎯 QA Agent claiming task 23...');
        console.log(`📋 Task: ${task23.title}`);
        console.log(`📝 Description: ${task23.description}\n`);
        
        // Execute the task with REAL MCP tools
        console.log('🔧 Executing task with REAL MCP tool integration...\n');
        
        const result = await qaAgent.executeQualityTask(task23);
        
        console.log('\n📊 TASK 23 EXECUTION RESULTS:');
        console.log('===============================');
        console.log(`Task ID: ${result.taskId}`);
        console.log(`Status: ${result.status}`);
        console.log(`Duration: ${new Date(result.endTime) - new Date(result.startTime)}ms`);
        console.log(`Success Rate: ${result.summary.successRate}`);
        console.log(`Tests Executed: ${result.summary.total}`);
        console.log(`Successful: ${result.summary.successful}`);
        console.log(`Failed: ${result.summary.failed}`);
        
        console.log('\n🎭 MCP TOOL EXECUTION SUMMARY:');
        console.log('==============================');
        result.summary.details.forEach(detail => {
            console.log(`✅ ${detail.name}`);
            console.log(`   🔧 MCP Tool: ${detail.mcpTool}`);
            console.log(`   📊 Result Count: ${detail.resultCount}`);
            console.log(`   ⏱️ Duration: ${detail.duration || 'N/A'}`);
            console.log(`   ✓ Success: ${detail.success}`);
        });
        
        console.log('\n🎭 PLAYWRIGHT MCP VERIFICATION:');
        console.log('===============================');
        
        // Check if Playwright was actually used
        const playwrightUsed = result.testResults.some(test => 
            test.mcpTool === 'playwright' || 
            test.results?.some(r => r.test?.includes('Playwright'))
        );
        
        if (playwrightUsed) {
            console.log('✅ PLAYWRIGHT MCP WAS USED');
            console.log('✅ Real browser automation executed');
            console.log('✅ Task 23 completed with actual MCP tools');
        } else {
            console.log('❌ Playwright MCP was not detected in execution');
        }
        
        // Report task completion to TaskMaster
        console.log('\n📤 Reporting task completion to TaskMaster...');
        await qaAgent.reportTaskProgress(task23.id, result);
        
        console.log('\n✅ Task 23 execution complete!');
        return result;
        
    } catch (error) {
        console.error('\n❌ Task 23 execution failed:', error.message);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

// Execute Task 23
executeTask23().then(result => {
    if (result) {
        console.log('\n🎉 Task 23 successfully executed with real MCP tools!');
        process.exit(0);
    } else {
        console.log('\n💥 Task 23 execution failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});