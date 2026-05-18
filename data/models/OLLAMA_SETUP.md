# How to Add a Model to Ollama

> ⚠️ **The cocoa fine-tune is NOT shipped as a GGUF.** The on-device + hub path for the cocoa fine-tune is `.litertlm` (see [`cocoa_v1_e2b.litertlm`](./cocoa_v1_e2b.litertlm)). llama.cpp's GGUF converter silently drops Gemma 4's Per-Layer Embeddings tables, which is why the GGUF path was abandoned ([DEVLOG 2026-05-16](../../DEVLOG.md)). The [`Modelfile`](./Modelfile) in this directory therefore references files that do not exist — keep it only as a template for when GGUF support upstream lands.
>
> **What you CAN do with Ollama today:** serve the upstream base model (`ollama pull gemma4:e2b`) as a Hub-mode connectivity test from the phone. You will *not* get cocoa-specific tuning — that requires the `.litertlm` on-device or via a hub-side LiteRT-LM server (out of scope here).

## Prerequisites
- Ollama installed: https://ollama.ai
- GGUF model file in this directory (currently unavailable for the cocoa fine-tune — see warning above)

## Steps to Create and Run a Model

### 1. Create a Modelfile
Create a file named `Modelfile` (no extension) in the same directory as your `.gguf` file:

```
FROM ./cocoa_v1_e2b.gguf

PARAMETER temperature 0.2
PARAMETER num_predict 400
PARAMETER num_ctx 2048
```

**Key Parameters:**
- `temperature`: 0.2 = deterministic responses (good for diagnostics)
- `num_predict`: 400 = max output tokens
- `num_ctx`: 2048 = context window size

### 2. Create the Model in Ollama
```bash
cd /path/to/your/models/directory
ollama create cocoa-v1 -f Modelfile
```

This registers the model with Ollama. Name (`cocoa-v1`) can be anything.

### 3. Start Ollama Server (Network Mode)
```bash
ollama serve --host 0.0.0.0:11434
```

This makes Ollama accessible from other devices on your network (required for iPhone app).

**Find your Mac's IP:**
```bash
ifconfig | grep "inet " | grep -v 127
```

Example output: `inet 192.168.1.100`

### 4. Configure the App
In PokouAI app:
- Go to **Settings → Hub**
- Set Hub URL to: `http://192.168.1.100:11434` (replace IP with yours)
- The model name should auto-populate if Ollama is running

### 5. Test It
Run a diagnosis from the app. The iPhone will send images to your Mac's Ollama server.

---

## Optional: Auto-start Ollama on Mac Boot

Create and load a LaunchAgent:

```bash
cat > ~/Library/LaunchAgents/com.ollama.serve.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.serve</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
        <string>--host</string>
        <string>0.0.0.0:11434</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.ollama.serve.plist
```

**To unload later:**
```bash
launchctl unload ~/Library/LaunchAgents/com.ollama.serve.plist
```

---

## Useful Ollama Commands

```bash
# List all models
ollama list

# Pull a model from registry
ollama pull llama2

# Run a model directly (for testing)
ollama run cocoa-v1

# Delete a model
ollama rm cocoa-v1

# Check model info
ollama show cocoa-v1
```

---

## Troubleshooting

**iPhone can't reach Mac:**
- Check Mac IP is correct: `ifconfig | grep "inet " | grep -v 127`
- Make sure firewall allows port 11434
- Both devices must be on same WiFi network

**Model loads but no responses:**
- Check Ollama logs: `tail -f ~/.ollama/logs/server.log`
- Verify model was created: `ollama list`

**Modelfile not found error:**
- Make sure you're in the correct directory
- Modelfile must be in same folder as the `.gguf` file
