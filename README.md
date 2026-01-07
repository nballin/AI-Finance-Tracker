# AI Finance Tracker

A full-stack AI-powered finance tracking application built with React, Node.js, PostgreSQL, and Python FastAPI. Track expenses, manage budgets, visualize spending patterns, and get personalized financial insights through natural language queries.

## Features

- 📊 **Expense Tracking**: Add, edit, and delete expenses with categories
- 💰 **Budget Management**: Set and track budgets by category
- 📈 **Visualizations**: Interactive charts showing spending trends and category breakdowns
- 🤖 **AI Assistant**: Natural language queries for financial insights and analysis
- 🎨 **Modern UI**: Beautiful, responsive interface built with React

## Tech Stack

### Frontend
- React 18
- Vite
- Recharts for data visualization
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- PostgreSQL database
- RESTful API

### AI Service
- Python FastAPI
- OpenAI GPT-3.5-turbo
- Pandas for data analysis

### Deployment
- Docker & Docker Compose
- Heroku/Vercel ready

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+ (or use Docker)
- OpenAI API key
- Docker and Docker Compose (optional, for containerized deployment)

## Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create `.env` files in `backend/` and `ai-service/` directories:
   
   `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://localhost:5432/finance_tracker
   AI_SERVICE_URL=http://localhost:8001
   NODE_ENV=development
   ```
   
   `ai-service/.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgresql://localhost:5432/finance_tracker
   BACKEND_URL=http://localhost:5000
   ```

4. **Set up PostgreSQL database**
   ```bash
   createdb finance_tracker
   ```

5. **Start the services**

   In separate terminals:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: AI Service
   cd ai-service
   uvicorn main:app --reload --port 8001

   # Terminal 3: Frontend
   cd frontend
   npm run dev
   ```

   Or use the root script:
   ```bash
   npm run dev
   ```

### Option 2: Docker Deployment

1. **Set up environment variables**
   - Copy `.env.example` files and fill in your values
   - Make sure `OPENAI_API_KEY` is set in your environment

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:8001

## Usage

1. **Add Expenses**: Navigate to the Expenses page and click "Add Expense"
2. **Set Budgets**: Go to Budgets page and create budgets for different categories
3. **View Dashboard**: See overview statistics and visualizations
4. **AI Assistant**: Ask questions like:
   - "What are my total expenses this month?"
   - "Which category am I spending the most on?"
   - "Am I over budget in any category?"
   - "Give me spending insights"

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Statistics
- `GET /api/stats` - Get financial statistics

### AI Chat
- `POST /api/ai/chat` - Chat with AI assistant

## Project Structure

```
AI-finance-tracker/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── backend/           # Node.js backend API
│   ├── server.js
│   └── package.json
├── ai-service/        # Python FastAPI AI service
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml # Docker configuration
└── README.md
```

## Deployment

### Heroku

1. Create Heroku apps for backend and frontend
2. Set environment variables in Heroku dashboard
3. Deploy using Heroku CLI or GitHub integration

### Vercel

1. Connect your repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Author

Built as part of a portfolio project demonstrating full-stack development skills with AI integration.

