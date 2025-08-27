# MCP Server Setup and Integration Guide

## Overview

This comprehensive guide covers the Model Context Protocol (MCP) server ecosystem for the claude-project, including setup, configuration, and integration patterns for agents. The MCP architecture provides a standardized way for AI agents to access external tools and capabilities.

## Quick Start

1. **Copy environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Configure required API keys** in `.env`:
   - `GITHUB_TOKEN` - GitHub personal access token for repository access
   - `GOOGLE_API_KEY` - Google API key for TaskMaster integration

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Test MCP servers**:
   ```bash
   ./start-mcps-final.sh
   ```

5. **Validate MCP setup**:
   ```bash
   ./scripts/validate-mcp-setup.sh
   ```

## MCP Server Configuration

### Core Servers (Always Required)
- **filesystem** - File system operations
- **memory** - Context memory management
- **sequential-thinking** - Sequential reasoning support

### Integration Servers (Require API Keys)
- **github** - GitHub repository integration (requires `GITHUB_TOKEN`)
- **task-master-ai** - AI task coordination (requires `GOOGLE_API_KEY`)

### Development Servers (Optional)
- **context7** - Up-to-date documentation fetching (free, no API key)
- **vite** - Build tool integration
- **eslint** - Code quality checking
- **playwright** - Browser automation
- **docker** - Container management

### Custom Servers (Project-Specific)
- **accessibility-testing-mcp** - WCAG compliance testing
- **user-testing-mcp** - User experience testing
- **design-system-mcp** - UI component consistency

## API Key Setup

### GitHub Token (Required for GitHub MCP)
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create new token with `repo` scope
3. Add to `.env`: `GITHUB_TOKEN=your_token_here`

### Google API Key (Required for TaskMaster AI)
1. Go to Google Cloud Console
2. Enable required APIs (based on TaskMaster needs)
3. Create API key
4. Add to `.env`: `GOOGLE_API_KEY=your_key_here`

## Troubleshooting

### Common Issues
- **Path not found**: Ensure you're in `/home/darlinghurstlinux/projects/claude-project/`
- **Permission denied**: Check file permissions on custom MCP servers
- **API rate limits**: Check API key validity and usage quotas

### Testing Individual Servers
```bash
# Test filesystem server
npx @modelcontextprotocol/server-filesystem .

# Test memory server  
npx @modelcontextprotocol/server-memory

# Test GitHub server (requires token)
GITHUB_TOKEN=your_token npx @modelcontextprotocol/server-github
```

## Security Notes

- Never commit actual API keys to git
- Keep `.env` file in `.gitignore`
- Rotate API keys regularly
- Use minimum required permissions for tokens

## Project-Specific MCP Configurations

### Main Project (`/projects/claude-project/.mcp.json`)
**17 Servers Total**: Core development environment with comprehensive tooling
- **Core**: filesystem, memory, sequential-thinking
- **Integration**: task-master-ai, github, context7
- **Development**: vite, tailwindcss, shadcn-ui, cron, fetch, playwright, docker, eslint
- **Custom UX**: accessibility-testing-mcp, user-testing-mcp, design-system-mcp

### TaskMaster AI (`/projects/claude-project/apps/taskmaster-ai/.mcp.json`)
**8 Servers Total**: Focused on task management and UX validation
- **Core**: filesystem, memory, task-master-ai
- **Testing**: puppeteer, playwright
- **Custom UX**: accessibility-testing-mcp, user-testing-mcp, design-system-mcp

### CrewAI Studio (`/projects/crewai-studio/CrewAI-Studio/.mcp.json`)
**7 Servers Total**: Collaborative AI development environment
- **Core**: filesystem, memory, sequential-thinking
- **Integration**: github, eslint
- **Testing**: playwright
- **Documentation**: context7

## MCP Server Capability Matrix

### Data & File Management
| Server | Read Files | Write Files | Memory | Git Operations |
|--------|------------|-------------|---------|---------------|
| filesystem | ✅ | ✅ | ❌ | ❌ |
| memory | ❌ | ❌ | ✅ | ❌ |
| github | ✅ | ✅ | ❌ | ✅ |

### Development & Testing
| Server | Code Quality | Browser Testing | UI Components | Accessibility |
|--------|-------------|----------------|---------------|--------------|
| eslint | ✅ | ❌ | ❌ | ❌ |
| playwright | ❌ | ✅ | ❌ | ✅ |
| puppeteer | ❌ | ✅ | ❌ | ✅ |
| accessibility-testing-mcp | ❌ | ✅ | ❌ | ✅ |
| user-testing-mcp | ❌ | ✅ | ✅ | ✅ |
| design-system-mcp | ❌ | ✅ | ✅ | ✅ |

### Build & Deployment
| Server | Build Tools | Containers | Styling | Task Management |
|--------|-------------|------------|---------|----------------|
| vite | ✅ | ❌ | ❌ | ❌ |
| docker | ❌ | ✅ | ❌ | ❌ |
| tailwindcss | ❌ | ❌ | ✅ | ❌ |
| shadcn-ui | ❌ | ❌ | ✅ | ❌ |
| cron | ❌ | ❌ | ❌ | ✅ |
| task-master-ai | ❌ | ❌ | ❌ | ✅ |

## Agent Integration Patterns

### For Code Development Agents
**Recommended MCP Stack**: filesystem + memory + sequential-thinking + eslint + github
```json
{
  "primary": ["filesystem", "memory", "sequential-thinking"],
  "code_quality": ["eslint"],
  "version_control": ["github"],
  "optional": ["context7", "docker"]
}
```

### For UX/UI Agents
**Recommended MCP Stack**: All custom UX servers + playwright + design tools
```json
{
  "primary": ["filesystem", "memory"],
  "ux_testing": ["accessibility-testing-mcp", "user-testing-mcp"],
  "design_system": ["design-system-mcp", "tailwindcss", "shadcn-ui"],
  "browser_testing": ["playwright", "puppeteer"]
}
```

### For Task Management Agents
**Recommended MCP Stack**: task-master-ai + memory + scheduling
```json
{
  "primary": ["task-master-ai", "memory"],
  "scheduling": ["cron"],
  "data_access": ["filesystem", "fetch"],
  "integration": ["github"]
}
```

## Advanced Configuration

### Environment-Specific Settings
```bash
# Development environment
NODE_ENV=development
MCP_LOG_LEVEL=debug

# Production environment  
NODE_ENV=production
MCP_LOG_LEVEL=info
MCP_TIMEOUT=30000
```

### Custom Server Path Configuration
```json
{
  "accessibility-testing-mcp": {
    "command": "node",
    "args": ["./mcp-servers/accessibility-testing-mcp/index.js"],
    "env": {},
    "timeout": 30000
  }
}
```

### Cross-Project MCP Coordination

#### When Working Across Projects
1. **Check Current Project Context**: `pwd` to verify you're in the correct project directory
2. **Verify Available MCPs**: Different projects have different MCP availability
3. **Use Appropriate Tools**: TaskMaster context has fewer but focused MCPs
4. **Path Awareness**: Custom MCPs use relative paths - ensure correct working directory

#### Project Context Switching
```bash
# Switch to main project
cd /home/darlinghurstlinux/projects/claude-project
# Available: 17 MCPs including full development stack

# Switch to TaskMaster
cd /home/darlinghurstlinux/projects/claude-project/apps/taskmaster-ai  
# Available: 8 MCPs focused on task management and UX

# Switch to CrewAI
cd /home/darlinghurstlinux/projects/crewai-studio/CrewAI-Studio
# Available: 7 MCPs for collaborative development
```

## Version Information

- MCP SDK Version: ^1.0.0 (standardized across all custom servers)
- Core servers use latest stable versions via npx
- Custom servers use relative paths for portability
- Configuration validation available via `./scripts/validate-mcp-setup.sh`