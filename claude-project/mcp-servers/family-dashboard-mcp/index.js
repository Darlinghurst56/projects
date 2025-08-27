#!/usr/bin/env node

/**
 * Family Dashboard MCP Server
 * Provides file system access for family dashboard operations
 */

const { createFileSystemServer } = require('@modelcontextprotocol/server-filesystem');
const path = require('path');

// Define the root path for the family dashboard project
const rootPath = process.env.FAMILY_DASHBOARD_ROOT || path.join(__dirname, '../../../');

// Create and start the MCP server
const server = createFileSystemServer({
  allowedDirectories: [rootPath],
  name: 'family-dashboard-mcp',
  version: '1.0.0'
});

server.start();

console.log(`Family Dashboard MCP Server started with root path: ${rootPath}`);