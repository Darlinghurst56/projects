/**
 * Puppeteer Configuration for ARM64 Systems
 * Simple, standard configuration for MCP server compatibility
 */

const os = require('os');

// Use system Chrome on ARM64, let Puppeteer handle x86_64
const isARM64 = os.arch() === 'arm64' || os.arch() === 'aarch64';

module.exports = {
  // Use system Chrome on ARM64 for better compatibility
  executablePath: isARM64 ? '/usr/bin/chromium-browser' : undefined,
  
  // Standard launch arguments (safe by default)
  args: [
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ],
  
  // Default settings
  headless: true,
  defaultViewport: {
    width: 1920,
    height: 1080
  }
};