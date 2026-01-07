import { useState, useEffect } from 'react'
import api from '../services/api'

function DashboardSimple() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses')
      setExpenses(response.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ color: 'white', padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Found {expenses.length} expenses</p>
      <div style={{ marginTop: '2rem' }}>
        {expenses.slice(0, 5).map(exp => (
          <div key={exp.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <strong>{exp.description}</strong> - ${parseFloat(exp.amount || 0).toFixed(2)} - {exp.category}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardSimple

