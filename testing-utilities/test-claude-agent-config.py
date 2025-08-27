#!/usr/bin/env python3

"""
Test script to verify Claude Code agent configuration
This simulates how agents would see environment variables
"""

import os
import json

def test_agent_environment():
    print("🔧 Testing Claude Code Agent Configuration")
    print("=" * 50)
    
    # Check main Claude environment (should be empty)
    print("\n📋 Main Claude Code Environment:")
    print(f"ANTHROPIC_BASE_URL: '{os.getenv('ANTHROPIC_BASE_URL', '')}'")
    print(f"ANTHROPIC_API_KEY: '{os.getenv('ANTHROPIC_API_KEY', '')}'")
    
    # Check agent-specific environment variables
    print("\n🤖 Agent Environment Variables (from settings.json):")
    agent_base_url = os.getenv('ANTHROPIC_BASE_URL_FOR_AGENTS', '')
    agent_api_key = os.getenv('ANTHROPIC_API_KEY_FOR_AGENTS', '')
    proxy_enabled = os.getenv('CLAUDE_AGENT_PROXY_ENABLED', '')
    
    print(f"ANTHROPIC_BASE_URL_FOR_AGENTS: '{agent_base_url}'")
    print(f"ANTHROPIC_API_KEY_FOR_AGENTS: '{agent_api_key}'")
    print(f"CLAUDE_AGENT_PROXY_ENABLED: '{proxy_enabled}'")
    
    # Verify configuration
    print("\n✅ Configuration Status:")
    if not os.getenv('ANTHROPIC_BASE_URL') and not os.getenv('ANTHROPIC_API_KEY'):
        print("✓ Main Claude Code: Using CLI login (no proxy)")
    else:
        print("⚠ Main Claude Code: Has proxy settings")
    
    if agent_base_url and agent_api_key:
        print("✓ Agents: Have LiteLLM proxy configuration")
        print(f"  → Base URL: {agent_base_url}")
        print(f"  → API Key: {agent_api_key[:15]}...")
    else:
        print("⚠ Agents: Missing proxy configuration")
    
    print(f"\n🌐 Expected behavior:")
    print("• Main Claude: Direct Anthropic API (your CLI login)")
    print("• Agents: Route through LiteLLM → Groq models")
    print("  - claude-3-5-sonnet-20241022 → Llama 3.3 70B")
    print("  - claude-3-5-haiku-20241022 → Llama 3.1 8B")

if __name__ == "__main__":
    test_agent_environment()