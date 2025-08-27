# API Key Management Standards

## Overview
Standardized API key management for all projects to reduce location confusion and improve security.

## Standard Location Hierarchy

### 1. Project-Level Keys (Preferred)
```
/projects/{project-name}/.env
```
- Contains project-specific API keys
- Loaded via `dotenv` in project entry point
- Never committed to version control

### 2. Shared Infrastructure Keys
```
/shared/config/{service}/.env
```
- For shared services (LiteLLM, Docker services)
- Infrastructure-level configurations
- Cross-project dependencies

### 3. Global Fallback Keys
```
/home/darlinghurstlinux/.env.global
```
- System-wide API keys (if needed)
- Loaded as fallback when project keys not found

## Standard Naming Conventions

### Core API Providers
```bash
# AI/LLM Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_STUDIO_API_KEY=AIza...
GROQ_API_KEY=gsk_...
PERPLEXITY_API_KEY=pplx-...

# Infrastructure
LITELLM_MASTER_KEY=sk-...
OLLAMA_BASE_URL=http://localhost:11434

# Google Services (OAuth)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Security & Auth
JWT_SECRET=...
SESSION_SECRET=...
```

### Service-Specific Prefixes
```bash
# Database
DATABASE_URL=...
REDIS_URL=...

# Monitoring
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...

# External Services
N8N_URL=http://192.168.1.74:5678
```

## Standard Loading Pattern

### For all JavaScript/Node.js projects:
```javascript
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with hierarchy
function loadEnvironment() {
    // 1. Load project-specific .env
    dotenv.config();
    
    // 2. Load shared config if exists
    const sharedEnvPath = path.join(process.cwd(), '../shared/config/.env');
    dotenv.config({ path: sharedEnvPath, override: false });
    
    // 3. Load global fallback if exists
    const globalEnvPath = path.join(process.env.HOME, '.env.global');
    dotenv.config({ path: globalEnvPath, override: false });
}

// Standard key validation
function validateRequiredKeys(requiredKeys) {
    const missing = requiredKeys.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Usage
loadEnvironment();
validateRequiredKeys(['GOOGLE_AI_STUDIO_API_KEY', 'OPENAI_API_KEY']);
```

### For Python projects:
```python
import os
from pathlib import Path
from dotenv import load_dotenv

def load_environment():
    """Load environment variables with hierarchy"""
    # 1. Load project-specific .env
    load_dotenv()
    
    # 2. Load shared config if exists
    shared_env = Path.cwd().parent / 'shared' / 'config' / '.env'
    if shared_env.exists():
        load_dotenv(shared_env, override=False)
    
    # 3. Load global fallback if exists
    global_env = Path.home() / '.env.global'
    if global_env.exists():
        load_dotenv(global_env, override=False)

def validate_required_keys(required_keys):
    """Validate required environment variables exist"""
    missing = [key for key in required_keys if not os.getenv(key)]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

# Usage
load_environment()
validate_required_keys(['GOOGLE_AI_STUDIO_API_KEY', 'OPENAI_API_KEY'])
```

### For Bash Scripts and Agent Commands:
```bash
# SECURE pattern for gem agents and scripts
# Always check if key exists before using
if [[ -n "$GOOGLE_AI_STUDIO_API_KEY" ]]; then
    export GOOGLE_AI_STUDIO_API_KEY="${GOOGLE_AI_STUDIO_API_KEY}"
    gemini --prompt "your request here"
else
    echo "Error: GOOGLE_AI_STUDIO_API_KEY not found"
    exit 1
fi

# ALTERNATIVE: Direct usage without export (preferred)
gemini --prompt "your request here"  # Uses environment automatically
```

**Gem Agent Best Practices:**
- ✅ Use `${GOOGLE_AI_STUDIO_API_KEY}` variable expansion
- ✅ Check if API key exists before bash commands
- ✅ Prefer direct tool usage over explicit export when possible
- ❌ Never hardcode API keys in agent definitions
- ❌ Never log or expose API key values

## Security Guidelines

### CRITICAL: Document Locations, Never Recreate Keys
```bash
# ALWAYS document where keys are located in project CLAUDE.md
# NEVER regenerate existing API keys unless explicitly required
# ALWAYS preserve existing working configurations
```

### .env File Protection
```bash
# Always add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### File Permissions
```bash
# Secure .env files
chmod 600 .env
```

### Key Generation Standards
```bash
# JWT secrets (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# LiteLLM master keys
openssl rand -base64 32
```

## Template System

### Standard .env.example template:
```bash
# =============================================================================
# [PROJECT NAME] Environment Configuration
# =============================================================================
# Copy this file to .env and configure values for your environment
# SECURITY: Never commit .env files with real secrets to version control!

# =============================================================================
# AI/LLM API KEYS (Required)
# =============================================================================
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=your-google-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# =============================================================================
# INFRASTRUCTURE
# =============================================================================
LITELLM_MASTER_KEY=your-litellm-master-key-here
OLLAMA_BASE_URL=http://localhost:11434

# =============================================================================
# PROJECT SPECIFIC
# =============================================================================
# [Add project-specific variables here]
```

## Migration Strategy

### For existing projects:
1. **Audit current .env files** - identify all API keys and their usage
2. **Standardize naming** - update variable names to match conventions
3. **Consolidate locations** - move keys to appropriate hierarchy level
4. **Update load patterns** - implement standard loading code
5. **Test thoroughly** - ensure all services still work with new structure

### Implementation order:
1. **DOCUMENT EXISTING LOCATIONS FIRST** in each project's CLAUDE.md
2. `home-dashboard` (preserve existing working keys)
3. `crewai` projects (preserve existing working keys)
4. `shared/config/litellm` (preserve existing working keys)
5. Other miniprojects

### PRESERVATION POLICY
- **NEVER recreate working API keys**
- **ALWAYS document current locations in project CLAUDE.md**  
- **ONLY standardize locations, not key values**
- **PRESERVE all existing working configurations**

## Cost Control Integration

### API key validation with cost awareness:
```javascript
function validateKeyWithCostWarning(keyName, service) {
    const key = process.env[keyName];
    if (!key) {
        throw new Error(`Missing ${keyName} for ${service}`);
    }
    
    // Warn about paid services
    const paidServices = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY'];
    if (paidServices.includes(keyName)) {
        console.warn(`⚠️  Using paid service: ${service}. Monitor costs.`);
    }
    
    return key;
}
```

## Benefits of This System

1. **Predictable Locations** - Always know where to find API keys
2. **Hierarchy Fallbacks** - Flexible key resolution
3. **Security by Default** - Standardized protection patterns  
4. **Cost Awareness** - Built-in warnings for paid services
5. **Easy Migration** - Clear upgrade path for existing projects
6. **Development Friendly** - Consistent patterns across projects

## Next Steps

1. Implement standard loading pattern in home-dashboard
2. Create migration scripts for existing projects
3. Update all .env.example files to use standard template
4. Document project-specific key requirements