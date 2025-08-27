// Simple test server to check if basic setup works
const express = require('express');
const path = require('path');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Test routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API working' });
});

// Serve React app for any other route
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hurst Home Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        h1 { color: #333; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .guest-mode { background: #e3f2fd; padding: 20px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏠 Welcome to Hurst Home</h1>
        <div class="status">
          <strong>✅ Server Status:</strong> Running successfully!
        </div>
        <div class="guest-mode">
          <strong>👋 Guest Mode:</strong> Basic dashboard is working. 
          <br/>Full React app with widgets will load here once built.
        </div>
        <h2>Available Features:</h2>
        <ul>
          <li>✅ Server running on port 80</li>
          <li>✅ URL accessible at <code>http://localhost/hursthome</code></li>
          <li>🔧 DNS monitoring widgets (when React app loads)</li>
          <li>🤖 AI chat integration (when React app loads)</li>
          <li>🔐 Google authentication (when configured)</li>
        </ul>
        <h2>Next Steps:</h2>
        <ol>
          <li>Run <code>npm run build</code> to build React frontend</li>
          <li>Configure Google OAuth credentials in .env</li>
          <li>Set up Ollama AI service connection</li>
        </ol>
        <p><strong>URL:</strong> <a href="/hursthome">/hursthome</a> | <strong>Health Check:</strong> <a href="/health">/health</a> | <strong>API Test:</strong> <a href="/api/test">/api/test</a></p>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.CLIENT_PORT || 80;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🏠 Hurst Home Dashboard test server running on http://localhost:${PORT}`);
  console.log(`📍 Access dashboard at: http://localhost:${PORT}/hursthome`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});