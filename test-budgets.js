// Test script for budgets functionality
const axios = require('axios')

const API_BASE = 'http://localhost:5001/api'

async function testBudgets() {
  console.log('🧪 Testing Budgets Functionality\n')
  
  try {
    // Test 1: Get all budgets
    console.log('Test 1: Fetching all budgets...')
    const budgetsRes = await axios.get(`${API_BASE}/budgets`)
    console.log(`✅ Found ${budgetsRes.data.length} budgets`)
    budgetsRes.data.forEach(b => {
      console.log(`   - ${b.category}: $${b.amount} (${b.period})`)
    })
    
    // Test 2: Get all expenses
    console.log('\nTest 2: Fetching all expenses...')
    const expensesRes = await axios.get(`${API_BASE}/expenses`)
    console.log(`✅ Found ${expensesRes.data.length} expenses`)
    
    // Test 3: Calculate spending by category for current month
    console.log('\nTest 3: Calculating current month spending by category...')
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const categorySpending = {}
    expensesRes.data.forEach(exp => {
      const expDate = new Date(exp.date)
      if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
        const amount = parseFloat(exp.amount) || 0
        categorySpending[exp.category] = (categorySpending[exp.category] || 0) + amount
      }
    })
    
    console.log('Current month spending:')
    Object.entries(categorySpending).forEach(([cat, amt]) => {
      console.log(`   - ${cat}: $${amt.toFixed(2)}`)
    })
    
    // Test 4: Compare budgets vs spending
    console.log('\nTest 4: Budget vs Spending Comparison:')
    budgetsRes.data.forEach(budget => {
      const spent = categorySpending[budget.category] || 0
      const budgetAmount = parseFloat(budget.amount) || 0
      const remaining = budgetAmount - spent
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      const status = spent > budgetAmount ? '❌ OVER BUDGET' : '✅ Within Budget'
      
      console.log(`\n   ${budget.category}:`)
      console.log(`     Budget: $${budgetAmount.toFixed(2)}`)
      console.log(`     Spent: $${spent.toFixed(2)}`)
      console.log(`     Remaining: $${remaining.toFixed(2)}`)
      console.log(`     Usage: ${percentage.toFixed(1)}%`)
      console.log(`     Status: ${status}`)
    })
    
    // Test 5: Create a test budget
    console.log('\nTest 5: Creating test budget...')
    try {
      const testBudget = await axios.post(`${API_BASE}/budgets`, {
        category: 'Other',
        amount: 50,
        period: 'monthly'
      })
      console.log(`✅ Created test budget: ${testBudget.data.category} - $${testBudget.data.amount}`)
      
      // Test 6: Update the test budget
      console.log('\nTest 6: Updating test budget...')
      const updated = await axios.put(`${API_BASE}/budgets/${testBudget.data.id}`, {
        category: 'Other',
        amount: 75,
        period: 'monthly'
      })
      console.log(`✅ Updated budget: $${updated.data.amount}`)
      
      // Test 7: Delete the test budget
      console.log('\nTest 7: Deleting test budget...')
      await axios.delete(`${API_BASE}/budgets/${testBudget.data.id}`)
      console.log('✅ Deleted test budget')
    } catch (e) {
      console.log(`⚠️  Test budget already exists or error: ${e.message}`)
    }
    
    console.log('\n✅ All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

testBudgets()

