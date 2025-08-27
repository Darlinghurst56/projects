# Home Dashboard - Unified Family Hub

[![CI/CD Pipeline](https://github.com/your-username/claude-project/actions/workflows/home-dashboard-ci.yml/badge.svg)](https://github.com/your-username/claude-project/actions/workflows/home-dashboard-ci.yml)
[![Live UX Testing](https://img.shields.io/badge/Live%20UX%20Testing-Required-critical)](http://localhost:8080/hursthome)
[![Accessibility](https://img.shields.io/badge/Accessibility-A11Y%20Compliant-green)](https://www.w3.org/WAI/WCAG21/quickref/)

A comprehensive home dashboard system that merges DNS monitoring, Google services integration, and AI-powered features into a single, cohesive application.

> **🚨 CRITICAL TESTING**: This project includes mandatory live UX testing that will **FAIL THE BUILD** if the dashboard isn't actually functional. No mocking allowed!

## 🚀 Quick Start (30 seconds)

### Access the Dashboard
- **Family Server**: http://192.168.1.74:3003
- **Development**: http://localhost:3003

### Family Authentication
- **Adults**: Click "Sign in with Google"
- **Kids**: Use your family PIN

| PIN | Access Level | What You Can Do |
|-----|-------------|-----------------|
| **123456** | Child Basic | AI chat, basic widgets |
| **567890** | Child Extended | + calendar viewing |
| **999999** | Admin Full | Everything |

### Quick Installation
```bash
npm install
cp .env.example .env
npm run dev
```

> **Need Help?** See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for family-friendly troubleshooting or [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed setup.

## 🚀 Features

### Core Components
- **DNS Monitoring**: Real-time DNS status, analytics, and performance monitoring
- **Google Services**: Calendar, Gmail, and Drive integration
- **AI Chat**: Ollama-powered chat interface with context awareness
- **Authentication**: Dual authentication system (PIN + Google OAuth)
- **Real-time Updates**: WebSocket-based live data updates

### Technical Architecture
- **Frontend**: React 18 with Vite for fast development
- **Backend**: Node.js with Express and Socket.IO
- **Integration**: n8n workflows for automation
- **AI**: Ollama integration for local AI processing
- **Dashboard**: Dashy integration for visual management

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm 8+
- Access to network services (n8n at 192.168.1.74:5678, Ollama at 192.168.1.74:11434)
- Google API credentials for services integration

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install Dashy globally** (optional):
   ```bash
   npm run install-dashy
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## 📋 Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Server Configuration
PORT=3000
CLIENT_PORT=3001
NODE_ENV=production

# External Services
N8N_URL=http://192.168.1.74:5678
OLLAMA_URL=http://192.168.1.74:11434

# Google API
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Authentication
JWT_SECRET=your-secret-key
PIN_ATTEMPTS=5
SESSION_TIMEOUT=1800000

# Feature Flags
FEATURE_DNS_MONITORING=true
FEATURE_GOOGLE_INTEGRATION=true
FEATURE_AI_CHAT=true
FEATURE_DASHY_INTEGRATION=true
```

## 🚨 CI/CD Pipeline & Live Testing

### Critical Testing Philosophy
This project enforces **REAL UX TESTING** - no mocking, no fake data. The CI/CD pipeline will:

1. **🔥 FAIL THE BUILD** if the dashboard server doesn't actually start
2. **🔥 FAIL THE BUILD** if pages don't load within performance thresholds  
3. **🔥 FAIL THE BUILD** if critical user workflows are broken
4. **🔥 FAIL THE BUILD** if accessibility standards aren't met

### Testing Pipeline Stages

#### 1. Live UX Validation (CRITICAL)
```bash
npm run test:live      # Server health + dashboard validation
npm run test:ux        # Full Playwright UX testing
```

**What gets tested:**
- Server starts and responds within 3 seconds
- Dashboard loads at `/hursthome` within performance thresholds
- Guest mode workflow works end-to-end
- Mobile responsiveness on real viewports
- Error handling for invalid routes
- Performance metrics meet strict requirements

#### 2. Code Quality Gates
```bash
npm run lint           # ESLint code quality
npm run test:security  # Security audit
npm run test:unit      # Unit tests (if present)
```

#### 3. Accessibility Testing
```bash
npm run test:a11y      # Automated accessibility compliance
```

#### 4. Cross-Platform Validation
Tested on Ubuntu, Windows, and macOS with Node 18 & 20

#### 5. MVP Integration Test
```bash
npm run test:mvp       # Complete end-to-end validation
```

### Local Testing Commands

```bash
# Run the full validation locally
npm run test:mvp

# Test only live dashboard functionality  
npm run test:live

# Run Playwright UX tests
npm run test:ux

# Quick quality check
npm run test:quick
```

### CI/CD Workflow Triggers

- **Push to main/master**: Full pipeline + deployment
- **Pull requests**: All tests except deployment
- **Manual trigger**: Complete validation

### Why This Approach?

Traditional testing often uses mocks and doesn't catch real-world failures:
- Server configuration issues
- Network connectivity problems  
- Performance degradation
- Accessibility regressions
- Cross-browser compatibility

Our live testing approach ensures the dashboard **actually works** for real family use.

### Test Artifacts

The pipeline automatically captures:
- 📸 Screenshots of working dashboard
- 📊 Performance metrics
- 🔍 Accessibility reports  
- 📋 Test execution logs

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dns/            # DNS monitoring widgets
│   ├── google/         # Google services widgets
│   └── chat/           # AI chat interface
├── services/
│   ├── api.js          # Unified API client
│   └── auth.js         # Authentication service
├── config/
│   └── index.js        # Configuration management
└── utils/              # Utility functions

server/
├── routes/             # API routes
├── middleware/         # Express middleware
├── integrations/       # External service integrations
└── index.js           # Main server file
```

### Component Integration

The system integrates three previously separate systems:

1. **Family Dashboard**: DNS monitoring and PIN authentication
2. **HouseAI**: Google services integration with vanilla JS
3. **Dashy Integration**: n8n workflows and AI chat capabilities

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Standard login
- `POST /api/auth/login-pin` - PIN-based login
- `GET /api/auth/validate` - Token validation

### DNS Monitoring
- `GET /api/dns/status` - Current DNS status
- `GET /api/dns/analytics` - DNS analytics data
- `GET /api/dns/profile` - DNS profile settings

### Google Services
- `GET /api/google/calendar/events` - Calendar events
- `GET /api/google/gmail/messages` - Gmail messages
- `GET /api/google/drive/files` - Drive files

### AI Chat
- `POST /api/ai/chat` - Send chat message
- `GET /api/ai/chat/history` - Chat history
- `DELETE /api/ai/chat/history` - Clear history

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 🔒 Security

### Authentication
- JWT-based session management
- PIN-based local authentication
- Google OAuth integration
- Rate limiting and brute force protection

### Data Protection
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Secure session storage

## 📊 Monitoring

### Health Checks
- `/health` - Basic health status
- `/api/system/status` - Detailed system status
- Real-time monitoring via WebSocket

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking and reporting

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker build -t home-dashboard .
docker run -p 3000:3000 home-dashboard
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting guide
2. Review the API documentation
3. Create an issue in the repository

## 🔄 Migration Notes

This system replaces three separate applications:
- `/apps/family-dashboard` (DNS widgets + PIN auth)
- `/apps/houseai` (Google services)
- `/apps/houseai/dashy-integration` (n8n + AI)

All functionality has been preserved and enhanced in this unified system.

---

**Version**: 1.0.0  
**Last Updated**: 2025-07-16  
**Maintained by**: HouseAI Team