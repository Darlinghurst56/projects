/**
 * Tests for Dynamic Tool Restriction Framework
 */

const { ToolRestrictionFramework } = require('../tool-restriction-framework.cjs');
const { ToolEnforcementEngine } = require('../tool-enforcement.cjs');
const fs = require('fs');
const path = require('path');

describe('ToolRestrictionFramework', () => {
    let framework;
    const testConfigPath = '.taskmaster/agents/test-restrictions.json';

    beforeEach(() => {
        // Clean up test files
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
        framework = new ToolRestrictionFramework(testConfigPath);
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
    });

    describe('Tool Permission Checks', () => {
        test('frontend-architect can use allowed tools', () => {
            expect(framework.isToolAllowed('frontend-architect', 'Read')).toBe(true);
            expect(framework.isToolAllowed('frontend-architect', 'mcp__vite__build')).toBe(true);
            expect(framework.isToolAllowed('frontend-architect', 'mcp__eslint__lint')).toBe(true);
        });

        test('frontend-architect cannot use denied tools', () => {
            expect(framework.isToolAllowed('frontend-architect', 'mcp__docker__start')).toBe(false);
            expect(framework.isToolAllowed('frontend-architect', 'mcp__task-master-ai__delete_task')).toBe(false);
        });

        test('ui-developer has appropriate restrictions', () => {
            expect(framework.isToolAllowed('ui-developer', 'mcp__tailwindcss__generate')).toBe(true);
            expect(framework.isToolAllowed('ui-developer', 'mcp__playwright__screenshot')).toBe(true);
            expect(framework.isToolAllowed('ui-developer', 'mcp__docker__deploy')).toBe(false);
        });

        test('integration-specialist has broad access', () => {
            expect(framework.isToolAllowed('integration-specialist', 'mcp__docker__start')).toBe(true);
            expect(framework.isToolAllowed('integration-specialist', 'mcp__http__fetch')).toBe(true);
            expect(framework.isToolAllowed('integration-specialist', 'mcp__task-master-ai__update_task')).toBe(true);
        });

        test('qa-specialist can test but not destroy', () => {
            expect(framework.isToolAllowed('qa-specialist', 'mcp__eslint__lint')).toBe(true);
            expect(framework.isToolAllowed('qa-specialist', 'mcp__playwright__test')).toBe(true);
            expect(framework.isToolAllowed('qa-specialist', 'mcp__task-master-ai__delete_task')).toBe(false);
        });
    });

    describe('Wildcard Pattern Matching', () => {
        test('wildcard patterns work correctly', () => {
            expect(framework.matchesPattern('mcp__vite__build', ['mcp__vite__*'])).toBe(true);
            expect(framework.matchesPattern('mcp__docker__start', ['mcp__vite__*'])).toBe(false);
            expect(framework.matchesPattern('Read', ['Read', 'Write'])).toBe(true);
        });

        test('exact patterns work correctly', () => {
            expect(framework.matchesPattern('Read', ['Read'])).toBe(true);
            expect(framework.matchesPattern('Write', ['Read'])).toBe(false);
        });
    });

    describe('Dynamic Restrictions', () => {
        test('can add new tool restrictions', () => {
            framework.addToolRestriction('frontend-architect', 'mcp__new__tool', 'allowed');
            expect(framework.isToolAllowed('frontend-architect', 'mcp__new__tool')).toBe(true);
        });

        test('can remove tool restrictions', () => {
            framework.addToolRestriction('frontend-architect', 'mcp__test__tool', 'denied');
            expect(framework.isToolAllowed('frontend-architect', 'mcp__test__tool')).toBe(false);
            
            framework.removeToolRestriction('frontend-architect', 'mcp__test__tool');
            expect(framework.isToolAllowed('frontend-architect', 'mcp__test__tool')).toBe(false); // Default deny
        });

        test('tool moves between lists correctly', () => {
            framework.addToolRestriction('frontend-architect', 'mcp__test__tool', 'allowed');
            expect(framework.isToolAllowed('frontend-architect', 'mcp__test__tool')).toBe(true);
            
            framework.addToolRestriction('frontend-architect', 'mcp__test__tool', 'denied');
            expect(framework.isToolAllowed('frontend-architect', 'mcp__test__tool')).toBe(false);
        });
    });

    describe('Report Generation', () => {
        test('generates complete report for all roles', () => {
            const report = framework.generateReport();
            expect(report.timestamp).toBeDefined();
            expect(report.roles).toBeDefined();
            expect(Object.keys(report.roles)).toContain('frontend-architect');
            expect(Object.keys(report.roles)).toContain('integration-specialist');
        });

        test('generates role-specific report', () => {
            const report = framework.generateReport('frontend-architect');
            expect(report.roles['frontend-architect']).toBeDefined();
            expect(report.roles['ui-developer']).toBeUndefined();
        });
    });
});

describe('ToolEnforcementEngine', () => {
    let enforcer;

    beforeEach(() => {
        enforcer = new ToolEnforcementEngine();
    });

    describe('Agent Context Management', () => {
        test('requires agent context for tool enforcement', () => {
            const result = enforcer.enforceTool('Read');
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('NO_AGENT_CONTEXT');
        });

        test('sets agent context correctly', () => {
            enforcer.setCurrentAgent('frontend-architect', 'test-agent-123');
            expect(enforcer.currentAgent.role).toBe('frontend-architect');
            expect(enforcer.currentAgent.id).toBe('test-agent-123');
        });
    });

    describe('Tool Enforcement', () => {
        beforeEach(() => {
            enforcer.setCurrentAgent('frontend-architect');
        });

        test('allows permitted tools', () => {
            const result = enforcer.enforceTool('Read');
            expect(result.allowed).toBe(true);
            expect(result.code).toBe('ALLOWED');
        });

        test('denies restricted tools', () => {
            const result = enforcer.enforceTool('mcp__docker__start');
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('ROLE_RESTRICTION');
        });

        test('logs tool usage activity', () => {
            enforcer.enforceTool('Read');
            enforcer.enforceTool('mcp__docker__start');
            
            const activity = enforcer.getAgentActivity('frontend-architect');
            expect(activity.length).toBeGreaterThan(0);
        });
    });

    describe('Security Reporting', () => {
        beforeEach(() => {
            enforcer.setCurrentAgent('frontend-architect');
            enforcer.enforceTool('Read'); // Allowed
            enforcer.enforceTool('mcp__docker__start'); // Denied
            enforcer.enforceTool('Write'); // Allowed
        });

        test('generates security report', () => {
            const report = enforcer.generateSecurityReport();
            expect(report.summary.allowed).toBeGreaterThan(0);
            expect(report.summary.denied).toBeGreaterThan(0);
            expect(report.summary.violations.length).toBeGreaterThan(0);
        });

        test('tracks agent activity', () => {
            const report = enforcer.generateSecurityReport();
            expect(report.agentActivity['frontend-architect']).toBeDefined();
            expect(report.agentActivity['frontend-architect'].allowed).toBeGreaterThan(0);
            expect(report.agentActivity['frontend-architect'].denied).toBeGreaterThan(0);
        });

        test('tracks tool usage patterns', () => {
            const report = enforcer.generateSecurityReport();
            expect(report.toolUsage['Read']).toBeDefined();
            expect(report.toolUsage['mcp__docker__start']).toBeDefined();
        });
    });

    describe('Violation Pattern Analysis', () => {
        beforeEach(() => {
            enforcer.setCurrentAgent('frontend-architect');
            // Create repeated violations
            enforcer.enforceTool('mcp__docker__start');
            enforcer.enforceTool('mcp__docker__start');
            enforcer.enforceTool('mcp__docker__deploy');
        });

        test('detects repeated violations', () => {
            const patterns = enforcer.getViolationPatterns();
            expect(patterns.repeated.length).toBeGreaterThan(0);
            
            const dockerViolation = patterns.repeated.find(
                r => r.tool === 'mcp__docker__start'
            );
            expect(dockerViolation.count).toBe(2);
        });

        test('groups violations by agent and tool', () => {
            const patterns = enforcer.getViolationPatterns();
            expect(patterns.byAgent['frontend-architect']).toBeGreaterThan(0);
            expect(patterns.byTool['mcp__docker__start']).toBeGreaterThan(0);
        });
    });

    describe('Parameter Sanitization', () => {
        test('sanitizes sensitive parameters', () => {
            const params = {
                file: 'test.txt',
                password: 'secret123',
                apiKey: 'abc123',
                content: 'normal data'
            };

            const sanitized = enforcer.sanitizeParameters(params);
            expect(sanitized.file).toBe('test.txt');
            expect(sanitized.content).toBe('normal data');
            expect(sanitized.password).toBe('[REDACTED]');
            expect(sanitized.apiKey).toBe('[REDACTED]');
        });
    });
});

describe('Integration Tests', () => {
    test('framework and enforcer work together', () => {
        const framework = new ToolRestrictionFramework();
        const enforcer = new ToolEnforcementEngine();
        
        // Set up agent
        enforcer.setCurrentAgent('qa-specialist');
        
        // Test tool enforcement
        const readResult = enforcer.enforceTool('Read');
        const dockerResult = enforcer.enforceTool('mcp__docker__start');
        
        expect(readResult.allowed).toBe(true);
        expect(dockerResult.allowed).toBe(false);
        
        // Generate reports
        const restrictionReport = framework.generateReport('qa-specialist');
        const securityReport = enforcer.generateSecurityReport();
        
        expect(restrictionReport.roles['qa-specialist']).toBeDefined();
        expect(securityReport.agentActivity['qa-specialist']).toBeDefined();
    });
});