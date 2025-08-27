#!/usr/bin/env node

/**
 * Manual TaskMaster AI Test - Direct API Testing
 * Tests the task creation process manually
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'INFO') {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
}

async function testTaskMasterCLI() {
    log('Testing TaskMaster CLI functionality...', 'TEST');
    
    try {
        // Test if task-master CLI is available
        const result = execSync('task-master --help', { encoding: 'utf8', timeout: 5000 });
        log('✅ TaskMaster CLI is available', 'PASS');
        return true;
    } catch (error) {
        log(`❌ TaskMaster CLI not available: ${error.message}`, 'FAIL');
        return false;
    }
}

async function testTaskCreationWorkflow() {
    log('Testing task creation workflow...', 'TEST');
    
    try {
        // Test task listing
        const listResult = execSync('task-master list', { encoding: 'utf8', timeout: 5000 });
        log('✅ Task listing works', 'PASS');
        
        // Test task creation
        const createResult = execSync('task-master add-task --prompt "E2E Test Task - Family notice board development"', { encoding: 'utf8', timeout: 5000 });
        log('✅ Task creation works', 'PASS');
        
        // Test task listing again to confirm
        const listResult2 = execSync('task-master list', { encoding: 'utf8', timeout: 5000 });
        log('✅ Task creation workflow completed without errors', 'PASS');
        
        return true;
    } catch (error) {
        log(`❌ Task creation workflow failed: ${error.message}`, 'FAIL');
        return false;
    }
}

async function testAgentSystem() {
    log('Testing agent system integration...', 'TEST');
    
    try {
        // Test agent status
        const statusResult = execSync('npm run agents:status', { encoding: 'utf8', timeout: 10000 });
        log('✅ Agent status check works', 'PASS');
        
        return true;
    } catch (error) {
        log(`❌ Agent system test failed: ${error.message}`, 'FAIL');
        return false;
    }
}

async function testSystemValidation() {
    log('Testing system validation...', 'TEST');
    
    try {
        // Test validation script
        const validationResult = execSync('npm run validate', { encoding: 'utf8', timeout: 10000 });
        log('✅ System validation works', 'PASS');
        
        return true;
    } catch (error) {
        log(`❌ System validation failed: ${error.message}`, 'FAIL');
        return false;
    }
}

async function runManualTest() {
    log('🚀 Starting TaskMaster AI Manual Test', 'START');
    log('Testing core functionality without API dependencies', 'INFO');
    
    let passed = 0;
    let failed = 0;
    
    const tests = [
        testTaskMasterCLI,
        testTaskCreationWorkflow,
        testAgentSystem,
        testSystemValidation
    ];
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            log(`❌ Test failed with error: ${error.message}`, 'FAIL');
            failed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('📊 Test Report:', 'REPORT');
    log(`✅ Passed: ${passed}`, 'REPORT');
    log(`❌ Failed: ${failed}`, 'REPORT');
    
    const overallResult = failed === 0 ? 'PASSED' : 'FAILED';
    log(`\n🎯 Overall Result: ${overallResult}`, 'RESULT');
    
    if (failed === 0) {
        log('✅ All tests passed - No errors during task creation process', 'SUCCESS');
        return true;
    } else {
        log('❌ Some tests failed - Errors detected during task creation process', 'FAILURE');
        return false;
    }
}

// Main execution
async function main() {
    try {
        const result = await runManualTest();
        process.exit(result ? 0 : 1);
    } catch (error) {
        console.error('Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runManualTest };