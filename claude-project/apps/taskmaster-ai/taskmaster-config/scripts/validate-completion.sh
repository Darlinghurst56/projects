#!/bin/bash

# Agent Task Completion Validation Script
# This script helps verify that all mandatory checklist items are completed

set -e

echo "🔍 Agent Task Completion Validation"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "1. 📋 Git Status Check"
echo "----------------------"

# Check git status
if git status --porcelain | grep -q .; then
    UNTRACKED=$(git status --porcelain | grep "^??" | wc -l)
    MODIFIED=$(git status --porcelain | grep "^.M" | wc -l)
    STAGED=$(git status --porcelain | grep "^M" | wc -l)
    
    if [ $UNTRACKED -gt 0 ]; then
        check_warning "Found $UNTRACKED untracked files"
    fi
    
    if [ $MODIFIED -gt 0 ]; then
        check_info "Found $MODIFIED modified files"
    fi
    
    if [ $STAGED -gt 0 ]; then
        check_passed "Found $STAGED staged files ready for commit"
    else
        check_warning "No files staged for commit"
    fi
else
    check_passed "Working directory is clean"
fi

echo ""
echo "2. 🔧 Code Quality Checks"
echo "-------------------------"

# Check for package.json to determine project type
if [ -f "package.json" ]; then
    check_passed "Node.js project detected"
    
    # Check if npm audit passes
    if command_exists npm; then
        if npm audit --audit-level=high >/dev/null 2>&1; then
            check_passed "No high-severity security vulnerabilities found"
        else
            check_failed "High-severity security vulnerabilities detected (run: npm audit)"
        fi
    fi
    
    # Check if build passes
    if grep -q '"build"' package.json; then
        check_info "Build script available - recommend running: npm run build"
    fi
    
    # Check if test passes
    if grep -q '"test"' package.json; then
        check_info "Test script available - recommend running: npm test"
    fi
else
    check_info "No package.json found - skipping Node.js specific checks"
fi

echo ""
echo "3. 📄 Documentation Checks"
echo "--------------------------"

# Check for TaskMaster project
if [ -d ".taskmaster" ]; then
    check_passed "TaskMaster project structure found"
    
    if [ -f ".taskmaster/tasks/tasks.json" ]; then
        check_passed "TaskMaster tasks file exists"
    else
        check_failed "TaskMaster tasks.json not found"
    fi
else
    check_failed "TaskMaster project structure not found"
fi

# Check for mandatory checklist
if [ -f ".taskmaster/docs/agent-completion-checklist.md" ]; then
    check_passed "Mandatory completion checklist found"
else
    check_failed "Mandatory completion checklist not found"
fi

# Check for CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    check_passed "Project CLAUDE.md found"
else
    check_warning "Project CLAUDE.md not found"
fi

echo ""
echo "4. 🔄 Process Verification"
echo "--------------------------"

# Check if TaskMaster is available
if command_exists task-master; then
    check_passed "TaskMaster CLI available"
else
    check_failed "TaskMaster CLI not found in PATH"
fi

# Check current git branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" != "unknown" ]; then
    check_info "Current branch: $CURRENT_BRANCH"
else
    check_warning "Could not determine current git branch"
fi

# Check for recent commits
RECENT_COMMITS=$(git log --oneline -5 --since="1 day ago" 2>/dev/null | wc -l)
if [ $RECENT_COMMITS -gt 0 ]; then
    check_info "Found $RECENT_COMMITS recent commits (last 24 hours)"
else
    check_warning "No recent commits found"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

echo ""
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Validation passed! You may proceed with task completion.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Complete the mandatory checklist in .taskmaster/docs/agent-completion-checklist.md"
    echo "2. Update TaskMaster with completion notes"
    echo "3. Commit changes with proper commit message"
    echo "4. Mark task as complete in TaskMaster"
else
    echo -e "${RED}❌ Validation failed. Please address the failed checks before completing your task.${NC}"
    exit 1
fi

echo ""
echo "For full requirements, see: .taskmaster/docs/agent-completion-checklist.md"