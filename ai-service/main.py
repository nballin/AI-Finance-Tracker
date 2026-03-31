"""
AI Finance Tracker — FastAPI microservice.

This service powers the chat assistant by:
  1. Pulling expenses, budgets, and stats from the Node backend over HTTP.
  2. Summarizing that data with pandas (totals, categories, monthly trends, budget vs actual).
  3. Optionally augmenting replies with OpenAI when OPENAI_API_KEY is configured.

Run with: python main.py (uvicorn on port 8001) or `uvicorn main:app --reload`.
Environment: load from `.env` via python-dotenv (see env.example in repo).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI
import pandas as pd
import httpx
from datetime import datetime

# Load variables from ai-service/.env (or process env) before reading OPENAI_API_KEY, etc.
load_dotenv()

# --- FastAPI app & CORS ----------------------------------------------------
# Browser clients on other origins need CORS; permissive settings suit local dev.
app = FastAPI(title="AI Finance Tracker Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production to your frontend origin(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenAI client (lazy-safe: None when key missing or invalid) ------------


def get_openai_client():
    """
    Construct an OpenAI SDK client if a real API key is present.

    Returns None when the key is unset, placeholder, or SDK init fails so callers
    can fall back to rule-based / summary-only responses without crashing.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "your_openai_api_key_here":
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            print(f"Warning: Could not initialize OpenAI client: {e}")
            return None
    return None


client = get_openai_client()

# --- External services (Node backend; Postgres URL reserved for future direct DB use) ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/finance_tracker")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5001")


# --- Request/response models for POST /chat ---------------------------------


class ChatRequest(BaseModel):
    """Inbound chat: user text plus optional prior turns for multi-turn context."""

    message: str
    conversation_history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    """Assistant reply as a single string (markdown/plain text from the model or fallback)."""

    response: str


async def fetch_finance_data():
    """
    Load expenses, budgets, and aggregate stats from the main backend REST API.

    Uses httpx async client for non-blocking I/O. Any failed request yields an empty
    list/dict for that resource so analysis can still proceed partially.
    """
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
    """
    Turn raw expense/budget rows into a human-readable summary string for the LLM or fallback.

    - Builds a DataFrame, normalizes date/amount types (API may send strings).
    - Computes total spend, per-category breakdown with % of total, monthly totals.
    - If budgets exist, compares current calendar month spend per category to budget caps.

    stats is accepted for API symmetry but not yet merged into the text (backend may evolve).
    """
    if not expenses:
        return "No expense data available."

    try:
        df = pd.DataFrame(expenses)
        # Parse ISO or similar date strings into datetime for grouping/resampling
        df["date"] = pd.to_datetime(df["date"])
        # Coerce bad/missing amounts to 0 so sum/groupby never propagates NaN silently
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

        analysis = []

        # --- Aggregate totals ---
        total_expenses = df["amount"].sum()
        analysis.append(f"Total expenses: ${total_expenses:.2f}")

        # --- Category mix (largest categories first) ---
        category_totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
        analysis.append(f"\nExpenses by category:")
        for category, amount in category_totals.items():
            percentage = (amount / total_expenses) * 100
            analysis.append(f"  - {category}: ${amount:.2f} ({percentage:.1f}%)")

        # --- Month-over-month totals (Period index for stable month labels) ---
        df["month"] = df["date"].dt.to_period("M")
        monthly_totals = df.groupby("month")["amount"].sum()
        analysis.append(f"\nMonthly spending trend:")
        for month, amount in monthly_totals.items():
            analysis.append(f"  - {month}: ${amount:.2f}")

        # --- Budget vs actual for the current month only ---
        if budgets:
            analysis.append(f"\nBudget status:")
            budget_df = pd.DataFrame(budgets)
            current_month = datetime.now().month
            current_year = datetime.now().year

            for _, budget in budget_df.iterrows():
                # Sum expenses in this category that fall in the current month/year
                category_expenses = df[
                    (df["category"] == budget["category"])
                    & (df["date"].dt.month == current_month)
                    & (df["date"].dt.year == current_year)
                ]["amount"].sum()

                budget_amount = float(budget["amount"]) if isinstance(budget["amount"], str) else budget["amount"]
                remaining = budget_amount - category_expenses
                status = "OVER BUDGET" if category_expenses > budget_amount else "within budget"
                analysis.append(
                    f"  - {budget['category']}: ${category_expenses:.2f} / ${budget_amount:.2f} ({status})"
                )

        return "\n".join(analysis)
    except Exception as e:
        return f"Error analyzing finances: {str(e)}. Basic stats: {len(expenses)} expenses found."


def generate_ai_response(user_message: str, finance_analysis: str, conversation_history: List[dict]) -> str:
    """
    Build chat messages and call OpenAI chat completions, or return a no-key / error fallback.

    Message order: system (persona) → last 5 history turns → system (injected finance snapshot) → user.
    Truncating history limits token use and keeps focus on recent context.
    """
    try:
        # Explicit placeholder check mirrors get_openai_client() so we message clearly in .env
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            return """I'm your AI finance assistant! To enable AI features, please add your OpenAI API key to the ai-service/.env file.
            
For now, here's what I can tell you about your finances:
""" + finance_analysis

        messages = [
            {
                "role": "system",
                "content": """You are a helpful AI finance assistant. You help users track expenses, manage budgets, 
                and provide personalized financial insights. Be concise, friendly, and actionable in your responses.
                Use the provided financial data to answer questions accurately.""",
            }
        ]

        # Replay recent turns only — balances context vs. model context window and cost
        for msg in conversation_history[-5:]:
            if isinstance(msg, dict) and msg.get("role") and msg.get("content"):
                messages.append(
                    {
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", ""),
                    }
                )

        # Second system message: fresh snapshot each request so answers reflect latest fetch
        if finance_analysis:
            messages.append({"role": "system", "content": f"Current financial data:\n{finance_analysis}"})

        messages.append({"role": "user", "content": user_message})

        if not client:
            # Client failed init earlier — still return analysis and setup instructions
            return f"""I'm your AI finance assistant! Here's your financial summary:

{finance_analysis}

To enable full AI features, please add your OpenAI API key to the ai-service/.env file:
OPENAI_API_KEY=your_api_key_here

You can get an API key from https://platform.openai.com/api-keys"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error generating AI response: {e}")
        import traceback

        traceback.print_exc()
        # Always surface the pandas summary so the UI stays useful on API errors
        return f"""I encountered an error processing your request: {str(e)}

However, here's your current financial summary:
{finance_analysis}

To fix AI features, please check:
1. OpenAI API key is set in ai-service/.env
2. You have credits in your OpenAI account
3. The API key has proper permissions"""


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main entry: refresh finance data, analyze, then produce assistant text (LLM or fallback).

    On unexpected errors, retries a minimal path (fetch + analyze) to return a useful message
    instead of a bare 500 when possible.
    """
    try:
        expenses, budgets, stats = await fetch_finance_data()
        finance_analysis = analyze_finances(expenses, budgets, stats)
        ai_response = generate_ai_response(
            request.message,
            finance_analysis,
            request.conversation_history or [],
        )
        return ChatResponse(response=ai_response)

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback

        traceback.print_exc()
        try:
            expenses, budgets, stats = await fetch_finance_data()
            finance_analysis = analyze_finances(expenses, budgets, stats)
            error_message = f"I encountered an error: {str(e)}\n\nHere's your financial summary:\n{finance_analysis}"
            return ChatResponse(response=error_message)
        except:
            return ChatResponse(
                response=f"I encountered an error processing your request: {str(e)}. Please check the server logs."
            )


@app.get("/health")
async def health():
    """Liveness/readiness probe for orchestrators and load balancers."""
    return {"status": "ok", "service": "ai-finance-tracker"}


if __name__ == "__main__":
    import uvicorn

    # Bind 0.0.0.0 so the service is reachable from other containers/machines on the LAN
    uvicorn.run(app, host="0.0.0.0", port=8001)
