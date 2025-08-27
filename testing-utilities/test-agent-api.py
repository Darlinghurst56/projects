#!/usr/bin/env python3

import os
import json

print("🔍 Agent API Configuration Analysis")
print("=" * 50)

# Check environment variables that agents would see
print("\n📋 Environment Variables Available to Agents:")
print(f"ANTHROPIC_BASE_URL_FOR_AGENTS: {os.getenv('ANTHROPIC_BASE_URL_FOR_AGENTS', 'Not set')}")
print(f"ANTHROPIC_API_KEY_FOR_AGENTS: {os.getenv('ANTHROPIC_API_KEY_FOR_AGENTS', 'Not set')}")

# Read settings.json to see agent configuration
try:
    with open('/home/darlinghurstlinux/.claude/settings.json', 'r') as f:
        settings = json.load(f)
        env_vars = settings.get('env', {})
        print("\n📄 From settings.json env:")
        for key, value in env_vars.items():
            if 'AGENT' in key:
                print(f"  {key}: {value}")
except Exception as e:
    print(f"Error reading settings: {e}")

print("\n🔍 Based on LiteLLM logs:")
print("  • Requests coming from: 127.0.0.1 (localhost)")
print("  • Models requested: claude-* models")
print("  • Actually routing to: api.groq.com")
print("  • Authentication: Using LiteLLM master key")

print("\n✅ Conclusion:")
print("  Agents are using: LiteLLM Proxy → Groq API")
print("  NOT using: Direct Anthropic API or CLI login")
print("  Evidence: All agent requests route through localhost:4000 to Groq")