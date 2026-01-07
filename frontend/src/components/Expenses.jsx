import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import api from '../services/api'
import './Expenses.css'

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

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [sortBy, setSortBy] = useState('date-desc') // Default: latest to recent
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/expenses')
      setExpenses(response.data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData)
      } else {
        await api.post('/expenses', formData)
      }
      fetchExpenses()
      setShowModal(false)
      setEditingExpense(null)
      setFormData({
        description: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Error saving expense. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await api.delete(`/expenses/${id}`)
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense. Please try again.')
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.split('T')[0]
    })
    setShowModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSortedExpenses = () => {
    const sorted = [...expenses]
    
    switch (sortBy) {
      case 'amount-asc':
        // Cheapest to most expensive
        return sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
      case 'amount-desc':
        // Most expensive to cheapest
        return sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      case 'date-asc':
        // Oldest to newest (recent to latest)
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date))
      case 'date-desc':
        // Newest to oldest (latest to recent)
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
      default:
        return sorted
    }
  }

  const sortedExpenses = getSortedExpenses()

  return (
    <div className="expenses">
      <div className="expenses-header">
        <h1>Expenses</h1>
        <div className="header-actions">
          <div className="sort-filter">
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date-desc">Latest to Recent</option>
              <option value="date-asc">Recent to Latest</option>
              <option value="amount-desc">Most Expensive First</option>
              <option value="amount-asc">Cheapest First</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No expenses found. Add your first expense!
                  </td>
                </tr>
              ) : (
                sortedExpenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td>{expense.description}</td>
                    <td>
                      <span className="category-badge">{expense.category}</span>
                    </td>
                    <td className="amount">${parseFloat(expense.amount || 0).toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(expense)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(expense.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false)
                setEditingExpense(null)
                setFormData({
                  description: '',
                  amount: '',
                  category: 'Food',
                  date: new Date().toISOString().split('T')[0]
                })
              }}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
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
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  setEditingExpense(null)
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses

