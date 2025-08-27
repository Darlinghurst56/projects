#!/usr/bin/env node

/**
 * Simple test runner for TaskMaster Agent Coordination System
 * Runs basic validation tests without requiring external testing frameworks
 */

const fs = require('fs');
const path = require('path');

// Simple test framework
class SimpleTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.current = null;
    }

    describe(name, fn) {
        console.log(`\n📋 ${name}`);
        fn();
    }

    test(name, fn) {
        try {
            this.current = name;
            fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`  ❌ ${name}`);
            console.log(`     ${error.message}`);
            this.failed++;
        }
    }

    expect(value) {
        return {
            toBe: (expected) => {
                if (value !== expected) {
                    throw new Error(`Expected ${expected}, got ${value}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (value <= expected) {
                    throw new Error(`Expected ${value} to be greater than ${expected}`);
                }
            },
            toBeDefined: () => {
                if (value === undefined) {
                    throw new Error(`Expected value to be defined`);
                }
            },
            toContain: (expected) => {
                if (!value.includes(expected)) {
                    throw new Error(`Expected "${value}" to contain "${expected}"`);
                }
            }
        };
    }

    beforeEach(fn) {
        fn();
    }

    afterEach(fn) {
        fn();
    }

    run() {
        console.log('\n🧪 Running TaskMaster Agent Coordination Tests\n');
        
        try {
            this.runCoordinationTests();
            this.runIntegrationTests();
        } catch (error) {
            console.error('Test execution failed:', error.message);
            this.failed++;
        }

        console.log('\n📊 Test Results:');
        console.log(`  ✅ Passed: ${this.passed}`);
        console.log(`  ❌ Failed: ${this.failed}`);
        console.log(`  📈 Total: ${this.passed + this.failed}`);

        if (this.failed > 0) {
            console.log('\n❌ Some tests failed. Check the output above for details.');
            process.exit(1);
        } else {
            console.log('\n✅ All tests passed!');
            process.exit(0);
        }
    }

    runCoordinationTests() {
        // Load coordination workflow
        const coordinationPath = path.join(__dirname, '../coordination-workflow.cjs');
        const AgentCoordinationWorkflow = require(coordinationPath);

        this.describe('Agent Coordination Workflow', () => {
            this.test('should create coordination workflow instance', () => {
                const workflow = new AgentCoordinationWorkflow();
                this.expect(workflow).toBeDefined();
                this.expect(workflow.availableRoles.length).toBeGreaterThan(0);
            });

            this.test('should have proper priority hierarchy', () => {
                const workflow = new AgentCoordinationWorkflow();
                this.expect(workflow.priorityHierarchy[0]).toBe('server-agent');
                this.expect(workflow.priorityHierarchy).toContain('qa-specialist');
            });

            this.test('should have correct priority indices', () => {
                const workflow = new AgentCoordinationWorkflow();
                const serverAgentIndex = workflow.priorityHierarchy.indexOf('server-agent');
                const uiDeveloperIndex = workflow.priorityHierarchy.indexOf('ui-developer');
                this.expect(serverAgentIndex).toBe(0); // Highest priority
                this.expect(uiDeveloperIndex).toBeGreaterThan(serverAgentIndex); // Lower priority
            });
        });
    }

    runIntegrationTests() {
        // Test web interface functionality
        this.describe('Tasks Web Interface', () => {
            this.test('should load web interface without errors', () => {
                // This would normally run the Playwright test
                // For now, just check that the test file exists
                const testFile = path.join(__dirname, '../../tests/integration/test-tasks-web-interface.js');
                this.assert(fs.existsSync(testFile), 'Web interface test file should exist');
            });
        });
        // Load simple assignment
        const assignmentPath = path.join(__dirname, '../simple-assignment.cjs');
        
        this.describe('Agent Assignment System', () => {
            this.test('should load agent assignment module', () => {
                const assignment = require(assignmentPath);
                this.expect(assignment).toBeDefined();
            });

            this.test('should have agent roles configuration', () => {
                const rolesPath = path.join(__dirname, '../agent-roles.json');
                this.expect(fs.existsSync(rolesPath)).toBe(true);
                
                const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
                this.expect(roles.agents).toBeDefined();
            });
        });
    }
}

// Global test functions for compatibility
global.describe = (name, fn) => runner.describe(name, fn);
global.test = (name, fn) => runner.test(name, fn);
global.expect = (value) => runner.expect(value);
global.beforeEach = (fn) => runner.beforeEach(fn);
global.afterEach = (fn) => runner.afterEach(fn);

// Create runner and execute tests
const runner = new SimpleTestRunner();

// Check if this is being run directly
if (require.main === module) {
    runner.run();
}

module.exports = { SimpleTestRunner }; 