# AI Curator Settings

The AI Curator uses OpenAI's API to analyze your game library and provide personalized recommendations.

## Quick Start

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Navigate to Settings > AI Curator Settings
3. Enter your API key
4. Select a model (recommended: gpt-4o-mini for cost-effectiveness)
5. Save settings

See the [OpenAI Setup Guide](openai.md) for detailed instructions.

## Azure OpenAI Support

If you're using Azure OpenAI, you can configure a custom Base URL in the settings. Contact your Azure administrator for the endpoint URL.

## Features

The AI Curator provides:

- **Collection Suggestions**: Analyzes your library to suggest themed collections
- **Next Game Recommendations**: Personalized suggestions on what to play next
- **Cover Image Generation**: AI-generated cover art for collections using DALL-E

## Cost Considerations

Costs are estimated before each action. Typical costs:

- Collection suggestions: $0.001-0.01 per request
- Next game suggestion: $0.0005-0.005 per request
- Cover image generation: $0.04 per image

## Privacy & Security

- API keys are encrypted before storage using AES-256-GCM
- The app caches your library context in Redis for 24 hours to reduce API costs

## Recommended Models

### Text Models

- **gpt-5-mini**: Recommended, best balance of performance and cost
- gpt-4o-mini: Good fallback option
- gpt-4o: Higher quality, higher cost

### Image Models

- **dall-e-3**: Default and recommended for cover generation

## Troubleshooting

### "AI features are not enabled"

- Ensure you've configured your OpenAI API key in Settings
- Verify your API key is valid at [platform.openai.com](https://platform.openai.com)

### "Failed to generate suggestions"

- Check that your API key is correctly configured
- Ensure you have sufficient credits in your OpenAI account
- Verify the selected model is available for your account

### Image generation not working

- Ensure you have a valid OpenAI API key configured
- The default image model is `dall-e-3`
- Image generation requires a separate API key or the main API key if not separately configured
