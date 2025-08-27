# Installation Guide

## Quick Setup (30 seconds)

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git access

### One-Command Installation
```bash
# Complete automated setup
npm run setup

# Alternative: Manual setup
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Access the Dashboard
- **Family Server**: http://192.168.1.74:3003
- **Development**: http://localhost:3003

## Environment Configuration

### Required Environment Variables
```bash
# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# External Services
OLLAMA_URL=http://192.168.1.74:11434
N8N_URL=http://192.168.1.74:5678

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### Google API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API and Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3003/auth/google/callback`
   - `http://192.168.1.74:3003/auth/google/callback`

## Installation Verification

### Automated Test Script
```bash
# Run installation verification
npm run test:install

# Manual verification steps
npm list --depth=0 | grep -E "(react|express|socket\.io)"
test -f .env && echo "✅ Environment configured"
npm run build && echo "✅ Build successful"
```

### Service Connectivity Check
```bash
# Test external services
curl -f http://192.168.1.74:5678/healthz || echo "⚠️ n8n not accessible"
curl -f http://192.168.1.74:11434/api/tags || echo "⚠️ Ollama not accessible"
```

## Troubleshooting Installation

### Common Issues

**Node.js Version Error**
```bash
# Install Node.js 18+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Permission Errors**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**External Service Issues**
- Ensure services are running on the family server
- Check network connectivity to 192.168.1.74
- Verify firewall settings allow access to ports 5678 and 11434

## Development Setup

### Development Mode
```bash
# Start development server
npm run dev

# Start with debugging
DEBUG=dashboard:* npm run dev

# Start backend only
npm run server:dev

# Start frontend only  
npm run client:dev
```

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to production
npm run deploy
```

---

**Need Help?** Check the troubleshooting section or see `/home/darlinghurstlinux/projects/home-dashboard/archive/docs/` for detailed installation guides.