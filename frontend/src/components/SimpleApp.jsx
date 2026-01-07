// Simple fallback app if main app fails
import React from 'react'

export default function SimpleApp() {
  return (
    <div style={{ 
      padding: '2rem', 
      color: 'white', 
      textAlign: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <h1>AI Finance Tracker</h1>
      <p>React is working! If you see this, the app loaded successfully.</p>
      <p>If you're seeing a white screen, check the browser console (F12) for errors.</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '0.75rem 1.5rem',
          marginTop: '1rem',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Reload Page
      </button>
    </div>
  )
}

