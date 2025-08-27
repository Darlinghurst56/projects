#!/bin/bash

# Setup Enhanced Agent Tracking
# Minimal integration with existing orchestrator and TaskMaster systems

echo "🔧 Setting up enhanced agent tracking and LLM usage monitoring..."

# Create telemetry directory
mkdir -p .taskmaster/telemetry
mkdir -p .taskmaster/agents/models

echo "📊 Configuring agent-specific models..."

# Configure agent-specific models (leverages TaskMaster's multi-model support)
for agent in orchestrator-agent frontend-agent backend-agent devops-agent qa-specialist; do
    echo "  Setting up $agent model configuration..."
    node .taskmaster/agents/test-strategy-enhancer.js model $agent > .taskmaster/agents/models/${agent}.json
done

echo "🤖 Testing telemetry tracking..."

# Test the tracking system
echo "Creating test task to verify telemetry..."
TASK_OUTPUT=$(task-master add-task --prompt="Test telemetry tracking system" --priority="low" 2>&1)

if [[ $TASK_OUTPUT == *"Telemetry"* ]]; then
    echo "✅ TaskMaster telemetry detected and working!"
    # Extract telemetry for testing
    echo "$TASK_OUTPUT" | grep -A10 "Telemetry"
else
    echo "⚠️  TaskMaster telemetry not detected in output"
fi

echo "📈 Setting up dashboard commands..."

# Add convenience commands to package.json scripts (if not already present)
if ! grep -q "telemetry:dashboard" package.json; then
    echo "Adding telemetry commands to package.json..."
    
    # Create a temporary package.json with new scripts
    node -e "
        const pkg = require('./package.json');
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['telemetry:dashboard'] = 'node .taskmaster/agents/telemetry-dashboard.js';
        pkg.scripts['telemetry:report'] = 'node .taskmaster/agents/agent-telemetry-tracker.js report';
        pkg.scripts['telemetry:live'] = 'node .taskmaster/agents/telemetry-dashboard.js live';
        pkg.scripts['telemetry:export'] = 'node .taskmaster/agents/telemetry-dashboard.js export';
        require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✅ Added telemetry commands to package.json"
else
    echo "✅ Telemetry commands already in package.json"
fi

echo "🧪 Testing UI/UX test strategy enhancement..."

# Test the test strategy enhancer
ENHANCED_STRATEGY=$(node .taskmaster/agents/test-strategy-enhancer.js enhance "Test basic functionality" "frontend")
echo "Original: Test basic functionality"
echo "Enhanced: $ENHANCED_STRATEGY"

echo ""
echo "🎉 Setup complete! Available commands:"
echo ""
echo "📊 Telemetry & Monitoring:"
echo "   npm run telemetry:dashboard     - Show usage dashboard"
echo "   npm run telemetry:live         - Live monitoring mode"
echo "   npm run telemetry:report       - JSON usage report"
echo "   npm run telemetry:export       - Export data for analysis"
echo ""
echo "🤖 Agent Management:"
echo "   npm run agents:status          - Agent status"
echo "   npm run agents:health-check    - Agent health"
echo ""
echo "🧪 Testing:"
echo "   ./update-test-strategies.sh    - Enhance test strategies"
echo ""
echo "🔧 Integration (Manual):"
echo "   See enhanced-orchestrator-integration.js for orchestrator patches"
echo "   Agent-specific models configured in .taskmaster/agents/models/"
echo ""
echo "💡 Next Steps:"
echo "1. Run 'npm run telemetry:dashboard' to see current usage"
echo "2. Execute some tasks to generate telemetry data"
echo "3. Use 'npm run telemetry:live' for real-time monitoring"
echo ""
echo "🔗 Integration with existing systems:"
echo "   ✅ Uses TaskMaster's built-in telemetry"
echo "   ✅ Compatible with existing LiteLLM setup"  
echo "   ✅ Minimal changes to orchestrator required"
echo "   ✅ Preserves all existing functionality"
echo ""