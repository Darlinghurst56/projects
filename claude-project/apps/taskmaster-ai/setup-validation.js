#!/usr/bin/env node

/**
 * TaskMaster AI - Setup Validation Script
 * Validates system setup for new users
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupValidator {
    constructor() {
        this.checks = [];
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'INFO') {
        const colors = {
            INFO: '\x1b[36m',
            SUCCESS: '\x1b[32m',
            WARNING: '\x1b[33m',
            ERROR: '\x1b[31m',
            RESET: '\x1b[0m'
        };
        
        const color = colors[type] || colors.INFO;
        console.log(`${color}[${type}] ${message}${colors.RESET}`);
    }

    addCheck(name, checkFunction) {
        this.checks.push({ name, checkFunction });
    }

    async runCheck(check) {
        try {
            const result = await check.checkFunction();
            if (result.success) {
                this.log(`✓ ${check.name}`, 'SUCCESS');
            } else {
                this.log(`✗ ${check.name}: ${result.message}`, 'ERROR');
                this.errors.push({ check: check.name, message: result.message });
            }
            return result.success;
        } catch (error) {
            this.log(`✗ ${check.name}: ${error.message}`, 'ERROR');
            this.errors.push({ check: check.name, message: error.message });
            return false;
        }
    }

    async validateSetup() {
        this.log('TaskMaster AI - Setup Validation', 'INFO');
        this.log('=====================================', 'INFO');

        // Define validation checks
        this.addCheck('Node.js Version', () => this.checkNodeVersion());
        this.addCheck('NPM Installed', () => this.checkNpm());
        this.addCheck('Dependencies Installed', () => this.checkDependencies());
        this.addCheck('Core Files Present', () => this.checkCoreFiles());
        this.addCheck('Agent Scripts Present', () => this.checkAgentScripts());
        this.addCheck('TaskMaster Directory', () => this.checkTaskMasterDirectory());
        this.addCheck('Port 3001 Available', () => this.checkPortAvailable());
        this.addCheck('CLI Tools Executable', () => this.checkCliTools());

        // Run all checks
        let passedChecks = 0;
        for (const check of this.checks) {
            const success = await this.runCheck(check);
            if (success) passedChecks++;
        }

        // Summary
        this.log('\n=== Validation Summary ===', 'INFO');
        this.log(`Passed: ${passedChecks}/${this.checks.length} checks`, 
                 passedChecks === this.checks.length ? 'SUCCESS' : 'WARNING');

        if (this.errors.length > 0) {
            this.log('\n=== Issues Found ===', 'ERROR');
            this.errors.forEach(error => {
                this.log(`${error.check}: ${error.message}`, 'ERROR');
            });
        }

        if (this.warnings.length > 0) {
            this.log('\n=== Warnings ===', 'WARNING');
            this.warnings.forEach(warning => {
                this.log(`${warning.check}: ${warning.message}`, 'WARNING');
            });
        }

        // Next steps
        this.log('\n=== Next Steps ===', 'INFO');
        if (passedChecks === this.checks.length) {
            this.log('🎉 System is ready! Try:', 'SUCCESS');
            this.log('   npm run workflow:morning', 'INFO');
            this.log('   npm run batch:health-check', 'INFO');
        } else {
            this.log('❌ Please fix the issues above first', 'ERROR');
            this.log('   Check the QUICK_START_GUIDE.md for help', 'INFO');
        }

        return passedChecks === this.checks.length;
    }

    checkNodeVersion() {
        try {
            const version = execSync('node --version', { encoding: 'utf8' }).trim();
            const major = parseInt(version.replace('v', '').split('.')[0]);
            
            if (major >= 18) {
                return { success: true, message: `Node.js ${version} is compatible` };
            } else {
                return { success: false, message: `Node.js ${version} is too old. Need v18.0.0+` };
            }
        } catch (error) {
            return { success: false, message: 'Node.js not found' };
        }
    }

    checkNpm() {
        try {
            const version = execSync('npm --version', { encoding: 'utf8' }).trim();
            return { success: true, message: `npm ${version} is available` };
        } catch (error) {
            return { success: false, message: 'npm not found' };
        }
    }

    checkDependencies() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const nodeModulesExists = fs.existsSync('node_modules');
            
            if (!nodeModulesExists) {
                return { success: false, message: 'Dependencies not installed. Run: npm install' };
            }

            // Check key dependencies
            const keyDeps = ['express', 'cors', 'inquirer', 'chalk'];
            for (const dep of keyDeps) {
                if (!fs.existsSync(`node_modules/${dep}`)) {
                    return { success: false, message: `Missing dependency: ${dep}` };
                }
            }

            return { success: true, message: 'All dependencies installed' };
        } catch (error) {
            return { success: false, message: 'Error checking dependencies' };
        }
    }

    checkCoreFiles() {
        const coreFiles = [
            'app/core/simple-agent-manager.js',
            'app/core/taskmaster-api-server.js',
            'app/cli/batch-operations.js',
            'app/cli/workflow-manager.js'
        ];

        for (const file of coreFiles) {
            if (!fs.existsSync(file)) {
                return { success: false, message: `Missing core file: ${file}` };
            }
        }

        return { success: true, message: 'All core files present' };
    }

    checkAgentScripts() {
        const agentScripts = [
            'app/agents/orchestrator-agent.js',
            'app/agents/frontend-agent.js',
            'app/agents/backend-agent.js',
            'app/agents/devops-agent.js',
            'app/agents/qa-specialist-agent.js'
        ];

        for (const script of agentScripts) {
            if (!fs.existsSync(script)) {
                return { success: false, message: `Missing agent script: ${script}` };
            }
        }

        return { success: true, message: 'All agent scripts present' };
    }

    checkTaskMasterDirectory() {
        if (!fs.existsSync('.taskmaster')) {
            return { success: false, message: '.taskmaster directory missing. Run: mkdir -p .taskmaster/tasks' };
        }

        if (!fs.existsSync('.taskmaster/tasks')) {
            return { success: false, message: '.taskmaster/tasks directory missing' };
        }

        return { success: true, message: 'TaskMaster directory structure exists' };
    }

    checkPortAvailable() {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            server.listen(3001, () => {
                server.close(() => {
                    resolve({ success: true, message: 'Port 3001 is available' });
                });
            });
            server.on('error', () => {
                resolve({ success: false, message: 'Port 3001 is in use. Stop existing processes first.' });
            });
        });
    }

    checkCliTools() {
        try {
            // Check if CLI tools are executable
            const cliTools = [
                'app/cli/batch-operations.js',
                'app/cli/workflow-manager.js'
            ];

            for (const tool of cliTools) {
                if (!fs.existsSync(tool)) {
                    return { success: false, message: `CLI tool missing: ${tool}` };
                }
            }

            return { success: true, message: 'CLI tools are available' };
        } catch (error) {
            return { success: false, message: 'Error checking CLI tools' };
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new SetupValidator();
    validator.validateSetup().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = SetupValidator;