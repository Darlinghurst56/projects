# Home Dashboard - Troubleshooting Guide

## 🔧 Quick Fix Reference

**Most Common Issues & 30-Second Solutions**

| Problem | Quick Fix | Works For |
|---------|-----------|-----------|
| Dashboard won't load | Try http://192.168.1.74:3003 | All Users |
| PIN rejected | Wait 15 min, try again | Kids |
| Google features broken | Sign out & back in | Adults |
| AI chat not responding | Refresh page | All Users |
| Slow loading | Close other browser tabs | All Users |

---

## 🚨 Emergency Quick Fixes

### Dashboard Completely Down
```bash
# Family members can try:
1. Check WiFi connection
2. Try different device
3. Use Google Calendar/Gmail directly
4. Wait 5 minutes and try again

# Tech-savvy family members:
curl http://192.168.1.74:3000/health
# Should return: {"status": "healthy"}
```

### Can't Access Google Features
```bash
# Immediate fix:
1. Go to dashboard settings
2. Click "Sign out from Google"  
3. Sign back in with Google
4. Grant all permissions when asked
```

### AI Chat Broken
```bash
# Check AI service:
curl http://192.168.1.74:11434/api/tags
# Should list available AI models
```

---

## 👨‍👩‍👧‍👦 Family-Friendly Troubleshooting

### For Kids (PIN Users)

#### "My PIN isn't working!"

**🔍 Check These First:**
- Are you typing the right numbers?
- Are you on the family WiFi?
- Did you try too many times? (Wait 15 minutes)

**📱 Step-by-Step Fix:**
1. Make sure you're using your correct PIN:
   - Basic access: 123456
   - Extended access: 567890  
   - Ask parents if unsure
2. Check the screen shows "Enter PIN" (not locked out)
3. Type carefully - each number should show as a dot
4. If it says "too many attempts," wait 15 minutes
5. Ask parents to reset if still not working

#### "The dashboard looks broken!"

**🔍 Most Common Cause:** Browser needs refreshing

**📱 Step-by-Step Fix:**
1. Press F5 on keyboard (or Command+R on Mac)
2. If that doesn't work, close browser completely
3. Wait 10 seconds, then open browser again
4. Go to the dashboard website again
5. If still broken, try a different device

#### "AI won't answer my homework questions!"

**🔍 Check These First:**
- Is your question clear and simple?
- Are you signed in with your PIN?
- Is the family server working?

**📱 Step-by-Step Fix:**
1. Try asking a simpler question first: "What is 2+2?"
2. If no response, refresh the page (F5)
3. Sign out and back in with your PIN
4. Try from a different device
5. Ask parents to check the family server

### For Adults (Google Users)

#### "Google Calendar/Gmail not loading"

**🔍 Root Cause Analysis:**
- Google tokens may have expired
- Network connectivity issues
- API rate limits reached
- Circuit breaker protection active

**📱 Detailed Resolution:**
1. **Check Network**: Verify internet connection working
2. **Token Refresh**: 
   - Go to dashboard settings
   - Click "Sign out from Google"
   - Sign back in (this refreshes tokens)
   - Grant permissions when prompted
3. **API Status Check**:
   - Look for "Circuit Breaker" messages
   - Wait 5-10 minutes for automatic recovery
   - Check system status widget if available
4. **Alternative Access**:
   - Use Google Calendar directly: calendar.google.com
   - Use Gmail directly: gmail.com
   - Return to dashboard later

#### "Real-time updates not working"

**🔍 Root Cause Analysis:**
- WebSocket connection lost
- Family server connectivity issues
- Browser blocking real-time features

**📱 Detailed Resolution:**
1. **Check Connection**: Open browser developer tools (F12)
2. **Look for Errors**: Check console for WebSocket errors
3. **Manual Refresh**: Refresh page to restore connection
4. **Browser Settings**: Ensure JavaScript enabled
5. **Network Check**: Verify family WiFi stability
6. **Server Status**: Check if 192.168.1.74 is responding

#### "System seems slow or unresponsive"

**🔍 Performance Diagnosis:**
- Multiple browser tabs open
- Family server under load
- Network congestion
- Cache issues

**📱 Optimization Steps:**
1. **Browser Cleanup**:
   - Close unnecessary tabs
   - Clear browser cache (Ctrl+Shift+Delete)
   - Restart browser completely
2. **Network Optimization**:
   - Check WiFi signal strength
   - Pause large downloads/streams
   - Try ethernet connection if available
3. **Device Performance**:
   - Close other applications
   - Restart device if very slow
   - Try different device for comparison

---

## 🖥️ Technical Troubleshooting

### For Tech-Savvy Family Members

#### Development Environment Issues

**Problem**: `npm run dev` fails to start
```bash
# Solution:
cd /home/darlinghurstlinux/projects/home-dashboard
npm install
npm run dev

# If port conflicts:
pkill -f "node.*3000"
pkill -f "node.*3003"
npm run dev
```

**Problem**: "ECONNREFUSED" errors in console
```bash
# Check services:
curl http://localhost:3000/health
curl http://192.168.1.74:11434/api/tags

# Fix DNS issues:
# Edit /etc/hosts if needed
echo "8.8.8.8 google.com" | sudo tee -a /etc/hosts
```

**Problem**: Google API "unauthorized" errors
```bash
# Check environment variables:
cat .env | grep GOOGLE

# Verify credentials:
# 1. Check Google Cloud Console
# 2. Verify redirect URIs
# 3. Ensure APIs are enabled
```

#### Production Deployment Issues

**Problem**: Dashboard not accessible from family devices
```bash
# Check server binding:
netstat -tlnp | grep :3003

# Should show: 0.0.0.0:3003 (not 127.0.0.1)

# Fix in vite.config.js:
server: {
  host: '0.0.0.0',
  port: 3003
}
```

**Problem**: Ollama AI service not responding
```bash
# Check Ollama on family server:
ssh user@192.168.1.74
curl http://localhost:11434/api/tags

# Restart if needed:
systemctl restart ollama
# or
docker restart ollama-container
```

**Problem**: Docker containers not starting
```bash
# Check container status:
docker ps -a

# View logs:
docker logs home-dashboard

# Restart services:
docker-compose down
docker-compose up -d
```

### Circuit Breaker Diagnostics

#### Understanding Circuit Breaker Status

**Check Current Status:**
```bash
curl http://localhost:3000/system/circuit-breakers

# Response interpretation:
# "CLOSED" = Normal operation
# "OPEN" = Service blocked (failing)  
# "HALF_OPEN" = Testing recovery
```

**Manual Circuit Breaker Reset:**
```bash
# Reset all circuit breakers:
curl -X POST http://localhost:3000/system/circuit-breakers/reset

# Reset specific service:
curl -X POST http://localhost:3000/system/circuit-breakers/reset \
  -H "Content-Type: application/json" \
  -d '{"service": "google-calendar"}'
```

**Circuit Breaker Tuning:**
```javascript
// In server/middleware/circuitBreaker.js
const circuitBreakerOptions = {
  timeout: 15000,        // Increase if requests are slow
  errorThresholdPercentage: 50,  // Increase tolerance
  resetTimeout: 30000    // How long to wait before retry
};
```

### Advanced Diagnostics

#### Widget-Specific Troubleshooting

**DNS Widget Issues:**
```bash
# Test DNS resolution manually:
nslookup google.com
dig @8.8.8.8 google.com

# Check DNS widget API:
curl http://localhost:3000/dns/status

# Fix DNS configuration:
# Edit systemd-resolved configuration
sudo systemctl restart systemd-resolved
```

**Google API Issues:**
```bash
# Test Google Calendar API directly:
curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

# Check token validity:
curl http://localhost:3000/auth/validate \
  -H "Authorization: Bearer $JWT_TOKEN"

# Refresh Google tokens:
curl -X POST http://localhost:3000/auth/refresh-google \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**AI Chat Issues:**
```bash
# Test Ollama directly:
curl http://192.168.1.74:11434/api/generate \
  -d '{"model": "llama2", "prompt": "Hello"}' \
  -H "Content-Type: application/json"

# Check available models:
curl http://192.168.1.74:11434/api/tags

# Pull new model if needed:
curl -X POST http://192.168.1.74:11434/api/pull \
  -d '{"name": "llama2:latest"}'
```

#### Performance Profiling

**Response Time Analysis:**
```bash
# Test API performance:
time curl http://localhost:3000/health
time curl http://localhost:3000/system/status

# Network latency to family server:
ping 192.168.1.74
traceroute 192.168.1.74
```

**Memory Usage Monitoring:**
```bash
# Node.js process monitoring:
ps aux | grep node
top -p $(pgrep node)

# Browser memory usage:
# Open Chrome DevTools > Performance > Memory
```

**Database Query Performance:**
```bash
# Since using file-based storage:
ls -la server/data/
du -sh server/data/

# Check file permissions:
ls -la server/data/pin_attempts.json
ls -la server/data/chat_history/
```

---

## 🔐 Security Troubleshooting

### Authentication Issues

#### JWT Token Problems
```bash
# Decode JWT token (for debugging):
node -e "
const jwt = require('jsonwebtoken');
const token = process.argv[1];
console.log(jwt.decode(token, {complete: true}));
" "$JWT_TOKEN"

# Verify JWT signature:
node -e "
const jwt = require('jsonwebtoken');
const token = process.argv[1];
const secret = process.env.JWT_SECRET;
try {
  console.log(jwt.verify(token, secret));
} catch(e) {
  console.log('Invalid token:', e.message);
}
" "$JWT_TOKEN"
```

#### Google OAuth Issues
```bash
# Check OAuth configuration:
echo "Client ID: $GOOGLE_CLIENT_ID"
echo "Redirect URI: $GOOGLE_REDIRECT_URI"

# Test OAuth flow manually:
# 1. Go to Google OAuth playground
# 2. Use your client ID
# 3. Test authorization flow

# Verify token scopes:
curl "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=$GOOGLE_ACCESS_TOKEN"
```

#### PIN Security Audit
```bash
# Check PIN attempt logs:
cat server/data/pin_attempts.json

# Verify lockout mechanism:
node -e "
const data = require('./server/data/pin_attempts.json');
console.log('Failed attempts:', data);
"

# Reset PIN attempts (if needed):
echo '{}' > server/data/pin_attempts.json
```

### Network Security

#### CORS Configuration Issues
```bash
# Test CORS from different origins:
curl -H "Origin: http://192.168.1.100" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -X OPTIONS \
  http://localhost:3000/api/health

# Should return CORS headers
```

#### Rate Limiting Verification
```bash
# Test rate limiting:
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:3000/health
done

# Should see 429 status codes after 100 requests
```

---

## 📱 Device-Specific Issues

### Mobile Device Troubleshooting

#### iOS Safari Issues
- **Problem**: Widgets not responding to touch
- **Solution**: Enable JavaScript in Safari settings
- **Problem**: Layout broken on iPhone
- **Solution**: Clear Safari cache, force refresh

#### Android Chrome Issues  
- **Problem**: Real-time updates not working
- **Solution**: Allow notifications for the dashboard site
- **Problem**: Voice features not available
- **Solution**: Grant microphone permissions

#### Windows Computer Issues
- **Problem**: Dashboard slow in Edge browser
- **Solution**: Use Chrome or Firefox for better performance
- **Problem**: WebSocket connections failing
- **Solution**: Check Windows Firewall settings

### Network Configuration

#### Family WiFi Issues
```bash
# Test family network connectivity:
ping 192.168.1.1  # Router
ping 192.168.1.74 # Family server
ping 8.8.8.8      # Internet

# Check DNS resolution:
nslookup google.com
nslookup 192.168.1.74
```

#### Port Accessibility
```bash
# Test required ports:
telnet 192.168.1.74 3000  # API port
telnet 192.168.1.74 3003  # Dashboard port
telnet 192.168.1.74 11434 # Ollama AI port

# Check firewall rules:
sudo ufw status
# or on the family server:
iptables -L
```

---

## 📊 Monitoring & Alerts

### Health Check Automation

#### Automated Monitoring Script
```bash
#!/bin/bash
# Save as: monitor-dashboard.sh

check_service() {
  local url=$1
  local name=$2
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$response" = "200" ]; then
    echo "✅ $name: Healthy"
  else
    echo "❌ $name: Failed (HTTP $response)"
    # Could send notification here
  fi
}

echo "🏠 Family Dashboard Health Check - $(date)"
check_service "http://localhost:3000/health" "API Server"
check_service "http://localhost:3003" "Dashboard"
check_service "http://192.168.1.74:11434/api/tags" "AI Service"
```

#### Family Status Dashboard
```bash
# Create simple family status page:
curl -s http://localhost:3000/system/status | \
  jq '.services | to_entries[] | "\(.key): \(.value.status)"'

# Output example:
# ollama: healthy
# dns: degraded
# google: healthy
```

### Log Analysis

#### Application Logs
```bash
# View recent errors:
tail -f logs/dashboard.log | grep ERROR

# Search for specific issues:
grep "Circuit Breaker" logs/dashboard.log
grep "Authentication failed" logs/dashboard.log
grep "Google API" logs/dashboard.log

# Analyze error patterns:
awk '/ERROR/ {print $1, $2, $4}' logs/dashboard.log | sort | uniq -c
```

#### Browser Console Monitoring
```javascript
// Add to browser console for debugging:
window.addEventListener('error', function(e) {
  console.log('🔴 Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.log('🔴 Unhandled Promise:', e.reason);
});

// Monitor WebSocket connections:
const originalWebSocket = window.WebSocket;
window.WebSocket = function(...args) {
  const ws = new originalWebSocket(...args);
  console.log('🔗 WebSocket connecting to:', args[0]);
  ws.addEventListener('open', () => console.log('✅ WebSocket connected'));
  ws.addEventListener('close', () => console.log('❌ WebSocket disconnected'));
  ws.addEventListener('error', (e) => console.log('🔴 WebSocket error:', e));
  return ws;
};
```

---

## 🆘 When All Else Fails

### Nuclear Options (Last Resort)

#### Complete System Reset
```bash
# Stop all services:
pkill -f "node.*3000"
pkill -f "node.*3003"

# Clear all cache and temporary data:
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist

# Reinstall everything:
rm -rf node_modules
npm install
npm run dev
```

#### Factory Reset (Preserve Data)
```bash
# Backup family data:
cp -r server/data backup-$(date +%Y%m%d)

# Reset configuration:
cp .env.example .env
# Edit .env with family settings

# Reset authentication:
echo '{}' > server/data/pin_attempts.json

# Restart with clean slate:
npm run dev
```

#### Emergency Fallback Plan
1. **Use Google services directly**:
   - Google Calendar: calendar.google.com
   - Gmail: gmail.com
   - Google Drive: drive.google.com

2. **Basic family communication**:
   - Text messages for urgent coordination
   - Shared Google Calendar for schedules
   - Email for non-urgent family matters

3. **Tech support contact**:
   - Family tech administrator
   - Dashboard documentation
   - Community support forums

---

## 📚 Additional Resources

### Documentation Quick Links
- **Family Guide**: `FAMILY_GUIDE.md` - User-friendly instructions
- **API Documentation**: `API_DOCUMENTATION.md` - Technical details
- **System Status**: `SYSTEM_STATUS.md` - Current health overview
- **Configuration**: `.env.example` - All available settings

### External Resources
- **Google API Console**: https://console.developers.google.com/
- **Ollama Documentation**: https://ollama.ai/docs
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

### Emergency Contacts
- **Family System Administrator**: [Configure family contact]
- **Technical Support**: Check system documentation
- **Google Account Support**: Google account recovery
- **Internet Provider**: For network connectivity issues

---

**Troubleshooting Guide Version**: 1.0  
**Last Updated**: August 15, 2025  
**Next Review**: Monthly updates based on common issues

---

*Remember: Most issues resolve themselves within 5-10 minutes. When in doubt, try refreshing the page first!*