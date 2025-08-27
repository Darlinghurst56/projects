# Integration Validation and Testing Guide

## Overview
Comprehensive testing and validation procedures for the Family Home Dashboard integrations. This guide provides step-by-step validation for Google APIs, external services, and troubleshooting common integration issues.

## Prerequisites
- Home Dashboard installed and configured
- Environment variables properly set in `.env` file
- Network access to external services

## Part 1: Configuration Validation

### 1.1 Basic Configuration Check

**Validate environment setup:**
```bash
# Navigate to dashboard directory
cd /home/darlinghurstlinux/projects/home-dashboard

# Test configuration loading
JWT_SECRET=a0712110d1c0a23cce12e037f054ce8210d0ca2aa52f693ad61a2164ba9c93754f978a1aef5b978929ec144d4e743ac757987a0acddcd32aa552ad8930b2d902 node -e "
const config = require('./config');
console.log('✅ Configuration Test Results');
console.log('================================');
console.log('Google Client ID:', config.services.google.clientId || '❌ MISSING');
console.log('Google Client Secret:', config.services.google.clientSecret || '❌ MISSING');
console.log('JWT Secret Length:', config.auth.jwtSecret.length, 'chars (need >=32)');
console.log('Ollama URL:', config.services.ollama.baseUrl);
console.log('Google Redirect URI:', config.services.google.redirectUri);
console.log('');
console.log('Feature Flags:');
console.log('- Google Integration:', config.features.googleIntegration);
console.log('- AI Chat:', config.features.aiChat);
console.log('- DNS Monitoring:', config.features.dnsMonitoring);
console.log('- Guest Mode:', config.features.guestMode);
"
```

**Expected output:**
```
✅ Configuration Test Results
================================
Google Client ID: ❌ MISSING  (or your actual client ID)
Google Client Secret: ❌ MISSING  (or "SET")
JWT Secret Length: 128 chars (need >=32)
Ollama URL: http://localhost:11434
Google Redirect URI: http://localhost:3000/auth/google/callback

Feature Flags:
- Google Integration: true
- AI Chat: true
- DNS Monitoring: true
- Guest Mode: true
```

### 1.2 Environment File Validation

**Check .env file structure:**
```bash
# Verify .env file exists and has required variables
echo "=== Environment File Check ==="
[ -f .env ] && echo "✅ .env file exists" || echo "❌ .env file missing"

# Check for required variables (without revealing secrets)
grep -q "JWT_SECRET=" .env && echo "✅ JWT_SECRET configured" || echo "❌ JWT_SECRET missing"
grep -q "GOOGLE_CLIENT_ID=" .env && echo "✅ GOOGLE_CLIENT_ID configured" || echo "❌ GOOGLE_CLIENT_ID missing"
grep -q "GOOGLE_CLIENT_SECRET=" .env && echo "✅ GOOGLE_CLIENT_SECRET configured" || echo "❌ GOOGLE_CLIENT_SECRET missing"
grep -q "OLLAMA_URL=" .env && echo "✅ OLLAMA_URL configured" || echo "❌ OLLAMA_URL missing"
```

## Part 2: External Services Connectivity

### 2.1 Ollama AI Service Testing

**Test Ollama connectivity:**
```bash
# Test basic connectivity
echo "=== Ollama Service Test ==="
if curl -s --connect-timeout 5 http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama service accessible"
    
    # List available models
    echo "📋 Available AI Models:"
    curl -s http://localhost:11434/api/tags | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    data.models.forEach(model => {
        const size = (model.size / (1024*1024*1024)).toFixed(1);
        console.log(\`  - \${model.name} (\${size}GB)\`);
    });
    " || echo "  (Unable to parse model list)"
else
    echo "❌ Ollama service not accessible"
    echo "   Start with: docker run -d -p 11434:11434 ollama/ollama"
fi
```

**Test AI model inference:**
```bash
# Test basic AI generation
echo "=== AI Generation Test ==="
curl -s --connect-timeout 10 -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "prompt": "What is 2+2?",
    "stream": false
  }' | node -e "
try {
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    if (data.response) {
        console.log('✅ AI inference working');
        console.log('📝 Response:', data.response.substring(0, 100) + '...');
    } else {
        console.log('❌ AI inference failed - no response');
    }
} catch(e) {
    console.log('❌ AI inference failed -', e.message);
}
" || echo "❌ AI generation test failed"
```

### 2.2 n8n Workflow Service Testing

**Test n8n connectivity:**
```bash
echo "=== n8n Service Test ==="
if curl -s --connect-timeout 5 http://localhost:5678/healthz > /dev/null; then
    echo "✅ n8n service accessible"
    
    # Test API endpoint
    if curl -s --connect-timeout 5 http://localhost:5678/rest/workflows > /dev/null; then
        echo "✅ n8n API responding"
    else
        echo "⚠️ n8n API not accessible (may require authentication)"
    fi
else
    echo "❌ n8n service not accessible"
    echo "   Start with the External Services Setup Guide"
    echo "   Expected at: http://localhost:5678"
fi
```

### 2.3 Network Connectivity Testing

**Test external API connectivity:**
```bash
echo "=== External API Connectivity ==="

# Test Google APIs
echo "Testing Google API access..."
if curl -s --connect-timeout 10 "https://www.googleapis.com/oauth2/v1/certs" > /dev/null; then
    echo "✅ Google APIs accessible"
else
    echo "❌ Google APIs not accessible (check internet connection)"
fi

# Test DNS resolution
echo "Testing DNS resolution..."
if nslookup google.com > /dev/null 2>&1; then
    echo "✅ DNS resolution working"
else
    echo "❌ DNS resolution failed"
fi
```

## Part 3: Dashboard Service Testing

### 3.1 Start Dashboard Services

**Start the dashboard in test mode:**
```bash
# Start dashboard with full logging
echo "=== Starting Dashboard Services ==="
npm start
```

**Monitor startup logs for:**
- ✅ "JWT secret configured successfully"
- ✅ "Health monitoring initialized"
- ✅ "Ready to handle requests!"
- ⚠️ Any service connection warnings

### 3.2 API Endpoint Testing

**Test system endpoints:**
```bash
# Wait for dashboard to start, then test endpoints
sleep 5

echo "=== API Endpoint Tests ==="

# Test health endpoint (no auth required)
echo "Testing health endpoint..."
curl -s http://localhost:3000/api/system/health | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('Health Status:', data.status);
console.log('Version:', data.version || 'unknown');
" || echo "❌ Health endpoint failed"

# Test system status (requires auth - will show auth requirement)
echo ""
echo "Testing system status endpoint..."
curl -s http://localhost:3000/api/system/status | node -e "
try {
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    if (data.error) {
        console.log('⚠️ Authentication required (expected)');
    } else {
        console.log('✅ System status accessible');
        console.log('Services:', Object.keys(data.services || {}));
    }
} catch(e) {
    console.log('❌ System status endpoint error');
}
"
```

### 3.3 Authentication Testing

**Test PIN authentication:**
```bash
# Test PIN login
echo "=== Authentication Test ==="
curl -s -X POST http://localhost:3000/api/auth/login-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "123456"}' | node -e "
try {
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    if (data.token) {
        console.log('✅ PIN authentication working');
        console.log('User:', data.user.name);
        
        // Save token for further testing
        require('fs').writeFileSync('/tmp/dashboard-token', data.token);
    } else {
        console.log('❌ PIN authentication failed:', data.error || 'Unknown error');
    }
} catch(e) {
    console.log('❌ PIN authentication error:', e.message);
}
"
```

**Test authenticated endpoint:**
```bash
# Test system status with authentication
if [ -f /tmp/dashboard-token ]; then
    TOKEN=$(cat /tmp/dashboard-token)
    echo ""
    echo "Testing authenticated endpoint..."
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/system/status | node -e "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        console.log('✅ Authenticated access working');
        console.log('Overall Status:', data.status);
        console.log('Services:');
        Object.entries(data.services || {}).forEach(([name, service]) => {
            console.log(\`  - \${name}: \${service.status}\`);
        });
    } catch(e) {
        console.log('❌ Authenticated endpoint error:', e.message);
    }
    "
else
    echo "❌ No authentication token available for testing"
fi
```

## Part 4: Google API Integration Testing

### 4.1 OAuth Configuration Test

**Test Google OAuth setup (requires configured credentials):**
```bash
echo "=== Google OAuth Test ==="

# This will only work if you've configured Google credentials
if grep -q "your-google-client-id-here" .env; then
    echo "⚠️ Google credentials not configured yet"
    echo "   Follow GOOGLE_API_SETUP_GUIDE.md to configure"
else
    echo "✅ Google credentials appear to be configured"
    
    # Test OAuth URL generation (won't work without real credentials)
    echo "Google OAuth URL should be available at:"
    echo "http://localhost:3000/auth/google"
fi
```

### 4.2 Google API Endpoints Test

**Test Google service endpoints (requires authentication and setup):**
```bash
# These tests require both authentication and Google credentials
if [ -f /tmp/dashboard-token ] && ! grep -q "your-google-client-id-here" .env; then
    TOKEN=$(cat /tmp/dashboard-token)
    
    echo "=== Google API Endpoints Test ==="
    
    # Test Google auth status
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/google/auth/status | node -e "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        console.log('Google Auth Status:', data.authenticated ? 'Authenticated' : 'Not authenticated');
        console.log('Method:', data.method);
        console.log('Available Services:');
        Object.entries(data.services || {}).forEach(([service, available]) => {
            console.log(\`  - \${service}: \${available ? '✅' : '❌'}\`);
        });
    } catch(e) {
        console.log('❌ Google auth status error:', e.message);
    }
    "
else
    echo "⚠️ Google API testing requires authentication and configured credentials"
fi
```

## Part 5: AI Chat Integration Testing

### 5.1 AI Service Test

**Test AI chat endpoint:**
```bash
if [ -f /tmp/dashboard-token ]; then
    TOKEN=$(cat /tmp/dashboard-token)
    
    echo "=== AI Chat Integration Test ==="
    curl -s -X POST -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3000/api/ai/chat \
         -d '{"message": "Hello, can you help with family planning?"}' | node -e "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        if (data.message) {
            console.log('✅ AI Chat working');
            console.log('Model:', data.model);
            console.log('Response:', data.message.substring(0, 100) + '...');
            if (data.suggestedActions && data.suggestedActions.length > 0) {
                console.log('Suggested Actions:', data.suggestedActions.length);
            }
        } else {
            console.log('❌ AI Chat failed:', data.error || 'No response');
        }
    } catch(e) {
        console.log('❌ AI Chat error:', e.message);
    }
    "
else
    echo "❌ AI Chat testing requires authentication token"
fi
```

### 5.2 AI Status Check

**Check AI service status:**
```bash
if [ -f /tmp/dashboard-token ]; then
    TOKEN=$(cat /tmp/dashboard-token)
    
    echo ""
    echo "AI Service Status:"
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/ai/status | node -e "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        console.log('Connected:', data.connected ? '✅' : '❌');
        console.log('Service:', data.service);
        console.log('Endpoint:', data.endpoint);
        console.log('Available Models:', data.models?.length || 0);
        if (data.models && data.models.length > 0) {
            data.models.slice(0, 3).forEach(model => {
                console.log(\`  - \${model.name}\`);
            });
        }
    } catch(e) {
        console.log('❌ AI Status error:', e.message);
    }
    "
fi
```

## Part 6: Frontend Integration Testing

### 6.1 Web Interface Test

**Test dashboard web interface:**
```bash
echo "=== Web Interface Test ==="

# Test main page
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
    echo "✅ Dashboard web interface accessible"
    echo "🌐 Open http://localhost:3000 in your browser"
else
    echo "❌ Dashboard web interface not accessible"
fi

# Test static assets
if curl -s --connect-timeout 5 http://localhost:3000/src/main.jsx > /dev/null 2>&1; then
    echo "✅ Vite dev server working"
else
    echo "⚠️ Static assets may not be served (normal in production)"
fi
```

### 6.2 Widget Functionality Test

**Manual testing checklist for web interface:**

1. **Load Dashboard**: Open http://localhost:3000
   - ✅ Page loads without errors
   - ✅ All widgets render properly
   - ✅ No console errors

2. **Authentication**: 
   - ✅ PIN login works (123456)
   - ✅ Google login button appears (if configured)

3. **AI Chat Widget**:
   - ✅ Chat interface loads
   - ✅ Can send messages
   - ✅ Receives responses
   - ✅ Suggested actions appear (if applicable)

4. **DNS Status Widget**:
   - ✅ Shows DNS provider info
   - ✅ Displays latency metrics
   - ✅ Updates periodically

5. **Google Widgets** (if configured):
   - ✅ Calendar widget loads
   - ✅ Gmail widget shows status
   - ✅ Drive widget accessible

## Part 7: Troubleshooting Common Issues

### 7.1 Service Connection Issues

**Ollama connection problems:**
```bash
# Check if Ollama is running
ps aux | grep ollama || echo "Ollama process not found"

# Check Ollama logs
docker logs family-ollama 2>/dev/null || echo "No Docker container found"

# Test with different model
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.2", "prompt": "test", "stream": false}' \
  || echo "Model generation test failed"
```

**Dashboard startup issues:**
```bash
# Check for port conflicts
netstat -tlnp | grep :3000 || echo "Port 3000 not in use"

# Check environment variables
env | grep -E "(JWT_SECRET|GOOGLE|OLLAMA)" || echo "Environment variables not set"

# Check Node.js version
node --version && npm --version
```

### 7.2 Authentication Issues

**JWT/PIN problems:**
```bash
# Verify JWT secret length
echo "JWT_SECRET length: $(echo $JWT_SECRET | wc -c)"

# Test PIN database
ls -la server/data/pins.json 2>/dev/null || echo "PIN database not found"

# Reset authentication (if needed)
rm -f server/data/pins.json server/data/tokens/* 2>/dev/null
echo "Authentication data reset"
```

### 7.3 Google API Issues

**OAuth configuration problems:**
- Verify redirect URI matches exactly in Google Cloud Console
- Check that all required APIs are enabled
- Ensure credentials are not expired
- Test with incognito browser window

**API quota issues:**
- Check Google Cloud Console quotas
- Monitor API usage
- Implement rate limiting if needed

### 7.4 Network and Firewall Issues

**Internal network problems:**
```bash
# Test internal connectivity
ping -c 3 192.168.1.74 || echo "Cannot reach family server"

# Check firewall rules
sudo ufw status 2>/dev/null || echo "UFW firewall not active"

# Test specific ports
telnet localhost 3000 < /dev/null && echo "Port 3000 open" || echo "Port 3000 blocked"
telnet localhost 11434 < /dev/null && echo "Port 11434 open" || echo "Port 11434 blocked"
```

## Part 8: Performance Validation

### 8.1 Response Time Testing

**Test API response times:**
```bash
echo "=== Performance Testing ==="

# Test health endpoint response time
time curl -s http://localhost:3000/api/system/health > /dev/null

# Test AI response time (if available)
if [ -f /tmp/dashboard-token ]; then
    TOKEN=$(cat /tmp/dashboard-token)
    echo "AI Response Time Test:"
    time curl -s -X POST -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3000/api/ai/chat \
         -d '{"message": "Quick test"}' > /dev/null
fi
```

### 8.2 Resource Usage Monitoring

**Monitor system resources:**
```bash
# Check memory usage
free -h

# Check CPU usage
top -n 1 | head -n 5

# Check disk usage
df -h | grep -E "/$|/home"

# Check Node.js processes
ps aux | grep -E "(node|npm)" | grep -v grep
```

## Part 9: Automated Testing Script

### 9.1 Complete Integration Test

**Create comprehensive test script:**
```bash
cat > test-integration.sh << 'EOF'
#!/bin/bash
echo "====================================="
echo "Family Dashboard Integration Test"
echo "====================================="
echo ""

# Set JWT secret for testing
export JWT_SECRET="a0712110d1c0a23cce12e037f054ce8210d0ca2aa52f693ad61a2164ba9c93754f978a1aef5b978929ec144d4e743ac757987a0acddcd32aa552ad8930b2d902"

PASSED=0
FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $2"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: Configuration
echo "1. Testing Configuration..."
node -e "const config = require('./config'); console.log('Config loaded successfully');" > /dev/null 2>&1
test_result $? "Configuration loads without errors"

# Test 2: Ollama Service
echo "2. Testing Ollama Service..."
curl -s --connect-timeout 5 http://localhost:11434/api/tags > /dev/null 2>&1
test_result $? "Ollama service accessible"

# Test 3: Dashboard Health
echo "3. Testing Dashboard Health..."
curl -s http://localhost:3000/api/system/health > /dev/null 2>&1
test_result $? "Dashboard health endpoint responding"

# Test 4: Authentication
echo "4. Testing Authentication..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$TOKEN" ]
test_result $? "PIN authentication working"

# Test 5: AI Chat (if token available)
if [ -n "$TOKEN" ]; then
    echo "5. Testing AI Chat..."
    curl -s -X POST -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3000/api/ai/chat \
         -d '{"message": "test"}' | grep -q '"message"'
    test_result $? "AI Chat endpoint working"
fi

# Summary
echo ""
echo "====================================="
echo "Test Summary:"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "====================================="

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed! Dashboard ready for family use."
    exit 0
else
    echo "⚠️ Some tests failed. Check configuration and services."
    exit 1
fi
EOF

chmod +x test-integration.sh
echo "✅ Integration test script created: ./test-integration.sh"
```

### 9.2 Run Complete Test

**Execute full integration test:**
```bash
./test-integration.sh
```

## Summary

This validation guide provides comprehensive testing for all aspects of the Family Home Dashboard integration:

1. ✅ **Configuration validation**
2. ✅ **External service connectivity** 
3. ✅ **API endpoint testing**
4. ✅ **Authentication verification**
5. ✅ **Google API setup verification**
6. ✅ **AI chat functionality**
7. ✅ **Frontend interface testing**
8. ✅ **Performance monitoring**
9. ✅ **Automated test scripts**

Use this guide to systematically validate your installation and troubleshoot any integration issues. The automated test script provides a quick way to verify overall system health.

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-08-06  
**Compatibility**: Home Dashboard v1.0+  
**Testing Requirements**: Node.js, curl, basic Unix tools