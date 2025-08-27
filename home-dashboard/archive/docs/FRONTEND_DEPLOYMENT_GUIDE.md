# Home Dashboard Frontend Deployment Guide

## 📦 Deployment Package Ready

**Package**: `home-dashboard-frontend-deployment.tar.gz` (1.3MB)
**Target Server**: 192.168.1.74
**Status**: Frontend built and ready for deployment

## 🚀 Quick Deployment Steps

### 1. Transfer Files to Production Server

```bash
# From development machine, copy to production server
scp home-dashboard-frontend-deployment.tar.gz darlinghurstlinux@192.168.1.74:/home/darlinghurstlinux/
```

### 2. On Production Server (192.168.1.74)

```bash
# Extract deployment package
cd /home/darlinghurstlinux/
tar -xzf home-dashboard-frontend-deployment.tar.gz

# Create production directory
sudo mkdir -p /var/www/home-dashboard
sudo chown darlinghurstlinux:darlinghurstlinux /var/www/home-dashboard

# Deploy frontend assets
cp -r dist/* /var/www/home-dashboard/
cp .env.example /var/www/home-dashboard/.env

# Set permissions
sudo chown -R darlinghurstlinux:www-data /var/www/home-dashboard
sudo chmod -R 755 /var/www/home-dashboard
```

### 3. Configure Web Server

#### Option A: Simple HTTP Server (Quick Start)
```bash
# Install serve if not available
npm install -g serve

# Start frontend on port 3001
cd /var/www/home-dashboard
serve -s . -l 3001
```

#### Option B: Nginx (Recommended)
```bash
# Install nginx if not installed
sudo apt update && sudo apt install nginx

# Create nginx configuration
sudo tee /etc/nginx/sites-available/home-dashboard << EOF
server {
    listen 80;
    server_name 192.168.1.74 localhost;
    root /var/www/home-dashboard;
    index index.html;

    # API proxy to backend (when backend is deployed)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/home-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 Environment Configuration

Edit `/var/www/home-dashboard/.env`:

```env
# Production Environment
NODE_ENV=production
PORT=3000
CLIENT_PORT=80

# Server URLs (adjust as needed)
OLLAMA_URL=http://192.168.1.74:11434
N8N_URL=http://192.168.1.74:5678

# Security (generate secure values)
JWT_SECRET=your-secure-jwt-secret-here
DEFAULT_PIN=your-family-pin

# Google OAuth (configure for production domain)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://192.168.1.74/auth/google/callback

# CORS (allow production domains)
CORS_ORIGINS=http://192.168.1.74,http://localhost
```

## 🧪 Testing Frontend Deployment

### Test Frontend Access
```bash
# Test direct frontend access
curl -I http://192.168.1.74/

# Test from family devices
# Open browser to: http://192.168.1.74
```

### Test API Endpoints (Debug Mode)
```bash
# These will show connection status without backend
curl http://192.168.1.74/api/system/status  # Will show connection error (expected)
curl http://192.168.1.74/health              # Will proxy to backend when ready
```

## 📊 Frontend Features Available

### ✅ Ready for Testing:
- **Dashboard UI**: Complete interface loaded
- **Authentication Forms**: PIN and Google OAuth forms
- **Widget Layouts**: DNS, Google, AI chat components
- **Real-time UI**: WebSocket connection interfaces

### ⏳ Needs Backend APIs:
- DNS monitoring data
- Google services integration  
- AI chat functionality
- Authentication validation

## 🔗 Next Steps After Frontend Deployment

1. **Test Frontend**: Verify UI loads at http://192.168.1.74
2. **Deploy Backend APIs**: Enable full functionality
3. **Configure Google OAuth**: Set up family authentication
4. **Test Family Access**: Verify Windows/iOS device access

## 🚨 Quick Troubleshooting

### Frontend Not Loading
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/logs/nginx/error.log

# Verify files exist
ls -la /var/www/home-dashboard/
```

### API Connection Issues
- Expected until backend is deployed
- Frontend will show "Connection Error" messages
- UI components will still render correctly

## 📱 Family Device Testing

Once deployed, test from:
- **Windows devices**: Open browser to `http://192.168.1.74`  
- **iOS devices**: Open Safari to `http://192.168.1.74`
- **Expected**: Dashboard UI loads, shows connection status

---

**Deployment Package**: `home-dashboard-frontend-deployment.tar.gz`  
**Ready for Production**: ✅ Frontend built and packaged  
**Next Step**: Deploy to 192.168.1.74 using instructions above