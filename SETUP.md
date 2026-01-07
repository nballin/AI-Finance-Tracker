# Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+ (or Docker)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Step 1: Install Dependencies

```bash
npm run install:all
```

This will install:
- Root dependencies (concurrently)
- Frontend dependencies (React, Vite, etc.)
- Backend dependencies (Express, PostgreSQL, etc.)
- AI service dependencies (FastAPI, OpenAI, Pandas, etc.)

### Step 2: Set Up Environment Variables

#### Backend Environment (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://localhost:5432/finance_tracker
AI_SERVICE_URL=http://localhost:8001
NODE_ENV=development
```

#### AI Service Environment (`ai-service/.env`)
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://localhost:5432/finance_tracker
BACKEND_URL=http://localhost:5000
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Step 3: Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb finance_tracker

# Or using psql
psql -U postgres
CREATE DATABASE finance_tracker;
```

#### Option B: Docker PostgreSQL
```bash
docker run --name finance_tracker_db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=finance_tracker \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 4: Start the Application

#### Option A: Run All Services Together
```bash
npm run dev
```

This starts:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000
- AI Service on http://localhost:8001

#### Option B: Run Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
uvicorn main:app --reload --port 8001
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health
- **AI Service**: http://localhost:8001/health

## Docker Setup (Alternative)

If you prefer using Docker:

1. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - AI Service: http://localhost:8001

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` files
- Verify database `finance_tracker` exists

### OpenAI API Issues
- Verify OPENAI_API_KEY is set correctly
- Check your OpenAI account has credits
- Ensure API key has proper permissions

### Port Conflicts
- Change ports in `.env` files if needed
- Ensure ports 3000, 5000, and 8001 are available

### Python Dependencies
- Ensure Python 3.11+ is installed
- Use virtual environment: `python -m venv venv && source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

## Next Steps

1. Add your first expense
2. Create budgets for different categories
3. Explore the dashboard visualizations
4. Try the AI assistant with questions like:
   - "What are my total expenses this month?"
   - "Which category am I spending the most on?"
   - "Am I over budget?"

## Production Deployment

See the main README.md for deployment instructions to Heroku/Vercel.

