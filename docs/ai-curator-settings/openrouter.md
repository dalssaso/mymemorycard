# OpenRouter Setup Guide

OpenRouter provides access to multiple AI models through a single API with competitive pricing.

**IMPORTANT:**
- OpenRouter model names require a provider prefix (e.g., `openai/gpt-4.1-mini`, `anthropic/claude-3.5-sonnet`). See the [Models page](https://openrouter.ai/models) for the complete list.
- **Image generation is not supported** with OpenRouter. Only text-based features (collection suggestions and next game recommendations) are available. For AI-generated cover images, please use the OpenAI provider.

## Getting an API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Click "Sign In" and create an account
3. Go to [Keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy your API key

## Configuration in MyMemoryCard

1. Go to **Settings** in MyMemoryCard
2. Scroll to **AI Curator Settings**
3. Select **OpenRouter** as the provider
4. (Optional) Set Base URL: `https://openrouter.ai/api/v1` (default)
5. Paste your API key
6. Configure the model:
   - Recommended: `mistralai/mistral-small-3.2`
   - Budget: `google/gemini-flash-1.5`
   - Quality: `openai/gpt-4.1-mini`
7. Enable AI Curator features
8. Click **Save AI Settings**

## Pricing

OpenRouter pricing varies by model. Popular choices:
- **mistralai/mistral-small-3.2**: $0.10/M input tokens, $0.30/M output tokens
- google/gemini-flash-1.5: $0.075/M input tokens, $0.30/M output tokens
- openai/gpt-4.1-mini: $0.003/1K input tokens (same as OpenAI)

View all models and pricing: [OpenRouter Models](https://openrouter.ai/models)

## Features

- Access to 100+ models from different providers
- Automatic fallbacks if a model is unavailable
- Competitive pricing
- Credits system (can add funds to account)

**Supported AI Curator Features:**
- ✅ Collection Suggestions
- ✅ Next Game Recommendations
- ❌ Cover Image Generation (OpenAI only)

## Model Selection

Choose based on your needs:

### Quality-Focused
- `openai/gpt-4.1-mini`: Best overall quality
- `anthropic/claude-3.5-sonnet`: Excellent reasoning

### Budget-Friendly
- `google/gemini-flash-1.5`: Very cheap, good quality
- `meta-llama/llama-3.2-3b-instruct`: Ultra-cheap

### Balanced
- `mistralai/mistral-small-3.2`: Recommended, good value

## Monitoring Usage

- Check usage at [OpenRouter Activity](https://openrouter.ai/activity)
- View credits and add funds at [OpenRouter Credits](https://openrouter.ai/credits)
- Monitor costs in MyMemoryCard's AI Curator activity log

## Troubleshooting

### "Failed to generate suggestions"
- Verify API key is correct
- Ensure you have credits in your account
- Check model name is correct (case-sensitive)

### Model not available
- Try a different model
- Check [OpenRouter Status](https://status.openrouter.ai/)
- OpenRouter will automatically try fallback models if configured

## Resources

- [Official Documentation](https://openrouter.ai/docs)
- [Available Models](https://openrouter.ai/models)
- [API Reference](https://openrouter.ai/docs/api-reference)
- [Discord Community](https://discord.gg/openrouter)
