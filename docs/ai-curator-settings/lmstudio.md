# LM Studio Setup Guide

LM Studio is a user-friendly desktop application for running large language models locally with a GUI interface.

**Supported AI Curator Features:**
- ✅ Collection Suggestions
- ✅ Next Game Recommendations
- ❌ Cover Image Generation (requires OpenAI provider)

## Installation

1. Visit [LM Studio website](https://lmstudio.ai/)
2. Download for your platform:
   - macOS (Apple Silicon or Intel)
   - Windows
   - Linux
3. Install the application
4. Launch LM Studio

## Downloading a Model

1. Open LM Studio
2. Click on the **Search** tab (magnifying glass icon)
3. Search for a model:
   - Recommended: "llama-3.2-3b"
   - Alternative: "mistral-7b"
4. Click **Download** on your chosen model
5. Wait for download to complete

## Starting the Local Server

1. In LM Studio, click the **Local Server** tab (plug icon)
2. Select your downloaded model from the dropdown
3. Click **Start Server**
4. Note the server address (usually `http://localhost:1234`)
5. Keep LM Studio running while using AI Curator

## Configuration in MyMemoryCard

1. Ensure LM Studio server is running
2. Go to **Settings** in MyMemoryCard
3. Scroll to **AI Curator Settings**
4. Select **LM Studio (Local)** as the provider
5. Set Base URL: `http://localhost:1234/v1`
6. API Key: Leave empty (not required for local)
7. Configure the model name (must match LM Studio):
   - Check the model name shown in LM Studio server tab
   - Example: `llama-3.2-3b-instruct`
8. Enable AI Curator features
9. Click **Save AI Settings**

## Model Recommendations

LM Studio supports any GGUF format models:

### For 8GB RAM
- **Llama 3.2 3B**: Best choice, fast and capable
- Phi-3 Mini: Very small, good for limited RAM

### For 16GB RAM
- **Llama 3.1 8B**: More capable, good balance
- Mistral 7B: Popular alternative

### For 32GB+ RAM
- Llama 3.1 70B: Very capable (needs GPU)
- Mixtral 8x7B: Excellent quality

## Features

- **GPU Acceleration**: Automatic CUDA/Metal support
- **Model Management**: Easy download and switching
- **Chat Interface**: Test models before using with API
- **Performance Monitoring**: See GPU/CPU usage in real-time

## Docker Setup

If using MyMemoryCard with Docker:

```bash
# Allow Docker container to access host LM Studio
# In MyMemoryCard settings:
# Base URL: http://host.docker.internal:1234/v1
```

## Performance Tips

1. **Enable GPU acceleration** in LM Studio settings
2. **Adjust context length** based on your RAM
3. **Use quantized models** (Q4, Q5) for better performance
4. **Keep model loaded** in LM Studio while using features

## Troubleshooting

### Connection refused
- Ensure LM Studio server is running
- Check the server tab shows "Server running on port 1234"
- Verify firewall isn't blocking port 1234
- For Docker: Use `host.docker.internal` instead of `localhost`

### Model not responding
- Check model is loaded in LM Studio
- Try stopping and restarting the server
- Ensure enough RAM is available
- Check LM Studio logs for errors

### Slow responses
- Use a smaller/faster model
- Enable GPU acceleration in LM Studio settings
- Reduce max tokens in MyMemoryCard settings
- Close other applications to free RAM

### Wrong model format
- LM Studio only supports GGUF format models
- Download models directly from LM Studio's search
- Or use Hugging Face models compatible with llama.cpp

## Advanced Configuration

### Custom Server Port
If port 1234 is in use:
1. Change port in LM Studio server settings
2. Update Base URL in MyMemoryCard to match

### Model Parameters
In LM Studio server tab, you can adjust:
- Temperature (0-2)
- Max tokens
- Context window
- GPU layers (for partial GPU offloading)

## Resources

- [Official Website](https://lmstudio.ai/)
- [Documentation](https://lmstudio.ai/docs)
- [Model Library](https://huggingface.co/models?library=gguf)
- [Discord Community](https://discord.gg/lmstudio)
- [Supported Models](https://lmstudio.ai/docs/basics/supported-models)
