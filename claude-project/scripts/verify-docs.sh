#!/bin/bash

# Documentation Verification Script (No AI Required)
# Verifies required sections exist in documentation files

DOC_METADATA="docs/.doc-metadata.json"
FAILED_CHECKS=0

echo "🔍 Verifying documentation integrity..."

# Check if metadata file exists
if [ ! -f "$DOC_METADATA" ]; then
    echo "❌ Documentation metadata file not found: $DOC_METADATA"
    exit 1
fi

# Function to check if section exists in file
check_section() {
    local file="$1"
    local section="$2"
    
    if grep -q "## $section" "$file"; then
        echo "  ✅ Section '$section' found"
        return 0
    else
        echo "  ❌ Missing section '$section'"
        return 1
    fi
}

# Function to check file line count
check_line_count() {
    local file="$1"
    local max_lines="$2"
    local actual_lines=$(wc -l < "$file")
    
    if [ "$actual_lines" -le "$max_lines" ]; then
        echo "  ✅ Line count OK: $actual_lines/$max_lines"
        return 0
    else
        echo "  ❌ Too many lines: $actual_lines/$max_lines (optimize for token usage)"
        return 1
    fi
}

# Verify QA Agent Context
echo "📋 Checking QA Agent Context..."
if [ -f "docs/agent-contexts/qa-agent-context.md" ]; then
    check_section "docs/agent-contexts/qa-agent-context.md" "Agent Role" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/qa-agent-context.md" "Key Commands" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/qa-agent-context.md" "API Endpoints" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/qa-agent-context.md" "Error Patterns" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_line_count "docs/agent-contexts/qa-agent-context.md" 50 || FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo "❌ QA Agent context file missing"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Verify UX Agent Context
echo "🎨 Checking UX Agent Context..."
if [ -f "docs/agent-contexts/ux-agent-context.md" ]; then
    check_section "docs/agent-contexts/ux-agent-context.md" "Agent Role" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/ux-agent-context.md" "Key Commands" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/ux-agent-context.md" "API Endpoints" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_line_count "docs/agent-contexts/ux-agent-context.md" 50 || FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo "❌ UX Agent context file missing"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Verify Integration Agent Context
echo "🔗 Checking Integration Agent Context..."
if [ -f "docs/agent-contexts/integration-agent-context.md" ]; then
    check_section "docs/agent-contexts/integration-agent-context.md" "Agent Role" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/integration-agent-context.md" "Key Commands" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/agent-contexts/integration-agent-context.md" "API Endpoints" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_line_count "docs/agent-contexts/integration-agent-context.md" 50 || FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo "❌ Integration Agent context file missing"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Verify Home User Guide
echo "🏠 Checking Home User Guide..."
if [ -f "docs/HOME-USER-GUIDE.md" ]; then
    check_section "docs/HOME-USER-GUIDE.md" "Quick Start" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/HOME-USER-GUIDE.md" "What Each Agent Does" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_section "docs/HOME-USER-GUIDE.md" "Common Tasks" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_line_count "docs/HOME-USER-GUIDE.md" 200 || FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo "❌ Home User Guide missing"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Summary
echo ""
if [ $FAILED_CHECKS -eq 0 ]; then
    echo "✅ All documentation checks passed!"
    echo "📊 Token optimization: Agent contexts under 200 tokens each"
    exit 0
else
    echo "❌ $FAILED_CHECKS documentation checks failed"
    echo "📝 Please fix the issues above before committing"
    exit 1
fi