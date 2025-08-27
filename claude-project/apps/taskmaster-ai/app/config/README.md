# LiteLLM Configuration Directory

This directory contains configuration files for the LiteLLM proxy server.

## Files:
- `litellm-config.yaml` - Main LiteLLM configuration
- `.env` - Environment variables (create from .env.example)

## Setup:
1. Copy `.env.example` to `.env`
2. Fill in your API keys in `.env`
3. Modify `litellm-config.yaml` as needed
4. Run `docker-compose up` to start the proxy