# 🚨 **IMPORTANT: PROJECTS HAVE BEEN MOVED!**

## **❌ OLD LOCATION (DEPRECATED)**
This `claude-project/apps/` directory is **DEPRECATED** and will be removed soon.

## **✅ NEW LOCATION**
All projects have been moved to the new monorepo structure:

### **📁 Current Project Locations:**

```
/
├── projects/                    # ✅ NEW LOCATION
│   ├── home-dashboard/         # ✅ (was claude-project/apps/web)
│   ├── crewai/                 # ✅ AI/ML project
│   ├── claude-project/         # ✅ Claude integration project
│   │   ├── apps/              # ✅ Apps within claude-project
│   │   │   ├── taskmaster-ai/ # ✅ (stays within claude-project)
│   │   │   └── ...            # ✅ Other claude-project apps
│   ├── prdapp/                 # ✅ Product requirements app
│   ├── mcp-server/             # ✅ MCP server project
│   └── claude-code-flow/       # ✅ Claude code flow project
│
├── shared/                     # ✅ Shared resources and utilities
│   ├── config/                 # ✅ Shared configuration files
│   ├── scripts/               # ✅ Shared utility scripts
│   ├── docs/                 # ✅ Shared documentation
│   └── tools/                # ✅ Shared development tools
│
├── infrastructure/           # ✅ Infrastructure and deployment
└── archive/                 # ✅ Legacy/backup files
```

## **🔄 Migration Status:**

| Project | Old Path | New Path | Status | Notes |
|---------|----------|----------|---------|-------|
| **home-dashboard** | `claude-project/apps/web` | `projects/home-dashboard` | ✅ **MOVED** | Independent project |
| **taskmaster-ai** | `claude-project/apps/taskmaster-ai` | `projects/claude-project/apps/taskmaster-ai` | ✅ **MOVED** | **Stays within claude-project** |

## **⚠️ IMPORTANT: taskmaster-ai Integration**

**taskmaster-ai** is a **core component** of the `claude-project` system and must stay within the `claude-project` structure because:

1. **Turborepo Integration**: Managed by Turborepo within `claude-project`
2. **API Dependencies**: `taskmaster-api-server.js` depends on it
3. **Agent Coordination**: Part of the multi-agent system
4. **Build System**: Part of the Turborepo build pipeline

### **✅ Correct References for taskmaster-ai:**
```javascript
// CORRECT - Within claude-project
import { something } from 'apps/taskmaster-ai/...'
import { something } from './apps/taskmaster-ai/...'
```

## **⚠️ ACTION REQUIRED:**

### **For Developers:**
1. **Update your imports** from:
   ```javascript
   // OLD (BROKEN)
   import { something } from 'claude-project/apps/web/...'
   ```
   
   To:
   ```javascript
   // NEW (WORKING)
   import { something } from 'projects/home-dashboard/...'
   ```

2. **For taskmaster-ai references** (within claude-project):
   ```javascript
   // CORRECT - No change needed
   import { something } from 'apps/taskmaster-ai/...'
   ```

3. **Update your IDE workspace** to point to the new locations
4. **Update build scripts** and configuration files
5. **Update documentation** references

### **For CI/CD:**
- Update build paths in pipeline configurations
- Update deployment scripts
- Update test configurations

## **📋 Files That Need Updates:**

### **Configuration Files:**
- `package.json` files (only for home-dashboard references)
- `vite.config.js` / `webpack.config.js`
- `docker-compose.yml`
- `.env` files
- `tsconfig.json` / `jsconfig.json`

### **Source Code:**
- All import statements for home-dashboard
- All require() statements for home-dashboard
- All file path references for home-dashboard

### **Documentation:**
- README files
- API documentation
- Setup guides

## **🔗 Quick Links:**

- **Home Dashboard**: [`projects/home-dashboard/`](../../home-dashboard/)
- **Taskmaster AI**: [`projects/claude-project/apps/taskmaster-ai/`](./taskmaster-ai/)
- **CrewAI**: [`projects/crewai/`](../../crewai/)
- **Shared Config**: [`shared/config/`](../../../shared/config/)
- **Infrastructure**: [`infrastructure/`](../../../infrastructure/)

## **📞 Need Help?**

If you're having trouble with the migration:
1. Check the reorganization documentation: [`FINAL_REORGANIZATION_SUMMARY.md`](../../../FINAL_REORGANIZATION_SUMMARY.md)
2. Review the completion report: [`REORGANIZATION_COMPLETION_REPORT.md`](../../../REORGANIZATION_COMPLETION_REPORT.md)
3. Contact the development team

---

**⚠️ This directory will be removed after all references are updated!**
**📅 Target removal date: After all code references are migrated** 