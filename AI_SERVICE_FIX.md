# AI Service Fix Guide

## Problem
The AI service was crashing on startup because:
1. OpenAI client was initialized without checking if API key exists
2. This caused immediate crash: `OpenAIError: The api_key client option must be set`

## Solution Applied

### 1. Fixed OpenAI Client Initialization
- Changed from immediate initialization to lazy initialization
- Only creates client if API key is available
- Service can now start without API key

### 2. Fixed Data Type Issues
- Added proper type conversion for amounts (string to numeric)
- Fixed pandas data type errors
- Added error handling for data analysis

### 3. Improved Error Handling
- Service provides fallback responses
- Shows financial summaries even without OpenAI
- Better error messages

## How to Start AI Service

### Option 1: Manual Start
```bash
cd ai-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Option 2: Use Startup Script
```bash
./start-ai-service.sh
```

### Option 3: Check if Running
```bash
curl http://localhost:8001/health
```

## Current Status

✅ **Service starts successfully**
✅ **Works without OpenAI API key** (shows financial summaries)
✅ **Handles errors gracefully**
✅ **Provides helpful fallback messages**

## To Enable Full AI Features

1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add to `ai-service/.env`:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```
3. Restart the service

## Troubleshooting

If service still doesn't start:
1. Check Python version: `python3 --version` (needs 3.11+)
2. Check dependencies: `pip3 install -r requirements.txt`
3. Check port: `lsof -ti:8001` (should be empty if port is free)
4. Check logs: `tail -f /tmp/ai-service.log`

