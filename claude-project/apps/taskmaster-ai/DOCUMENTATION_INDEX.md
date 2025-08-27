# TaskMaster AI Documentation Index

**Version:** 2.1 (Post-Cleanup)  
**Last Updated:** July 21, 2025  
**Status:** Production Ready  

## 📚 Quick Navigation

### 🚀 Getting Started
| Document | Purpose | Audience |
|----------|---------|----------|
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | **New user onboarding** - setup and first steps | New users |
| [CLAUDE.md](./CLAUDE.md) | **Main developer guide** - system overview, agent roles | Developers |
| [CHEAT_SHEET.md](./CHEAT_SHEET.md) | **Quick reference** - essential commands and URLs | All users |
| [.taskmaster/docs/CLAUDE.md](./.taskmaster/docs/CLAUDE.md) | **Agent operations** - launch procedures, workflows | Agent operators |

### 🔧 API Documentation
| Document | Purpose | Version |
|----------|---------|---------|
| [app/api/v2/README.md](./app/api/v2/README.md) | **API v2 Reference** - endpoints, examples, migration | v2.0 |

### 📊 System Status & Testing
| Document | Date | Purpose |
|----------|------|---------|
| [E2E_WORKFLOW_SUCCESS_REPORT.md](./E2E_WORKFLOW_SUCCESS_REPORT.md) | July 20, 2025 | **Production validation** - system works end-to-end |
| [E2E_WORKFLOW_TEST_REPORT.md](./E2E_WORKFLOW_TEST_REPORT.md) | July 20, 2025 | **Detailed test results** - comprehensive testing documentation |

### 📁 Historical Reference
| Location | Purpose |
|----------|---------|
| [archive/documentation/](./archive/documentation/) | **Historical docs** - system evolution, legacy procedures |

## 🎯 Documentation by Use Case

### New Developer Onboarding
1. **Start here:** [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - setup and installation
2. **System overview:** [CLAUDE.md](./CLAUDE.md) - agent roles and workflows
3. **Quick commands:** [CHEAT_SHEET.md](./CHEAT_SHEET.md)  
4. **API integration:** [app/api/v2/README.md](./app/api/v2/README.md)

### Agent Operation
1. **Launch agents:** [.taskmaster/docs/CLAUDE.md](./.taskmaster/docs/CLAUDE.md)
2. **System health:** [E2E_WORKFLOW_SUCCESS_REPORT.md](./E2E_WORKFLOW_SUCCESS_REPORT.md)
3. **Troubleshooting:** [archive/documentation/E2E_FAULT_LOG.md](./archive/documentation/E2E_FAULT_LOG.md)

### System Integration
1. **API v2 usage:** [app/api/v2/README.md](./app/api/v2/README.md)
2. **Workflow validation:** [E2E_WORKFLOW_TEST_REPORT.md](./E2E_WORKFLOW_TEST_REPORT.md)
3. **Emergency procedures:** [CHEAT_SHEET.md](./CHEAT_SHEET.md#🚨-emergency)

## 🤖 The 5 Agents

| Agent | Role | Documentation |
|-------|------|---------------|
| **orchestrator-agent** | Project coordination | [CLAUDE.md](./CLAUDE.md#agent-roles-correct-priority-order) |
| **frontend-agent** | UI/React development | [CLAUDE.md](./CLAUDE.md#agent-roles-correct-priority-order) |  
| **backend-agent** | API/database development | [CLAUDE.md](./CLAUDE.md#agent-roles-correct-priority-order) |
| **qa-specialist** | Testing & QA | [CLAUDE.md](./CLAUDE.md#agent-roles-correct-priority-order) |
| **documentation-agent** | Documentation | [CLAUDE.md](./CLAUDE.md#agent-roles-correct-priority-order) |

## 🌐 Key URLs

| Service | URL | Documentation |
|---------|-----|---------------|
| **Developer Dashboard** | http://localhost:3010/developer-interface | [CHEAT_SHEET.md](./CHEAT_SHEET.md#🔧-urls) |
| **Agent Management** | http://localhost:3010/agent-management | [CHEAT_SHEET.md](./CHEAT_SHEET.md#🔧-urls) |
| **API Health** | http://localhost:3010/api/health | [app/api/v2/README.md](./app/api/v2/README.md) |
| **API Status** | http://localhost:3010/api/v2/agents | [app/api/v2/README.md](./app/api/v2/README.md) |

## 📋 Essential Commands

```bash
# System startup
./start-taskmaster.sh              # Smart start script

# Agent management  
npm run agents:start               # Start all agents
npm run agents:status              # Check agent status

# Task management
task-master list                   # Show all tasks
task-master next                   # Get next task
task-master set-status --id=X --status=done

# System monitoring
npm run system:status              # Complete system health
curl http://localhost:3001/api/health
```

## 🔄 Documentation Maintenance

### Review Schedule
- **Weekly:** Check system status reports
- **Monthly:** Review operational procedures  
- **Quarterly:** Update major system changes
- **Major releases:** Update version references

### Update Procedures
1. Test changes in development environment
2. Update relevant documentation files
3. Update this index if structure changes
4. Commit changes with clear documentation descriptions

### Contact
- **System Issues:** Check [E2E_WORKFLOW_TEST_REPORT.md](./E2E_WORKFLOW_TEST_REPORT.md)
- **API Questions:** See [app/api/v2/README.md](./app/api/v2/README.md)
- **Agent Problems:** Refer to [.taskmaster/docs/CLAUDE.md](./.taskmaster/docs/CLAUDE.md)

---

**Index Version:** 2.0  
**System Version:** API v2  
**Last Verified:** July 20, 2025  
**Status:** ✅ All documentation current and accurate