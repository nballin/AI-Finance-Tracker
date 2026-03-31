const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables are not set. Auth middleware will not work properly.')
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!supabase) {
      // If Supabase is not configured, allow requests but with a warning
      console.warn('Supabase not configured - allowing request without auth')
      req.user = { id: 'demo-user' } // Fallback for development
      return next()
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

module.exports = { verifyAuth }
