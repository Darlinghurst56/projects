#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Server Agent - WebSocket stability testing
 */

const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection to TaskMaster API server...');
console.log('URL: ws://localhost:3001/ws');
console.log('');

const ws = new WebSocket('ws://localhost:3001/ws');

let connectionStart = Date.now();
let messagesReceived = 0;
let heartbeatCount = 0;

ws.on('open', () => {
    const connectionTime = Date.now() - connectionStart;
    console.log(`✅ WebSocket connected in ${connectionTime}ms`);
    console.log('📊 Monitoring real-time messages...');
    console.log('');
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'subscribe_agents',
        timestamp: new Date().toISOString()
    }));
    
    console.log('📤 Sent subscription request for agent updates');
});

ws.on('message', (data) => {
    messagesReceived++;
    
    try {
        const message = JSON.parse(data);
        const timestamp = new Date().toLocaleTimeString();
        
        switch (message.type) {
            case 'connection_established':
                console.log(`[${timestamp}] 🎉 Connection established:`, message.payload.message);
                break;
                
            case 'heartbeat':
                heartbeatCount++;
                console.log(`[${timestamp}] 💓 Heartbeat #${heartbeatCount} (responding...)`);
                // Respond to heartbeat
                ws.send(JSON.stringify({ type: 'heartbeat_response' }));
                break;
                
            case 'agent_status_update':
                console.log(`[${timestamp}] 🤖 Agent Update:`, message.payload);
                break;
                
            case 'task_assigned':
                console.log(`[${timestamp}] 📋 Task Assigned:`, message.payload);
                break;
                
            case 'coordination_status_update':
                console.log(`[${timestamp}] 🎛️  Coordination Update:`, message.payload);
                break;
                
            default:
                console.log(`[${timestamp}] 📨 Unknown message type:`, message.type);
        }
    } catch (error) {
        console.log(`[${new Date().toLocaleTimeString()}] ❌ Invalid JSON message:`, data.toString());
    }
});

ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
    const duration = ((Date.now() - connectionStart) / 1000).toFixed(1);
    console.log('');
    console.log('🔌 WebSocket connection closed');
    console.log(`   Code: ${code}`);
    console.log(`   Reason: ${reason || 'No reason provided'}`);
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Messages received: ${messagesReceived}`);
    console.log(`   Heartbeats: ${heartbeatCount}`);
});

// Test duration: 30 seconds
setTimeout(() => {
    console.log('');
    console.log('⏱️  Test duration completed (30 seconds)');
    console.log('📊 Connection Statistics:');
    console.log(`   Duration: 30 seconds`);
    console.log(`   Messages received: ${messagesReceived}`);
    console.log(`   Heartbeats: ${heartbeatCount}`);
    console.log('');
    
    if (heartbeatCount > 0) {
        console.log('✅ WebSocket connection is stable and receiving heartbeats');
    } else {
        console.log('⚠️  No heartbeats received - check server configuration');
    }
    
    ws.close();
}, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('👋 Shutting down WebSocket test...');
    ws.close();
    process.exit(0);
});