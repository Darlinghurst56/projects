# LiteLLM Proxy Server Dockerfile
# Based on official LiteLLM image with custom configuration

FROM ghcr.io/berriai/litellm:main-latest

# Set working directory
WORKDIR /app

# Create directory for configuration
RUN mkdir -p /app/config

# Copy configuration files
COPY litellm-config.yaml /app/config/
COPY .env.example /app/config/

# Create logs directory
RUN mkdir -p /app/logs

# Set environment variables
ENV LITELLM_CONFIG_PATH=/app/config/litellm-config.yaml
ENV LITELLM_LOG_LEVEL=INFO
ENV LITELLM_PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Run LiteLLM
CMD ["litellm", "--config", "/app/config/litellm-config.yaml", "--port", "4000", "--num_workers", "1"]