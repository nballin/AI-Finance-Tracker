import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Expenses from './components/Expenses'
import Budgets from './components/Budgets'
import AIChatbot from './components/AIChatbot'
import { Wallet, TrendingUp, DollarSign, MessageSquare } from 'lucide-react'
import './App.css'

function App() {
  // Add error boundary check
  if (typeof window === 'undefined') {
    return null
  }
  
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Wallet className="nav-icon" />
            <h1>AI Finance Tracker</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <TrendingUp size={20} />
              Dashboard
            </Link>
            <Link to="/expenses" className="nav-link">
              <DollarSign size={20} />
              Expenses
            </Link>
            <Link to="/budgets" className="nav-link">
              <Wallet size={20} />
              Budgets
            </Link>
            <Link to="/ai-chat" className="nav-link">
              <MessageSquare size={20} />
              AI Assistant
            </Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/ai-chat" element={<AIChatbot />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

