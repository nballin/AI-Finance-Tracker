import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Expenses from './components/Expenses'
import Budgets from './components/Budgets'
import AIChatbot from './components/AIChatbot'
import Login from './components/Login'
import Signup from './components/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import { Wallet, TrendingUp, DollarSign, MessageSquare, LogOut, User } from 'lucide-react'
import './App.css'

function AppContent() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

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
          {user && (
            <>
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
              <div className="nav-user">
                <div className="user-info">
                  <User size={16} />
                  <span>{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="nav-link logout-btn">
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <AIChatbot />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return <AppContent />
}

export default App

