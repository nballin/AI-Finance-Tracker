import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import SimpleApp from './components/SimpleApp'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Try to render the app, fallback to simple app on error
try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Error rendering app:', error)
  root.render(
    <React.StrictMode>
      <SimpleApp />
    </React.StrictMode>
  )
}

