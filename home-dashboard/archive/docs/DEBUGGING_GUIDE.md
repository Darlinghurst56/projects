# Interactive Browser Debugging Guide

This guide explains the enhanced debugging capabilities added to replace the slow screenshot-based testing workflow with real-time interactive debugging.

## Overview

The home-dashboard project now supports multiple debugging modes for browser-based testing and development, providing immediate feedback and interactive debugging capabilities.

## Available Debugging Commands

### 1. Interactive Test Debugging
```bash
npm run test:debug
```
- Opens tests in headed mode with DevTools
- Allows setting breakpoints in test code
- Provides step-by-step execution control
- Automatically opens Chrome DevTools for inspection

### 2. Playwright Inspector
```bash
npm run test:inspect
```
- Enables Playwright's built-in inspector
- Provides GUI for test step navigation
- Shows element selectors and actions
- Useful for test development and debugging

### 3. DevTools-Enabled Testing
```bash
npm run test:devtools
```
- Uses the `chromium-debug` configuration
- Automatically opens DevTools alongside tests
- Best for debugging React component behavior
- Includes network monitoring and performance profiling

### 4. Development with Debugging Browser
```bash
npm run dev:debug
```
- Starts both server and client in development mode
- Opens Chrome with remote debugging enabled
- Accessible at `http://localhost:3003`
- Chrome DevTools available at `chrome://inspect`

### 5. Manual Browser Debugging
```bash
npm run browser:debug
```
- Opens Chrome with remote debugging port 9222
- Direct access to application with DevTools
- Useful for manual testing and exploration

## Debugging Workflows

### For Test Development
1. Run `npm run test:inspect` to develop new tests
2. Use the Playwright Inspector to identify selectors
3. Switch to `npm run test:debug` for deeper debugging
4. Set breakpoints in React components via DevTools

### For Component Debugging
1. Start with `npm run dev:debug`
2. Navigate to problematic components
3. Use Chrome DevTools to:
   - Set breakpoints in React components
   - Monitor network requests
   - Analyze performance issues
   - Inspect state changes

### For Performance Analysis
1. Use `npm run test:devtools` with performance tests
2. Open Performance tab in DevTools
3. Record interactions with widgets
4. Analyze rendering bottlenecks

### For Network Debugging
1. Run `npm run dev:debug`
2. Open Network tab in DevTools
3. Monitor API calls to Google Services
4. Debug WebSocket connections
5. Analyze request/response timing

## Configuration Details

### Browser Projects
- **chromium**: Headless mode for CI/CD
- **firefox**: Headless mode for cross-browser testing
- **chromium-debug**: Headed mode with DevTools auto-open
- **firefox-debug**: Headed Firefox debugging mode

### Environment Variables
- `PWDEBUG=1`: Enables debug mode with enhanced settings
- Automatically disables timeouts in debug mode
- Forces headed mode when debugging is active

### Chrome Configuration
- Remote debugging port: 9222
- Custom Chrome installation path configured
- WSL-compatible with necessary security flags
- DevTools auto-open for debugging sessions

## Advanced Features

### Breakpoint Debugging in React
1. Open DevTools during test execution
2. Navigate to Sources tab
3. Find React component files
4. Set breakpoints in component logic
5. Interact with components to trigger breakpoints

### Network Monitoring
- Monitor Google API calls in real-time
- Debug authentication flows
- Analyze DNS monitoring requests
- Track WebSocket connections

### Performance Profiling
- Record performance during widget interactions
- Identify slow rendering components
- Analyze memory usage patterns
- Debug React re-rendering issues

## Troubleshooting

### Chrome Won't Start
- Verify Chrome path: `/home/darlinghurstlinux/projects/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome`
- Check file permissions are executable
- Ensure WSL display forwarding is working

### DevTools Not Opening
- Manually navigate to `chrome://inspect` in Chrome
- Look for "Remote Target" with port 9222
- Click "inspect" under the target

### Tests Hanging in Debug Mode
- This is expected behavior - debug mode waits for interaction
- Use Playwright Inspector or DevTools to continue execution
- Press F8 or click Continue in DevTools to resume

### Performance Issues
- Debug mode adds overhead for better debugging experience
- Use headless mode (`npm run test:e2e`) for performance testing
- Disable video recording in debug projects if needed

## Comparison with Screenshot Testing

| Old Approach | New Approach |
|-------------|--------------|
| Take screenshots → Analyze images | Real-time visual debugging |
| Post-failure analysis | Live debugging during execution |
| Static image inspection | Interactive DOM manipulation |
| No breakpoint support | Full breakpoint debugging |
| Limited context | Complete browser DevTools |
| Slow feedback loop | Immediate feedback |

## Best Practices

1. **Start Small**: Use `npm run test:debug` on individual test files first
2. **Use Inspector**: Leverage Playwright Inspector for selector development
3. **Set Targeted Breakpoints**: Focus on specific component issues
4. **Monitor Network**: Always check network tab for API issues
5. **Profile Performance**: Use Performance tab for slow interactions
6. **Debug State**: Use React DevTools extension for state debugging

This enhanced debugging setup provides immediate practical improvements for browser-based development, replacing slow screenshot analysis with interactive debugging capabilities.