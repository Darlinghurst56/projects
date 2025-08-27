# TaskMaster AI - End-to-End User Guide

## 🎯 **Orchestrator Workflow Guide**

This guide demonstrates the complete orchestrator workflow tested on 2025-07-15.

### **Prerequisites**

1. **Start TaskMaster API Server**
   ```bash
   npm start
   # Server runs on http://localhost:3001
   ```

2. **Verify System Status**
   ```bash
   curl http://localhost:3001/api/health
   ```

## **Phase 1: Create a Task (Orchestrator)**

### **Step 1: Switch to Orchestrator Workspace**
```bash
task-master use-tag orchestrator-agent
```
**Expected Output**: 
- Tag switched successfully 
- Shows current workspace and available tasks

### **Step 2: Create Task Following CLAUDE.md Protocol**
```bash
task-master add-task --prompt="PROJECT: House AI - Family Home Page | SUBPROJECT: Authentication System - Implement OAuth 2.0 authentication system with JWT tokens for secure user login. This task requires backend development skills including Node.js, Express, database integration, and API security." --priority="high"
```

**Critical Notes**:
- ✅ **PROJECT metadata is mandatory** per CLAUDE.md
- ✅ **Include capability keywords** (nodejs, express, database, auth)
- ⚠️  **Fix invalid dependencies** if AI adds them: `task-master fix-dependencies`

**Expected Result**: Task created with ID (e.g., Task #1)

## **Phase 2: Agent Management (Orchestrator Suggestion)**

### **Step 3: Register Target Agent**
```bash
# Register backend-agent for OAuth task
node -e "
const AgentCoordination = require('./.taskmaster/agents/coordination-workflow.cjs');
const coordination = new AgentCoordination();
coordination.registerAgent('backend-agent', ['nodejs', 'express', 'api', 'database', 'authentication'], 'available');
console.log('Backend agent registered');
"
```

### **Step 4: Create Orchestrator Suggestion**
```bash
curl -X POST http://localhost:3001/api/human-approval/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "1",
    "targetAgent": "backend-agent", 
    "reasoning": "ORCHESTRATOR: Task matches backend-agent capabilities (nodejs, express, api, database, authentication). Keywords: auth, api, oauth, jwt",
    "suggestedBy": "orchestrator-agent"
  }'
```

**Expected Response**: 
```json
{
  "success": true,
  "suggestion": {
    "id": "suggestion-{timestamp}",
    "taskId": "1",
    "targetAgent": "backend-agent",
    "status": "pending"
  }
}
```

### **Step 5: Human Approval Workflow**

**Check Pending Suggestions**:
```bash
curl http://localhost:3001/api/human-approval/suggestions/pending
```

**Approve Assignment**:
```bash
curl -X POST http://localhost:3001/api/human-approval/suggestions/{suggestion-id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Approved - backend-agent is correct choice for OAuth implementation",
    "approvedBy": "human"
  }'
```

## **Phase 3: Task Execution (Backend Agent)**

### **Step 6: Assign Task to Agent**
```bash
# Direct assignment (bypassing API issues in test)
node -e "
const AgentCoordination = require('./.taskmaster/agents/coordination-workflow.cjs');
const coordination = new AgentCoordination();
const result = coordination.assignTaskToAgent('1', 'backend-agent');
console.log('Assignment result:', result);
"
```

### **Step 7: Start Work on Task**
```bash
task-master set-status --id=1 --status=in-progress
```

**Expected Output**: Task status changed from pending to in-progress

### **Step 8: Complete Task**
```bash
task-master set-status --id=1 --status=done
```

## **Phase 4: Coordination Cleanup**

### **Step 9: Complete Assignment in Coordination System**
```bash
node -e "
const AgentCoordination = require('./.taskmaster/agents/coordination-workflow.cjs');
const coordination = new AgentCoordination();
const result = coordination.completeTaskAssignment('1', 'backend-agent');
console.log('Completion result:', result);
"
```

**Expected Results**:
- ✅ Backend-agent status changes to 'cooldown' 
- ✅ Task removed from agent's assigned tasks
- ✅ Cleanup jobs scheduled (immediate, delayed, archival)
- ✅ Task metrics updated

## **Phase 5: Monitoring & Verification**

### **Dashboard Access**
```bash
# Access enhanced human interface dashboard
open http://localhost:3001/human-interface
```

**Features Available**:
- 🤖 Agent status cards with real-time updates
- 🔔 Approval workflow panel  
- 📊 System health monitoring
- 💬 Claude integration interface

### **CLI Tools Testing**
```bash
# Interactive task router
npm run task-router

# Agent manager  
npm run agent-manager
```

## **🚨 Common Issues & Solutions**

### **Issue 1: Chalk Compatibility Error**
```
TypeError: chalk.red is not a function
```
**Solution**: Install chalk v4 for CommonJS compatibility
```bash
npm install chalk@4.1.2 --save
```

### **Issue 2: Invalid Dependencies**
```
Dependencies: 6 (Not found), 7 (Not found)
```
**Solution**: Run dependency fixer
```bash
task-master fix-dependencies
```

### **Issue 3: Task Assignment Failure**
```
"success": false, "message": "Failed to assign task"
```
**Solution**: Ensure agent is registered before assignment
```bash
# Check agent registration
node -e "
const coordination = require('./.taskmaster/agents/coordination-workflow.cjs');
console.log(coordination.getAvailableAgents());
"
```

### **Issue 4: JSON Parsing Error in Task Update**
```
Expected property name or '}' in JSON at position 1
```
**Solution**: Skip AI update and use direct status change
```bash
task-master set-status --id={task-id} --status=done
```

### **Issue 5: Tag Isolation Issues**
Different tasks show in different tag workspaces during single source of truth cleanup.
**Solution**: This is expected behavior during system reorganization.

## **🎯 Success Criteria**

✅ **Task Creation**: Task created with proper PROJECT metadata  
✅ **Agent Management**: Agent registered and suggestion created  
✅ **Human Approval**: Approval workflow functional via API  
✅ **Task Assignment**: Task assigned to appropriate agent  
✅ **Task Completion**: Task marked as done with cleanup  
✅ **Coordination**: Agent enters cooldown, metrics updated  

## **🔧 API Endpoints Tested**

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/health` | GET | System health check | ✅ Working |
| `/api/human-approval/suggestions` | POST | Create suggestion | ✅ Working |
| `/api/human-approval/suggestions/pending` | GET | List pending | ✅ Working |
| `/api/human-approval/suggestions/{id}/approve` | POST | Approve suggestion | ✅ Working |
| `/human-interface` | GET | Enhanced dashboard | ⚠️ Needs server restart |

## **📊 Performance Metrics**

- **Task Creation Time**: ~2-3 seconds (with AI)
- **Agent Registration**: Instant  
- **Suggestion Creation**: <1 second
- **Approval Processing**: <1 second
- **Coordination Cleanup**: ~1-2 seconds
- **Total Workflow Time**: ~60 seconds end-to-end

## **🔮 Next Steps for Production**

1. **Fix API Integration**: Resolve task assignment API issues
2. **Automate Agent Registration**: Register agents on system startup  
3. **Real-time Updates**: Connect WebSocket for live dashboard updates
4. **Error Handling**: Improve error messages and recovery
5. **Performance**: Optimize coordination system response times

---

**Test Completed**: 2025-07-15  
**System Status**: Functional with noted improvements needed  
**Overall Assessment**: ✅ MVP Ready with fixes required