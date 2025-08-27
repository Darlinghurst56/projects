/**
 * PIN Authentication Security Test Runner (Node.js)
 * QA Specialist Implementation - Security Analysis
 */

const fs = require('fs');
const path = require('path');

class PinAuthSecurityAnalyzer {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        this.securityFindings = [];
    }

    /**
     * Run comprehensive security analysis
     */
    async runSecurityAnalysis() {
        console.log('🔐 Starting PIN Authentication Security Analysis');
        
        try {
            // Analyze authentication implementation
            await this.analyzeAuthImplementation();
            
            // Analyze security configurations
            await this.analyzeSecurityConfig();
            
            // Analyze session management
            await this.analyzeSessionManagement();
            
            // Analyze protection mechanisms
            await this.analyzeProtectionMechanisms();
            
            // Generate security report
            const report = this.generateSecurityReport();
            console.log('\n🔐 Security Analysis Report Generated');
            
            return report;
            
        } catch (error) {
            console.error('❌ Security analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze authentication implementation
     */
    async analyzeAuthImplementation() {
        this.logTest('auth_implementation', 'Analyzing authentication implementation');

        try {
            const authContextPath = './src/contexts/AuthContext.jsx';
            
            if (!fs.existsSync(authContextPath)) {
                this.logTest('auth_implementation', 'AuthContext.jsx not found', 'error');
                return;
            }

            const authContent = fs.readFileSync(authContextPath, 'utf8');

            // Security analysis checks
            const securityChecks = {
                bcryptUsed: authContent.includes('bcrypt') || authContent.includes('bcryptjs'),
                saltRounds: authContent.includes('saltRounds') || authContent.includes('10'),
                sessionTimeout: authContent.includes('INACTIVITY_TIMEOUT') || authContent.includes('30 * 60 * 1000'),
                sessionStorage: authContent.includes('SESSION_STORAGE_KEY'),
                rememberDevice: authContent.includes('REMEMBER_DEVICE_KEY'),
                activityListeners: authContent.includes('addEventListener'),
                errorHandling: authContent.includes('try') && authContent.includes('catch'),
                inputValidation: authContent.includes('validation') || authContent.includes('validate'),
                clearSession: authContent.includes('clearSession') || authContent.includes('removeItem'),
                cryptoSecurity: authContent.includes('hash') && authContent.includes('compare')
            };

            let passedChecks = 0;
            Object.entries(securityChecks).forEach(([check, passed]) => {
                if (passed) {
                    passedChecks++;
                    this.logTest('auth_implementation', `✅ ${check}: Implemented`, 'success');
                } else {
                    this.logTest('auth_implementation', `❌ ${check}: Not found`, 'warning');
                }
            });

            // Check for security vulnerabilities
            this.checkSecurityVulnerabilities(authContent);

            const implementationScore = (passedChecks / Object.keys(securityChecks).length * 100).toFixed(1);
            this.logTest('auth_implementation', `Authentication implementation score: ${implementationScore}%`, 
                implementationScore >= 80 ? 'success' : 'warning');

        } catch (error) {
            this.logTest('auth_implementation', `Authentication analysis failed: ${error.message}`, 'error');
        }
    }

    /**
     * Check for common security vulnerabilities
     */
    checkSecurityVulnerabilities(code) {
        const vulnerabilityChecks = [
            {
                name: 'Plain text storage',
                pattern: /localStorage\.setItem.*['"]\d{4}['"]/,
                severity: 'high',
                description: 'PIN stored in plain text'
            },
            {
                name: 'Weak hashing',
                pattern: /md5|sha1(?!256)/,
                severity: 'high',
                description: 'Weak cryptographic hash algorithm used'
            },
            {
                name: 'SQL injection risk',
                pattern: /query.*\+.*input|exec.*\+/,
                severity: 'high',
                description: 'Potential SQL injection vulnerability'
            },
            {
                name: 'XSS vulnerability',
                pattern: /innerHTML.*\+|dangerouslySetInnerHTML/,
                severity: 'medium',
                description: 'Potential XSS vulnerability'
            },
            {
                name: 'Hardcoded secrets',
                pattern: /password.*=.*['"][^'"]{8,}['"]/,
                severity: 'high',
                description: 'Hardcoded password or secret found'
            }
        ];

        vulnerabilityChecks.forEach(check => {
            if (check.pattern.test(code)) {
                this.securityFindings.push({
                    type: 'vulnerability',
                    name: check.name,
                    severity: check.severity,
                    description: check.description
                });
                this.logTest('security_vulnerability', `⚠️ ${check.name}: ${check.description}`, 'warning');
            }
        });
    }

    /**
     * Analyze security configuration
     */
    async analyzeSecurityConfig() {
        this.logTest('security_config', 'Analyzing security configuration');

        try {
            const authContextPath = './src/contexts/AuthContext.jsx';
            
            if (!fs.existsSync(authContextPath)) {
                this.logTest('security_config', 'Configuration file not found', 'error');
                return;
            }

            const content = fs.readFileSync(authContextPath, 'utf8');

            // Extract security configuration values
            const config = this.extractSecurityConfig(content);

            // Validate security configuration
            const configValidation = {
                sessionTimeout: config.sessionTimeout >= 1800000, // 30 minutes minimum
                saltRounds: config.saltRounds >= 10, // Minimum 10 salt rounds
                storageKeys: config.storageKeys.length >= 2, // Multiple storage keys used
                errorHandling: config.hasErrorHandling,
                activityTracking: config.hasActivityTracking
            };

            let validConfigs = 0;
            Object.entries(configValidation).forEach(([configItem, isValid]) => {
                if (isValid) {
                    validConfigs++;
                    this.logTest('security_config', `✅ ${configItem}: Valid configuration`, 'success');
                } else {
                    this.logTest('security_config', `❌ ${configItem}: Invalid or weak configuration`, 'warning');
                }
            });

            const configScore = (validConfigs / Object.keys(configValidation).length * 100).toFixed(1);
            this.logTest('security_config', `Security configuration score: ${configScore}%`, 
                configScore >= 80 ? 'success' : 'warning');

        } catch (error) {
            this.logTest('security_config', `Security configuration analysis failed: ${error.message}`, 'error');
        }
    }

    /**
     * Extract security configuration from code
     */
    extractSecurityConfig(content) {
        const config = {
            sessionTimeout: 0,
            saltRounds: 0,
            storageKeys: [],
            hasErrorHandling: false,
            hasActivityTracking: false
        };

        // Extract session timeout
        const timeoutMatch = content.match(/INACTIVITY_TIMEOUT\s*=\s*(\d+)/);
        if (timeoutMatch) {
            config.sessionTimeout = parseInt(timeoutMatch[1]);
        }

        // Extract salt rounds
        const saltMatch = content.match(/saltRounds.*=\s*(\d+)/);
        if (saltMatch) {
            config.saltRounds = parseInt(saltMatch[1]);
        }

        // Extract storage keys
        const storageKeyMatches = content.match(/_STORAGE_KEY\s*=\s*['"][^'"]+['"]/g);
        if (storageKeyMatches) {
            config.storageKeys = storageKeyMatches;
        }

        // Check for error handling
        config.hasErrorHandling = content.includes('try') && content.includes('catch');

        // Check for activity tracking
        config.hasActivityTracking = content.includes('addEventListener') && content.includes('activity');

        return config;
    }

    /**
     * Analyze session management
     */
    async analyzeSessionManagement() {
        this.logTest('session_management', 'Analyzing session management implementation');

        try {
            const authContextPath = './src/contexts/AuthContext.jsx';
            
            if (!fs.existsSync(authContextPath)) {
                this.logTest('session_management', 'Session management file not found', 'error');
                return;
            }

            const content = fs.readFileSync(authContextPath, 'utf8');

            // Session management checks
            const sessionChecks = {
                sessionCreation: content.includes('sessionId') || content.includes('createSession'),
                sessionValidation: content.includes('expiresAt') || content.includes('sessionData'),
                sessionClearing: content.includes('clearSession') || content.includes('removeItem'),
                inactivityTimer: content.includes('resetInactivityTimer') || content.includes('setTimeout'),
                activityListeners: content.includes('addEventListener') && content.includes('mousedown'),
                sessionStorage: content.includes('localStorage') || content.includes('sessionStorage'),
                sessionTimeout: content.includes('INACTIVITY_TIMEOUT'),
                sessionPersistence: content.includes('REMEMBER_DEVICE')
            };

            let passedSessionChecks = 0;
            Object.entries(sessionChecks).forEach(([check, passed]) => {
                if (passed) {
                    passedSessionChecks++;
                    this.logTest('session_management', `✅ ${check}: Implemented`, 'success');
                } else {
                    this.logTest('session_management', `❌ ${check}: Not implemented`, 'warning');
                }
            });

            const sessionScore = (passedSessionChecks / Object.keys(sessionChecks).length * 100).toFixed(1);
            this.logTest('session_management', `Session management score: ${sessionScore}%`, 
                sessionScore >= 80 ? 'success' : 'warning');

        } catch (error) {
            this.logTest('session_management', `Session management analysis failed: ${error.message}`, 'error');
        }
    }

    /**
     * Analyze protection mechanisms
     */
    async analyzeProtectionMechanisms() {
        this.logTest('protection_mechanisms', 'Analyzing protection mechanisms');

        try {
            // Check React components for protection
            const components = ['PinLogin.jsx', 'PinSettings.jsx', 'ProtectedRoute.jsx'];
            let protectionScore = 0;
            
            for (const component of components) {
                const componentPath = `./src/components/${component}`;
                if (fs.existsSync(componentPath)) {
                    const content = fs.readFileSync(componentPath, 'utf8');
                    
                    const protectionChecks = {
                        inputValidation: content.includes('validation') || content.includes('validate'),
                        errorHandling: content.includes('try') && content.includes('catch'),
                        stateManagement: content.includes('useState') || content.includes('state'),
                        accessControl: content.includes('isAuthenticated') || content.includes('auth'),
                        loadingStates: content.includes('loading') || content.includes('Loading')
                    };

                    let componentProtections = 0;
                    Object.entries(protectionChecks).forEach(([check, passed]) => {
                        if (passed) {
                            componentProtections++;
                        }
                    });

                    const componentScore = (componentProtections / Object.keys(protectionChecks).length * 100).toFixed(1);
                    this.logTest('protection_mechanisms', `${component} protection score: ${componentScore}%`, 
                        componentScore >= 60 ? 'success' : 'warning');
                    
                    protectionScore += parseFloat(componentScore);
                } else {
                    this.logTest('protection_mechanisms', `${component} not found`, 'warning');
                }
            }

            const avgProtectionScore = (protectionScore / components.length).toFixed(1);
            this.logTest('protection_mechanisms', `Average protection score: ${avgProtectionScore}%`, 
                avgProtectionScore >= 70 ? 'success' : 'warning');

        } catch (error) {
            this.logTest('protection_mechanisms', `Protection mechanism analysis failed: ${error.message}`, 'error');
        }
    }

    /**
     * Generate comprehensive security report
     */
    generateSecurityReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'success').length;
        const failedTests = this.testResults.filter(r => r.status === 'error').length;
        const warningTests = this.testResults.filter(r => r.status === 'warning').length;
        const score = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        const report = {
            type: 'security_analysis',
            summary: {
                totalTests,
                passedTests,
                failedTests,
                warningTests,
                score: parseFloat(score),
                duration,
                timestamp: new Date().toISOString()
            },
            security: {
                findings: this.securityFindings,
                vulnerabilities: this.securityFindings.filter(f => f.type === 'vulnerability'),
                recommendations: this.generateSecurityRecommendations()
            },
            details: this.testResults
        };

        // Log summary
        console.log('\n🔐 SECURITY ANALYSIS SUMMARY');
        console.log('============================');
        console.log(`Overall Score: ${score}%`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Warnings: ${warningTests}`);
        console.log(`Security Findings: ${this.securityFindings.length}`);
        console.log(`Duration: ${duration}ms`);

        if (this.securityFindings.length > 0) {
            console.log('\n⚠️ SECURITY FINDINGS:');
            this.securityFindings.forEach(finding => {
                console.log(`  - ${finding.severity.toUpperCase()}: ${finding.name} - ${finding.description}`);
            });
        }

        return report;
    }

    /**
     * Generate security recommendations
     */
    generateSecurityRecommendations() {
        const recommendations = [];

        if (this.securityFindings.length > 0) {
            const highSeverity = this.securityFindings.filter(f => f.severity === 'high');
            if (highSeverity.length > 0) {
                recommendations.push({
                    type: 'critical',
                    priority: 'high',
                    message: `${highSeverity.length} high severity security issues require immediate attention`
                });
            }
        }

        // General security recommendations
        recommendations.push({
            type: 'security_headers',
            priority: 'medium',
            message: 'Implement security headers (CSP, HSTS, X-Frame-Options)'
        });

        recommendations.push({
            type: 'audit_logging',
            priority: 'medium',
            message: 'Implement comprehensive audit logging for authentication events'
        });

        recommendations.push({
            type: 'penetration_testing',
            priority: 'low',
            message: 'Conduct regular security assessments and penetration testing'
        });

        return recommendations;
    }

    /**
     * Log test result
     */
    logTest(test, message, status = 'info') {
        const logEntry = {
            test,
            message,
            status,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(logEntry);
        
        const statusSymbol = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        console.log(`${statusSymbol[status] || 'ℹ️'} [${test}] ${message}`);
    }
}

// Run security analysis if called directly
if (require.main === module) {
    const securityAnalyzer = new PinAuthSecurityAnalyzer();
    securityAnalyzer.runSecurityAnalysis()
        .then(report => {
            console.log('\n🎉 Security analysis completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Security analysis failed:', error);
            process.exit(1);
        });
}

module.exports = PinAuthSecurityAnalyzer;