# Family Dashboard MCP Server

## Overview

A Model Context Protocol (MCP) server that provides specialized file system operations and project management capabilities for family dashboard development. Designed specifically for single home user needs with focus on family-oriented task management and dashboard operations.

## Features

### 🛠️ Available Tools

1. **File System Operations** - Specialized family dashboard file management
   - Project structure navigation and organization  
   - Dashboard configuration file handling
   - Asset management for family-specific content
   - Template management for dashboard components

2. **Project Integration** - Family dashboard project structure management
   - Integration with main family dashboard project
   - Configuration synchronization
   - Asset pipeline management
   - Development workflow support

### 🏠 Family Focus Features

- **Single Home Optimization**: Designed for personal family use, not enterprise scenarios
- **Simple Project Structure**: Easy navigation and file organization
- **Family-Oriented Content**: Supports family task management, schedules, and coordination
- **Dashboard Integration**: Seamless integration with family dashboard components

## Installation

```bash
# Install dependencies
npm install

# Test the MCP server
npm test
```

## Usage

### As MCP Server

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "family-dashboard-mcp": {
      "command": "node",
      "args": ["./mcp-servers/family-dashboard-mcp/index.js"],
      "env": {}
    }
  }
}
```

### Direct Usage

```javascript
import { FamilyDashboardMCP } from './index.js';

const mcp = new FamilyDashboardMCP();

// Manage family dashboard files
const result = await mcp.manageProjectFiles('/path/to/family/dashboard');

// Handle dashboard configurations
const config = await mcp.handleDashboardConfig('family-settings.json');
```

## Integration

### With Main Family Dashboard Project
- Provides file system operations specific to dashboard needs
- Manages configuration files and assets
- Supports development workflow for family dashboard components

### With Other MCPs
- **Complements**: user-testing-mcp, accessibility-testing-mcp, design-system-mcp
- **Supports**: Task management and family coordination features
- **Integrates**: With main project file system operations

## Project Structure

```
family-dashboard-mcp/
├── index.js          # Main MCP server implementation
├── package.json      # Dependencies and configuration
├── README.md         # This documentation
└── lib/              # Supporting libraries (if any)
```

## Configuration

### Environment Variables
No specific environment variables required - operates with filesystem permissions.

### Project Paths
- Designed to work with family dashboard project structure
- Relative path support for portability
- Asset management for dashboard components

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server framework (v1.0.0)
- `@modelcontextprotocol/server-filesystem` - Core file system operations

## Troubleshooting

### Common Issues
1. **Path Resolution**: Ensure correct working directory for family dashboard project
2. **File Permissions**: Check filesystem permissions for dashboard files
3. **Project Structure**: Verify family dashboard project structure is properly set up

### Testing
```bash
# Run basic functionality tests
npm test

# Validate MCP server startup
node index.js --test
```

## Future Enhancements

1. **Advanced File Operations**
   - Family asset pipeline management
   - Configuration template generation
   - Automated backup and sync capabilities

2. **Dashboard Integration**
   - Real-time configuration updates
   - Asset optimization for dashboard
   - Family content management

3. **Family Workflow Support**
   - Task file management
   - Schedule and calendar file operations
   - Family member content organization

## Contributing

This MCP server is focused on single home family needs. Contributions should maintain simplicity while enhancing family dashboard file management capabilities.

## License

MIT License - See package.json for details