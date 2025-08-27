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

    describe('Tool Permission Management', () => {
        test('should allow tools by default when no restrictions exist', () => {
            const result = framework.isToolAllowed('frontend-agent', 'mcp__eslint__lint-files');
            expect(result).toBe(true);
        });

        test('should enforce explicit denials', () => {
            framework.setRestriction('frontend-agent', 'mcp__docker__*', 'deny');
            const result = framework.isToolAllowed('frontend-agent', 'mcp__docker__start');
            expect(result).toBe(false);
        });

        test('should handle wildcard patterns correctly', () => {
            framework.setRestriction('qa-agent', 'mcp__accessibility__*', 'allow');
            framework.setRestriction('qa-agent', 'mcp__docker__*', 'deny');
            
            expect(framework.isToolAllowed('qa-agent', 'mcp__accessibility__test')).toBe(true);
            expect(framework.isToolAllowed('qa-agent', 'mcp__docker__start')).toBe(false);
        });

        test('should prioritize specific rules over wildcard rules', () => {
            framework.setRestriction('backend-agent', 'mcp__docker__*', 'deny');
            framework.setRestriction('backend-agent', 'mcp__docker__logs', 'allow');
            
            expect(framework.isToolAllowed('backend-agent', 'mcp__docker__logs')).toBe(true);
            expect(framework.isToolAllowed('backend-agent', 'mcp__docker__start')).toBe(false);
        });
    });

    describe('Dynamic Restriction Updates', () => {
        test('should update restrictions dynamically', () => {
            framework.setRestriction('ui-agent', 'mcp__puppeteer__*', 'allow');
            expect(framework.isToolAllowed('ui-agent', 'mcp__puppeteer__screenshot')).toBe(true);
            
            framework.setRestriction('ui-agent', 'mcp__puppeteer__*', 'deny');
            expect(framework.isToolAllowed('ui-agent', 'mcp__puppeteer__screenshot')).toBe(false);
        });

        test('should remove restrictions', () => {
            framework.setRestriction('integration-agent', 'mcp__http__*', 'deny');
            expect(framework.isToolAllowed('integration-agent', 'mcp__http__fetch')).toBe(false);
            
            framework.removeRestriction('integration-agent', 'mcp__http__*');
            expect(framework.isToolAllowed('integration-agent', 'mcp__http__fetch')).toBe(true);
        });
    });

    describe('Configuration Persistence', () => {
        test('should save and load restrictions from file', () => {
            framework.setRestriction('devops-agent', 'mcp__bash__*', 'allow');
            framework.setRestriction('devops-agent', 'mcp__eslint__*', 'deny');
            
            // Create new instance to test loading
            const newFramework = new ToolRestrictionFramework(testConfigPath);
            
            expect(newFramework.isToolAllowed('devops-agent', 'mcp__bash__exec')).toBe(true);
            expect(newFramework.isToolAllowed('devops-agent', 'mcp__eslint__lint')).toBe(false);
        });
    });
});

describe('ToolEnforcementEngine', () => {
    let engine;
    const testLogPath = '.taskmaster/agents/test-tool-usage.log';

    beforeEach(() => {
        // Clean up test files
        if (fs.existsSync(testLogPath)) {
            fs.unlinkSync(testLogPath);
        }
        engine = new ToolEnforcementEngine();
        engine.logPath = testLogPath;
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testLogPath)) {
            fs.unlinkSync(testLogPath);
        }
    });

    describe('Agent Context Management', () => {
        test('should set and track agent context', () => {
            engine.setCurrentAgent('frontend-architect', 'fa-001');
            
            expect(engine.currentAgent.role).toBe('frontend-architect');
            expect(engine.currentAgent.id).toBe('fa-001');
            expect(engine.currentAgent.sessionStart).toBeDefined();
        });

        test('should require agent context for tool enforcement', () => {
            const result = engine.enforceTool('mcp__eslint__lint-files');
            
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('NO_AGENT_CONTEXT');
        });
    });

    describe('Tool Enforcement', () => {
        beforeEach(() => {
            engine.setCurrentAgent('qa-specialist', 'qa-001');
        });

        test('should allow permitted tools', () => {
            // QA specialist should be allowed to use accessibility tools
            engine.framework.setRestriction('qa-specialist', 'mcp__accessibility__*', 'allow');
            
            const result = engine.enforceTool('mcp__accessibility__test');
            
            expect(result.allowed).toBe(true);
            expect(result.agent.role).toBe('qa-specialist');
        });

        test('should deny restricted tools', () => {
            // QA specialist should not use docker tools
            engine.framework.setRestriction('qa-specialist', 'mcp__docker__*', 'deny');
            
            const result = engine.enforceTool('mcp__docker__start');
            
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Tool access denied');
        });

        test('should log all enforcement decisions', () => {
            engine.framework.setRestriction('qa-specialist', 'mcp__puppeteer__*', 'allow');
            
            engine.enforceTool('mcp__puppeteer__screenshot');
            engine.enforceTool('mcp__docker__start'); // This should be denied
            
            expect(engine.auditLog.length).toBe(3); // 1 session start + 2 tool attempts
        });
    });

    describe('Security Reporting', () => {
        beforeEach(() => {
            engine.setCurrentAgent('ui-developer', 'ui-001');
        });

        test('should generate security reports', () => {
            // Simulate some tool usage
            engine.enforceTool('mcp__eslint__lint-files');
            engine.enforceTool('mcp__docker__start'); // Should be denied
            engine.enforceTool('mcp__accessibility__test');
            
            const report = engine.generateSecurityReport();
            
            expect(report.totalAttempts).toBe(3);
            expect(report.deniedAttempts).toBeGreaterThan(0);
            expect(report.allowedAttempts).toBeGreaterThan(0);
            expect(report.violationRate).toBeDefined();
        });

        test('should detect violation patterns', () => {
            // Simulate repeated violations
            for (let i = 0; i < 5; i++) {
                engine.enforceTool('mcp__docker__start');
            }
            
            const violations = engine.detectViolationPatterns();
            
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].toolPattern).toBe('mcp__docker__start');
            expect(violations[0].frequency).toBe(5);
        });
    });

    describe('Parameter Sanitization', () => {
        beforeEach(() => {
            engine.setCurrentAgent('integration-specialist', 'int-001');
        });

        test('should sanitize sensitive parameters', () => {
            const sensitiveParams = {
                apiKey: 'secret-key-123',
                password: 'mypassword',
                token: 'bearer-token-xyz',
                normalParam: 'safe-value'
            };
            
            engine.enforceTool('mcp__http__fetch', sensitiveParams);
            
            const lastLog = engine.auditLog[engine.auditLog.length - 1];
            expect(lastLog.parameters.apiKey).toBe('[REDACTED]');
            expect(lastLog.parameters.password).toBe('[REDACTED]');
            expect(lastLog.parameters.token).toBe('[REDACTED]');
            expect(lastLog.parameters.normalParam).toBe('safe-value');
        });
    });
});

// Integration Tests
describe('Framework Integration', () => {
    let framework;
    let engine;

    beforeEach(() => {
        framework = new ToolRestrictionFramework('.taskmaster/agents/test-integration.json');
        engine = new ToolEnforcementEngine();
        engine.framework = framework;
        engine.logPath = '.taskmaster/agents/test-integration.log';
    });

    afterEach(() => {
        // Cleanup
        const files = [
            '.taskmaster/agents/test-integration.json',
            '.taskmaster/agents/test-integration.log'
        ];
        files.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    test('should integrate framework and engine for complete workflow', () => {
        // Set up agent and restrictions
        engine.setCurrentAgent('server-agent', 'srv-001');
        framework.setRestriction('server-agent', 'mcp__docker__*', 'allow');
        framework.setRestriction('server-agent', 'mcp__task-master-ai__delete_*', 'deny');
        
        // Test allowed tool
        const allowedResult = engine.enforceTool('mcp__docker__start');
        expect(allowedResult.allowed).toBe(true);
        
        // Test denied tool
        const deniedResult = engine.enforceTool('mcp__task-master-ai__delete_task');
        expect(deniedResult.allowed).toBe(false);
        
        // Verify logging
        expect(engine.auditLog.length).toBe(3); // session + 2 tool calls
        
        // Generate report
        const report = engine.generateSecurityReport();
        expect(report.totalAttempts).toBe(2);
        expect(report.allowedAttempts).toBe(1);
        expect(report.deniedAttempts).toBe(1);
    });
}); 