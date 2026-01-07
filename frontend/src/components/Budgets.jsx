import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react'
import api from '../services/api'
import './Budgets.css'

const CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other'
]

function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    period: 'monthly'
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [budgetsRes, expensesRes] = await Promise.all([
        api.get('/budgets').catch(e => {
          console.error('Error fetching budgets:', e)
          return { data: [] }
        }),
        api.get('/expenses').catch(e => {
          console.error('Error fetching expenses:', e)
          return { data: [] }
        })
      ])
      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data : [])
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setBudgets([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const calculateSpent = (category) => {
    try {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      return expenses
        .filter(exp => {
          if (!exp || !exp.category || !exp.date) return false
          try {
            const expDate = new Date(exp.date)
            return exp.category === category &&
              expDate.getMonth() === currentMonth &&
              expDate.getFullYear() === currentYear
          } catch (e) {
            return false
          }
        })
        .reduce((sum, exp) => {
          const amount = parseFloat(exp.amount) || 0
          return sum + amount
        }, 0)
    } catch (error) {
      console.error('Error calculating spent:', error)
      return 0
    }
  }

  const getBudgetStatus = (budget) => {
    try {
      const spent = calculateSpent(budget.category)
      const budgetAmount = parseFloat(budget.amount) || 0
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      return {
        spent,
        remaining: budgetAmount - spent,
        percentage: Math.min(Math.max(percentage, 0), 100),
        isOverBudget: spent > budgetAmount
      }
    } catch (error) {
      console.error('Error getting budget status:', error)
      return {
        spent: 0,
        remaining: parseFloat(budget.amount) || 0,
        percentage: 0,
        isOverBudget: false
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, formData)
      } else {
        await api.post('/budgets', formData)
      }
      fetchData()
      setShowModal(false)
      setEditingBudget(null)
      setFormData({
        category: 'Food',
        amount: '',
        period: 'monthly'
      })
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Error saving budget. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return
    
    try {
      await api.delete(`/budgets/${id}`)
      fetchData()
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Error deleting budget. Please try again.')
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      category: budget.category || 'Food',
      amount: parseFloat(budget.amount || 0).toString(),
      period: budget.period || 'monthly'
    })
    setShowModal(true)
  }

  // All hooks must be called before any conditional returns
  useEffect(() => {
    fetchData()
  }, [])

  // Debug logging - must be before conditional return
  useEffect(() => {
    if (budgets.length > 0 && expenses.length > 0) {
      console.log('Budgets data:', budgets)
      console.log('Expenses count:', expenses.length)
      const testBudget = budgets[0]
      const status = getBudgetStatus(testBudget)
      console.log('Sample budget status:', {
        category: testBudget.category,
        budgetAmount: parseFloat(testBudget.amount),
        spent: status.spent,
        percentage: status.percentage,
        isOverBudget: status.isOverBudget
      })
    }
  }, [budgets, expenses])

  // Conditional return AFTER all hooks
  if (loading) {
    return (
      <div className="loading" style={{ color: '#666666', padding: '2rem', textAlign: 'center' }}>
        Loading budgets...
      </div>
    )
  }

  return (
    <div className="budgets">
      <div className="budgets-header">
        <h1>Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Budget
        </button>
      </div>

      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', padding: '2rem' }}>
              No budgets found. Create your first budget!
            </p>
          </div>
        ) : (
          budgets.map(budget => {
            const status = getBudgetStatus(budget)
            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <h3>{budget.category}</h3>
                  <div className="budget-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(budget)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDelete(budget.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="budget-amount">
                  <span className="budget-label">Budget:</span>
                  <span className="budget-value">${parseFloat(budget.amount || 0).toFixed(2)}</span>
                </div>
                <div className="budget-progress">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${status.isOverBudget ? 'over-budget' : ''}`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                  <div className="progress-info">
                    <span>Spent: ${status.spent.toFixed(2)}</span>
                    <span className={status.isOverBudget ? 'over-budget-text' : ''}>
                      {status.isOverBudget ? 'Over Budget!' : `Remaining: $${status.remaining.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                {status.isOverBudget && (
                  <div className="budget-warning">
                    <AlertCircle size={16} />
                    <span>You've exceeded your budget for this category</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false)
                setEditingBudget(null)
                setFormData({
                  category: 'Food',
                  amount: '',
                  period: 'monthly'
                })
              }}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={!!editingBudget}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  setEditingBudget(null)
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update' : 'Add'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets

