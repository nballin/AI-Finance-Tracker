from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI
import pandas as pd
import httpx
from datetime import datetime

load_dotenv()

app = FastAPI(title="AI Finance Tracker Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI configuration - initialize only if API key is available
def get_openai_client():
    """Get OpenAI client, or None if API key is not set"""
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "your_openai_api_key_here":
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            print(f"Warning: Could not initialize OpenAI client: {e}")
            return None
    return None

client = get_openai_client()

# Database connection URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/finance_tracker")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5001")


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    response: str


async def fetch_finance_data():
    """Fetch expenses and budgets from the backend API"""
    try:
        async with httpx.AsyncClient() as client:
            expenses_response = await client.get(f"{BACKEND_URL}/api/expenses")
            budgets_response = await client.get(f"{BACKEND_URL}/api/budgets")
            stats_response = await client.get(f"{BACKEND_URL}/api/stats")
            
            expenses = expenses_response.json() if expenses_response.status_code == 200 else []
            budgets = budgets_response.json() if budgets_response.status_code == 200 else []
            stats = stats_response.json() if stats_response.status_code == 200 else {}
            
            return expenses, budgets, stats
    except Exception as e:
        print(f"Error fetching finance data: {e}")
        return [], [], {}


def analyze_finances(expenses, budgets, stats):
    """Analyze financial data using pandas"""
    if not expenses:
        return "No expense data available."
    
    try:
        df = pd.DataFrame(expenses)
        # Convert date column
        df['date'] = pd.to_datetime(df['date'])
        # Convert amount column - handle both string and numeric types
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        
        analysis = []
        
        # Total expenses
        total_expenses = df['amount'].sum()
        analysis.append(f"Total expenses: ${total_expenses:.2f}")
        
        # Expenses by category
        category_totals = df.groupby('category')['amount'].sum().sort_values(ascending=False)
        analysis.append(f"\nExpenses by category:")
        for category, amount in category_totals.items():
            percentage = (amount / total_expenses) * 100
            analysis.append(f"  - {category}: ${amount:.2f} ({percentage:.1f}%)")
        
        # Monthly trend
        df['month'] = df['date'].dt.to_period('M')
        monthly_totals = df.groupby('month')['amount'].sum()
        analysis.append(f"\nMonthly spending trend:")
        for month, amount in monthly_totals.items():
            analysis.append(f"  - {month}: ${amount:.2f}")
        
        # Budget analysis
        if budgets:
            analysis.append(f"\nBudget status:")
            budget_df = pd.DataFrame(budgets)
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            for _, budget in budget_df.iterrows():
                category_expenses = df[
                    (df['category'] == budget['category']) &
                    (df['date'].dt.month == current_month) &
                    (df['date'].dt.year == current_year)
                ]['amount'].sum()
                
                budget_amount = float(budget['amount']) if isinstance(budget['amount'], str) else budget['amount']
                remaining = budget_amount - category_expenses
                status = "OVER BUDGET" if category_expenses > budget_amount else "within budget"
                analysis.append(
                    f"  - {budget['category']}: ${category_expenses:.2f} / ${budget_amount:.2f} ({status})"
                )
        
        return "\n".join(analysis)
    except Exception as e:
        return f"Error analyzing finances: {str(e)}. Basic stats: {len(expenses)} expenses found."


def generate_ai_response(user_message: str, finance_analysis: str, conversation_history: List[dict]) -> str:
    """Generate AI response using OpenAI"""
    try:
        # Check if OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            return """I'm your AI finance assistant! To enable AI features, please add your OpenAI API key to the ai-service/.env file.
            
For now, here's what I can tell you about your finances:
""" + finance_analysis
        
        # Build context from conversation history
        messages = [
            {
                "role": "system",
                "content": """You are a helpful AI finance assistant. You help users track expenses, manage budgets, 
                and provide personalized financial insights. Be concise, friendly, and actionable in your responses.
                Use the provided financial data to answer questions accurately."""
            }
        ]
        
        # Add conversation history
        for msg in conversation_history[-5:]:  # Keep last 5 messages for context
            if isinstance(msg, dict) and msg.get("role") and msg.get("content"):
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current financial context
        if finance_analysis:
            messages.append({
                "role": "system",
                "content": f"Current financial data:\n{finance_analysis}"
            })
        
        # Add user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call OpenAI API
        if not client:
            # Fallback response when OpenAI is not configured
            return f"""I'm your AI finance assistant! Here's your financial summary:

{finance_analysis}

To enable full AI features, please add your OpenAI API key to the ai-service/.env file:
OPENAI_API_KEY=your_api_key_here

You can get an API key from https://platform.openai.com/api-keys"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"Error generating AI response: {e}")
        import traceback
        traceback.print_exc()
        # Return helpful error message with finance analysis
        return f"""I encountered an error processing your request: {str(e)}

However, here's your current financial summary:
{finance_analysis}

To fix AI features, please check:
1. OpenAI API key is set in ai-service/.env
2. You have credits in your OpenAI account
3. The API key has proper permissions"""


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with AI"""
    try:
        # Fetch current finance data
        expenses, budgets, stats = await fetch_finance_data()
        
        # Analyze finances
        finance_analysis = analyze_finances(expenses, budgets, stats)
        
        # Generate AI response
        ai_response = generate_ai_response(
            request.message,
            finance_analysis,
            request.conversation_history or []
        )
        
        return ChatResponse(response=ai_response)
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        # Return error message instead of raising exception
        try:
            expenses, budgets, stats = await fetch_finance_data()
            finance_analysis = analyze_finances(expenses, budgets, stats)
            error_message = f"I encountered an error: {str(e)}\n\nHere's your financial summary:\n{finance_analysis}"
            return ChatResponse(response=error_message)
        except:
            return ChatResponse(response=f"I encountered an error processing your request: {str(e)}. Please check the server logs.")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "ai-finance-tracker"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

