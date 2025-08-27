#!/usr/bin/env node

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 3005;

// Simple HTTP server to serve the device editor
const server = http.createServer(async (req, res) => {
    try {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        if (req.url === '/' || req.url === '/device-editor.html') {
            // Serve the device editor HTML
            try {
                const htmlContent = await fs.readFile(path.join(__dirname, 'device-editor.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(htmlContent);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading device editor');
            }
            return;
        }
        
        if (req.url === '/json') {
            // Proxy to main dashboard
            const mainDashboardUrl = 'http://localhost:3001/json';
            try {
                const response = await fetch(mainDashboardUrl);
                const data = await response.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            } catch (error) {
                console.error('Error fetching from main dashboard:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to fetch from main dashboard: ' + error.message }));
            }
            return;
        }
        
        if (req.url === '/api/update-description' && req.method === 'POST') {
            // Handle description updates (placeholder for now)
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const { ip, description } = JSON.parse(body);
                    console.log(`📝 Request to update ${ip} name to "${description}"`);
                    
                    // For now, return success - this would need to be implemented in the main dashboard
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Description update requested (implementation pending)',
                        note: 'This endpoint needs to be implemented in the main dashboard'
                    }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                }
            });
            return;
        }
        
        if (req.url === '/api/update-device-type' && req.method === 'POST') {
            // Handle device type updates (placeholder for now)
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const { ip, deviceType } = JSON.parse(body);
                    console.log(`🏷️  Request to update ${ip} type to "${deviceType}"`);
                    
                    // For now, return success - this would need to be implemented in the main dashboard
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Device type update requested (implementation pending)',
                        note: 'This endpoint needs to be implemented in the main dashboard'
                    }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                }
            });
            return;
        }
        
        // 404 for everything else
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`📝 Device Editor Server running on http://localhost:${PORT}`);
    console.log(`🔗 Main Dashboard API: http://localhost:3001`);
    console.log(`📱 Access the editor at: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    console.log('\n👋 Device Editor Server shutting down...');
    server.close(() => {
        process.exit(0);
    });
});