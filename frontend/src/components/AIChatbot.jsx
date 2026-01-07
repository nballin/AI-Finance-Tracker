import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import api from '../services/api'
import './AIChatbot.css'

function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI finance assistant. I can help you track expenses, analyze spending patterns, answer questions about your finances, and provide personalized insights. How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return

    const userMessage = { role: 'user', content: messageText }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const response = await api.post('/ai/chat', {
        message: messageText,
        conversation_history: updatedMessages
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }])
    } catch (error) {
      console.error('Error chatting with AI:', error)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error.response) {
        // Server responded with error
        if (error.response.data?.response) {
          errorMessage = error.response.data.response
        } else if (error.response.data?.error) {
          errorMessage = `Error: ${error.response.data.error}`
        } else if (error.response.status === 503) {
          errorMessage = 'AI service is not available. Please ensure the AI service is running.'
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to AI service. Please check if the service is running.'
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const messageToSend = input.trim()
    if (!messageToSend || loading) return
    
    setInput('')
    await sendMessage(messageToSend)
  }

  const handleQuickQuestion = async (question) => {
    await sendMessage(question)
  }

  return (
    <div className="ai-chatbot">
      <div className="chat-header">
        <h1>AI Finance Assistant</h1>
        <p>Ask me anything about your finances, expenses, or budgets!</p>
      </div>

      <div className="quick-questions">
        <h3>Quick Questions:</h3>
        <div className="quick-buttons">
          <button
            className="quick-btn"
            onClick={() => handleQuickQuestion('What are my total expenses this month?')}
          >
            Total expenses this month?
          </button>
          <button
            className="quick-btn"
            onClick={() => handleQuickQuestion('Which category am I spending the most on?')}
          >
            Top spending category?
          </button>
          <button
            className="quick-btn"
            onClick={() => handleQuickQuestion('Am I over budget in any category?')}
          >
            Over budget check?
          </button>
          <button
            className="quick-btn"
            onClick={() => handleQuickQuestion('Give me spending insights')}
          >
            Spending insights
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-icon">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your finances..."
            className="chat-input"
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AIChatbot

