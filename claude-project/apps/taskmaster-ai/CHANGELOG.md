# Changelog

All notable changes to TaskMaster AI will be documented in this file.

## [1.1.1] - 2025-07-21

### Changed
- **Major cleanup**: Removed 50+ obsolete files and consolidated documentation
- **Test consolidation**: Organized 169 test files into structured suite  
- **Dependencies**: Updated ESLint from deprecated v8.0.0 to v9.0.0
- **Production ready**: Removed debug code and verbose logging
- **Archive organization**: Created structured archive with proper documentation

### Removed
- Outdated documentation files (15 files from archive/outdated-docs/)
- Redundant E2E test files (kept enhanced-comprehensive-e2e-test.js)
- Debug console.log statements from production code
- Temporary log files and test artifacts
- Obsolete npm scripts and package references

### Added
- Comprehensive archive/README.md documenting preserved files
- Improved .gitignore for better file management
- Streamlined production logging in start-web.js script

## [1.0.1] - 2024-07-18

### Fixed
- Fixed inquirer.Separator constructor errors in terminal interfaces
- Fixed missing TaskMaster CLI wrapper causing server errors
- Fixed agent status 404 error handling with proper null checks
- Cleaned up orphaned documentation files

### Added
- Agent Configuration documentation for manual tool and LLM editing
- TaskMaster workspace management commands reference
- Basic version tracking and changelog

### Removed
- Outdated documentation files from archive
- Duplicate developer interface directories
- Orphaned configuration files

## [1.0.0] - 2024-07-01

### Added
- Initial release of TaskMaster AI 5-agent system
- Frontend, Backend, DevOps, QA, and Orchestrator agents
- Web dashboard with SSE integration
- Terminal interfaces for agent management
- TaskMaster integration for project management
- MCP tool integration for agent capabilities