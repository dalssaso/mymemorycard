# Ollama Setup Guide

Ollama lets you run large language models locally on your machine for free.

**Supported AI Curator Features:**
- ✅ Collection Suggestions
- ✅ Next Game Recommendations
- ❌ Cover Image Generation (requires OpenAI provider)

## Installation

### macOS
```bash
# Download from website
open https://ollama.ai/download/mac

# Or install with Homebrew
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
Download the installer from [Ollama for Windows](https://ollama.ai/download/windows)

## Pulling a Model

After installing Ollama, pull a model:

```bash
# Recommended: Fast, lightweight model (3GB)
ollama pull llama3.2:3b

# Alternative: Mistral 7B (4GB)
ollama pull mistral:7b

# More capable: Llama 3.1 8B (4.7GB)
ollama pull llama3.1:8b
```

## Starting Ollama

Ollama starts automatically after installation. If not running:

```bash
# Start Ollama server
ollama serve
```

The server runs on `http://localhost:11434` by default.

## Configuration in MyMemoryCard

1. Ensure Ollama is running (`ollama serve`)
2. Go to **Settings** in MyMemoryCard
3. Scroll to **AI Curator Settings**
4. Select **Ollama (Local)** as the provider
5. Set Base URL: `http://localhost:11434/v1`
6. API Key: Leave empty (not required for local)
7. Configure the model:
   - Recommended: `llama3.2:3b`
   - Alternative: `mistral:7b`, `llama3.1:8b`
8. Enable AI Curator features
9. Click **Save AI Settings**

## Docker Setup (Alternative)

If you're using MyMemoryCard with Docker:

```bash
# Allow Docker container to access host Ollama
# Use host.docker.internal instead of localhost

# In MyMemoryCard settings:
# Base URL: http://host.docker.internal:11434/v1
```

## Model Recommendations

Choose based on your hardware:

### 8GB RAM
- `llama3.2:3b`: Best choice, fast and capable
- `phi3:mini`: Tiny but capable (2GB)

### 16GB RAM
- `llama3.1:8b`: More capable, still fast
- `mistral:7b`: Good alternative

### 32GB+ RAM
- `llama3.1:70b`: Very capable (needs GPU)
- `mixtral:8x7b`: Excellent quality

## Hardware Requirements

Minimum:
- 8GB RAM
- 10GB free disk space

Recommended:
- 16GB+ RAM
- GPU (NVIDIA, AMD, or Apple Silicon)
- SSD for faster model loading

## Performance Tips

1. **Use GPU acceleration**:
   ```bash
   # Check GPU is being used
   ollama ps
   ```

2. **Keep models in memory**:
   ```bash
   # Load model into memory
   ollama run llama3.2:3b "test"
   ```

3. **Adjust context window** in advanced settings

## Troubleshooting

### Connection refused
- Ensure Ollama is running: `ollama ps`
- Check port 11434 is not blocked
- For Docker: Use `host.docker.internal` instead of `localhost`

### Model not found
- Pull the model first: `ollama pull llama3.2:3b`
- List available models: `ollama list`
- Use exact model name from list

### Out of memory
- Use a smaller model (e.g., `llama3.2:3b` instead of `llama3.1:8b`)
- Close other applications
- Restart Ollama

### Slow performance
- Install on SSD if possible
- Use GPU acceleration
- Choose smaller model
- Reduce max tokens in settings

## Resources

- [Official Website](https://ollama.ai/)
- [Documentation](https://github.com/ollama/ollama/blob/main/README.md)
- [Available Models](https://ollama.ai/library)
- [GitHub Repository](https://github.com/ollama/ollama)
- [Discord Community](https://discord.gg/ollama)
