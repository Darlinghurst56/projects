# Hurst Home Dashboard - Deployment Guide

## URL Access

**Primary Access URL**: `http://localhost/hursthome`
- **Landing Page**: `/HurstHome` (public access, no login required)
- **Alternative URLs**: `/`, `/dashboard` (also work)

## Port Configuration

### Default Configuration (Port 80)
- **Frontend**: Port 80 (standard HTTP)
- **Backend API**: Port 3000
- **Access**: `http://localhost/hursthome`

### Development Requirements

**Port 80 Setup:**
```bash
# Linux/Mac - Run with sudo for port 80 access
sudo npm run dev

# Windows - Run as Administrator
npm run dev
```

**Alternative Port Configuration:**
If port 80 is unavailable, you can use custom ports:

```bash
# Environment variables
CLIENT_PORT=3001
WS_PORT=3001

# Access URL becomes:
http://localhost:3001/hursthome
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

### 3. Run Development Server
```bash
# Standard setup (requires sudo/admin for port 80)
sudo npm run dev

# Alternative port setup
CLIENT_PORT=3001 npm run dev
```

### 4. Access Dashboard
```bash
# Default (port 80)
http://localhost/hursthome

# Alternative port
http://localhost:3001/hursthome
```

## Guest vs Authenticated Features

### 🔓 **Guest Mode** (No Login Required)
Available at `http://localhost/hursthome` immediately:

- ✅ **DNS Status** - Network monitoring and safety
- ✅ **DNS Analytics** - Usage statistics and blocked domains
- ✅ **AI Chat** - Local Ollama assistant for general questions

### 🔐 **Authenticated Mode** (Google Login Required)
Additional features after signing in:

- ✅ **Google Calendar** - Family event scheduling
- ✅ **Gmail** - Family inbox management
- ✅ **Google Drive** - Family file access
- ✅ **Meal Planner** - PDF shopping list processing

## Production Deployment

### Port 80 Setup (Recommended)
```bash
# Linux - Configure nginx/apache proxy
# Or run directly with sudo
sudo NODE_ENV=production npm start
```

### 192.168.1.74 Production Server
```bash
# Access URLs
http://192.168.1.74/hursthome
http://192.168.1.74/HurstHome

# Services integrated:
# - Ollama AI: http://192.168.1.74:11434
# - n8n workflows: http://192.168.1.74:5678
```

## Security Notes

### CORS Configuration
Automatically configured for:
- `http://localhost` (port 80)
- `http://localhost:80` (explicit)
- `http://192.168.1.74` (production)

### Authentication
- **Guest Mode**: No personal data access
- **Google OAuth**: Family Google account integration
- **Secure Logout**: Returns to guest mode, clears tokens

## Troubleshooting

### Port 80 Permission Issues
```bash
# Linux/Mac
sudo npm run dev

# Or use alternative port
CLIENT_PORT=8080 npm run dev
```

### CORS Errors
Update `.env` file:
```bash
CORS_ORIGINS=http://localhost,http://localhost:8080,http://your-custom-url
```

### Google OAuth Setup
1. Google Cloud Console → APIs & Credentials
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/auth/google/callback`
4. Update `.env` with client ID and secret

## Testing

### Run Tests
```bash
# Unit tests
npm test

# E2E tests (requires running server)
npm run test:e2e

# All tests including build
npm run test:mvp
```

### Test URLs
Tests automatically use the configured base URL:
- Default: `http://localhost/hursthome`
- Custom: Set `baseURL` in `playwright.config.js`

## Architecture Overview

```
Frontend (Port 80)     Backend (Port 3000)     External Services
├── /hursthome        ├── /api/dns/*          ├── Ollama AI (:11434)
├── /login            ├── /api/google/*       ├── Google APIs
├── /dashboard        ├── /api/ai/*           └── Control D DNS
└── Guest/Auth modes  └── /api/system/*
```

## Family Usage

**Daily Workflow:**
1. Visit `http://localhost/hursthome`
2. Use DNS monitoring and AI chat (no login needed)
3. Sign in with Google for calendar, email, meal planning
4. All family members can use the same dashboard

**Multiple Users:**
- Each family member can sign in with their Google account
- Guest mode always available for quick access
- Logout returns to guest mode (stays on same page)

This setup provides immediate value to family members while offering enhanced functionality for authenticated users.