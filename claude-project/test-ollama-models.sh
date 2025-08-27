#!/bin/bash

# List of installed models to test
MODELS=(
  "llama3.2:latest"
  "gemma:2b"
  "phi3:latest"
  "codellama:7b"
  "mistral:latest"
  "llama3:latest"
  "llama3.1:8b"
)

OLLAMA_HOST="${OLLAMA_HOST:-localhost:11434}"
RESULTS_FILE="ollama-model-test-results.log"
PROMPT="Say hello from MODEL_NAME!"

> "$RESULTS_FILE"
ALL_OK=0

for MODEL in "${MODELS[@]}"; do
  echo "Testing $MODEL..." | tee -a "$RESULTS_FILE"
  RESPONSE=$(curl -s -X POST http://$OLLAMA_HOST/api/generate \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"$MODEL\", \"prompt\": \"${PROMPT//MODEL_NAME/$MODEL}\", \"stream\": false}")
  if echo "$RESPONSE" | grep -q 'error'; then
    echo "❌ $MODEL: ERROR - $(echo $RESPONSE | jq -r .error)" | tee -a "$RESULTS_FILE"
    ALL_OK=1
  else
    SNIPPET=$(echo "$RESPONSE" | jq -r .response | head -c 80)
    echo "✅ $MODEL: $SNIPPET..." | tee -a "$RESULTS_FILE"
  fi
done

echo -e "\nTest complete. See $RESULTS_FILE for details."
exit $ALL_OK 