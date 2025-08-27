# Process Index

## Table of Contents
1. [Introduction](#introduction)
2. [Service Status Dashboard](#service-status-dashboard)
3. [Agent & AI Configuration](#agent--ai-configuration)
4. [Development & Build](#development--build)
5. [System Administration & Permissions](#system-administration--permissions)
6. [Documentation & Reporting](#documentation--reporting)
7. [Infrastructure & Deployment](#infrastructure--deployment)
8. [How to Use This Index](#how-to-use-this-index)
9. [Maintenance Procedures](#maintenance-procedures)
   - [Testing Standards for All Processes](#testing-standards-for-all-processes)
10. [Basic Configuration Guide (Home Development)](#basic-configuration-guide-home-development)
11. [Quick Troubleshooting (Home Development)](#quick-troubleshooting-home-development)

## Introduction

This document serves as the central hub for discovering and understanding all operational processes, scripts, and workflows in the darlinghurstlinux environment. **Optimized for individual developer home automation projects** - focuses on simple solutions, rapid iteration, and family-scale systems rather than enterprise complexity. Each process is categorized, tagged, and documented with clear inputs, outputs, and dependencies.

### Quick Reference
- **Process IDs**: Each process has a unique identifier (P001, P002, etc.)
- **Tags**: Use `@` tags for filtering and discovery (e.g., `@docker`, `@claude`)
- **Navigation**: Click process IDs for anchor links
- **Search**: Use Ctrl+F with process IDs or tags

## Service Status Dashboard

### 🟢 **Active Services** (Currently Working)
- **Claude-Code-Router (CCR)**: Port 3456 - AI model routing and agent coordination
- **Ollama**: Port 11434 - Local AI models (primary for home use)
- **Home Dashboard**: Port 3000 - Family dashboard with widgets
- **Gemini CLI**: Local AI coding assistant
- **n8n Workflows**: Automation and integration platform

### 🟡 **Services in Active Development** (Known Issues)
- **Claude-Code-Router (CCR)**: Environment variable and API key handling limitations
  - **Current Issues**: Variable substitution and credential management
  - **Status**: Active development, exempt from standard configuration practices
  - **Reference**: Check CCR documentation for updates

### 🔴 **Defunct Services** (No Longer Used)
- **LiteLLM**: Proxy service replaced by CCR
  - **Migration**: Use CCR (port 3456) instead
  - **Legacy Files**: `/shared/config/litellm/` directory retained for reference
- **LiteLLM Docker Deployments**: Replaced by native CCR service

### 🏠 **Home Development Focus** 
This environment prioritizes **individual developer working on family home automation projects**:
- **Local-first**: Ollama for AI, local services over cloud when possible
- **Simple setup**: Minimal configuration, rapid iteration over rigid processes
- **Practical standards**: Clean code practices without enterprise overhead
- **Cost-effective**: Free/local services preferred, family-scale solutions
- **Early MVP**: Minimal viable features first, simple solutions over complex ones
- **Real data**: Always use real APIs/data, never implement mock modes

---

## Agent & AI Configuration
*Processes related to Claude agents, Gemini integration, and LiteLLM proxy management*

---
### <a name="P001"></a> Claude Shell Proxy Setup → CCR Routing
- **ID:** P001
- **Status:** **UPDATED** - Migrated from LiteLLM to Claude-Code-Router (CCR)
- **Description:** Configures Claude CLI to route through Claude-Code-Router (CCR) for enhanced model access and agent routing capabilities. **Note:** CCR is in active development with known issues around environment variables and API key handling.
- **Current Issues:** CCR has known limitations with variable handling - exempt from standard configuration practices
- **Tags:** `@claude`, `@ccr`, `@cli`, `@setup`, `@active-development`, `@process`
- **Location:** [`shared/config/litellm/claude-shell-proxy.sh`](../shared/config/litellm/claude-shell-proxy.sh) - **LEGACY**, use CCR configuration
- **Inputs:** CCR URL (http://127.0.0.1:3456), authentication tokens (when stable)
- **Outputs:** Updated Claude CLI configuration for CCR routing
- **Dependencies:** Claude CLI installation, running CCR service (port 3456)

---
### <a name="P002"></a> Agent Routing Test Suite
- **ID:** P002
- **Description:** Validates agent routing configuration and tests failover mechanisms between different AI models and providers. **Implements comprehensive success validation** as per testing standards - verifies both HTTP responses AND actual routing success, including error code validation and response content verification.
- **Tags:** `@test`, `@agent`, `@routing`, `@validation`, `@process`
- **Location:** [`shared/config/litellm/test-agent-routing.sh`](../shared/config/litellm/test-agent-routing.sh)
- **Inputs:** Routing configuration files, test prompts
- **Outputs:** Comprehensive test results with success/failure validation, routing validation report, error analysis
- **Dependencies:** LiteLLM proxy, configured agents, jq for response parsing

---

## Development & Build
*Development workflows, build processes, and project setup scripts*

---
### <a name="P003"></a> CrewAI Studio Setup
- **ID:** P003
- **Description:** Installs and configures CrewAI Studio development environment with all necessary dependencies and API integrations.
- **Tags:** `@crewai`, `@setup`, `@development`, `@ai`, `@process`
- **Location:** [`projects/crewai/setup-crewai-studio.sh`](../projects/crewai/setup-crewai-studio.sh)
- **Inputs:** API keys, Python environment settings
- **Outputs:** Configured CrewAI Studio instance, virtual environment
- **Dependencies:** Python 3.8+, pip, virtual environment tools

---
### <a name="P004"></a> Home Dashboard Development Environment
- **ID:** P004
- **Description:** Configures and manages the family dashboard development environment with testing suite, Intel N100 optimizations, and production setup validation.
- **Tags:** `@dashboard`, `@development`, `@react`, `@intel-n100`, `@process`
- **Location:** [`projects/home-dashboard/scripts/start-intel-n100-dev.sh`](../projects/home-dashboard/scripts/start-intel-n100-dev.sh)
- **Inputs:** Environment configuration, hardware optimization settings, test parameters
- **Outputs:** Optimized development server, performance benchmarks, validation reports
- **Dependencies:** Node.js, npm packages, Intel N100 optimization libraries

---

## System Administration & Permissions
*System maintenance, permission fixes, and administrative scripts*

---
### <a name="P005"></a> NPM Permission Repair
- **ID:** P005
- **Description:** Fixes common NPM permission issues in WSL/Linux environments by correcting ownership and global package installation paths.
- **Tags:** `@npm`, `@permissions`, `@fix`, `@maintenance`, `@process`
- **Location:** [`fix-npm-permissions.sh`](../fix-npm-permissions.sh)
- **Inputs:** Current user context, npm global directory
- **Outputs:** Corrected file permissions, updated npm config
- **Dependencies:** npm installation, sudo access

---
### <a name="P006"></a> System Tools Repair
- **ID:** P006
- **Description:** Comprehensive system repair script for common development tool issues including Git, Node.js, Python, and Docker configurations.
- **Tags:** `@repair`, `@tools`, `@maintenance`, `@system`, `@process`
- **Location:** [`repair-tools.sh`](../repair-tools.sh)
- **Inputs:** System state diagnostics, user permissions
- **Outputs:** Repaired tool configurations, status report
- **Dependencies:** Multiple development tools, administrative access

---
### <a name="P007"></a> Claude Health Check
- **ID:** P007
- **Description:** Validates Claude CLI installation, agent configurations, and connectivity to AI services with comprehensive diagnostics.
- **Tags:** `@claude`, `@health`, `@diagnostics`, `@validation`, `@process`
- **Location:** [`.claude/health-check.sh`](../.claude/health-check.sh)
- **Inputs:** Claude configuration files, API endpoints
- **Outputs:** Health status report, error diagnostics
- **Dependencies:** Claude CLI, agent definitions, network connectivity

---

## Documentation & Reporting
*Documentation generation, API documentation, and reporting processes*

---
### <a name="P008"></a> API Documentation Generation
- **ID:** P008
- **Description:** Generates comprehensive API documentation for the home dashboard project including endpoints, schemas, and authentication flows.
- **Tags:** `@docs`, `@api`, `@documentation`, `@generation`, `@process`
- **Location:** [`projects/home-dashboard/API_DOCUMENTATION.md`](../projects/home-dashboard/API_DOCUMENTATION.md)
- **Inputs:** Source code, API definitions, configuration files
- **Outputs:** Formatted API documentation, usage examples
- **Dependencies:** Source code analysis, documentation templates

---

## Infrastructure & Deployment
*Container orchestration, deployment automation, and infrastructure management*

---
### <a name="P009"></a> Continuous Router Log Collection
- **ID:** P009
- **Description:** Automated router log collection system using Puppeteer with session management, circuit breaker patterns, and configurable retention policies for continuous network monitoring.
- **Tags:** `@monitoring`, `@logs`, `@router`, `@automation`, `@process`
- **Location:** [`projects/miniprojects/router_logs/continuous-log-collector.js`](../projects/miniprojects/router_logs/continuous-log-collector.js)
- **Inputs:** Router IP, credentials, polling interval configuration via environment variables
- **Outputs:** JSON log files, session state files, retention-managed log archives
- **Dependencies:** Node.js, Puppeteer, router web interface access

---
### <a name="P010"></a> Router Log Ecosystem Management
- **ID:** P010
- **Description:** PM2 ecosystem configuration for managing long-running router log collection processes with automatic restart, log rotation, and monitoring.
- **Tags:** `@pm2`, `@ecosystem`, `@monitoring`, `@management`, `@process`
- **Location:** [`projects/miniprojects/router_logs/ecosystem.config.js`](../projects/miniprojects/router_logs/ecosystem.config.js)
- **Inputs:** PM2 configuration parameters, log file paths, restart policies
- **Outputs:** Managed PM2 processes, rotated log files, process monitoring
- **Dependencies:** PM2 process manager, Node.js application

---
### <a name="P011"></a> Paperless AI Setup
- **ID:** P011
- **Description:** Comprehensive setup script for Paperless-ngx with AI document processing integration, including OCR, classification, and automated filing workflows.
- **Tags:** `@paperless`, `@ai`, `@setup`, `@ocr`, `@process`
- **Location:** [`shared/scripts/setup/setup-paperless-ai.sh`](../shared/scripts/setup/setup-paperless-ai.sh)
- **Inputs:** Docker environment, API configurations, storage paths
- **Outputs:** Running Paperless-ngx instance, AI processing pipeline, document workflows
- **Dependencies:** Docker, Docker Compose, AI service endpoints

---
### <a name="P012"></a> Google Drive Integration Setup
- **ID:** P012
- **Description:** Configures Google Drive API integration with rclone for automated document sync, backup workflows, and cloud storage management.
- **Tags:** `@gdrive`, `@rclone`, `@setup`, `@sync`, `@process`
- **Location:** [`shared/scripts/setup/google-drive-setup.sh`](../shared/scripts/setup/google-drive-setup.sh)
- **Inputs:** Google API credentials, rclone configuration, sync directories
- **Outputs:** Configured rclone mounts, automated sync jobs, backup schedules
- **Dependencies:** rclone, Google Drive API access, credential files

---
### <a name="P015"></a> Ollama Model Management
- **ID:** P015
- **Description:** Manages local Ollama model installations, updates, and configuration for self-hosted AI inference with model switching and resource optimization.
- **Tags:** `@ollama`, `@models`, `@ai`, `@local`, `@process`
- **Location:** [`shared/scripts/manage-ollama-models.sh`](../shared/scripts/manage-ollama-models.sh)
- **Inputs:** Model names, resource limits, configuration parameters
- **Outputs:** Installed Ollama models, optimized configurations, resource usage reports
- **Dependencies:** Ollama installation, adequate disk space and memory

---
### <a name="P016"></a> MCP Server Integration
- **ID:** P016
- **Description:** Model Context Protocol (MCP) server setup for extending Claude with custom tools and data sources, enabling enhanced AI agent capabilities and domain-specific integrations.
- **Tags:** `@mcp`, `@claude`, `@integration`, `@tools`, `@process`
- **Location:** [`projects/claude-project/mcp-servers/family-dashboard-mcp/README.md`](../projects/claude-project/mcp-servers/family-dashboard-mcp/README.md)
- **Inputs:** MCP server configuration, tool definitions, data source connections
- **Outputs:** Running MCP servers, enhanced Claude capabilities, custom tool access
- **Dependencies:** Claude CLI, Node.js, specific tool dependencies per server

---
### <a name="P017"></a> Claude CLI Installation
- **ID:** P017
- **Description:** Automated installation and configuration of Claude CLI with proper permissions, agent setup, and integration with development environment.
- **Tags:** `@claude`, `@cli`, `@install`, `@setup`, `@process`
- **Location:** [`install-claude-cli.sh`](../install-claude-cli.sh)
- **Inputs:** System permissions, npm access, configuration preferences
- **Outputs:** Installed Claude CLI, configured agents, development integration
- **Dependencies:** Node.js, npm, proper system permissions

---
### <a name="P018"></a> Documentation Maintenance System
- **ID:** P018
- **Description:** Comprehensive documentation maintenance system with flexible scheduling (daily health checks, weekly quality assessment, monthly strategic review). Optimized for single developer home automation projects with automated validation and quality assurance.
- **Tags:** `@gem_doc_agent`, `@maintenance`, `@documentation`, `@flexible-scheduling`, `@home-development`, `@process`
- **Location:** [`.claude/commands/doc-maintenance.sh`](../.claude/commands/doc-maintenance.sh)
- **Inputs:** Documentation files, recent changes, git history, system state, maintenance frequency (daily/weekly/monthly)
- **Outputs:** Maintenance reports, quality assessments, metrics tracking, strategic recommendations
- **Dependencies:** Gemini API access, git repository, Claude agent system
- **Maintenance Modes:**
  - **Daily**: Quick health checks, change validation, basic metrics
  - **Weekly**: Quality assessment, link validation, agent coordination review
  - **Monthly**: Strategic assessment, architecture review, roadmap planning

---
### <a name="P017"></a> Agent Project Readiness Check 📋 **INFORMATIONAL**
- **ID:** P017
- **Status:** **ACTIVE** - Recommended guidance for agents entering project folders
- **Description:** Lightweight project readiness assessment for agents beginning work in project folders. Provides informational guidance on API key security, documentation standards, and project structure. Optimized for single developer home automation workflow with non-blocking validation.
- **Tags:** `@guidance`, `@security`, `@standards`, `@agent-workflow`, `@home-development`, `@process`
- **Location:** [`~/.claude/AGENT_PROJECT_READINESS_GUIDE.md`](../.claude/AGENT_PROJECT_READINESS_GUIDE.md)
- **Script:** [`~/.claude/scripts/project-readiness-check.sh`](../.claude/scripts/project-readiness-check.sh)
- **Inputs:** Target project directory, agent type
- **Outputs:** Readiness assessment, recommendations, guidance report
- **Dependencies:** Git repository (optional), project documentation (optional)
- **Philosophy:** **Informational guidance** - provides recommendations without blocking agent workflow
- **Home Development Focus:** Optimized for rapid iteration and single developer productivity

---
### <a name="P023"></a> Third-Party Script Research Protocol 🔍 **RESEARCH-FIRST**
- **ID:** P023
- **Status:** **ACTIVE** - Mandatory research before coding solutions for third-party script issues
- **Description:** Research-first troubleshooting protocol for agents encountering third-party script problems. Requires systematic investigation of documentation, source URLs, bug reports, and community discussions before attempting custom coding solutions. Prevents reinventing existing fixes and ensures agents use official solutions when available.
- **Tags:** `@research`, `@troubleshooting`, `@third-party`, `@documentation`, `@investigation`, `@process`
- **Location:** [`~/.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md`](../.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md) (Research-First section)
- **Script:** [`~/.claude/scripts/third-party-research.sh`](../.claude/scripts/third-party-research.sh) (research automation tool)
- **Inputs:** Script/tool name, issue description, error messages, project context
- **Outputs:** Research summary, documentation links, existing solutions, recommended actions
- **Dependencies:** WebFetch tool for documentation access, WebSearch for community discussions, project context
- **Research Steps:**
  1. **Documentation Investigation**: README, official docs, API documentation, setup guides
  2. **Source Verification**: GitHub repository, official URLs, version compatibility
  3. **Issue Research**: GitHub issues, bug reports, Stack Overflow discussions
  4. **Solution Discovery**: Existing fixes, workarounds, official patches, alternatives
  5. **Decision Point**: Code only if no existing solution found after comprehensive research
- **Philosophy:** **"Research existing solutions first, code only as last resort"** - prevents duplicate effort and leverages community knowledge
- **Home Development Focus:** Quick but thorough research (5-10 minutes), practical validation, documentation-first approach

---
### <a name="P022"></a> Home Installation Workflow 🏠 **HOME-OPTIMIZED**
- **ID:** P022
- **Status:** **ACTIVE** - Optional guidance for script/program installation with repository layout awareness
- **Description:** Lightweight installation workflow for agents installing tools, scripts, or programs in home automation projects. Provides quick checks and practical guidance without blocking development flow. Emphasizes using existing tools and simple documentation over complex validation. Includes repository layout awareness for optimal installation locations.
- **Tags:** `@installation`, `@tools`, `@scripts`, `@home-development`, `@guidance`, `@layout`, `@process`
- **Location:** [`~/.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md`](../.claude/MANDATORY_AGENT_COMPLIANCE_WORKFLOW.md) (renamed to Home Development Agent Guidance)
- **Script:** [`~/.claude/scripts/installation-check.sh`](../.claude/scripts/installation-check.sh) (optional utility with layout detection)
- **Repository Guide:** [`/projects/CLAUDE.md`](../projects/CLAUDE.md#repository-layout--installation-guide) - Comprehensive layout documentation
- **Inputs:** Tool/script name, project directory, installation context, repository location
- **Outputs:** Installation recommendations, existing tool detection, location-specific guidance, documentation suggestions
- **Dependencies:** Project package manager (npm, pip, etc.), repository structure knowledge, basic project structure
- **Installation Patterns:**
  - **Node.js Projects** (`/projects/home-dashboard/`): `npm install <tool>` → `./node_modules/`
  - **Python Projects** (`/projects/crewai-studio/`): `pip install <tool>` → `./venv/lib/python*/`
  - **System Tools**: `/usr/local/bin/`, `~/.local/bin/`, document in README
  - **Configuration**: Project-specific `.env` files, avoid global configs
- **Philosophy:** **"Use existing tools first, install what's needed, document major additions"** - no blocking validations
- **Home Development Focus:** 30-second checks, prefer existing over new, location-aware recommendations, practical solutions

---

## How to Use This Index

### Finding Processes
1. **By Category**: Browse the sections above for processes by domain
2. **By Tag**: Search for `@tag` patterns (e.g., `@docker`, `@setup`)
3. **By ID**: Use process IDs (P001-P017) for direct references
4. **By Search**: Use Ctrl+F to search for keywords or file paths

### Process Entry Format
Each process follows this standardized format:
- **ID**: Unique identifier for cross-referencing
- **Description**: What the process does and its primary purpose
- **Tags**: Categorization tags for filtering and discovery
- **Location**: Direct link to the source file
- **Inputs**: Required parameters, files, or environment variables
- **Outputs**: Generated files, system changes, or services started
- **Dependencies**: Other processes, tools, or services required

### Adding New Processes
When creating new operational processes:
1. Add an entry to this index using the standard format
2. Use the next available process ID (P021+)
3. Include relevant `@` tags for categorization
4. Link back to this index from your process file
5. Update the Table of Contents if adding new categories

---

## Maintenance Procedures

### Keeping This Index Current
This document is a living resource that requires regular maintenance:

1. **New Processes**: When creating operational scripts, add them to this index
2. **Process Changes**: Update entries when modifying existing processes
3. **Deprecation**: Mark deprecated processes but don't delete entries
4. **Quarterly Reviews**: Validate accuracy and prune outdated information

### Testing Standards for All Processes

**⚠️ CRITICAL: Complete Success Validation Required**

All processes must implement comprehensive success validation that goes beyond basic API responses:

#### Test Success Criteria (Default Standards)
- **API Tests**: Validate both HTTP status codes AND response content validity
- **Error Code Validation**: Check for application-level errors within valid HTTP responses  
- **Data Integrity**: Verify returned data matches expected format and content
- **Business Logic**: Confirm operations actually completed (not just acknowledged)

#### Examples of Inadequate vs. Complete Testing

**❌ Inadequate (Current Pattern)**:
```bash
# Only checks if API responds, ignores error content
if [ "$http_status" = "200" ]; then
    echo "✅ Test passed"
fi
```

**✅ Complete (Required Standard)**:
```bash
# Validates both HTTP status AND actual success
if [ "$http_status" = "200" ] && [ "$(echo $response | jq -r '.error')" = "null" ] && [ "$(echo $response | jq -r '.status')" = "success" ]; then
    echo "✅ Test passed - Operation completed successfully"
else
    echo "❌ Test failed - API responded but operation failed"
    echo "Response: $response"
fi
```

#### Required Test Components
1. **HTTP Status Validation**: Check for appropriate status codes (200, 201, etc.)
2. **Error Field Checking**: Verify `error`, `status`, or equivalent success indicators
3. **Data Validation**: Confirm expected data structure and content
4. **Side Effect Verification**: Check that intended changes actually occurred
5. **Rollback Capability**: Ensure test cleanup doesn't leave system in invalid state

#### Implementation Requirement
- **All testing processes** must implement these standards by default
- **No manual prompting** should be required for complete validation
- **Automated test suites** must include comprehensive success verification
- **Process documentation** must specify success criteria clearly

#### Centralization Status
**✅ CENTRALIZED HERE** - This PROCESS_INDEX.md is the **single source of truth** for home development standards.

**📍 HOME DEVELOPMENT STANDARDS CENTRALIZED**:
- **Testing Standards**: Complete success validation (not just HTTP responses)
- **Service Status**: Current/Defunct/Development status for all services
- **Configuration Guide**: Simple home development patterns (not enterprise)
- **Troubleshooting**: Common home development issues and fixes
- **Infrastructure Status**: LiteLLM defunct, CCR in development, Ollama active

**⚠️ SCATTERED LOCATIONS TO REFERENCE THIS DOCUMENT**:
- `/home/darlinghurstlinux/shared/config/litellm/` - Legacy files, reference migration guidance here
- `/home/darlinghurstlinux/projects/home-dashboard/DEBUGGING_GUIDE.md` - Should reference troubleshooting section here
- `/home/darlinghurstlinux/.claude-code-router/SECURITY.md` - CCR development status documented here
- Various agent definition files - Should reference centralized standards

**✅ COMPLETED**: Infrastructure reality documented, home standards established, enterprise complexity avoided

### Quality Standards
- All links must resolve correctly
- Process descriptions should be clear and concise
- Tags should follow established conventions
- Dependencies should be accurately documented

### Integration Points
- Link from main [`CLAUDE.md`](../projects/CLAUDE.md) for discovery
- Reference from individual process files using anchor links
- Cross-reference related processes within entries

---

## Basic Configuration Guide (Home Development)

### Environment Setup Patterns
**Simple home development configuration - not enterprise complexity**

#### Core Environment Variables
```bash
# Primary AI Services
GOOGLE_AI_STUDIO_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here

# Optional Services (when working)
CLAUDE_CODE_ROUTER_API_KEY=your_ccr_key_when_stable

# System Configuration (Auto-updated daily at 6 AM)
CURRENT_DATE=2025-08-11  # For WebSearch tool date context - AUTO-UPDATES via cron
ENABLE_BACKGROUND_TASKS=true
```

#### Service URLs (Home Environment)
- **Ollama**: http://localhost:11434 (local AI)
- **CCR**: http://localhost:3456 (agent routing - in development)
- **Home Dashboard**: http://localhost:3000 (family dashboard)
- **n8n**: Check individual project configurations

#### Configuration Best Practices (Home)
- **Use .env files** for local development
- **Keep secrets out of git** - use .env.example templates
- **Local-first approach** - prefer Ollama over paid APIs
- **Simple over complex** - avoid enterprise configuration patterns

---

## Quick Troubleshooting (Home Development)

### Common Issues & Quick Fixes

#### 🔧 **CCR (Claude-Code-Router) Issues**
**Problem**: Environment variables not working
- **Status**: Known issue, CCR in active development
- **Workaround**: Use direct configuration until CCR stabilizes
- **Reference**: Check CCR docs for updates

#### 🔧 **LiteLLM References**
**Problem**: Scripts/processes referencing LiteLLM
- **Fix**: LiteLLM is defunct - migrate to CCR or direct service calls
- **Migration**: Replace LiteLLM references with CCR (port 3456)

#### 🔧 **Ollama Connection Issues**
**Problem**: AI services not responding
- **Check**: `curl http://localhost:11434/api/version`
- **Fix**: Restart Ollama service
- **Alternative**: Use Gemini CLI for development

#### 🔧 **Home Dashboard Issues**
**Problem**: Dashboard widgets not loading
- **Check**: Service status at http://localhost:3000/health
- **Common Fix**: Restart development server
- **Debug**: Check browser console for errors

#### 🔧 **Environment Variable Issues**
**Problem**: Services can't find API keys
- **Check**: `.env` file exists and is loaded
- **Verify**: `echo $GOOGLE_AI_STUDIO_API_KEY` returns value
- **Fix**: Source environment or restart service

#### 🔧 **WebSearch Tool Date Issues** ✅ **FIXED & AUTOMATED**
**Problem**: WebSearch tool returned old dates in search results
- **Root Cause**: Missing current date context in environment
- **Fix Applied**: Added `CURRENT_DATE` to `.claude/settings.json` with auto-update system
- **Auto-Update**: 
  - Script: `/home/darlinghurstlinux/.claude/update-date.sh`
  - Cron job: Daily at 6 AM (`0 6 * * *`)
  - Logs: `/home/darlinghurstlinux/.claude/logs/date-update.log`
- **Manual Update**: Run `/home/darlinghurstlinux/.claude/update-date.sh`
- **Result**: WebSearch now returns current results and updates automatically
- **Verification**: Test query "latest AI developments August 2025" returns current results

### Development Workflow (Home Standards)

#### Daily Development
1. **Start services**: Ollama → CCR (if needed) → Home Dashboard
2. **Check service status**: Use Service Status Dashboard above
3. **Use local-first**: Prefer Ollama over paid APIs
4. **Simple testing**: Focus on practical validation over complex test suites

#### When Things Break
1. **Check service status** first (ports 3000, 3456, 11434)
2. **Review recent changes** in git
3. **Use local alternatives** (Ollama, direct services)
4. **Simple fixes over complex solutions**

---

---

## Summary & Status

**✅ PROCESS_INDEX.md OPTIMIZED FOR HOME DEVELOPMENT**

### What's Centralized Here
- **20 Processes Documented** - Core operational processes with clear status
- **Infrastructure Reality Check** - LiteLLM defunct, CCR in development, Ollama active
- **Home Development Standards** - Simple practices without enterprise complexity
- **Complete Testing Standards** - Success validation beyond HTTP responses
- **Practical Configuration** - Local-first, cost-effective patterns
- **Quick Troubleshooting** - Common issues and simple fixes

### Home Development Philosophy Applied
- **Simple over Enterprise** - Clean home coding standards
- **Local-first Approach** - Ollama preferred over paid APIs
- **Practical Standards** - What works for home development
- **Reality-based Documentation** - Current service status, not aspirational

### Infrastructure Status Summary
- 🟢 **Active**: CCR (port 3456), Ollama (11434), Home Dashboard (3000), Gemini CLI, n8n
- 🟡 **In Development**: CCR (known issues with env vars/API keys)
- 🔴 **Defunct**: LiteLLM (all services), LiteLLM Docker deployments

*Last Updated: 2025-08-14*  
*Total Processes Documented: 19 (0 defunct, 19 active/development)*  
*Focus: Home Development Standards (Not Enterprise)*  
*Latest Optimization: Research-first troubleshooting protocol for third-party scripts*