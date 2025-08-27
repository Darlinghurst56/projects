#!/bin/bash
# Install Browser Dependencies for Playwright Testing

echo "🔧 Installing Browser Dependencies for Visual Testing..."

# Install required system libraries
echo "📦 Installing system packages..."
sudo apt-get update
sudo apt-get install -y libasound2t64 libnspr4 libnss3 libnssutil3 libfontconfig1 libfreetype6 libdbus-1-3 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libxss1 libxtst6 libgtk-3-0 libgdk-pixbuf2.0-0 libasound2-dev

# Install Playwright dependencies 
echo "🎭 Installing Playwright system dependencies..."
sudo npx playwright install-deps

# Verify installation
echo "✅ Verifying browser installation..."
echo "Firefox path: $(ls -la /home/darlinghurstlinux/.cache/ms-playwright/firefox-*/firefox/firefox 2>/dev/null || echo 'Not found')"
echo "Chrome path: $(ls -la /home/darlinghurstlinux/home-dashboard/chrome/*/chrome-linux64/chrome 2>/dev/null || echo 'Not found')"

# Test Firefox launch
echo "🔍 Testing Firefox launch..."
if /home/darlinghurstlinux/.cache/ms-playwright/firefox-*/firefox/firefox --version 2>/dev/null; then
    echo "✅ Firefox can launch"
else
    echo "❌ Firefox launch failed"
fi

echo "🎯 Ready to run browser tests:"
echo "   npm run test:ux"
echo "   npx playwright test widget-rendering-test.spec.js"

echo "📸 Screenshots will be saved to: tests/screenshots/"