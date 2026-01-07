const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/finance_tracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Sample expense data spanning 2+ months
const sampleExpenses = [
  // November 2024 expenses
  { description: 'Grocery shopping at Whole Foods', amount: 125.50, category: 'Food', date: '2024-11-01' },
  { description: 'Uber ride to airport', amount: 45.00, category: 'Transportation', date: '2024-11-02' },
  { description: 'Netflix subscription', amount: 15.99, category: 'Entertainment', date: '2024-11-03' },
  { description: 'Lunch with colleagues', amount: 28.75, category: 'Food', date: '2024-11-05' },
  { description: 'Gas station fill-up', amount: 52.30, category: 'Transportation', date: '2024-11-06' },
  { description: 'Amazon Prime purchase', amount: 89.99, category: 'Shopping', date: '2024-11-07' },
  { description: 'Electricity bill', amount: 85.50, category: 'Bills', date: '2024-11-08' },
  { description: 'Coffee shop', amount: 12.50, category: 'Food', date: '2024-11-10' },
  { description: 'Movie tickets', amount: 24.00, category: 'Entertainment', date: '2024-11-12' },
  { description: 'Gym membership', amount: 49.99, category: 'Healthcare', date: '2024-11-15' },
  { description: 'Restaurant dinner', amount: 67.80, category: 'Food', date: '2024-11-16' },
  { description: 'Parking fee', amount: 15.00, category: 'Transportation', date: '2024-11-18' },
  { description: 'Online course', amount: 199.00, category: 'Education', date: '2024-11-20' },
  { description: 'Phone bill', amount: 75.00, category: 'Bills', date: '2024-11-22' },
  { description: 'Weekend groceries', amount: 95.25, category: 'Food', date: '2024-11-23' },
  { description: 'Concert tickets', amount: 120.00, category: 'Entertainment', date: '2024-11-25' },
  { description: 'New running shoes', amount: 89.99, category: 'Shopping', date: '2024-11-26' },
  { description: 'Dentist appointment', amount: 150.00, category: 'Healthcare', date: '2024-11-28' },
  { description: 'Thanksgiving groceries', amount: 185.50, category: 'Food', date: '2024-11-29' },
  { description: 'Bus pass', amount: 65.00, category: 'Transportation', date: '2024-11-30' },
  
  // December 2024 expenses
  { description: 'Holiday shopping', amount: 250.00, category: 'Shopping', date: '2024-12-01' },
  { description: 'Coffee and pastries', amount: 18.75, category: 'Food', date: '2024-12-02' },
  { description: 'Uber ride', amount: 22.50, category: 'Transportation', date: '2024-12-03' },
  { description: 'Streaming service', amount: 9.99, category: 'Entertainment', date: '2024-12-05' },
  { description: 'Lunch meeting', amount: 35.20, category: 'Food', date: '2024-12-06' },
  { description: 'Internet bill', amount: 79.99, category: 'Bills', date: '2024-12-07' },
  { description: 'Gift wrapping supplies', amount: 45.00, category: 'Shopping', date: '2024-12-08' },
  { description: 'Dinner with family', amount: 125.00, category: 'Food', date: '2024-12-10' },
  { description: 'Taxi ride', amount: 28.00, category: 'Transportation', date: '2024-12-12' },
  { description: 'Gaming subscription', amount: 14.99, category: 'Entertainment', date: '2024-12-13' },
  { description: 'Vitamins and supplements', amount: 55.00, category: 'Healthcare', date: '2024-12-15' },
  { description: 'Holiday party groceries', amount: 145.75, category: 'Food', date: '2024-12-16' },
  { description: 'Parking meter', amount: 8.00, category: 'Transportation', date: '2024-12-18' },
  { description: 'Online book purchase', amount: 24.99, category: 'Education', date: '2024-12-20' },
  { description: 'Water bill', amount: 45.50, category: 'Bills', date: '2024-12-21' },
  { description: 'Christmas gifts', amount: 350.00, category: 'Shopping', date: '2024-12-22' },
  { description: 'Holiday dinner', amount: 180.00, category: 'Food', date: '2024-12-24' },
  { description: 'Movie streaming', amount: 19.99, category: 'Entertainment', date: '2024-12-25' },
  { description: 'Year-end gym assessment', amount: 75.00, category: 'Healthcare', date: '2024-12-27' },
  { description: 'New Year groceries', amount: 110.25, category: 'Food', date: '2024-12-29' },
  { description: 'Ride share', amount: 32.50, category: 'Transportation', date: '2024-12-30' },
  
  // January 2025 expenses (partial month to show current month)
  { description: 'New Year brunch', amount: 45.00, category: 'Food', date: '2025-01-01' },
  { description: 'Gym membership renewal', amount: 49.99, category: 'Healthcare', date: '2025-01-02' },
  { description: 'Public transit pass', amount: 65.00, category: 'Transportation', date: '2025-01-03' },
  { description: 'Weekly groceries', amount: 98.50, category: 'Food', date: '2025-01-05' },
  { description: 'Netflix subscription', amount: 15.99, category: 'Entertainment', date: '2025-01-06' },
  { description: 'Electricity bill', amount: 92.30, category: 'Bills', date: '2025-01-07' },
  { description: 'Coffee supplies', amount: 25.00, category: 'Food', date: '2025-01-08' },
  { description: 'Uber to work', amount: 18.75, category: 'Transportation', date: '2025-01-10' },
  { description: 'Online course materials', amount: 79.99, category: 'Education', date: '2025-01-12' },
  { description: 'Restaurant dinner', amount: 58.40, category: 'Food', date: '2025-01-13' },
  { description: 'Shopping for clothes', amount: 125.00, category: 'Shopping', date: '2025-01-15' },
  { description: 'Phone bill', amount: 75.00, category: 'Bills', date: '2025-01-16' },
  { description: 'Movie night', amount: 32.00, category: 'Entertainment', date: '2025-01-18' },
  { description: 'Gas fill-up', amount: 48.50, category: 'Transportation', date: '2025-01-19' },
  { description: 'Grocery shopping', amount: 112.75, category: 'Food', date: '2025-01-20' },
]

const sampleBudgets = [
  { category: 'Food', amount: 500.00, period: 'monthly' },
  { category: 'Transportation', amount: 200.00, period: 'monthly' },
  { category: 'Shopping', amount: 300.00, period: 'monthly' },
  { category: 'Bills', amount: 250.00, period: 'monthly' },
  { category: 'Entertainment', amount: 150.00, period: 'monthly' },
  { category: 'Healthcare', amount: 200.00, period: 'monthly' },
  { category: 'Education', amount: 100.00, period: 'monthly' },
]

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')
    
    // Clear existing data
    console.log('Clearing existing data...')
    await pool.query('DELETE FROM expenses')
    await pool.query('DELETE FROM budgets')
    console.log('✓ Existing data cleared')
    
    // Insert expenses
    console.log(`Inserting ${sampleExpenses.length} expenses...`)
    for (const expense of sampleExpenses) {
      await pool.query(
        'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4)',
        [expense.description, expense.amount, expense.category, expense.date]
      )
    }
    console.log('✓ Expenses inserted')
    
    // Insert budgets
    console.log(`Inserting ${sampleBudgets.length} budgets...`)
    for (const budget of sampleBudgets) {
      await pool.query(
        'INSERT INTO budgets (category, amount, period) VALUES ($1, $2, $3) ON CONFLICT (category) DO UPDATE SET amount = $2, period = $3',
        [budget.category, budget.amount, budget.period]
      )
    }
    console.log('✓ Budgets inserted')
    
    // Show summary
    const expenseCount = await pool.query('SELECT COUNT(*) FROM expenses')
    const budgetCount = await pool.query('SELECT COUNT(*) FROM budgets')
    const totalExpenses = await pool.query('SELECT SUM(amount) as total FROM expenses')
    
    console.log('\n=== Database Seeding Complete ===')
    console.log(`Total expenses: ${expenseCount.rows[0].count}`)
    console.log(`Total budgets: ${budgetCount.rows[0].count}`)
    console.log(`Total expense amount: $${parseFloat(totalExpenses.rows[0].total || 0).toFixed(2)}`)
    console.log('\nData spans from November 2024 to January 2025')
    console.log('You can now view the data in your application!')
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()

