# Mandatory Agent Task Completion Checklist

## Overview

This checklist MUST be completed by all agents before marking any task as "done". This ensures consistent quality, proper documentation, and adherence to project standards across all agent work.

## ⚠️ CRITICAL REQUIREMENT

**NO TASK SHALL BE MARKED AS COMPLETE UNLESS ALL ITEMS IN THIS CHECKLIST ARE VERIFIED AND DOCUMENTED.**

---

## 📋 Pre-Completion Checklist

### 1. Code Quality Validation ✅

#### Linting & Formatting

- [ ] **ESLint**: Run `mcp__eslint__lint-files` on all modified files
- [ ] **Format Check**: Verify code follows project formatting standards
- [ ] **TypeScript**: Run type checking if applicable (`tsc --noEmit`)
- [ ] **No Linting Errors**: All linting issues resolved or justified

**Documentation Required**: List all files linted and any issues found/resolved.

#### Code Standards Compliance

- [ ] **Project Conventions**: Code follows established patterns in CLAUDE.md
- [ ] **Security Review**: No hardcoded credentials, API keys, or sensitive data
- [ ] **Performance**: No obvious performance bottlenecks introduced
- [ ] **Accessibility**: UI changes meet WCAG 2.1 AA standards (if applicable)

### 2. Testing Requirements ✅

#### Test Execution

- [ ] **Existing Tests**: All existing tests still pass
- [ ] **New Tests**: New functionality has appropriate test coverage
- [ ] **Manual Testing**: Core functionality manually verified
- [ ] **Browser Testing**: Cross-browser compatibility verified (if UI changes)

**Testing Commands to Run**:

```bash
# Project-specific test commands (check package.json or README)
npm test
npm run test:unit
npm run test:integration
npm run build  # Verify build succeeds
```

**Documentation Required**: Test results, any test failures and resolutions.

### 3. Task Documentation ✅

#### TaskMaster Updates

- [ ] **Task Progress**: All implementation steps documented in TaskMaster
- [ ] **Subtask Updates**: Relevant subtasks updated with progress notes
- [ ] **Decision Log**: Key implementation decisions documented
- [ ] **Issues Encountered**: Any problems and solutions documented

**Required TaskMaster Command**:

```bash
task-master update-subtask --id=X.Y --prompt="AGENT: [role] - [detailed implementation notes]"
```

#### Implementation Details

- [ ] **Architecture Decisions**: Major design choices explained
- [ ] **Dependencies**: New dependencies justified and documented
- [ ] **Configuration Changes**: Any config modifications explained
- [ ] **Breaking Changes**: Backward compatibility impact assessed

### 4. Git Workflow Compliance ✅

#### Commit Standards

- [ ] **Staged Changes**: All relevant changes staged for commit
- [ ] **Commit Message**: Follows conventional commit format
- [ ] **Task Reference**: Commit message includes task ID
- [ ] **Clean History**: No merge conflicts or broken commits

**Required Commit Format**:

```
feat: implement [description] (task X.Y)

- Detailed explanation of changes
- Reference to task requirements
- Any breaking changes noted

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Repository State

- [ ] **Git Status Clean**: No untracked files that should be committed
- [ ] **Branch Sync**: Working on correct branch for task
- [ ] **Conflict Resolution**: Any merge conflicts properly resolved
- [ ] **File Permissions**: Proper file permissions maintained

### 5. Environment & Dependencies ✅

#### Installation & Setup

- [ ] **Dependencies Updated**: Package files updated if new dependencies added
- [ ] **Environment Variables**: Required env vars documented
- [ ] **Build Process**: Project builds successfully
- [ ] **Runtime Verification**: Application starts and runs correctly

#### Compatibility

- [ ] **Node Version**: Compatible with project Node.js version
- [ ] **Platform Support**: Works on target platforms (Windows/Mac/Linux)
- [ ] **Browser Support**: UI works in required browsers
- [ ] **Mobile Responsive**: Mobile compatibility verified (if applicable)

### 6. Documentation & Communication ✅

#### User-Facing Documentation

- [ ] **README Updates**: README.md updated if new features added
- [ ] **API Documentation**: API changes documented
- [ ] **User Guide**: User-facing documentation updated
- [ ] **Changelog**: CHANGELOG.md updated (if maintained)

#### Team Communication

- [ ] **CLAUDE.md Updates**: Project instructions updated if needed
- [ ] **Breaking Changes**: Team notified of any breaking changes
- [ ] **Deployment Notes**: Special deployment requirements documented
- [ ] **Rollback Plan**: Rollback procedure documented for significant changes

---

## 🚀 Completion Workflow

### Step 1: Pre-Completion Verification

```bash
# 1. Check git status
git status

# 2. Run linting
mcp__eslint__lint-files [list of modified files]

# 3. Run tests
npm test

# 4. Verify build
npm run build

# 5. Check for security issues
npm audit
```

### Step 2: TaskMaster Documentation

```bash
# Update task with completion details
task-master update-subtask --id=X.Y --prompt="AGENT: [role] - Task completed. 
Summary: [brief summary]
Changes: [list of changes]
Testing: [testing performed]
Issues: [any issues encountered and resolved]
Verification: All checklist items completed ✅"
```

### Step 3: Git Commit

```bash
# Stage all changes
git add .

# Commit with proper message
git commit -m "$(cat <<'EOF'
feat: implement [feature description] (task X.Y)

- [Detailed list of changes]
- [Testing performed]
- [Any breaking changes]

Checklist completed:
✅ Code quality validation
✅ Testing requirements
✅ Task documentation  
✅ Git workflow compliance
✅ Environment compatibility
✅ Documentation updates

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 4: Final Verification

```bash
# Mark task as complete only after all checks pass
task-master set-status --id=X --status=done
```

---

## 🔧 Tool Allowlist Verification

Before task completion, verify your role has access to required tools:

### Required Tools for All Agents

- `mcp__task-master-ai__*` - Task management
- `Edit` - File editing
- `Read` - File reading
- `Bash` - Command execution (task-master commands only)

### Role-Specific Tools

- **Frontend Agent**: `mcp__eslint__*`, `mcp__puppeteer__*`
- **Backend Agent**: `mcp__docker__*`, database tools
- **QA Agent**: `mcp__puppeteer__*`, testing frameworks
- **DevOps Agent**: `mcp__docker__*`, deployment tools

---

## 🚨 Emergency Bypass

**Only for Critical Production Issues**

If blocking critical production issue requires immediate task completion without full checklist:

1. Document reason for bypass
2. Create follow-up task for proper completion
3. Notify team of technical debt created
4. Schedule remediation within 48 hours

**Bypass Documentation**:

```bash
task-master update-task --id=X --prompt="EMERGENCY BYPASS: [reason]
Technical debt created: [list items not completed]
Follow-up task: [task ID for remediation]
Scheduled remediation: [date/time]"
```

---

## 📊 Quality Metrics

Track and report monthly:

- Checklist compliance rate
- Average time to complete checklist
- Most common checklist failures
- Process improvement suggestions

---

**Version**: 1.0  
**Effective Date**: January 2025  
**Mandatory For**: All Claude Code agents  
**Review Cycle**: Monthly  
**Maintained By**: Task Management Team
