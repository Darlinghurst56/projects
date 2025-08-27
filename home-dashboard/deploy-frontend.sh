#!/bin/bash

# Home Dashboard Frontend Deployment Script
# Run on production server: 192.168.1.74

set -e

echo "🚀 Home Dashboard Frontend Deployment"
echo "======================================"

# Check if running on correct server
if [[ $(hostname -I | xargs | cut -d' ' -f1) != "192.168.1.74" ]]; then
    echo "⚠️  This script should be run on 192.168.1.74"
    echo "   Current IP: $(hostname -I | xargs | cut -d' ' -f1)"
    echo "   Transfer the deployment package first:"
    echo "   scp home-dashboard-frontend-deployment.tar.gz darlinghurstlinux@192.168.1.74:/home/darlinghurstlinux/"
    exit 1
fi

echo "✅ Running on production server"

# Extract deployment package
echo "📦 Extracting deployment package..."
if [[ ! -f "home-dashboard-frontend-deployment.tar.gz" ]]; then
    echo "❌ Deployment package not found!"
    echo "   Please transfer: home-dashboard-frontend-deployment.tar.gz"
    exit 1
fi

tar -xzf home-dashboard-frontend-deployment.tar.gz
echo "✅ Package extracted"

# Create production directory
echo "📁 Setting up production directory..."
sudo mkdir -p /var/www/home-dashboard
sudo chown darlinghurstlinux:darlinghurstlinux /var/www/home-dashboard

# Deploy frontend assets
echo "📋 Deploying frontend assets..."
cp -r dist/* /var/www/home-dashboard/
cp .env.example /var/www/home-dashboard/.env

# Set permissions
sudo chown -R darlinghurstlinux:www-data /var/www/home-dashboard 2>/dev/null || \
sudo chown -R darlinghurstlinux:darlinghurstlinux /var/www/home-dashboard
sudo chmod -R 755 /var/www/home-dashboard

echo "✅ Frontend assets deployed to /var/www/home-dashboard"

# Check if nginx is available
if command -v nginx &> /dev/null; then
    echo "🔧 Configuring nginx..."
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/home-dashboard > /dev/null << 'EOF'
server {
    listen 80;
    server_name 192.168.1.74 localhost;
    root /var/www/home-dashboard;
    index index.html;

    # API proxy to backend (when backend is deployed)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
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
    
    # Test and reload nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configured and reloaded"
    else
        echo "❌ Nginx configuration error"
        exit 1
    fi
    
elif command -v serve &> /dev/null; then
    echo "🔧 Using serve for simple HTTP server..."
    echo "   Starting on port 3001..."
    cd /var/www/home-dashboard
    nohup serve -s . -l 3001 > /dev/null 2>&1 &
    echo "✅ Frontend server started on port 3001"
    
else
    echo "⚠️  Neither nginx nor serve found"
    echo "   Install nginx: sudo apt install nginx"
    echo "   Or install serve: npm install -g serve"
    echo "   Frontend files are ready at: /var/www/home-dashboard"
fi

echo ""
echo "🎉 Frontend Deployment Complete!"
echo "==============================="
echo "📂 Frontend location: /var/www/home-dashboard"
echo "🌐 Access URL: http://192.168.1.74"
echo ""
echo "🧪 Test deployment:"
echo "   curl -I http://192.168.1.74/"
echo "   Open browser: http://192.168.1.74"
echo ""
echo "📝 Next steps:"
echo "   1. Test frontend UI loads correctly"
echo "   2. Deploy backend APIs for full functionality"  
echo "   3. Configure Google OAuth for family authentication"
echo ""
echo "📋 Environment file: /var/www/home-dashboard/.env"
echo "   Edit this file with production values"