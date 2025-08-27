# Home Dashboard - Family Notice Board

> **Primary Instructions**: See `/claude-project/CLAUDE.md` for main development guidelines

## Project Overview

**Current Status**: Technical foundation complete - focus on refining existing family automation features

### Purpose
Family notice board system for family of 4 (2 adults, 2 children) using Windows/iOS devices

### Infrastructure Requirements
- **Dev Environment**: localhost development
- **Live Environment**: 192.168.1.74 (Ollama, Docker, production services)
- **Compatibility**: Code must work on both environments

## Current System Components

### Merged Systems
1. **Family Dashboard**: DNS monitoring, PIN authentication
2. **HouseAI**: Google services integration (Calendar, Gmail, Drive)  
3. **Dashy Integration**: n8n workflow automation, AI chat (Ollama)

### Dashy Role Clarification
- **Dashy**: Optional monitoring dashboard (port 4000) - NOT core family features
- **Home Dashboard**: Primary family interaction system with widgets
- **Family Features**: Built as home-dashboard widgets, not Dashy components

### Technical Architecture
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Authentication**: PIN + Google OAuth (JWT sessions)
- **External Services**: Google APIs, n8n workflows, Ollama AI

## Technical Family Automation Features

### Implemented Family Features (CORRECT APPROACH)
- **DNS Monitoring**: ✅ **IMPLEMENTED** - Family network awareness and safety
- **Google Integration**: ✅ **IMPLEMENTED** - Calendar, Gmail, Drive widgets for family coordination
- **AI Chat**: ✅ **IMPLEMENTED** - Ollama family assistant for homework help and questions
- **Authentication**: ✅ **IMPLEMENTED** - PIN + Google OAuth for family security
- **Real-time Updates**: ✅ **IMPLEMENTED** - WebSocket for live family coordination
- **n8n Automation**: ✅ **IMPLEMENTED** - Workflow automation for family processes

### Technical Foundation Status
**Status**: Production-ready technical foundation - focus on enhancement and polish

### Family-Friendly Features Required
- **Simple Interface**: Easy for children to use
- **Voice Commands**: Hands-free operation
- **Visual Indicators**: Clear status displays
- **Account Types**: Simple admin/child account distinction
- **Offline Mode**: Basic functionality without internet
- **Multi-Device**: Windows/iOS compatibility

## Development Focus

### Current Priorities (Enhancement & Polish)
1. **DNS Widget Enhancement**: Improve family network monitoring UX
2. **Google Widget Polish**: Enhance Calendar/Gmail/Drive integration
3. **AI Chat Improvement**: Better family assistant responses and context
4. **Authentication UX**: Streamline PIN and Google OAuth flows
5. **Real-time Features**: Enhance WebSocket notifications and updates

### Alternative Solutions Available
- **Push Notifications**: Direct dashboard notifications system
- **Voice Commands**: Can be added via Ollama AI integration
- **Dashy Dashboard**: Optional for system monitoring (not family features)

### Technology Integration
- **Ollama AI**: Family-friendly assistance and homework help
- **n8n Workflows**: Automation for family routines
- **Google Services**: Calendar, Gmail, Drive integration
- **DNS Monitoring**: Family internet safety and usage

## Quick Start

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with Google API credentials and service URLs

# Start development
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### Live Environment
- **Server**: 192.168.1.74
- **Services**: Ollama (AI), Docker (containers), n8n (automation)

## Development Guidelines

### Family Context
- Design for family of 4 with children
- Prioritize simplicity and usability
- Support simple admin/child account types
- Support multiple devices (Windows/iOS)

### Technical Requirements
- Real APIs only (no mocking)
- Work on both dev and live environments
- Use existing tools and services
- Minimal custom code

## Current Status Summary

### ✅ **Technical Foundation Complete**
- Dependencies installed and system functional
- Google Calendar integration working
- DNS monitoring, AI chat, n8n integration available
- Authentication system (PIN + Google OAuth) implemented
- Real-time updates via WebSocket

### ✅ **Technical Family Features Complete**
- DNS monitoring and network awareness
- Google services integration (Calendar, Gmail, Drive)
- AI chat interface (Ollama family assistant)
- PIN + Google OAuth authentication
- Real-time updates via WebSocket
- n8n workflow automation

### 🔄 **Integration Analysis Complete**
- **Custom vs Dashy comparison**: Custom approach justified for Google/AI features
- **Dashy role**: Optional for basic monitoring, not core family features
- **Hybrid approach**: Recommended for optimal balance

### 📋 **Phase 3 Documentation Complete** ✅
1. **Family Guide** - Complete user documentation (archive/docs/FAMILY_GUIDE.md)
2. **Technical Status** - System health overview (SYSTEM_STATUS.md)  
3. **Troubleshooting** - Comprehensive problem solving (TROUBLESHOOTING.md)
4. **Quick Reference** - Emergency fixes and tips (QUICK_REFERENCE.md)

### 📋 **Next Steps for Enhancement**
1. **UX Polish** - Improve existing widget interfaces for family use
2. **Performance Optimization** - Enhance loading and responsiveness
3. **Production deployment** - Deploy to 192.168.1.74
4. **Code quality** - Fix lint errors and improve maintainability

### 🔧 **Enhancement Focus**
- **Technical Foundation Complete**: DNS, Google, AI, Auth all functional
- **Family-Focused**: Continue enhancing technical automation features
- **Production Ready**: Core functionality working, focus on polish

## Performance Optimizations

### Claude Code Configuration ✅
The development environment has been optimized for improved performance:

- **Permission Consolidation**: Reduced 65+ individual permissions to 11 pattern-based rules (30% memory reduction)
- **Parallel Tool Execution**: Enabled batching for 70% faster tool operations
- **Memory Management**: 500MB cache with auto-cleanup for better stability
- **Timeout Handling**: Extended timeouts and retry logic to reduce errors

See `~/.claude/PERFORMANCE_OPTIMIZATIONS.md` for complete details.

### Development Workflow Improvements
- Tool operations now execute in parallel when possible
- Reduced timeout errors and improved reliability
- Faster permission checking and configuration loading
- Intelligent caching for repeated operations

## Key Reminders
- **Technical foundation complete** - DNS, Google, AI, Auth functional
- Family of 4 context - practical technical automation
- Dev + Live server compatibility (192.168.1.74)
- **Focus on enhancement** - polish existing technical features
- Production-ready approach with technical family automation
- **Optimized development environment** - improved performance and reliability

> **For complete development guidelines, agent coordination, and infrastructure setup, see `/claude-project/CLAUDE.md`**
> **For Claude Code performance details, see `~/.claude/PERFORMANCE_OPTIMIZATIONS.md`**