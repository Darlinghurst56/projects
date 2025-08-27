# 📋 **Migration Status - claude-project/apps**

## **✅ COMPLETED MOVES:**

| Project | Old Path | New Path | Status | Date | Notes |
|---------|----------|----------|---------|------|-------|
| **home-dashboard** | `claude-project/apps/web/` | `projects/home-dashboard/` | ✅ **MOVED** | 2024-07-30 | Independent project |
| **taskmaster-ai** | `claude-project/apps/taskmaster-ai/` | `projects/claude-project/apps/taskmaster-ai/` | ✅ **MOVED** | 2024-07-30 | **Stays within claude-project** |

## **📁 Current Directory Status:**

### **✅ Moved (No longer here):**
- `web/` → `projects/home-dashboard/` (Independent project)
- `taskmaster-ai/` → `projects/claude-project/apps/taskmaster-ai/` (Within claude-project)

### **📂 Remaining in this directory:**
- `docs/` - Documentation files (may need review)
- `README.md` - This migration guide
- `MIGRATION_STATUS.md` - This status file
- `find-old-references.sh` - Helper script

## **⚠️ CRITICAL: taskmaster-ai Integration**

**taskmaster-ai** is a **core component** of the `claude-project` system and must stay within the `claude-project` structure because:

### **🔗 Dependencies:**
1. **Turborepo Integration**: Managed by Turborepo within `claude-project`
2. **API Dependencies**: `taskmaster-api-server.js` depends on it
3. **Agent Coordination**: Part of the multi-agent system
4. **Build System**: Part of the Turborepo build pipeline

### **✅ Correct References:**
```javascript
// CORRECT - Within claude-project
import { something } from 'apps/taskmaster-ai/...'
import { something } from './apps/taskmaster-ai/...'
```

## **⚠️ NEXT STEPS:**

### **1. Update Code References (home-dashboard only):**
All import statements for **home-dashboard** need to be updated from:
```javascript
// OLD (BROKEN)
import { something } from 'claude-project/apps/web/...'
```

To:
```javascript
// NEW (WORKING)
import { something } from 'projects/home-dashboard/...'
```

### **2. taskmaster-ai References (NO CHANGE NEEDED):**
References to **taskmaster-ai** within `claude-project` should remain unchanged:
```javascript
// CORRECT - No change needed
import { something } from 'apps/taskmaster-ai/...'
```

### **3. Test Integration:**
- [ ] Test `taskmaster-api-server.js` functionality
- [ ] Test Turborepo build pipeline
- [ ] Test agent coordination system
- [ ] Test dashboard integration

### **4. Update Documentation:**
- [ ] Update `README.md` files
- [ ] Update `ARCHITECTURE.md`
- [ ] Update API documentation
- [ ] Update setup guides

### **5. Clean Up:**
- [ ] Remove old `web/` directory redirects
- [ ] Update any remaining hardcoded paths
- [ ] Remove this directory after all references are updated

## **🔍 Files to Check for Updates:**

### **Within claude-project:**
- `taskmaster-api-server.js` - Main API server
- `package.json` - Turborepo configuration
- `README.md` - Project documentation
- `ARCHITECTURE.md` - Architecture documentation
- `tests/` - Test files

### **External References:**
- Any files that import from `claude-project/apps/web/`
- Build scripts and CI/CD pipelines
- IDE workspace configurations

## **📞 Need Help?**

If you encounter issues:
1. Check the main migration guide: [`README.md`](./README.md)
2. Review the reorganization summary: [`FINAL_REORGANIZATION_SUMMARY.md`](../../../FINAL_REORGANIZATION_SUMMARY.md)
3. Contact the development team

---

**⚠️ This directory will be removed after all references are updated!**
**📅 Target removal date: After all code references are migrated** 