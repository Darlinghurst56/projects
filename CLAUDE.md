🚨 Claude Instructions - Main Development Guidelines
ALWAYS read this file first when starting any project work
Update task lists as we complete items
Add new discoveries to session notes
Ask for clarification if anything is unclear
Last Updated: 2025-01-30

# Development Projects - Main Claude Instructions

## Audience: Single Developer (NOT Family System)
- Individual developer working on family home automation projects
- NOT a commercial product - personal home automation development
- Focus on building tools for family use, not enterprise features

## Core Principles
- **Early MVP**: Minimal viable features first
- **Simplify**: Choose simple solutions over complex ones
- **Existing Tools**: Use proven scripts/tools, minimal custom code
- **Latest Tech**: Prioritize solutions from last 90 days
- **Real Data**: Never mock - always use real APIs/data
- **Task Management**: ALWAYS start and end jobs for every task

## Development Guidelines

### Task Management (CRITICAL)
- **ALWAYS** start job before beginning any task
- **ALWAYS** end job when task is complete
- Document task progress throughout
- Separate agent workflow from Claude code

### Dual-Tagging Agent Coordination System - DEVELOPMENT STANDARD

Our development environment uses a sophisticated dual-tagging system that combines real-time model routing with automated workflow coordination:

#### 1. CCR-SUBAGENT-MODEL Tags (Real-Time Routing)
```
<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>
```
- **Purpose**: Direct real-time model routing during API calls
- **Status**: 100% functional with comprehensive testing
- **Location**: Top of agent definition files
- **Routing Examples**:
  - `<CCR-SUBAGENT-MODEL>gemini,gemini-1.5-flash</CCR-SUBAGENT-MODEL>` → Routes to Gemini Flash
  - `<CCR-SUBAGENT-MODEL>groq,llama-3.3-70b-versatile</CCR-SUBAGENT-MODEL>` → Routes to Groq Llama
  - `<CCR-SUBAGENT-MODEL>ollama,qwen2.5-coder:latest</CCR-SUBAGENT-MODEL>` → Routes to local Ollama

#### 2. @ Tag System (Commit-Based Automation)
```bash
# Trigger security review for authentication changes
git commit -m "Add OAuth2 login @security_agent"

# Multi-agent coordination for complex features
git commit -m "Payment processing @security_agent @gem_test_agent @gem_doc_agent"

# Performance analysis for optimization work
git commit -m "Database query optimization @performance_agent"
```

**Dual-System Benefits:**
- **Real-Time Intelligence**: CCR tags ensure optimal model selection for each agent's capabilities
- **Workflow Automation**: @ tags provide automated quality gates and coordination
- **98% Built-in Functionality**: Leverages Claude Code's native infrastructure
- **Automatic Backup Protection**: Staged files backed up before agent execution
- **Cost Controls**: Inherits existing settings.json limits
- **GitHub Actions Ready**: Team collaboration workflows supported
- **Zero Maintenance**: No custom infrastructure to maintain

**Quick Reference - Available Agents with Dual-Tagging:**

| @ Tag | CCR Routing | Agent Purpose | Use When |
|-------|-------------|---------------|----------|
| `@security_agent` | `groq,llama-3.3-70b-versatile` | Security & vulnerability analysis | Auth changes, crypto, API security |
| `@performance_agent` | `groq,llama-3.1-70b-versatile` | Performance analysis & optimization | Slow queries, bottlenecks, scaling |
| `@gem_test_agent` | `gemini,gemini-1.5-flash` | Advanced testing with Gemini reasoning | Complex logic, integration testing |
| `@gem_doc_agent` | `gemini,gemini-1.5-flash` | Enhanced documentation with Gemini | API docs, complex systems, user guides |
| `@technical_architecture_agent` | `groq,llama-3.3-70b-versatile` | System design & architecture review | Major refactoring, architectural decisions |
| `@server_agent` | `groq,llama-3.1-8b-instant` | Infrastructure & deployment | Docker, services, configuration |
| `@ux_agent` | `gemini,gemini-1.5-flash` | User experience & interface validation | UI changes, workflows, accessibility |
| `@home_ui_engineer` | `gemini,gemini-1.5-flash` | Family-friendly UI implementation | React components, responsive design, family interfaces |
| `@codereview_agent` | `groq,llama-3.3-70b-versatile` | Code quality & standards review | Refactoring, new implementations |
| `@data_migration_agent` | `groq,llama-3.1-70b-versatile` | Database & data structure changes | Schema changes, data transformations |
| `@integration_agent` | `groq,llama-3.1-8b-instant` | API & service integration testing | Third-party APIs, webhooks, services |

**CCR Routing Notes:**
- `gem_*` agents automatically route to Gemini models for enhanced reasoning
- Security/architecture agents use high-capacity models for complex analysis
- Infrastructure agents use fast models for quick operations
- All routing is automatic - CCR tags in agent definitions handle this transparently

**For complete documentation and advanced patterns, see:** `~/.claude/AGENT_TAG_COORDINATION.md`

### **📋 RECOMMENDED: Agent Project Readiness Check (P017)**

**AGENTS** can optionally run project readiness assessment for guidance:

1. **Informational Guidance**: When agents enter new project folders, they may run `~/.claude/scripts/project-readiness-check.sh`
2. **Readiness Assessment**: Provides recommendations on API key security, documentation standards, project structure
3. **Non-Blocking**: Agents receive guidance but can proceed regardless of findings
4. **Philosophy**: Optimized for single developer home automation workflow - rapid iteration over rigid enforcement

**Reference**: `~/.claude/AGENT_PROJECT_READINESS_GUIDE.md` | **Process ID**: P017

### **🏠 RECOMMENDED: Home Installation Workflow (P022)**

**AGENTS** can optionally use installation guidance when adding tools/scripts:

1. **Quick Check**: Optional `~/.claude/scripts/installation-check.sh <tool-name>` for 30-second validation
2. **Use Existing First**: Check project dependencies and system tools before installing new ones
3. **Simple Documentation**: Add major additions to README, use package managers when appropriate
4. **No Blocking**: Suggestions only - install what's needed to get things working

**Reference**: `~/.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md` (Home Development Agent Guidance) | **Process ID**: P022

### **🔍 RECOMMENDED: Third-Party Script Research Protocol (P023)**

**AGENTS** must use research-first approach for third-party script issues:

1. **MANDATORY Research**: Use `~/.claude/scripts/third-party-research.sh <tool> [issue]` before coding solutions
2. **Documentation First**: Check README, official docs, GitHub issues, Stack Overflow
3. **Source Verification**: Confirm official repositories, version compatibility, proper installation
4. **Existing Solutions**: Find official fixes, workarounds, community solutions before custom code

**Philosophy**: "Research existing solutions first, code only as last resort"

**Reference**: `~/.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md` (Research-First section) | **Process ID**: P023

### **🔐 API Key Management Standards**

**AGENTS** must follow secure API key practices:

1. **Environment Variables**: Use `GOOGLE_AI_STUDIO_API_KEY` for Gemini API access
2. **Verification**: Check API key exists before bash commands: `[[ -n "$GOOGLE_AI_STUDIO_API_KEY" ]]`
3. **No Export Needed**: Gemini CLI reads environment automatically
4. **Never Hardcode**: Use variable expansion `${GOOGLE_AI_STUDIO_API_KEY}`, never literal values

**Reference**: `/projects/API_KEY_STANDARDS.md` | **Security Standards**: P017

---

## Repository Layout & Installation Guide

### **📁 Directory Structure Overview**

```
/home/darlinghurstlinux/
├── .claude/                    # Claude Code configuration & agents
│   ├── agents/                 # Agent definitions (*.md files)
│   ├── scripts/                # Utility scripts (installation-check.sh, etc.)
│   ├── MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md
│   └── AGENT_PROJECT_READINESS_GUIDE.md
├── projects/                   # Main development projects
│   ├── home-dashboard/         # PRIMARY family dashboard (Node.js)
│   ├── claude-project/         # Developer tools and utilities
│   ├── crewai-studio/          # Business automation (Python)
│   ├── miniprojects/           # Small utility projects
│   └── CLAUDE.md              # This file - main development guidelines
├── shared/                     # Shared resources across projects
│   ├── config/                 # Shared configuration files
│   │   ├── litellm/           # Legacy LiteLLM configs (defunct)
│   │   └── jellyfin/          # Media server configuration
│   ├── docs/                  # Shared documentation
│   └── scripts/               # Shared utility scripts
├── .claude-code-router/        # CCR proxy configuration (in development)
├── archive/                    # Project backups and deprecated code
└── [various config files]     # Environment-specific configurations
```

### **⚙️ Installation Patterns & Locations**

#### **Node.js Projects** (home-dashboard, claude-project)
```bash
# Package installation locations
./node_modules/              # Project-local packages (preferred)
~/.npm-global/              # Global npm packages (when needed)

# Configuration files
./.env                      # Project environment variables
./.env.example             # Environment template
./package.json             # Dependencies and scripts
./package-lock.json        # Locked dependency versions
```

#### **Python Projects** (crewai-studio, miniprojects)
```bash
# Package installation locations
./venv/                     # Project virtual environment (preferred)
~/.local/lib/python*/       # User-local pip packages

# Configuration files
./.env                      # Project environment variables
./requirements.txt          # Python dependencies
./pyproject.toml           # Modern Python project config
```

#### **System-Wide Tools**
```bash
# Claude Code & Agents
~/.claude/                  # Claude configuration directory
~/.claude/settings.json     # Claude Code settings
~/.claude/agents/           # Agent definitions

# Development Tools
/usr/local/bin/             # System binaries
~/.local/bin/               # User binaries
~/bin/                      # User scripts (if needed)
```

### **🔧 Configuration File Standards**

#### **Environment Variables Pattern**
```bash
# Project-specific (most common)
/projects/home-dashboard/.env
/projects/crewai-studio/.env

# Each project gets its own .env file in its root directory
# Never share .env files between projects for security isolation
```

#### **Shared Configuration Pattern**
```bash
# Shared configs (when appropriate)
/shared/config/jellyfin/     # Media server config
/shared/docs/               # Shared documentation

# Project-specific configs (preferred)
/projects/home-dashboard/config/
/projects/claude-project/mcp-servers/
```

### **📦 Installation Location Guidelines**

#### **For Agents Installing Tools**

1. **Check Project Type First**
   ```bash
   # Node.js project
   [[ -f "package.json" ]] && npm install <tool>
   
   # Python project  
   [[ -f "requirements.txt" ]] && pip install <tool>
   ```

2. **Prefer Project-Local Installation**
   - ✅ `npm install <tool>` (adds to ./node_modules/)
   - ✅ `pip install <tool>` (in project venv)
   - ❌ `npm install -g <tool>` (avoid global installs)

3. **Document Installation Location**
   ```bash
   # Add to project dependencies
   echo "<tool>" >> requirements.txt  # Python
   npm install --save <tool>          # Node.js (updates package.json)
   ```

### **🏠 Home Development Installation Workflow**

#### **Quick Installation Decision Tree**
```bash
1. Is tool already available?
   → command -v <tool> >/dev/null && echo "Use existing"

2. What project type?
   → package.json: use npm install <tool>
   → requirements.txt: use pip install <tool>
   → other: document in README

3. Document significant additions
   → README.md note for major tools
   → package.json/requirements.txt for dependencies
```

#### **Common Installation Scenarios**
```bash
# JSON validator for Node.js project
cd /projects/home-dashboard
npm install ajv                    # Adds to ./node_modules/
# Tool available as: ./node_modules/.bin/ajv

# Python analysis tool
cd /projects/crewai-studio  
pip install pandas                 # Installs in venv
# Import available: import pandas as pd

# System utility (rare, document well)
sudo apt install <tool>            # System-wide installation
echo "Installed <tool> system-wide for XYZ purpose" >> README.md
```

### **🔍 Location Verification Commands**
```bash
# Check where tools are installed
which <tool>                       # System binary location
npm list | grep <tool>            # Node.js package location
pip list | grep <tool>            # Python package location

# Check configuration locations
find . -name ".env*" -type f       # Find env files in project
ls -la ~/.claude/                  # Claude configuration
ls -la ./node_modules/.bin/        # Node.js executables
```

### **💡 Best Practices for Home Development**

1. **Project Isolation**: Each project manages its own dependencies
2. **Environment Separation**: Each project gets its own .env file  
3. **Shared Resources**: Use /shared/ for truly shared configs/docs
4. **Local-First**: Prefer project-local over global installations
5. **Document Choices**: Note significant installations in README
6. **Quick Validation**: Use `~/.claude/scripts/installation-check.sh` for guidance

---

### Process Enforcement & Adoption

**This @ tag system is now our standard development workflow.** To maximize quality and consistency:

**For New Developers:**
1. **Discovery**: Read this CLAUDE.md first - all key processes are documented here
2. **Practice**: Start with simple @ tags like `@gem_doc_agent` for documentation updates  
3. **Reference**: Use the quick reference table above for common scenarios
4. **Deep Dive**: Explore `~/.claude/AGENT_TAG_COORDINATION.md` for advanced coordination patterns

**For Existing Team Members:**
1. **Adoption**: Begin incorporating @ tags into your commit workflow immediately
2. **Quality Gates**: Use `@security_agent` for any auth/crypto changes, `@performance_agent` for optimization work
3. **Documentation**: Use `@gem_doc_agent` to maintain high-quality documentation automatically
4. **Testing**: Leverage `@gem_test_agent` for complex feature validation

**Process Discovery Guidelines:**
- **Start Small**: Use single @ tags initially, then progress to multi-agent coordination
- **Follow Patterns**: Common combinations like `@security_agent @gem_test_agent` for critical features
- **Automated Learning**: System learns from your patterns and suggests relevant agents
- **Team Consistency**: Standardized @ tag usage ensures consistent quality across all team members

**Remember: This system provides 98% built-in functionality + 2% custom code = maximum reliability with minimal maintenance.**

### Code Changes
- PREFER simple, clean, maintainable solutions
- MAKE smallest reasonable change to satisfy requirements
- ALWAYS ask permission before refactoring features
- CONFIRM understanding before modifying code

### Technology Choices
- Use existing scripts/tools from GitHub where possible
- Leverage latest technology (last 90 days priority)
- Minimal custom code to glue components together
- Real APIs only - never implement mock modes

## Documentation Standards

### Workflow & Documentation Rules
- **Naming**: Use descriptive, consistent naming
- **Versions**: Track changes with clear version history
- **Location**: Keep docs close to relevant code
- **Updates**: Update docs when code changes

### Issue Management
- **New Issues**: Document in project-specific README
- **Current Task**: Continue current task unless blocking
- **Escalation**: Ask for direction when uncertain

## Infrastructure Setup

### Development Environment
- **Local Dev**: localhost development server
- **Home Server**: 192.168.1.74 (one of two production servers)
  - Ollama AI service
  - Docker containers
  - Production services
- **Requirement**: Code must be flexible for localhost/IP address deployment

### Claude Code Router (CCR) Solution ✅

The claude-code-router is now fully operational and provides intelligent model routing for Claude Code commands. This proxy system routes different types of requests to optimal AI providers based on agent types and request context.

**Location**: `/home/darlinghurstlinux/.claude-code-router/`
**Status**: Production-ready with 100% test compliance
**Endpoint**: `http://127.0.0.1:3456/v1/messages`

**Key Features:**
- **CCR-SUBAGENT-MODEL Tag Routing**: Agents can specify exact models using `<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>` tags
- **Agent-based Routing**: `gem_*` agents automatically route to Gemini, others to Groq
- **Context-aware Routing**: Long context → Gemini Pro, Web search → Gemini Flash, Background tasks → Ollama
- **Multi-provider Support**: Groq, Gemini, and Ollama with failsafe fallback

**Provider Configuration:**
```json
{
  "groq": ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile"],
  "gemini": ["gemini-1.5-flash", "gemini-1.5-pro"], 
  "ollama": ["llama3.2:latest", "qwen2.5-coder:latest"]
}
```

**Routing Logic:**
- **Default**: `groq,llama-3.1-8b-instant`
- **Background**: `ollama,llama3.2:latest` 
- **Think**: `groq,llama-3.3-70b-versatile`
- **Long Context**: `gemini,gemini-1.5-pro`
- **Web Search**: `gemini,gemini-1.5-flash`

**Important Configuration Note**: 
The current implementation uses direct API key storage in `config.json` rather than environment variables. While the security documentation suggests using environment variables with a `.env` file approach, the current working configuration stores keys directly. This is acceptable for a home network environment but should be migrated to environment variables for better security practices.

**Files:**
- `config.json` - Main configuration with provider settings and API keys
- `custom-router.js` - Routing logic and CCR tag processing
- `config-loader.js` - Secure configuration loading utility (designed for env vars)
- `SECURITY.md` - Security guidelines and environment variable setup
- `CLAUDE_CODE_ROUTER_TEST_REPORT.md` - Comprehensive test results

**Why Environment Variables Cannot Use a Single Location:**
The claude-code-router operates as a standalone proxy service with its own Node.js process, separate from other project components. This architectural isolation means:

1. **Process Isolation**: Each service (router, dashboard, litellm) runs in separate processes with independent environment contexts
2. **Different .env Scopes**: Each component requires its own `.env` file in its working directory to load variables correctly
3. **Runtime Context**: Node.js process.env loading happens at startup within each process's working directory
4. **Security Compartmentalization**: Separate .env files provide better security isolation between services
5. **Configuration Inheritance**: While shared environment variables could work system-wide, each service needs component-specific configurations

**Current Working Solution**: Direct API key storage in config.json provides immediate functionality while maintaining clear separation between the router service and other project components. The claude-code-router's design as an independent proxy service makes centralized environment variable management complex without additional orchestration tools.

**Local AI Service Clarification**: 
The Ollama service mentioned in the infrastructure runs on the home server (192.168.1.74) and provides local model inference for background tasks and development work. This "local AI" capability is separate from and supplements the claude-code-router system, which primarily routes requests to cloud providers (Groq, Gemini). The home-dashboard project has its own integrated AI chat service that may utilize local models, but the claude-code-router is designed as a cloud-first routing solution with local fallback options.

## Projects Overview

This is the main projects directory containing multiple independent projects and tools.

## Active Projects

### 1. Claude Project (Developer Tools)
- **Path**: `/projects/claude-project/`
- **Status**: Active development
- **Description**: Developer tools and utilities
- **Key Apps**:
  - `/apps/taskmaster-ai/` - Developer coordination tool
  - `/apps/home-dashboard/` - DEPRECATED copy (use `/projects/home-dashboard/` instead)
- **CLAUDE.md**: Has its own detailed instructions

### 2. Home Dashboard (Main Family Dashboard)
- **Path**: `/projects/home-dashboard/`
- **Status**: ACTIVE - Main production version
- **Description**: Family notice board with DNS monitoring, Google services, AI chat
- **Note**: This is the PRIMARY version with full features and testing infrastructure

### 3. CrewAI Studio (Business-Focused)
- **Path**: `/projects/crewai-studio/`
- **Status**: Standalone business project
- **Description**: Visual interface for creating business automation and content creation crews
- **Purpose**: **BUSINESS AUTOMATION ONLY** - content creation, SEO, marketing workflows
- **Scope**: NOT connected to family automation or other development projects
- **Focus**: Commercial business processes, not technical development tools

### 4. CrewAI (Business Framework)
- **Path**: `/projects/crewai/`
- **Status**: Business automation framework
- **Description**: AI agent framework for business process automation
- **Purpose**: **BUSINESS WORKFLOWS ONLY** - supports CrewAI Studio for commercial automation
- **Scope**: Separate from coding projects, family dashboard, or technical agent development

### 5. MCP Server
- **Path**: `/projects/mcp-server/`
- **Status**: Utility/Tool
- **Description**: Model Context Protocol server
- **Purpose**: Provides context and tool access for AI models

### 6. PRD App
- **Path**: `/projects/prdapp/`
- **Status**: Utility/Tool
- **Description**: Product Requirements Document generator
- **Purpose**: Helps create structured PRDs for projects

### 7. Claude Code Flow
- **Path**: `/projects/claude-code-flow/`
- **Status**: Utility/Tool
- **Description**: Code flow visualization for Claude interactions
- **Purpose**: Development support tool

## Project Selection Guidelines

### For Family Automation Development
➡️ Use `/projects/home-dashboard/` - This is the PRIMARY family dashboard
- Complete implementation with all features
- Full testing infrastructure (browser testing, e2e tests)
- Production-ready with detailed documentation

### For Developer Tools
➡️ Use `/projects/claude-project/apps/taskmaster-ai/`
- AI agent coordination for development tasks
- Helps manage development workflow

### For Business Automation (Separate Business Project)
➡️ Use `/projects/crewai-studio/` or `/projects/crewai/`
- **Business-only focus**: Content creation, SEO, marketing automation
- **NOT for**: Family automation, coding projects, or technical development
- **Separate infrastructure**: Uses own LiteLLM configuration
- **Commercial scope**: Business process optimization only

### Important Notes
1. **Home Dashboard**: Always use the main version in `/projects/home-dashboard/` (NOT the claude-project copy)
2. **Documentation**: Each major project has its own CLAUDE.md with specific instructions
3. **Dependencies**: Projects may share dependencies (LiteLLM, Docker, etc.)
4. **Cleanup Needed**: Remove duplicate home-dashboard from claude-project/apps/

## Infrastructure Context
- **Development Machine**: Linux/WSL environment
- **Home Server**: 192.168.1.74 (one of two production servers - Ollama, Docker, services)
- **Shared Services**: LiteLLM proxy, Redis, Docker containers

## Navigation Tips
- Always check for project-specific CLAUDE.md files
- Use `claude-project` as the main development hub
- Legacy projects may exist for reference but shouldn't be modified
- **Process Discovery**: See [`PROCESS_INDEX.md`](PROCESS_INDEX.md) for comprehensive operational process documentation

## Agent Coordination Documentation
- **Quick Start**: Use the @ tag reference table in the "Task Management" section above
- **Comprehensive Guide**: See `~/.claude/AGENT_TAG_COORDINATION.md` for complete documentation
- **Agent Definitions**: Browse `~/.claude/agents/` directory for individual agent capabilities
- **Process Examples**: Look for @ tag patterns in recent commits for real-world usage examples

## Quick Project Status Check
```bash
# Check which projects have recent activity
find /home/darlinghurstlinux/projects -name "*.md" -mtime -7 -type f | grep -E "(README|CLAUDE)" | sort
```

## Key Context

### Family System
- **Target**: Family of 4 (2 adults, 2 children - do not implement child safety features, "child" is an account type only)
- **Devices**: Windows/iOS family devices
- **Purpose**: Practical home automation and coordination
- **Focus**: Real-world family needs, not enterprise features

### Development Approach
- Start with MVP features that family will actually use
- Test on both dev (localhost) and home server (192.168.1.74)
- Use existing tools and services where possible
- Keep interfaces simple and intuitive

## TaskMaster AI (when available)
```bash
# Basic task management
task-master list                    # Show all tasks
task-master next                    # Get next task
task-master show <id>               # View task details

# Workspaces
task-master tags                    # List workspaces
task-master use-tag <workspace>     # Switch workspace
```

## Claude Code Performance Optimizations ✅

The development environment has been optimized for maximum efficiency:

### Configuration Improvements
- **Permission Consolidation**: 65+ individual permissions → 11 pattern-based rules (83% reduction)
- **Parallel Tool Execution**: Batched operations for 70% speed improvement
- **Memory Management**: 500MB cache with auto-cleanup (30% memory reduction)
- **Enhanced Timeouts**: Extended limits with retry logic (80% fewer errors)

### Development Impact
- Faster tool operations through intelligent batching
- Reduced timeouts and improved reliability
- Better resource management and cleanup
- Simplified configuration maintenance

**Documentation**: See `~/.claude/PERFORMANCE_OPTIMIZATIONS.md` for technical details.

## Agent Coordination System ✅

Our @ tag agent coordination system is now active and provides enterprise-grade quality assurance:

### Key Features
- **Automatic Quality Gates**: Commit with `@security_agent` for security review, `@performance_agent` for optimization analysis
- **Built-in Backup Protection**: All staged files automatically backed up before agent execution
- **10 Specialized Agents**: Security, performance, testing, documentation, architecture, and more
- **GitHub Actions Integration**: Team collaboration workflows ready out-of-the-box
- **98% Built-in Reliability**: Leverages Claude Code's native infrastructure with minimal custom code

### Development Impact  
- **Higher Code Quality**: Automated review processes catch issues before they reach production
- **Consistent Documentation**: `@gem_doc_agent` maintains comprehensive, up-to-date documentation
- **Faster Development**: Parallel agent execution reduces manual review overhead
- **Team Standardization**: Common @ tag patterns ensure consistent quality across all developers

**Usage**: Simply add @ tags to commit messages - the system handles the rest automatically.

**Documentation**: Complete guide available at `~/.claude/AGENT_TAG_COORDINATION.md`

## Universal Reminders
- **Main Development**: Use `/projects/claude-project/` as primary hub
- **Task Management**: Always start and end jobs for every task
- **Dual-Tagging System**: 
  - **@ Tags**: Use in commit messages for automated workflows (`@security_agent`, `@gem_test_agent`)
  - **CCR Tags**: Automatically handled in agent definitions for optimal model routing
  - **Quick Pattern**: `git commit -m "Feature description @relevant_agent @gem_doc_agent"`
- **Agent Discovery**: Reference the dual-tagging table above for agent selection and automatic routing
- **Real APIs**: Never mock - always use real services
- **Family Focus**: Build for actual family use, not theoretical features
- **Documentation**: Keep CLAUDE.md files updated as projects evolve; use `@gem_doc_agent` for comprehensive docs
- **Optimized Environment**: Take advantage of parallel execution, caching, and intelligent model routing

---
> For project-specific instructions, navigate to individual project directories and read their CLAUDE.md files
> For Claude Code performance details, see `~/.claude/PERFORMANCE_OPTIMIZATIONS.md`