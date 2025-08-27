#!/bin/bash

# Documentation Analysis Script
# Identifies expired, superseded, and orphaned documentation for review

set -euo pipefail

echo "🔍 Documentation Analysis Report"
echo "================================"
echo "Generated: $(date)"
echo ""

echo "1. 📊 DUPLICATE RULE FILES:"
echo "   Problem: Same content in multiple directories wastes space and creates confusion"
find . -name "*.md" -not -path "*/node_modules/*" | grep -E "(dev_workflow|self_improve|taskmaster)" | sort
echo "   → Recommendation: Keep .clinerules/ as primary, remove others"
echo ""

echo "2. 🚫 EXPIRED MCP SYNTAX:"
echo "   Problem: --allowed-directories flag doesn't work with filesystem server"
grep -r "\-\-allowed-directories" . --include="*.md" --exclude-dir=node_modules 2>/dev/null | cut -d: -f1 | sort -u | while read -r file; do
    echo "   📄 $file"
done
echo "   → Recommendation: Update to correct syntax (path only, no flag)"
echo ""

echo "3. 🏚️ OBSOLETE DESKTOP CONFIG REFERENCES:"
echo "   Problem: References to Claude Desktop config when using Claude CLI"
grep -r "claude_desktop_config" . --include="*.md" --exclude-dir=node_modules 2>/dev/null | cut -d: -f1 | sort -u | while read -r file; do
    echo "   📄 $file"
done
echo "   → Recommendation: Update to .mcp.json project-scope config"
echo ""

echo "4. 📁 ARCHIVE DIRECTORIES:"
echo "   Status: Already archived content (review for orphaned references)"
find . -name "*archive*" -type d | while read -r dir; do
    echo "   📁 $dir ($(find "$dir" -name "*.md" | wc -l) markdown files)"
done
echo ""

echo "5. 🔗 POTENTIAL BROKEN LINKS:"
echo "   Checking for markdown links to non-existent files..."
link_count=0
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/archive/*" -exec grep -l "]\(" {} \; | while read -r file; do
    grep -o "]\([^)]*\.md[^)]*\)" "$file" 2>/dev/null | sed 's/](\(.*\))/\1/' | while read -r link; do
        if [[ ! "$link" =~ ^http ]] && [[ ! -f "$link" ]] && [[ ! -f "$(dirname "$file")/$link" ]]; then
            echo "   ⚠️  $file → $link"
            link_count=$((link_count + 1))
        fi
    done
done
echo ""

echo "6. 📈 CLEANUP IMPACT ESTIMATE:"
duplicate_files=$(find . -name "*.md" -not -path "*/node_modules/*" | grep -E "(dev_workflow|self_improve|taskmaster)" | grep -v ".clinerules" | wc -l)
expired_syntax_files=$(grep -r "\-\-allowed-directories" . --include="*.md" --exclude-dir=node_modules 2>/dev/null | cut -d: -f1 | sort -u | wc -l)
obsolete_config_files=$(grep -r "claude_desktop_config" . --include="*.md" --exclude-dir=node_modules 2>/dev/null | cut -d: -f1 | sort -u | wc -l)

echo "   📊 Files to remove: $duplicate_files duplicate rule files"
echo "   📝 Files to update: $expired_syntax_files (MCP syntax) + $obsolete_config_files (config references)"
echo "   💾 Space to recover: ~$(du -sh .github .roo .trae .windsurf 2>/dev/null | awk '{total+=$1} END {print total "K"}' || echo "Unknown")"
echo ""

echo "7. 🎯 RECOMMENDED ACTIONS:"
echo "   ✅ Run: chmod +x cleanup-docs.sh && ./cleanup-docs.sh"
echo "   ✅ Review: Backup created in cleanup-backup-YYYYMMDD-HHMMSS/"
echo "   ✅ Update: Any remaining references found during cleanup"
echo "   ✅ Commit: Changes after verification"
echo ""

echo "8. 📋 CURRENT DOCUMENTATION STRUCTURE:"
echo "   Primary documentation files (keeping these):"
find . -maxdepth 1 -name "*.md" -not -path "*/node_modules/*" | sort | while read -r file; do
    size=$(wc -l < "$file" 2>/dev/null || echo "0")
    echo "   📄 $file ($size lines)"
done
echo ""

echo "🔧 Next Steps:"
echo "1. Review this analysis"
echo "2. Run ./cleanup-docs.sh to perform cleanup"
echo "3. Verify changes in backup directory"
echo "4. Commit cleaned documentation"
echo ""
echo "⚠️  Note: All changes are backed up before removal"