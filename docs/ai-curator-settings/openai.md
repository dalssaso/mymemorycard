# OpenAI Setup Guide

OpenAI provides the official ChatGPT API with excellent quality and reliability.

**Note:** OpenAI is the only provider that supports AI-generated collection cover images using DALL-E models.

**Supported AI Curator Features:**
- ✅ Collection Suggestions
- ✅ Next Game Recommendations
- ✅ Cover Image Generation (DALL-E)

## Getting an API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key immediately (it won't be shown again)

## Configuration in MyMemoryCard

1. Go to **Settings** in MyMemoryCard
2. Scroll to **AI Curator Settings**
3. Select **OpenAI** as the provider
4. Paste your API key
5. Configure the model:
   - Recommended: `gpt-4.1-mini`
   - Alternative: `gpt-4o-mini`
6. Enable AI Curator features
7. Click **Save AI Settings**

## Pricing

Current pricing (as of January 2025):
- **gpt-4.1-mini**: $0.003/1K input tokens, $0.012/1K output tokens
- gpt-4o-mini: $0.00015/1K input tokens, $0.0006/1K output tokens
- dall-e-3: $0.040 per image (1024x1024)

View current pricing: [OpenAI Pricing](https://openai.com/api/pricing/)

## Advanced Options

### Custom Parameters
- **Temperature** (0-2): Controls randomness. Lower = more focused, Higher = more creative
- **Max Tokens**: Maximum response length (affects cost)

### Image Generation
- Uses the main API key by default
- Optional: Set separate image API key for better cost tracking
- Default model: `dall-e-3` (recommended)
- Alternative: `dall-e-2` (cheaper, lower quality)

## Monitoring Usage

- View your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Check recent AI activity in the AI Curator page
- Set up billing alerts in OpenAI dashboard

## Troubleshooting

### "Invalid API key" error
- Verify you copied the full key
- Check that the key hasn't been revoked
- Ensure your OpenAI account has billing set up

### Rate limit errors
- OpenAI has rate limits for new accounts
- Upgrade to paid tier for higher limits
- Wait a few seconds between requests

### High costs
- Use gpt-4.1-mini instead of larger models
- Reduce max tokens setting
- The app caches library data to minimize API calls

## Resources

- [Official API Documentation](https://platform.openai.com/docs)
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
