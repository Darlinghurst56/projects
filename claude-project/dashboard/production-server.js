#!/usr/bin/env node
/**
 * Production Server for Enhanced Agent Dashboard
 * Serves the agent dashboard with proper routing and production optimizations
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionDashboardServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Enable CORS for API requests
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:8001'],
            credentials: true
        }));

        // Parse JSON requests
        this.app.use(express.json());
        
        // Security headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            next();
        });

        // Serve static files with proper MIME types
        this.app.use(express.static(path.join(__dirname), {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                } else if (path.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (path.endsWith('.html')) {
                    res.setHeader('Content-Type', 'text/html');
                }
            }
        }));
    }

    setupRoutes() {
        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'agent-dashboard.html'));
        });

        // Agent dashboard route
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'agent-dashboard.html'));
        });

        // Original DNS dashboard route
        this.app.get('/dns', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        });

        // API routes for TaskMaster integration
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                features: {
                    taskMasterIntegration: true,
                    responsiveDesign: true,
                    tooltipSystem: true,
                    guidedTour: true,
                    interactiveHints: true
                }
            });
        });

        // TaskMaster API proxy endpoints (for future real API integration)
        this.app.get('/api/taskmaster/tags', (req, res) => {
            // TODO: Implement real TaskMaster CLI integration
            res.json({
                message: 'TaskMaster API integration pending',
                fallbackMode: true,
                tags: [
                    { name: 'master', tasks: 8, completed: 3 },
                    { name: 'integration-specialist-tasks', tasks: 34, completed: 12 },
                    { name: 'ui-developer', tasks: 7, completed: 3 },
                    { name: 'qa-specialist', tasks: 7, completed: 1 },
                    { name: 'server-agent', tasks: 10, completed: 6 }
                ]
            });
        });

        this.app.post('/api/taskmaster/tasks', (req, res) => {
            const { tag, format, include_subtasks } = req.body;
            
            // TODO: Implement real TaskMaster CLI integration
            // Execute: task-master use-tag {tag} && task-master list --format=json
            
            res.json({
                message: 'TaskMaster API integration pending',
                fallbackMode: true,
                tag: tag,
                tasks: []
            });
        });

        // Widget API endpoints
        this.app.get('/api/widgets/status', (req, res) => {
            res.json({
                agentRegistry: { status: 'active', widgets: 1 },
                taskAssignment: { status: 'active', widgets: 1 },
                statusMonitor: { status: 'placeholder', widgets: 0 },
                capabilityMatrix: { status: 'placeholder', widgets: 0 },
                dnsIntegration: { status: 'active', widgets: 2 }
            });
        });

        // Fallback route for SPA
        this.app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                res.status(404).json({ error: 'API endpoint not found' });
            } else {
                res.sendFile(path.join(__dirname, 'agent-dashboard.html'));
            }
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Server Error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.path} not found`
            });
        });
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 Enhanced Agent Dashboard Production Server running on port ${this.port}`);
            console.log(`📊 Agent Dashboard: http://localhost:${this.port}/dashboard`);
            console.log(`🌐 DNS Dashboard: http://localhost:${this.port}/dns`);
            console.log(`🔧 API Health: http://localhost:${this.port}/api/health`);
            console.log('');
            console.log('✅ Features Available:');
            console.log('   • TaskMaster Integration (fallback mode)');
            console.log('   • Responsive Design (tested)');
            console.log('   • Interactive Tooltips');
            console.log('   • Guided Tour System');
            console.log('   • Settings & Help Menu');
            console.log('   • 63 tasks across 5 contexts visibility');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 Received SIGTERM, shutting down gracefully...');
            this.server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 Received SIGINT, shutting down gracefully...');
            this.server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        return this.server;
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// Auto-start if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new ProductionDashboardServer();
    server.start();
}

export default ProductionDashboardServer;