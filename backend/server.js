const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')
const axios = require('axios')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/finance_tracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Initialize database tables
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        period VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('Database tables initialized')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

initDatabase()

// Routes

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

// Create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body
    const result = await pool.query(
      'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [description, amount, category, date]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { description, amount, category, date } = req.body
    const result = await pool.query(
      'UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING *',
      [description, amount, category, date, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({ error: 'Failed to update expense' })
  }
})

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

// Get all budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budgets ORDER BY category')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    res.status(500).json({ error: 'Failed to fetch budgets' })
  }
})

// Create budget
app.post('/api/budgets', async (req, res) => {
  try {
    const { category, amount, period } = req.body
    const result = await pool.query(
      'INSERT INTO budgets (category, amount, period) VALUES ($1, $2, $3) ON CONFLICT (category) DO UPDATE SET amount = $2, period = $3, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [category, amount, period]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating budget:', error)
    res.status(500).json({ error: 'Failed to create budget' })
  }
})

// Update budget
app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { category, amount, period } = req.body
    const result = await pool.query(
      'UPDATE budgets SET category = $1, amount = $2, period = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [category, amount, period, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating budget:', error)
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

// Delete budget
app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM budgets WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' })
    }
    res.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    res.status(500).json({ error: 'Failed to delete budget' })
  }
})

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const expensesResult = await pool.query('SELECT SUM(amount) as total FROM expenses')
    const budgetsResult = await pool.query('SELECT SUM(amount) as total FROM budgets')
    
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const monthExpensesResult = await pool.query(
      'SELECT SUM(amount) as total FROM expenses WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2',
      [currentMonth, currentYear]
    )

    const totalExpenses = parseFloat(expensesResult.rows[0].total || 0)
    const totalBudget = parseFloat(budgetsResult.rows[0].total || 0)
    const expensesThisMonth = parseFloat(monthExpensesResult.rows[0].total || 0)

    res.json({
      totalExpenses,
      totalBudget,
      expensesThisMonth,
      remainingBudget: totalBudget - expensesThisMonth
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// Proxy AI chat requests to Python service
app.post('/api/ai/chat', async (req, res) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001'
    console.log('Proxying AI request to:', aiServiceUrl)
    const response = await axios.post(`${aiServiceUrl}/chat`, req.body, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('Error proxying AI request:', error.message)
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service is not available. Please ensure the AI service is running on port 8001.',
        response: 'The AI service appears to be offline. Please check if the Python AI service is running.'
      })
    }
    res.status(500).json({ 
      error: 'Failed to process AI request',
      response: error.response?.data?.detail || error.message || 'Unknown error occurred'
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

