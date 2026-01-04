# AI Curator Settings

This directory contains setup guides for configuring AI providers with MyMemoryCard's AI Curator feature.

## Supported Providers

- [OpenAI](./openai.md) - Official OpenAI API
- [OpenRouter](./openrouter.md) - Multi-model API with competitive pricing
- [Ollama](./ollama.md) - Run models locally
- [LM Studio](./lmstudio.md) - Local model inference with GUI

## Quick Start

1. Choose a provider based on your needs:
   - **OpenAI**: Best quality, easiest setup, cloud-based
   - **OpenRouter**: More model choices, competitive pricing, cloud-based
   - **Ollama**: Completely free, runs locally, requires decent hardware
   - **LM Studio**: Free, local, user-friendly GUI

2. Follow the provider-specific guide to:
   - Get your API key (if needed)
   - Set up the base URL (for local providers)
   - Configure the provider in Settings

3. Enable AI Curator in Settings and start using the features!

## Features

The AI Curator provides:

- **Collection Suggestions**: Analyzes your library to suggest themed collections
- **Next Game Recommendations**: Personalized suggestions on what to play next
- **Cover Image Generation**: AI-generated cover art for collections (OpenAI only)

## Cost Considerations

### Cloud Providers (OpenAI, OpenRouter)

- Costs are estimated before each action
- Typical costs:
  - Collection suggestions: $0.001-0.01 per request
  - Next game suggestion: $0.0005-0.005 per request
  - Cover image generation: $0.04 per image

### Local Providers (Ollama, LM Studio)

- Completely free
- Requires:
  - 8-16GB RAM minimum (depending on model)
  - GPU recommended for better performance
  - Storage space for models (2-7GB per model)

## Privacy & Security

- API keys are encrypted before storage using AES-256-GCM
- For local providers, all data stays on your machine
- The app caches your library context in Redis for 24 hours to reduce API costs

## Troubleshooting

### "AI features are not enabled"

- Ensure you've configured a provider in Settings
- Check that the "Enable AI Curator features" toggle is ON

### "Failed to generate suggestions"

- Verify your API key is correct
- For local providers, ensure the service is running
- Check that your base URL is accessible from the backend

### Image generation not working

- Image generation only works with OpenAI provider
- Ensure you have a valid API key configured
- The default model is `dall-e-3`

## Model Recommendations

### OpenAI

- **gpt-4.1-mini**: Recommended, best value ($0.003/1K input tokens)
- gpt-4o-mini: Fallback option if gpt-4.1-mini unavailable

### OpenRouter

- **mistralai/mistral-small-3.2**: Recommended ($0.10/M input tokens)
- google/gemini-flash-1.5: Fast and cheap alternative

### Ollama

- **llama3.2:3b**: Recommended, fast and lightweight (3GB)
- mistral:7b: Alternative with good performance (4GB)
- llama3.1:8b: Larger, more capable (4.7GB)

### LM Studio

- Any model compatible with LM Studio works
- Recommended: Llama 3.2 3B or Mistral 7B variants
