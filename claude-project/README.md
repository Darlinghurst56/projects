# TaskMaster AI - Claude Code Project

A comprehensive multi-agent AI system built with TaskMaster AI, featuring Claude Code integration and Model Context Protocol (MCP) servers for enhanced AI capabilities.

This project is built on **Turborepo** for efficient monorepo management and development workflow.

## Overview

This project combines TaskMaster AI's multi-agent architecture with Claude Code's development capabilities, creating a powerful system for autonomous task management, code generation, and quality assurance.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `apps/taskmaster-ai`: Core TaskMaster AI application
- `dashboard/`: Real-time task monitoring dashboard  
- `mcp-servers/`: Custom MCP server implementations
- `docs/`: Project documentation and agent contexts
- `@repo/ui`: React component library (if using shared components)
- `@repo/eslint-config`: ESLint configurations
- `@repo/typescript-config`: TypeScript configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## MCP Server Configuration

The project uses the Model Context Protocol (MCP) to provide Claude Code with specialized tools and capabilities:

### Core MCP Servers

- **`memory`** - Persistent memory and context storage
- **`filesystem`** - File system operations and management
- **`sequential-thinking`** - Complex reasoning and analysis
- **`github`** - Repository management and version control
- **`playwright`** - Browser automation and testing
- **`docker`** - Container management and deployment
- **`eslint`** - Code linting and quality assurance
- **`context7`** - Code documentation and context analysis
- **`sourcery`** - Code quality and refactoring suggestions

### Custom MCP Servers

- **`task-master-ai`** - TaskMaster AI integration
- **`accessibility-testing-mcp`** - Accessibility testing and validation
- **`user-testing-mcp`** - User experience testing and analysis
- **`design-system-mcp`** - Design system management
- **`fetch`** - HTTP client and API operations

## Quick Start

### Prerequisites

- Node.js 22.16.0 or higher
- Docker (for containerized services)
- Git (for version control)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd claude-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Required Environment Variables

```env
# Google Gemini API Key (for TaskMaster AI)
GOOGLE_API_KEY=your_google_api_key

# GitHub Personal Access Token (for GitHub MCP)
GITHUB_TOKEN=your_github_token

# Optional: OLLAMA host for local LLM
OLLAMA_HOST=localhost:11434
```

## Development with Turborepo

### Build

To build all apps and packages, run the following command:

```bash
# With global turbo installed (recommended)
turbo build

# Without global turbo
npx turbo build
```

You can build a specific package using filters:

```bash
# Build only TaskMaster AI
turbo build --filter=taskmaster-ai

# Build only dashboard
turbo build --filter=dashboard
```

### Development

To develop all apps and packages:

```bash
# With global turbo installed (recommended)
turbo dev

# Without global turbo
npx turbo dev
```

You can develop specific packages:

```bash
# Develop TaskMaster AI only
turbo dev --filter=taskmaster-ai

# Develop dashboard only
turbo dev --filter=dashboard
```

### Running the System

```bash
# Check MCP server configuration
./start-mcps-final.sh

# Start the dashboard
cd dashboard
npm start

# Start TaskMaster AI
cd apps/taskmaster-ai
npm run dev
```

## MCP Server Management

MCP servers are automatically started by Claude Code when needed. They communicate via stdio protocol and don't require manual startup.

### Configuration Check

Run the configuration script to verify all MCP servers are properly configured:

```bash
./start-mcps-final.sh
```

## Development Workflow

### 1. Task Creation
- Use TaskMaster AI to create and manage tasks
- Tasks are automatically assigned to appropriate agents
- Real-time monitoring via dashboard

### 2. Code Development
- Claude Code provides AI-assisted development
- MCP servers enable specialized functionality
- Automated testing and quality assurance

### 3. Quality Assurance
- Sourcery MCP provides code quality analysis
- ESLint MCP handles linting and formatting
- Accessibility testing via custom MCP servers

## Agent System

The project uses a multi-agent architecture with specialized roles:

- **TaskMaster Agent**: Central coordination and task management
- **Developer Agent**: Code generation and implementation
- **QA Agent**: Quality assurance and testing
- **Server Agent**: Infrastructure and deployment management

## Testing

```bash
# Run all tests
npm test

# Run tests for specific packages
turbo test --filter=taskmaster-ai
turbo test --filter=dashboard
```

## Turborepo Utilities

This Turborepo has additional tools setup:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Remote Caching

Turborepo can use [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines.

To enable Remote Caching:

```bash
# Login to Vercel
turbo login

# Link to Remote Cache
turbo link
```

## Documentation

- `ARCHITECTURE.md` - System architecture overview
- `ONBOARDING.md` - Developer onboarding guide
- `PLAYWRIGHT_SOLUTION.md` - Browser automation setup
- `docs/agent-contexts/` - Agent-specific documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks with `turbo test` and `turbo lint`
5. Submit a pull request

## Useful Links

Learn more about the tools used:

- [Turborepo Documentation](https://turborepo.com/docs)
- [TaskMaster AI Documentation](./apps/taskmaster-ai/README.md)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## License

This project is licensed under the MIT License - see the LICENSE file for details.