# How to Add OpenAI API Key

## Current Status
✅ **The AI service is working!** It's showing financial summaries without an API key.

## To Enable Full AI Features

### Step 1: Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the API key (you'll only see it once!)

### Step 2: Add to Environment File
Create or edit `ai-service/.env` file:

```bash
cd ai-service
nano .env
# or
code .env
```

Add this line:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Also add:
```
DATABASE_URL=postgresql://localhost:5432/finance_tracker
BACKEND_URL=http://localhost:5001
```

### Step 3: Restart AI Service
```bash
# Stop current service
pkill -f "uvicorn.*8001"

# Start with new config
cd ai-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Test
Refresh your browser and try asking:
- "What are my total expenses?"
- "Give me spending insights"
- "Which category should I cut back on?"

## Without API Key (Current Setup)
The service still works and shows:
- ✅ Financial summaries
- ✅ Expense breakdowns by category
- ✅ Monthly spending trends
- ✅ Budget status

You just won't get AI-generated natural language responses.

## Cost Information
- OpenAI API charges per token used
- GPT-3.5-turbo is very affordable (~$0.002 per 1K tokens)
- Typical queries cost less than $0.01
- Set usage limits in your OpenAI account dashboard

