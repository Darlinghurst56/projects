#!/usr/bin/env node

/**
 * Setup Script for Home Dashboard
 * Handles initial setup, configuration, and validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class DashboardSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    this.config = {
      port: 3000,
      clientPort: 3001,
      dashyPort: 4000,
      ollamaUrl: 'http://192.168.1.74:11434',
      googleClientId: '',
      googleClientSecret: '',
      jwtSecret: '',
      features: {
        dnsMonitoring: true,
        googleIntegration: true,
        aiChat: true,
        dashyIntegration: true,
        pinAuth: true,
        googleAuth: true,
      },
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async run() {
    this.log('\n🚀 Home Dashboard Setup', 'cyan');
    this.log('=====================================', 'cyan');
    
    try {
      await this.checkPrerequisites();
      await this.gatherConfiguration();
      await this.createEnvironmentFile();
      await this.setupDirectories();
      await this.installDependencies();
      await this.setupDashy();
      await this.validateConfiguration();
      await this.displaySummary();
      
      this.log('\n✅ Setup completed successfully!', 'green');
      this.log('🎉 Your Home Dashboard is ready to use!', 'green');
      
    } catch (error) {
      this.log(`\n❌ Setup failed: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async checkPrerequisites() {
    this.log('\n🔍 Checking prerequisites...', 'blue');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js 16+ required. Current version: ${nodeVersion}`);
    }
    
    this.log(`✅ Node.js version: ${nodeVersion}`, 'green');
    
    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`✅ npm version: ${npmVersion}`, 'green');
    } catch (error) {
      throw new Error('npm not found. Please install Node.js with npm.');
    }
    
    // Check port availability
    await this.checkPortAvailability(this.config.port, 'API Server');
    await this.checkPortAvailability(this.config.clientPort, 'Client Dev Server');
    
    this.log('✅ All prerequisites check passed', 'green');
  }

  async checkPortAvailability(port, service) {
    return new Promise((resolve, reject) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          this.log(`✅ Port ${port} available for ${service}`, 'green');
          resolve(true);
        });
      });
      
      server.on('error', () => {
        reject(new Error(`Port ${port} is already in use (needed for ${service})`));
      });
    });
  }

  async gatherConfiguration() {
    this.log('\n⚙️  Configuration setup...', 'blue');
    
    // Server ports
    const port = await this.askQuestion(
      `API Server port (default: ${this.config.port}): `
    );
    if (port) this.config.port = parseInt(port);
    
    const clientPort = await this.askQuestion(
      `Client dev server port (default: ${this.config.clientPort}): `
    );
    if (clientPort) this.config.clientPort = parseInt(clientPort);
    
    // External services
    
    const ollamaUrl = await this.askQuestion(
      `Ollama URL (default: ${this.config.ollamaUrl}): `
    );
    if (ollamaUrl) this.config.ollamaUrl = ollamaUrl;
    
    // Google API credentials
    this.log('\n📝 Google API Configuration:', 'yellow');
    this.log('You need to set up Google API credentials for Calendar, Gmail, and Drive access.');
    this.log('Visit: https://console.cloud.google.com/apis/credentials');
    
    this.config.googleClientId = await this.askQuestion(
      'Google Client ID: '
    );
    
    this.config.googleClientSecret = await this.askQuestion(
      'Google Client Secret: '
    );
    
    // JWT Secret
    this.config.jwtSecret = await this.askQuestion(
      'JWT Secret (leave empty for auto-generated): '
    );
    
    if (!this.config.jwtSecret) {
      this.config.jwtSecret = require('crypto').randomBytes(64).toString('hex');
      this.log('✅ JWT Secret auto-generated', 'green');
    }
    
    // Feature flags
    this.log('\n🎛️  Feature Configuration:', 'blue');
    
    const features = await this.askQuestion(
      'Enable AI Chat? (y/n, default: y): '
    );
    this.config.features.aiChat = features.toLowerCase() !== 'n';
    
    const dashy = await this.askQuestion(
      'Enable Dashy Integration? (y/n, default: y): '
    );
    this.config.features.dashyIntegration = dashy.toLowerCase() !== 'n';
    
    this.log('✅ Configuration gathered', 'green');
  }

  async createEnvironmentFile() {
    this.log('\n📄 Creating environment file...', 'blue');
    
    const envContent = `# Home Dashboard Environment Configuration
# Generated by setup script on ${new Date().toISOString()}

# Server Configuration
PORT=${this.config.port}
CLIENT_PORT=${this.config.clientPort}
NODE_ENV=development

# External Services
OLLAMA_URL=${this.config.ollamaUrl}

# Google API Configuration
GOOGLE_CLIENT_ID=${this.config.googleClientId}
GOOGLE_CLIENT_SECRET=${this.config.googleClientSecret}
GOOGLE_REDIRECT_URI=http://localhost:${this.config.port}/auth/google/callback

# Authentication
JWT_SECRET=${this.config.jwtSecret}
JWT_EXPIRES_IN=24h
PIN_ATTEMPTS=5
PIN_LOCKOUT_DURATION=900000
SESSION_TIMEOUT=1800000

# DNS Monitoring
DNS_REFRESH_INTERVAL=60000
DNS_LATENCY_THRESHOLD=100
DNS_UPTIME_THRESHOLD=99.5

# WebSocket Configuration
WS_PORT=${this.config.clientPort}
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=100

# Security
CORS_ORIGINS=http://localhost:${this.config.clientPort},http://localhost:${this.config.dashyPort}
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/dashboard.log
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m

# Feature Flags
FEATURE_DNS_MONITORING=${this.config.features.dnsMonitoring}
FEATURE_GOOGLE_INTEGRATION=${this.config.features.googleIntegration}
FEATURE_AI_CHAT=${this.config.features.aiChat}
FEATURE_DASHY_INTEGRATION=${this.config.features.dashyIntegration}
FEATURE_PIN_AUTH=${this.config.features.pinAuth}
FEATURE_GOOGLE_AUTH=${this.config.features.googleAuth}

# Development
MOCK_DATA=false
DEBUG=false
HOT_RELOAD=true
VERBOSE_LOGGING=false
`;
    
    fs.writeFileSync('.env', envContent);
    this.log('✅ Environment file created', 'green');
  }

  async setupDirectories() {
    this.log('\n📁 Setting up directories...', 'blue');
    
    const directories = [
      'logs',
      'data',
      'public/assets',
      'public/widgets',
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`✅ Created directory: ${dir}`, 'green');
      }
    });
  }

  async installDependencies() {
    this.log('\n📦 Installing dependencies...', 'blue');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      this.log('✅ Dependencies installed successfully', 'green');
    } catch (error) {
      throw new Error('Failed to install dependencies');
    }
  }

  async setupDashy() {
    if (!this.config.features.dashyIntegration) {
      this.log('⏭️  Skipping Dashy setup (feature disabled)', 'yellow');
      return;
    }
    
    this.log('\n🎛️  Setting up Dashy integration...', 'blue');
    
    const shouldInstall = await this.askQuestion(
      'Install Dashy globally? (y/n, default: y): '
    );
    
    if (shouldInstall.toLowerCase() !== 'n') {
      try {
        execSync('npm install -g dashy', { stdio: 'inherit' });
        this.log('✅ Dashy installed globally', 'green');
      } catch (error) {
        this.log('⚠️  Failed to install Dashy globally. You can install it manually later.', 'yellow');
      }
    }
  }

  async validateConfiguration() {
    this.log('\n🔍 Validating configuration...', 'blue');
    
    // Test external services
    await this.testExternalServices();
    
    this.log('✅ Configuration validation completed', 'green');
  }

  async testExternalServices() {
    // Test Ollama connectivity
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`);
      if (response.ok) {
        this.log('✅ Ollama service accessible', 'green');
      } else {
        this.log('⚠️  Ollama service not responding (this is optional)', 'yellow');
      }
    } catch (error) {
      this.log('⚠️  Ollama service not accessible (this is optional)', 'yellow');
    }
  }

  async displaySummary() {
    this.log('\n📋 Setup Summary', 'cyan');
    this.log('==========================================', 'cyan');
    this.log('');
    this.log(`🖥️  API Server: http://localhost:${this.config.port}`, 'blue');
    this.log(`⚛️  Client Dev Server: http://localhost:${this.config.clientPort}`, 'blue');
    if (this.config.features.dashyIntegration) {
      this.log(`📊 Dashy Dashboard: http://localhost:${this.config.dashyPort}`, 'blue');
    }
    this.log('');
    this.log('🔗 External Services:', 'blue');
    this.log(`  • Ollama: ${this.config.ollamaUrl}`, 'blue');
    this.log('');
    this.log('🎛️  Enabled Features:', 'blue');
    Object.entries(this.config.features).forEach(([feature, enabled]) => {
      if (enabled) {
        this.log(`  • ${feature}`, 'green');
      }
    });
    this.log('');
    this.log('🚀 Next Steps:', 'cyan');
    this.log('  1. npm run dev          # Start development servers', 'yellow');
    this.log('  2. npm run build        # Build for production', 'yellow');
    this.log('  3. npm start            # Start production server', 'yellow');
    this.log('');
    this.log('📖 Documentation: README.md', 'blue');
    this.log('🐛 Issues: Create an issue in the repository', 'blue');
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new DashboardSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = DashboardSetup;