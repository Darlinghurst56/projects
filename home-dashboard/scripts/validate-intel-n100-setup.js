#!/usr/bin/env node

/**
 * Intel N100 Setup Validation Script
 * Validates all optimizations are properly configured
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IntelN100Validator {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    
    console.log(`${this.getIcon(type)} ${message}`);
    this.results.push(logEntry);
    
    if (type === 'error') this.errors.push(logEntry);
    if (type === 'warning') this.warnings.push(logEntry);
  }

  getIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️ ';
      case 'info': return 'ℹ️ ';
      default: return '📋';
    }
  }

  async validateSystemSpecs() {
    this.log('=== System Specifications ===');
    
    try {
      const cpus = os.cpus();
      const totalMemGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      
      this.log(`CPU: ${cpus[0].model}`, 'info');
      this.log(`Cores: ${cpus.length}`, 'info');
      this.log(`Total Memory: ${totalMemGB}GB`, 'info');
      
      // Validate Intel N100 characteristics
      if (cpus[0].model.includes('N100')) {
        this.log('Intel N100 processor detected', 'success');
      } else {
        this.log('Non-Intel N100 processor detected - optimizations may need adjustment', 'warning');
      }
      
      if (cpus.length === 4) {
        this.log('4-core configuration confirmed', 'success');
      } else {
        this.log(`Expected 4 cores, found ${cpus.length}`, 'warning');
      }
      
      if (totalMemGB >= 7) {
        this.log(`${totalMemGB}GB memory sufficient for Intel N100 development`, 'success');
      } else {
        this.log(`${totalMemGB}GB may be insufficient for development`, 'warning');
      }
      
    } catch (error) {
      this.log(`Failed to validate system specs: ${error.message}`, 'error');
    }
  }

  async validateNodeJSConfig() {
    this.log('\\n=== Node.js Configuration ===');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      this.log(`Node.js version: ${nodeVersion}`, 'info');
      
      // Check V8 heap limit
      const stats = require('v8').getHeapStatistics();
      const heapLimitMB = Math.round(stats.heap_size_limit / 1024 / 1024);
      
      this.log(`V8 heap limit: ${heapLimitMB}MB`, 'info');
      
      if (heapLimitMB >= 2000 && heapLimitMB <= 2200) {
        this.log('Node.js memory limit optimized for Intel N100', 'success');
      } else {
        this.log(`Memory limit ${heapLimitMB}MB may not be optimal for Intel N100`, 'warning');
      }
      
    } catch (error) {
      this.log(`Failed to validate Node.js config: ${error.message}`, 'error');
    }
  }

  async validateProjectFiles() {
    this.log('\\n=== Project Configuration Files ===');
    
    const requiredFiles = [
      'package.json',
      'vite.config.js',
      'nodemon.json',
      '.intel-n100.env',
      'scripts/performance-monitor.js',
      'scripts/start-intel-n100-dev.sh',
      'concurrently.config.js'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.log(`${file} exists`, 'success');
        
        // Additional validation for specific files
        if (file === 'package.json') {
          await this.validatePackageJson();
        }
        if (file === 'vite.config.js') {
          await this.validateViteConfig();
        }
        if (file === 'scripts/start-intel-n100-dev.sh') {
          await this.validateStartScript();
        }
      } else {
        this.log(`${file} missing`, 'error');
      }
    }
  }

  async validatePackageJson() {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check for Intel N100 optimized scripts
      const expectedScripts = [
        'dev:performance',
        'server:dev:optimized',
        'client:dev:optimized',
        'monitor:performance'
      ];
      
      let foundOptimizedScripts = 0;
      for (const script of expectedScripts) {
        if (pkg.scripts[script]) {
          foundOptimizedScripts++;
        }
      }
      
      if (foundOptimizedScripts >= 3) {
        this.log('Package.json contains Intel N100 optimized scripts', 'success');
      } else {
        this.log('Package.json missing some Intel N100 optimized scripts', 'warning');
      }
      
    } catch (error) {
      this.log(`Failed to validate package.json: ${error.message}`, 'error');
    }
  }

  async validateViteConfig() {
    try {
      const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
      
      // Check for Intel N100 specific optimizations
      const optimizations = [
        'Intel N100',
        'watch:',
        'usePolling: false',
        "target: 'es2018'",
        'maxParallelFileOps: 2'
      ];
      
      let foundOptimizations = 0;
      for (const optimization of optimizations) {
        if (viteConfig.includes(optimization)) {
          foundOptimizations++;
        }
      }
      
      if (foundOptimizations >= 4) {
        this.log('Vite config contains Intel N100 optimizations', 'success');
      } else {
        this.log('Vite config may be missing Intel N100 optimizations', 'warning');
      }
      
    } catch (error) {
      this.log(`Failed to validate vite.config.js: ${error.message}`, 'error');
    }
  }

  async validateStartScript() {
    try {
      const script = fs.readFileSync('scripts/start-intel-n100-dev.sh', 'utf8');
      
      if (script.includes('Intel N100') && script.includes('--max-old-space-size=2048')) {
        this.log('Start script contains Intel N100 optimizations', 'success');
      } else {
        this.log('Start script may be missing Intel N100 optimizations', 'warning');
      }
      
      // Check if script is executable
      try {
        const stats = fs.statSync('scripts/start-intel-n100-dev.sh');
        if (stats.mode & 0o111) {
          this.log('Start script is executable', 'success');
        } else {
          this.log('Start script is not executable', 'error');
        }
      } catch (e) {
        this.log('Could not check script permissions', 'warning');
      }
      
    } catch (error) {
      this.log(`Failed to validate start script: ${error.message}`, 'error');
    }
  }

  async validatePortAvailability() {
    this.log('\\n=== Port Availability ===');
    
    const ports = [3000, 3003, 9222];
    
    for (const port of ports) {
      try {
        // Use ss command to check port availability
        const result = execSync(`ss -tlnp | grep :${port} || echo "PORT_AVAILABLE"`, 
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        
        if (result.includes('PORT_AVAILABLE')) {
          this.log(`Port ${port} is available`, 'success');
        } else {
          this.log(`Port ${port} is in use`, 'warning');
          this.log(`   ${result.trim()}`, 'info');
        }
      } catch (error) {
        this.log(`Could not check port ${port}: ${error.message}`, 'warning');
      }
    }
  }

  async validateDependencies() {
    this.log('\\n=== Dependencies ===');
    
    try {
      // Check if node_modules exists
      if (fs.existsSync('node_modules')) {
        this.log('node_modules directory exists', 'success');
        
        // Check for key dependencies
        const keyDeps = ['concurrently', 'vite', 'nodemon'];
        for (const dep of keyDeps) {
          if (fs.existsSync(`node_modules/${dep}`)) {
            this.log(`${dep} installed`, 'success');
          } else {
            this.log(`${dep} not found`, 'error');
          }
        }
      } else {
        this.log('node_modules not found - run npm install', 'error');
      }
    } catch (error) {
      this.log(`Failed to validate dependencies: ${error.message}`, 'error');
    }
  }

  async validateEnvironmentVariables() {
    this.log('\\n=== Environment Variables ===');
    
    try {
      // Load Intel N100 environment file
      if (fs.existsSync('.intel-n100.env')) {
        const envContent = fs.readFileSync('.intel-n100.env', 'utf8');
        const envVars = envContent.split('\n')
          .filter(line => line.includes('=') && !line.startsWith('#'))
          .map(line => line.split('=')[0]);
        
        this.log(`Found ${envVars.length} environment variables in .intel-n100.env`, 'success');
        
        // Check for key variables
        const keyVars = ['NODE_OPTIONS', 'UV_THREADPOOL_SIZE', 'CHOKIDAR_USEPOLLING'];
        for (const envVar of keyVars) {
          if (envVars.includes(envVar)) {
            this.log(`${envVar} configured`, 'success');
          } else {
            this.log(`${envVar} not found in environment`, 'warning');
          }
        }
      } else {
        this.log('.intel-n100.env file not found', 'error');
      }
    } catch (error) {
      this.log(`Failed to validate environment variables: ${error.message}`, 'error');
    }
  }

  async generateReport() {
    this.log('\\n' + '='.repeat(60));
    this.log('INTEL N100 VALIDATION SUMMARY');
    this.log('='.repeat(60));
    
    const totalChecks = this.results.length;
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;
    
    this.log(`Total checks: ${totalChecks}`, 'info');
    this.log(`Successful: ${successCount}`, 'success');
    this.log(`Warnings: ${warningCount}`, 'warning');
    this.log(`Errors: ${errorCount}`, errorCount > 0 ? 'error' : 'info');
    
    const successRate = Math.round((successCount / totalChecks) * 100);
    this.log(`Success rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
    
    if (errorCount === 0 && warningCount <= 2) {
      this.log('\\n🎉 Intel N100 optimization setup is ready!', 'success');
      this.log('Run: ./scripts/start-intel-n100-dev.sh', 'info');
    } else if (errorCount === 0) {
      this.log('\\n⚠️  Setup is functional with warnings', 'warning');
      this.log('Review warnings above and consider fixes', 'info');
    } else {
      this.log('\\n❌ Setup has errors that need to be fixed', 'error');
      this.log('Address errors above before starting development servers', 'info');
    }
    
    // Save report to file
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        nodeVersion: process.version
      },
      validation: {
        totalChecks: this.results.length,
        successful: this.results.filter(r => r.type === 'success').length,
        warnings: this.warnings.length,
        errors: this.errors.length,
        successRate: Math.round((this.results.filter(r => r.type === 'success').length / this.results.length) * 100)
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings
    };
    
    const reportsDir = path.join(__dirname, '../validation-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `intel-n100-validation-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    this.log(`\\n📄 Detailed report saved to: ${filepath}`, 'info');
  }

  async runAllValidations() {
    this.log('🔍 Starting Intel N100 Setup Validation\\n');
    
    await this.validateSystemSpecs();
    await this.validateNodeJSConfig();
    await this.validateProjectFiles();
    await this.validatePortAvailability();
    await this.validateDependencies();
    await this.validateEnvironmentVariables();
    await this.generateReport();
  }
}

// Run validation
const validator = new IntelN100Validator();
validator.runAllValidations().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});