// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration - Intel N100 Optimized
 * 
 * SYSTEM SPECIFICATIONS:
 * - Intel N100 (4 cores, ~800MHz base, Intel UHD Graphics)
 * - 8GB RAM total system memory
 * - x86_64 architecture
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Memory usage optimized for 8GB system with integrated graphics
 * - CPU scheduling optimized for 800MHz 4-core Intel N100
 * - Hardware acceleration enabled for Intel UHD graphics
 * - Removed unnecessary ARM/container workarounds
 * - Conservative timeout values for lower base frequency
 * 
 * DEBUGGING COMMANDS:
 * - npm run test:debug         # Interactive debugging with DevTools
 * - npm run test:inspect       # Step-through debugging with Playwright Inspector
 * - npm run test:devtools      # Use chromium-debug project with DevTools enabled
 * - npm run dev:debug          # Start dev servers + Chrome with remote debugging
 * - npm run browser:debug      # Open Chrome with remote debugging port 9222
 * 
 * DEVELOPMENT WORKFLOW:
 * 1. Run 'npm run dev:debug' to start servers and debugging-enabled browser
 * 2. Use 'npm run test:debug' for interactive test execution
 * 3. Set breakpoints in React components via DevTools
 * 4. Monitor network traffic, performance, and console output live
 * 
 * @see https://playwright.dev/docs/test-configuration
 * @see https://playwright.dev/docs/debug
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Only include e2e and accessibility tests, exclude unit/integration tests
  testMatch: [
    '**/tests/e2e/**/*.spec.js',
    '**/tests/accessibility/**/*.spec.js',
    '**/test-*.spec.js' // Root level e2e specs
  ],
  /* Run tests in files in parallel - optimized for Intel N100 4-core */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Intel N100 optimized worker count: 2 workers for 4-core 800MHz CPU */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : null,
  ].filter(Boolean),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3003',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.PWDEBUG ? 'on' : 'on-first-retry',

    /* Take screenshot on failure - enhanced for debugging */
    screenshot: process.env.PWDEBUG ? 'on' : 'only-on-failure',

    /* Video on failure - enhanced for debugging */
    video: process.env.PWDEBUG ? 'on' : 'on-first-retry',

    /* WSL-compatible browser settings */
    headless: process.env.PWDEBUG ? false : true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* Intel N100 optimized timeout settings - conservative for 800MHz CPU */
    actionTimeout: process.env.PWDEBUG ? 0 : 15000, // Extended for Intel N100 performance
    navigationTimeout: process.env.PWDEBUG ? 0 : 45000, // Extended for Intel N100 performance
    
    /* Global test timeout for Intel N100 - allow extra time for CPU-intensive operations */
    timeout: process.env.PWDEBUG ? 0 : 60000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: true,
      },
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          // Use Playwright's Chromium installation
          // executablePath: '/home/darlinghurstlinux/.cache/ms-playwright/chromium-1181/chrome-linux/chrome',
          env: {
            LD_LIBRARY_PATH: '/home/darlinghurstlinux/home-dashboard/browser-libs:/home/darlinghurstlinux/.cache/ms-playwright/firefox-1489/firefox'
          },
          // Intel N100 optimized browser arguments
          args: [
            // Security (keep minimal for Intel N100)
            '--no-sandbox',
            '--disable-setuid-sandbox',
            
            // Memory optimization for 8GB system with integrated graphics
            '--memory-pressure-off',
            '--max_old_space_size=2048',
            '--disable-dev-shm-usage',
            
            // Intel UHD Graphics acceleration
            '--enable-gpu',
            '--enable-gpu-compositing',
            '--enable-accelerated-2d-canvas',
            '--enable-accelerated-video-decode',
            '--ignore-gpu-blacklist',
            
            // CPU optimization for Intel N100 4-core 800MHz
            '--renderer-process-limit=2',
            '--max-gum-fps=30',
            
            // Performance optimizations
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows', 
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-web-security', // Development only
            
            // Remove unnecessary features for development
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-default-apps'
          ],
        },
      },
    },
    {
      name: 'chromium-debug',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          // Use Playwright's Chromium installation
          // executablePath: '/home/darlinghurstlinux/.cache/ms-playwright/chromium-1181/chrome-linux/chrome',
          env: {
            LD_LIBRARY_PATH: '/home/darlinghurstlinux/home-dashboard/browser-libs:/home/darlinghurstlinux/.cache/ms-playwright/firefox-1489/firefox'
          },
          // Intel N100 optimized debug browser arguments
          args: [
            // Security (keep minimal for Intel N100)
            '--no-sandbox',
            '--disable-setuid-sandbox',
            
            // Debug specific
            '--remote-debugging-port=9222',
            '--start-maximized',
            
            // Memory optimization for 8GB system with integrated graphics
            '--memory-pressure-off',
            '--max_old_space_size=2048',
            '--disable-dev-shm-usage',
            
            // Intel UHD Graphics acceleration
            '--enable-gpu',
            '--enable-gpu-compositing',
            '--enable-accelerated-2d-canvas',
            '--enable-accelerated-video-decode',
            '--ignore-gpu-blacklist',
            
            // CPU optimization for Intel N100 4-core 800MHz
            '--renderer-process-limit=2',
            '--max-gum-fps=30',
            
            // Performance optimizations
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-web-security', // Development only
            
            // Remove unnecessary features for development
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-default-apps'
          ],
          slowMo: 100, // Add slight delay for better debugging visibility
          devtools: true, // Open DevTools automatically
        },
        // Enhanced debugging settings
        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },
    {
      name: 'firefox-debug',
      use: { 
        ...devices['Desktop Firefox'],
        headless: false,
        launchOptions: {
          slowMo: 100,
          devtools: true,
        },
        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },
  ],

  /* Intel N100 optimized dev server configuration */
  webServer: [
    {
      command: 'npm run server:dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000, // Extended timeout for Intel N100 startup
    },
    {
      command: 'npm run client:dev', 
      port: 3003,
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000, // Extended timeout for Intel N100 startup
    },
  ],
});