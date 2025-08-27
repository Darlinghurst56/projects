# Home Dashboard - Family Guide

## Welcome to Your Family Notice Board! 👨‍👩‍👧‍👦

Your Home Dashboard is a smart family coordination center designed specifically for families with children. It helps manage calendars, stay connected, monitor internet safety, and get helpful AI assistance for homework and daily questions.

---

## 🚀 Quick Start Guide

### For Family Members

**Step 1: Open the Dashboard**
- On any device (Windows computer, iPhone, iPad), open your web browser
- Go to: `http://192.168.1.74:3003` (family server) or `http://localhost:3003` (development)

**Step 2: Sign In**
- Choose your login method:
  - **Adults**: Use "Sign in with Google" for full access
  - **Kids**: Use PIN access (ask parents for your PIN)

**Step 3: Start Using Widgets**
- Click on any widget to interact with it
- Each widget has different features - explore and have fun!

### First Time Setup (For Parents)

1. **Google Account Setup**
   - Sign in with your Google account to enable Calendar, Gmail, and Drive features
   - Grant permissions when prompted - this allows the dashboard to help manage family schedules

2. **Set Up Family PINs** 
   - Configure PINs for children in the authentication settings
   - Each family member can have their own PIN for personalized access

3. **Configure Widgets**
   - Arrange widgets based on your family's needs
   - Some widgets work better with Google authentication, others work for everyone

---

## 🔐 Authentication Guide

### PIN System

Your family has access to different features based on how you sign in:

#### Family PINs
- **123456** - Child Account (Basic Access)
  - AI Chat for homework help
  - Basic widget viewing
  - Safe, filtered internet monitoring
  
- **567890** - Child Account (Extended Access)
  - Everything in Basic Access
  - Limited calendar viewing
  - Educational content access
  
- **999999** - Admin Account (Full Access)
  - All widget features
  - Calendar management
  - System settings
  - Email and file access

#### Google OAuth (Adults)
- Sign in with your Google account for full access to:
  - Google Calendar integration
  - Gmail management
  - Google Drive file access
  - Complete AI assistant features
  - All administrative functions

### Security Features
- **Auto-lock**: Sessions expire after 30 minutes of inactivity
- **PIN attempts**: Limited to 5 attempts before temporary lockout
- **Google tokens**: Automatically refresh to maintain secure access

---

## 📱 Widget Guide

### Current Functional Status: 37.5% 

#### ✅ **Working Widgets**

**1. DNS Status Widget**
- **What it does**: Monitors your family's internet safety and connection health
- **Family benefit**: Shows if parental controls are working and internet is safe
- **How to use**: Check the green/yellow/red status indicator
- **Current status**: ✅ Functional

**2. AI Chat Assistant**
- **What it does**: Family-friendly AI helper for homework, cooking, and questions
- **Family benefit**: Safe educational assistance, meal planning help
- **How to use**: Type questions in the chat box - it understands family context
- **Current status**: ✅ Functional
- **Examples**: "Help with math homework", "What's for dinner?", "Science project ideas"

**3. Authentication Widget**
- **What it does**: Secure login for family members
- **Family benefit**: Child-safe access control with different permission levels
- **How to use**: Enter PIN or sign in with Google
- **Current status**: ✅ Functional

#### ⚠️ **Partially Working Widgets**

**4. Google Calendar Widget**
- **What it does**: Shows family calendar events and appointments
- **Current issues**: May show connection errors occasionally
- **Workaround**: Refresh the page or check back in a few minutes
- **Expected fix**: System maintenance will improve reliability

**5. System Status Widget**
- **What it does**: Shows overall dashboard health
- **Current issues**: Some service connections may show as degraded
- **Impact**: Dashboard still works, just with limited real-time updates

#### 🔧 **Widgets Under Maintenance**

**6. Google Gmail Widget**
- **Status**: Being optimized for family use
- **Expected**: Email checking for family coordination

**7. Google Drive Widget**
- **Status**: File sharing features being enhanced
- **Expected**: Family photo and document sharing

**8. Voice Commands**
- **Status**: In development
- **Expected**: "Hey Dashboard" voice activation

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### "Can't Access the Dashboard"

**Problem**: Browser won't load the dashboard
**Solutions**:
1. Check if you're on the family WiFi network
2. Try: `http://192.168.1.74:3003` instead of localhost
3. Clear browser cache and refresh
4. Ask parents to check if the family server is running

#### "PIN Not Working"

**Problem**: PIN entry fails or gets rejected
**Solutions**:
1. Double-check you're using the correct family PIN
2. Wait 15 minutes if you've had multiple failed attempts
3. Ask parents to reset your PIN access
4. Make sure caps lock is off

#### "Google Features Not Working"

**Problem**: Calendar, Gmail, or Drive widgets show errors
**Solutions**:
1. Make sure a parent has signed in with Google first
2. Check if Google account permissions were granted
3. Try signing out and back in with Google
4. Wait a few minutes for connection to restore

#### "AI Chat Not Responding"

**Problem**: AI assistant doesn't answer questions
**Solutions**:
1. Check that the family server (192.168.1.74) is running
2. Try shorter, simpler questions
3. Refresh the page and try again
4. Ask parents to check Ollama AI service status

#### "Widgets Loading Slowly"

**Problem**: Dashboard feels slow or unresponsive
**Solutions**:
1. Close other browser tabs to free up memory
2. Check family WiFi connection strength
3. Refresh the browser page
4. Try using a different device

#### "Real-time Updates Not Working"

**Problem**: Information doesn't update automatically
**Solutions**:
1. Manually refresh the page
2. Check internet connection
3. Wait a few minutes for automatic reconnection
4. Clear browser cache if problem persists

### Emergency Contacts

**If the dashboard stops working completely**:
1. Check family WiFi connection
2. Try restarting your device
3. Ask parents to check the family server
4. Use Google Calendar and Gmail directly as backup

---

## 📊 Technical Status Overview

### System Health Dashboard

#### ✅ **Healthy Services**
- **Web Server**: Running on ports 3000 (API) and 3003 (Dashboard)
- **Authentication System**: PIN and Google OAuth working
- **Basic Widget System**: Core functionality operational
- **Circuit Breaker Protection**: Preventing system-wide failures

#### ⚠️ **Degraded Services**
- **DNS Monitoring**: May show timeout errors occasionally
- **Google API Connections**: Intermittent connection issues
- **Real-time Updates**: WebSocket connections may disconnect

#### 🔧 **In Maintenance**
- **Widget Health**: 37.5% fully functional, improvements ongoing
- **Performance Optimization**: Speed and reliability enhancements
- **Error Handling**: Better user-friendly error messages

### Infrastructure Overview

#### Development Environment
- **Backend API**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:3003
- **Health Check**: http://localhost:3000/health

#### Production Environment (Family Server)
- **Server**: 192.168.1.74
- **Services**: Ollama AI, Docker containers, n8n automation
- **Backup Systems**: Multiple service redundancy

#### Current Capabilities
- **Multi-device Support**: Windows computers, iPhones, iPads
- **Family-safe AI**: Homework help and educational assistance
- **Internet Safety**: DNS monitoring and parental controls
- **Google Integration**: Calendar, email, and file management
- **Real-time Sync**: Live updates across all family devices

### Recent Improvements
- **Widget Isolation**: Individual widgets can fail without crashing others
- **Circuit Breaker Protection**: Automatic service recovery
- **API Proxy Setup**: Improved connection reliability
- **Family Context**: AI responses optimized for family use

---

## 🛠️ For Tech-Savvy Family Members

### Advanced Features

#### Environment Configuration
- Configuration file: `.env.example` shows all available settings
- Feature flags: Enable/disable specific functionality
- Debug mode: Available for troubleshooting

#### API Access
- Full REST API available at `/api/` endpoints
- Real-time WebSocket connections on port 3003
- Circuit breaker monitoring at `/system/circuit-breakers`

#### Development Mode
```bash
# Start development servers
npm run dev

# Check system health
curl http://localhost:3000/health

# View API documentation
Open API_DOCUMENTATION.md
```

#### Production Deployment
- Family server: 192.168.1.74
- Docker containers for service isolation
- Automated deployment via GitHub integration

### Monitoring & Maintenance

#### Health Monitoring
- Service status: `/system/status`
- Circuit breaker state: Real-time monitoring
- Performance metrics: Response time tracking

#### Regular Maintenance
- Weekly system health checks
- Monthly feature updates
- Quarterly security reviews

---

## 📅 What's Next?

### Coming Soon
- **Enhanced Voice Commands**: "Hey Dashboard" activation
- **Mobile App**: Native iOS/Android apps
- **Smart Home Integration**: Control lights, thermostat, etc.
- **Advanced Parental Controls**: Time-based access restrictions

### Long-term Vision
- **Family Automation**: Smart routines for bedtime, chores, etc.
- **Educational Integration**: School calendar and assignment tracking
- **Health Monitoring**: Basic family wellness tracking
- **Guest Access**: Safe temporary access for babysitters, relatives

---

## 💡 Tips for Families

### Getting the Most from Your Dashboard

#### For Parents
1. **Set up Google integration first** - this unlocks the most features
2. **Configure family PINs** - give kids appropriate access levels
3. **Use AI for meal planning** - ask "What should we have for dinner?"
4. **Monitor internet usage** - check DNS widget regularly

#### For Kids
1. **Use AI for homework help** - it's like having a smart tutor
2. **Check family calendar** - see what's planned for today
3. **Ask questions safely** - the AI is filtered for family-appropriate responses
4. **Respect access levels** - don't try to bypass parental controls

#### Family Best Practices
- **Start simple**: Use basic features first, then explore advanced ones
- **Regular family meetings**: Discuss new features and needs
- **Backup plans**: Know how to access Google Calendar/Gmail directly
- **Privacy respect**: Each family member's data stays private

---

## 📞 Support & Help

### Self-Help Resources
1. **This Guide**: Comprehensive family usage instructions
2. **API Documentation**: Technical details for advanced users
3. **System Status Page**: Real-time health monitoring
4. **Error Messages**: User-friendly explanations and solutions

### Getting Additional Help
- **Technical Issues**: Check troubleshooting section first
- **Feature Requests**: Discuss during family meetings
- **Security Concerns**: Contact family administrator immediately
- **Educational Support**: AI assistant available 24/7

### Community Resources
- **Family Tech Support**: Built-in help system
- **User Forums**: Share tips with other families
- **Documentation Updates**: Regular guides and tutorials

---

**Dashboard Version**: 2.0.0 (MVP)  
**Last Updated**: August 15, 2025  
**Next Review**: September 15, 2025

---

*This dashboard is designed specifically for your family's needs. Have fun exploring, stay safe online, and don't hesitate to ask questions!*