import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import api from '../services/api'
import './Dashboard.css'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']

function Dashboard() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalBudget: 0,
    remainingBudget: 0,
    expensesThisMonth: 0
  })
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      let expenses = []
      let budgets = []
      let statsData = {}
      
      try {
        const [expensesRes, budgetsRes, statsRes] = await Promise.all([
          api.get('/expenses').catch(e => ({ data: [] })),
          api.get('/budgets').catch(e => ({ data: [] })),
          api.get('/stats').catch(e => ({ data: {} }))
        ])
        
        expenses = expensesRes?.data || []
        budgets = budgetsRes?.data || []
        statsData = statsRes?.data || {}
      } catch (apiError) {
        console.error('API Error:', apiError)
        // Continue with empty data
      }

      // Calculate category expenses
      const categoryMap = {}
      if (Array.isArray(expenses)) {
        expenses.forEach(expense => {
          if (expense && expense.category) {
            const amount = parseFloat(expense.amount) || 0
            categoryMap[expense.category] = (categoryMap[expense.category] || 0) + amount
          }
        })
      }
      setExpensesByCategory(Object.entries(categoryMap).map(([name, value]) => ({ name, value: Number(value) })))

      // Calculate monthly trend (last 6 months)
      const monthlyMap = {}
      if (Array.isArray(expenses)) {
        expenses.forEach(expense => {
          if (expense && expense.date) {
            try {
              const amount = parseFloat(expense.amount) || 0
              const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              monthlyMap[month] = (monthlyMap[month] || 0) + amount
            } catch (e) {
              console.error('Error processing expense date:', e)
            }
          }
        })
      }
      setMonthlyTrend(Object.entries(monthlyMap).slice(-6).map(([name, value]) => ({ name, value: Number(value) })))

      setStats({
        totalExpenses: parseFloat(statsData.totalExpenses) || 0,
        totalBudget: parseFloat(statsData.totalBudget) || 0,
        remainingBudget: parseFloat(statsData.remainingBudget) || 0,
        expensesThisMonth: parseFloat(statsData.expensesThisMonth) || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty data on error to prevent crash
      setStats({
        totalExpenses: 0,
        totalBudget: 0,
        remainingBudget: 0,
        expensesThisMonth: 0
      })
      setExpensesByCategory([])
      setMonthlyTrend([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading" style={{ color: '#666666', padding: '2rem', textAlign: 'center' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <DollarSign size={24} />
            <h3>Total Expenses</h3>
          </div>
          <div className="stat-value">${stats.totalExpenses.toFixed(2)}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <Wallet size={24} />
            <h3>Total Budget</h3>
          </div>
          <div className="stat-value">${stats.totalBudget.toFixed(2)}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <TrendingUp size={24} />
            <h3>This Month</h3>
          </div>
          <div className="stat-value">${stats.expensesThisMonth.toFixed(2)}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <TrendingDown size={24} />
            <h3>Remaining</h3>
          </div>
          <div className="stat-value">${stats.remainingBudget.toFixed(2)}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2>Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Recent Expenses</h2>
        <div className="recent-expenses">
          {expensesByCategory.slice(0, 5).map((cat, idx) => {
            // Calculate red intensity based on amount (higher = darker)
            const maxAmount = Math.max(...expensesByCategory.map(c => c.value), 1)
            const intensity = Math.min(cat.value / maxAmount, 1) // 0 to 1
            // Darker red for higher amounts: from #ff6b6b (light) to #8b0000 (dark)
            const redValue = Math.floor(139 + (255 - 139) * (1 - intensity)) // 139 to 255
            const greenBlueValue = Math.floor(0 + (107 - 0) * (1 - intensity)) // 0 to 107
            const redColor = `rgb(${redValue}, ${greenBlueValue}, ${greenBlueValue})`
            
            return (
              <div key={idx} className="expense-item">
                <span className="category-name">{cat.name}</span>
                <span 
                  className="category-amount" 
                  style={{ color: redColor }}
                >
                  ${cat.value.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

