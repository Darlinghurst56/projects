#!/usr/bin/env python3
"""
LiteLLM Proxy Server - Local Development Version
Provides a basic LiteLLM proxy for testing without Docker
"""

import os
import sys
import json
import logging
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

try:
    import litellm
    from litellm import completion, ModelResponse
    from fastapi import FastAPI, HTTPException, Request, Depends
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    import uvicorn
    from pydantic import BaseModel
except ImportError as e:
    print(f"❌ Missing required dependencies: {e}")
    print("📦 Install with: pip install litellm fastapi uvicorn")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="LiteLLM Proxy Server",
    description="TaskMaster LiteLLM Proxy for model call redirection",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configuration
class ProxyConfig:
    def __init__(self):
        self.master_key = os.getenv("LITELLM_MASTER_KEY", "taskmaster-litellm-key")
        self.port = int(os.getenv("LITELLM_PORT", "4000"))
        self.log_level = os.getenv("LITELLM_LOG_LEVEL", "INFO")
        self.taskmaster_api_url = os.getenv("TASKMASTER_API_URL", "http://localhost:3001")
        
        # Load model configuration
        self.models = self._load_models()
        
    def _load_models(self) -> Dict[str, Dict[str, Any]]:
        """Load model configuration based on available API keys"""
        models = {}
        
        # OpenAI models
        if os.getenv("OPENAI_API_KEY"):
            models.update({
                "gpt-4o": {
                    "provider": "openai",
                    "model": "gpt-4o",
                    "cost_per_input_token": 0.0025,
                    "cost_per_output_token": 0.01,
                    "priority": 2
                },
                "gpt-4o-mini": {
                    "provider": "openai", 
                    "model": "gpt-4o-mini",
                    "cost_per_input_token": 0.00015,
                    "cost_per_output_token": 0.0006,
                    "priority": 1
                }
            })
            
        # Anthropic models
        if os.getenv("ANTHROPIC_API_KEY"):
            models.update({
                "claude-3-5-sonnet": {
                    "provider": "anthropic",
                    "model": "claude-3-5-sonnet-20241022",
                    "cost_per_input_token": 0.003,
                    "cost_per_output_token": 0.015,
                    "priority": 3
                },
                "claude-3-haiku": {
                    "provider": "anthropic",
                    "model": "claude-3-haiku-20240307", 
                    "cost_per_input_token": 0.00025,
                    "cost_per_output_token": 0.00125,
                    "priority": 1
                }
            })
            
        # Google models
        if os.getenv("GOOGLE_API_KEY"):
            models.update({
                "gemini-2.0-flash": {
                    "provider": "google",
                    "model": "gemini-2.0-flash-exp",
                    "cost_per_input_token": 0.00015,
                    "cost_per_output_token": 0.0006,
                    "priority": 1
                }
            })
            
        return models

config = ProxyConfig()

# Request/Response models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: Optional[float] = 1.0
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    models_available: int
    version: str

class ModelInfo(BaseModel):
    id: str
    object: str
    created: int
    owned_by: str

# Authentication
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != config.master_key:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return credentials.credentials

# Utility functions
def get_best_model(requested_model: str) -> tuple[str, Dict[str, Any]]:
    """Get the best available model for the request"""
    if requested_model in config.models:
        model_config = config.models[requested_model]
        return f"{model_config['provider']}/{model_config['model']}", model_config
    
    # Fallback to cheapest available model
    available_models = sorted(
        config.models.items(),
        key=lambda x: (x[1]['priority'], x[1]['cost_per_input_token'])
    )
    
    if available_models:
        model_name, model_config = available_models[0]
        logger.warning(f"Model {requested_model} not found, using fallback: {model_name}")
        return f"{model_config['provider']}/{model_config['model']}", model_config
    
    raise HTTPException(status_code=400, detail="No models available")

async def log_to_taskmaster(request_data: Dict[str, Any], response_data: Dict[str, Any], success: bool):
    """Log request/response data to TaskMaster API"""
    try:
        import httpx
        
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "model": request_data.get("model"),
            "success": success,
            "input_tokens": response_data.get("usage", {}).get("prompt_tokens", 0),
            "output_tokens": response_data.get("usage", {}).get("completion_tokens", 0),
            "cost": calculate_cost(request_data.get("model"), response_data.get("usage", {}))
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{config.taskmaster_api_url}/api/litellm/log",
                json=log_data,
                timeout=5.0
            )
    except Exception as e:
        logger.error(f"Failed to log to TaskMaster: {e}")

def calculate_cost(model: str, usage: Dict[str, int]) -> float:
    """Calculate cost for the request"""
    if model not in config.models:
        return 0.0
        
    model_config = config.models[model]
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    
    input_cost = input_tokens * model_config["cost_per_input_token"] / 1000
    output_cost = output_tokens * model_config["cost_per_output_token"] / 1000
    
    return input_cost + output_cost

# API Routes
@app.get("/health")
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        models_available=len(config.models),
        version="1.0.0"
    )

@app.get("/models")
async def list_models() -> Dict[str, Any]:
    """List available models"""
    models_list = []
    for model_name, model_config in config.models.items():
        models_list.append(ModelInfo(
            id=model_name,
            object="model",
            created=1640995200,  # Static timestamp
            owned_by=model_config["provider"]
        ))
    
    return {
        "object": "list",
        "data": models_list
    }

@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    token: str = Depends(verify_token)
) -> Dict[str, Any]:
    """OpenAI-compatible chat completions endpoint"""
    try:
        # Get best model for request
        litellm_model, model_config = get_best_model(request.model)
        
        # Prepare request for LiteLLM
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        logger.info(f"Processing request for model: {request.model} -> {litellm_model}")
        
        # Make the completion request
        response = await completion(
            model=litellm_model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream
        )
        
        # Convert response to dict
        response_dict = response.model_dump() if hasattr(response, 'model_dump') else dict(response)
        
        # Log to TaskMaster
        await log_to_taskmaster(
            {"model": request.model, "messages": messages},
            response_dict,
            True
        )
        
        logger.info(f"Successfully completed request for {request.model}")
        return response_dict
        
    except Exception as e:
        logger.error(f"Error processing completion: {e}")
        
        # Log failure to TaskMaster
        await log_to_taskmaster(
            {"model": request.model},
            {"error": str(e)},
            False
        )
        
        raise HTTPException(status_code=500, detail=f"Completion failed: {str(e)}")

@app.get("/v1/models")
async def list_models_v1() -> Dict[str, Any]:
    """OpenAI-compatible models endpoint"""
    return await list_models()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "LiteLLM Proxy Server",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Development server
if __name__ == "__main__":
    # Check for required environment variables
    required_keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]
    available_keys = [key for key in required_keys if os.getenv(key)]
    
    if not available_keys:
        print("⚠️  Warning: No API keys found in environment")
        print("Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY")
    else:
        print(f"✅ Found API keys for: {', '.join(available_keys)}")
    
    print(f"🚀 Starting LiteLLM Proxy on port {config.port}")
    print(f"📊 Available models: {len(config.models)}")
    print(f"🔑 Master key: {config.master_key}")
    
    uvicorn.run(
        "litellm-proxy:app",
        host="0.0.0.0",
        port=config.port,
        log_level=config.log_level.lower(),
        reload=True
    )