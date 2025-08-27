# CCR Routing System - Historical Archive

> **Status**: ARCHIVED - CCR-SUBAGENT-MODEL system was not implemented
> **Date Archived**: 2025-08-27
> **Reason**: System was documented but never actually deployed or used

This document preserves the original CCR (Claude Code Router) agent routing design that was planned but not implemented.

## Original CCR-SUBAGENT-MODEL Tag Design

### Concept
The CCR-SUBAGENT-MODEL tag system was designed to provide real-time model routing during API calls:

```xml
<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>
```

### Planned Features
- **Purpose**: Direct real-time model routing during API calls
- **Status**: Never implemented (documented as "100% functional" but not actually deployed)
- **Location**: Top of agent definition files
- **Routing Examples**:
  - `<CCR-SUBAGENT-MODEL>gemini,gemini-1.5-flash</CCR-SUBAGENT-MODEL>` → Routes to Gemini Flash
  - `<CCR-SUBAGENT-MODEL>groq,llama-3.3-70b-versatile</CCR-SUBAGENT-MODEL>` → Routes to Groq Llama
  - `<CCR-SUBAGENT-MODEL>ollama,qwen2.5-coder:latest</CCR-SUBAGENT-MODEL>` → Routes to local Ollama

### Dual-System Benefits (Planned)
- **Real-Time Intelligence**: CCR tags ensure optimal model selection for each agent's capabilities
- **Workflow Automation**: @ tags provide automated quality gates and coordination
- **98% Built-in Functionality**: Leverages Claude Code's native infrastructure
- **Automatic Backup Protection**: Staged files backed up before agent execution
- **Cost Controls**: Inherits existing settings.json limits
- **GitHub Actions Ready**: Team collaboration workflows supported
- **Zero Maintenance**: No custom infrastructure to maintain

### Agent Routing Table (Planned)
| @ Tag | CCR Routing | Agent Purpose | Use When |
|-------|-------------|---------------|----------|
| `@security_agent` | `groq,llama-3.3-70b-versatile` | Security & vulnerability analysis | Auth changes, crypto, API security |
| `@performance_agent` | `groq,llama-3.1-70b-versatile` | Performance analysis & optimization | Slow queries, bottlenecks, scaling |
| `@gem_test_agent` | `gemini,gemini-1.5-flash` | Advanced testing with Gemini reasoning | Complex logic, integration testing |
| `@gem_doc_agent` | `gemini,gemini-1.5-flash` | Enhanced documentation with Gemini | API docs, complex systems, user guides |

### CCR Routing Notes (Planned)
- `gem_*` agents automatically route to Gemini models for enhanced reasoning
- Security/architecture agents use high-capacity models for complex analysis
- Infrastructure agents use fast models for quick operations
- All routing is automatic - CCR tags in agent definitions handle this transparently

## Claude Code Router Implementation Details

### Infrastructure Status
- **Location**: `/home/darlinghurstlinux/.claude-code-router/`
- **Status**: Documented as "Production-ready" but not actually functional
- **Endpoint**: `http://127.0.0.1:3456/v1/messages`

### Key Features (Planned)
- **CCR-SUBAGENT-MODEL Tag Routing**: Agents can specify exact models using `<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>` tags
- **Agent-based Routing**: `gem_*` agents automatically route to Gemini, others to Groq
- **Context-aware Routing**: Long context → Gemini Pro, Web search → Gemini Flash, Background tasks → Ollama
- **Multi-provider Support**: Groq, Gemini, and Ollama with failsafe fallback

### Provider Configuration (Planned)
```json
{
  "groq": ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile"],
  "gemini": ["gemini-1.5-flash", "gemini-1.5-pro"], 
  "ollama": ["llama3.2:latest", "qwen2.5-coder:latest"]
}
```

### Routing Logic (Planned)
- **Default**: `groq,llama-3.1-8b-instant`
- **Background**: `ollama,llama3.2:latest` 
- **Think**: `groq,llama-3.3-70b-versatile`
- **Long Context**: `gemini,gemini-1.5-pro`
- **Web Search**: `gemini,gemini-1.5-flash`

## Implementation Reality
The CCR system was extensively documented but never actually implemented or deployed. The @ tag system for commit-based automation remains valid and functional, but the CCR-SUBAGENT-MODEL routing was aspirational documentation rather than working functionality.

## Current Status (August 2025)
- **CCR-SUBAGENT-MODEL Tags**: Removed from active documentation
- **@ Tag System**: Continues to function for commit-based automation
- **Model Routing**: Handled through other means (LiteLLM simple proxy, direct API calls)
- **Agent Coordination**: Simplified to focus on working systems only

---

*This archive preserves the historical CCR routing design for reference purposes. The system was never implemented despite being documented as functional.*