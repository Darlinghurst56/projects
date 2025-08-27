// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Intel N100 Optimized Playwright Configuration
 * 
 * OPTIMIZATIONS APPLIED:
 * - Removed ARM/container-specific workarounds
 * - Enabled Intel UHD graphics hardware acceleration
 * - Memory-efficient configuration for 8GB system
 * - CPU scheduling optimized for 4-core Intel N100
 * - Native x86_64 performance enhancements
 * 
 * PERFORMANCE TARGETS:
 * - Browser startup: <3 seconds
 * - Memory usage: <2GB total
 * - Optimal 4-core CPU utilization
 * 
 * DEBUGGING COMMANDS:
 * - npm run test:debug         # Interactive debugging with DevTools
 * - npm run test:inspect       # Step-through debugging with Playwright Inspector
 * - npm run test:devtools      # Use chromium-debug project with DevTools enabled
 * - npm run dev:debug          # Start dev servers + Chrome with remote debugging
 * - npm run browser:debug      # Open Chrome with remote debugging port 9222
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

  /* Intel N100 optimized parallel execution */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Optimized workers for 4-core Intel N100 */
  workers: process.env.CI ? 1 : 2, // Use 2 workers for optimal 4-core utilization
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : null,
  ].filter(Boolean),

  /* Shared settings optimized for Intel N100 */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3003',

    /* Collect trace when retrying the failed test. */
    trace: process.env.PWDEBUG ? 'on' : 'on-first-retry',

    /* Take screenshot on failure - enhanced for debugging */
    screenshot: process.env.PWDEBUG ? 'on' : 'only-on-failure',

    /* Video on failure - enhanced for debugging */
    video: process.env.PWDEBUG ? 'on' : 'on-first-retry',

    /* Intel N100 optimized browser settings */
    headless: process.env.PWDEBUG ? false : true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* Timeout settings optimized for Intel N100 performance */
    actionTimeout: process.env.PWDEBUG ? 0 : 8000, // Reduced from 10s for faster feedback
    navigationTimeout: process.env.PWDEBUG ? 0 : 20000, // Reduced from 30s for Intel N100
  },

  /* Configure projects for Intel N100 optimized browsers */
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: true,
        launchOptions: {
          // Intel N100 optimized Firefox settings
          args: [
            '--memory-pressure-off', // Disable memory pressure handling for smoother performance
            '--disable-background-timer-throttling', // Keep essential for performance
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--enable-gpu', // Enable GPU acceleration on Intel UHD
            '--enable-features=VaapiVideoDecoder', // Intel hardware video decoding
          ],
        },
      },
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          executablePath: '/home/darlinghurstlinux/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome',
          env: {
            LD_LIBRARY_PATH: '/home/darlinghurstlinux/home-dashboard/browser-libs:/home/darlinghurstlinux/.cache/ms-playwright/firefox-1489/firefox'
          },
          // Intel N100 optimized Chrome arguments
          args: [
            // REMOVED: Container/ARM-specific arguments that hurt Intel N100 performance
            // '--no-sandbox',                    # Not needed for native Intel x86_64
            // '--disable-setuid-sandbox',        # Not needed for native Intel x86_64
            // '--disable-dev-shm-usage',         # Can hurt performance on native systems
            // '--disable-ipc-flooding-protection', # Unnecessary overhead on Intel N100
            
            // INTEL N100 SPECIFIC OPTIMIZATIONS:
            '--enable-gpu',                         // Enable Intel UHD graphics acceleration
            '--enable-gpu-rasterization',           // Use GPU for 2D rendering
            '--enable-zero-copy',                   // Reduce memory copying overhead
            '--enable-features=VaapiVideoDecoder,VaapiVideoEncoder', // Intel hardware video codec
            '--use-gl=desktop',                     // Use desktop OpenGL for better Intel UHD performance
            '--enable-accelerated-2d-canvas',       // Hardware accelerated 2D canvas
            '--enable-accelerated-mjpeg-decode',    // Hardware MJPEG decoding
            '--disable-background-timer-throttling', // Keep for performance
            '--disable-backgrounding-occluded-windows', // Keep for performance  
            '--disable-renderer-backgrounding',     // Keep for performance
            '--disable-features=TranslateUI',       // Remove unnecessary UI features
            '--max-old-space-size=1024',           // Limit V8 heap to 1GB for 8GB system
            '--memory-pressure-off',               // Disable memory pressure for smoother performance
            '--process-per-site',                  // Optimize process allocation for 4-core CPU
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
          executablePath: '/home/darlinghurstlinux/home-dashboard/chrome/linux-138.0.7204.168/chrome-linux64/chrome',
          env: {
            LD_LIBRARY_PATH: '/home/darlinghurstlinux/home-dashboard/browser-libs:/home/darlinghurstlinux/.cache/ms-playwright/firefox-1489/firefox'
          },
          args: [
            // Debug-specific settings with Intel N100 optimizations
            '--enable-gpu',
            '--enable-gpu-rasterization', 
            '--enable-zero-copy',
            '--enable-features=VaapiVideoDecoder,VaapiVideoEncoder',
            '--use-gl=desktop',
            '--enable-accelerated-2d-canvas',
            '--enable-accelerated-mjpeg-decode',
            '--remote-debugging-port=9222',
            '--disable-web-security',
            '--start-maximized',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--max-old-space-size=1024',
            '--memory-pressure-off',
            '--process-per-site',
          ],
          slowMo: 50, // Reduced slowMo for faster debugging on Intel N100
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
          args: [
            '--memory-pressure-off',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows', 
            '--disable-renderer-backgrounding',
            '--enable-gpu',
            '--enable-features=VaapiVideoDecoder',
          ],
          slowMo: 50, // Reduced slowMo for faster debugging
          devtools: true,
        },
        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run server:dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 90 * 1000, // Reduced timeout for Intel N100
    },
    {
      command: 'npm run client:dev', 
      port: 3003,
      reuseExistingServer: !process.env.CI,
      timeout: 90 * 1000, // Reduced timeout for Intel N100
    },
  ],
});