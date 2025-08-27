# ARM64 Puppeteer Configuration Guide

## Overview
This guide explains the standard approach for using Puppeteer MCP server on ARM64 systems.

## Quick Start

### For ARM64 Systems (aarch64/arm64)
```javascript
// Navigation
mcp__puppeteer__puppeteer_navigate(url: "http://localhost:3001/", allowDangerous: true)

// Screenshots  
mcp__puppeteer__puppeteer_screenshot(name: "test", allowDangerous: true)

// Element interactions
mcp__puppeteer__puppeteer_click(selector: ".button", allowDangerous: true)
```

### For x86_64 Systems
```javascript
// Standard usage (no allowDangerous needed)
mcp__puppeteer__puppeteer_navigate(url: "http://localhost:3001/")
mcp__puppeteer__puppeteer_screenshot(name: "test")
```

## Why allowDangerous is Required on ARM64

ARM64 systems require the `--no-sandbox` flag for Chrome/Chromium to function properly in containerized environments (Docker, WSL2, etc.). The MCP server correctly identifies this as a security risk and requires explicit opt-in via `allowDangerous: true`.

## Configuration Files

### .puppeteerrc.js
```javascript
const os = require('os');
const isARM64 = os.arch() === 'arm64' || os.arch() === 'aarch64';

module.exports = {
  executablePath: isARM64 ? '/usr/bin/chromium-browser' : undefined,
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
  headless: true,
  defaultViewport: { width: 1920, height: 1080 }
};
```

### .mcp.json
```json
{
  "puppeteer": {
    "command": "npx", 
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

## Troubleshooting

### "Dangerous browser arguments detected"
- **Solution**: Add `allowDangerous: true` to your MCP function calls on ARM64
- **Reason**: ARM64 requires `--no-sandbox` flag for proper operation

### "Could not find Chrome"
- **Solution**: Install system Chromium: `sudo apt install chromium-browser`
- **Reason**: ARM64 systems work better with system-installed Chrome

### Browser launch failures
- **Check**: System Chrome is installed and executable
- **Verify**: `/usr/bin/chromium-browser --version` works
- **Alternative**: Use Docker with proper Chrome ARM64 image

## Best Practices

1. **Always use allowDangerous: true on ARM64**
2. **Install system Chromium for better compatibility** 
3. **Keep configuration minimal and standard**
4. **Document ARM64 requirements in your project**
5. **Test on both ARM64 and x86_64 if deploying to multiple architectures**

## Migration from Complex Configurations

If upgrading from a complex Puppeteer setup:

1. Remove symbolic links in `/root/.cache/puppeteer/`
2. Replace complex `.puppeteerrc.js` with minimal version above
3. Remove custom environment variables from `.mcp.json`
4. Add `allowDangerous: true` to ARM64 MCP calls
5. Test functionality with clean configuration

This approach provides reliable ARM64 support while maintaining security best practices.