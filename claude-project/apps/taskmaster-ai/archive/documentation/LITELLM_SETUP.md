# LiteLLM Proxy Server Setup Guide

## Overview

This setup provides a comprehensive LiteLLM proxy server with Docker containerization, multi-provider support, cost optimization, and TaskMaster integration.

## Quick Start

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure API keys** in `.env`:
   ```bash
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   GOOGLE_API_KEY=your_google_key_here
   ```

3. **Start the proxy**:
   ```bash
   ./start-litellm.sh
   ```

4. **Test the proxy**:
   ```bash
   curl http://localhost:4000/health
   ```

## Architecture

### Docker Configuration
- **Base Image**: `ghcr.io/berriai/litellm:main-latest`
- **Port**: 4000 (configurable)
- **Health Checks**: Built-in with 30s intervals
- **Logging**: JSON format with configurable levels

### Provider Support
- **OpenAI**: GPT-4o, GPT-4o-mini
- **Anthropic**: Claude-3.5-Sonnet, Claude-3-Haiku
- **Google**: Gemini-2.0-Flash
- **Ollama**: Local models (llama3.2)

### Cost Optimization
- **Priority-based routing**: Lower cost models prioritized
- **Fallback mechanisms**: Automatic failover to alternative providers
- **Cost thresholds**: Dynamic routing based on request complexity

## Configuration Files

### `Dockerfile`
```dockerfile
FROM ghcr.io/berriai/litellm:main-latest
WORKDIR /app
COPY litellm-config.yaml /app/config/
EXPOSE 4000
CMD ["litellm", "--config", "/app/config/litellm-config.yaml"]
```

### `docker-compose.yml`
- **Services**: litellm-proxy, redis (optional)
- **Networks**: Isolated litellm-network
- **Volumes**: Configuration and logs persistence
- **Health Checks**: Container health monitoring

### `litellm-config.yaml`
- **Model List**: All supported providers and models
- **Router Settings**: Cost-based routing strategy
- **Callbacks**: TaskMaster integration hooks
- **Cost Configuration**: Per-token pricing and priorities

## Environment Variables

### Required API Keys
```bash
OPENAI_API_KEY=sk-...           # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic API key
GOOGLE_API_KEY=...              # Google API key
```

### Optional Configuration
```bash
LITELLM_LOG_LEVEL=INFO          # Logging level
LITELLM_PORT=4000               # Server port
TASKMASTER_API_URL=http://...   # TaskMaster integration
```

## Usage Examples

### Basic Chat Completion
```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer taskmaster-litellm-key" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Health Check
```bash
curl http://localhost:4000/health
```

### List Available Models
```bash
curl http://localhost:4000/models
```

## Cost Optimization Features

### Priority-Based Routing
Models are prioritized by cost-effectiveness:
1. **Priority 1**: Free/cheapest (Ollama, GPT-4o-mini, Claude-3-Haiku)
2. **Priority 2**: Moderate cost (GPT-4o)
3. **Priority 3**: Higher cost (Claude-3.5-Sonnet)

### Automatic Fallbacks
If a provider fails:
1. Try next available model in same priority tier
2. Fall back to different provider
3. Log failures for monitoring

### Cost Thresholds
- Simple tasks: Route to cheapest models
- Complex tasks: Allow higher-cost models
- Configurable per-request routing

## TaskMaster Integration

### Callback Functions
- **Success Callbacks**: Log successful requests to TaskMaster
- **Failure Callbacks**: Track errors and provider issues
- **Cost Tracking**: Monitor usage per task/agent

### API Integration
The proxy integrates with TaskMaster API at:
- **Endpoint**: `http://host.docker.internal:3001`
- **Purpose**: Usage tracking, cost attribution, performance monitoring

## Monitoring and Logging

### Container Logs
```bash
# View real-time logs
docker-compose logs -f litellm-proxy

# View specific timeframe
docker-compose logs --since 1h litellm-proxy
```

### Health Monitoring
```bash
# Check container status
docker-compose ps

# Check health status
curl http://localhost:4000/health
```

### Database Logging
- **Local SQLite**: `/app/logs/litellm.db`
- **Request Logs**: All API calls tracked
- **Error Logs**: Provider failures and retries

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check Docker daemon
docker info

# Check configuration
docker-compose config

# View build logs
docker-compose build --no-cache
```

#### API Key Issues
```bash
# Verify environment variables
docker-compose exec litellm-proxy env | grep API_KEY

# Test individual providers
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer taskmaster-litellm-key" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}]}'
```

#### Provider Failures
```bash
# Check provider status in logs
docker-compose logs litellm-proxy | grep -i error

# Test fallback routing
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer taskmaster-litellm-key" \
  -d '{"model": "claude-3-haiku", "messages": [{"role": "user", "content": "test"}]}'
```

## Development Commands

```bash
# Start in development mode
docker-compose up

# Rebuild after config changes
docker-compose down && docker-compose build && docker-compose up -d

# Access container shell
docker-compose exec litellm-proxy /bin/bash

# View configuration
docker-compose exec litellm-proxy cat /app/config/litellm-config.yaml
```

## Security Considerations

- **API Keys**: Stored in environment variables, not in code
- **Master Key**: Required for proxy access (`taskmaster-litellm-key`)
- **Network Isolation**: Containers run in isolated network
- **Health Checks**: Automatic monitoring and restart

## Next Steps

After successful setup:
1. **Test Multi-Provider**: Verify all configured providers work
2. **Cost Monitoring**: Set up usage tracking
3. **TaskMaster Integration**: Connect to task tracking system
4. **Production Deployment**: Configure for production environment

## Support

For issues or questions:
1. Check logs: `docker-compose logs litellm-proxy`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `curl http://localhost:4000/health`
4. Review TaskMaster integration logs