# Supabase Setup Guide

This guide will help you set up Supabase authentication for the AI Finance Tracker.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email
4. Create a new project

## Step 2: Get Your Supabase Credentials

After creating your project:

1. Go to **Settings** → **API** in your Supabase dashboard
2. You'll find:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Configure Environment Variables

### Frontend (`frontend/.env`)

Create a `.env` file in the `frontend` directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (`backend/.env`)

Update your existing `.env` file in the `backend` directory:

```env
PORT=5001
DATABASE_URL=postgresql://localhost:5432/finance_tracker
AI_SERVICE_URL=http://localhost:8001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important Notes:**
- Use the **anon key** for frontend (safe to expose)
- Use the **service_role key** for backend (keep secret!)
- Never commit `.env` files to git (they're already in `.gitignore`)

## Step 4: Install Dependencies

Run these commands to install Supabase client libraries:

```bash
cd frontend
npm install @supabase/supabase-js

cd ../backend
npm install @supabase/supabase-js
```

Or from the root directory:

```bash
npm run install:all
```

## Step 5: Update Database Schema

The backend will automatically add `user_id` columns to your existing tables when you start the server. If you have existing data, you may need to migrate it manually.

## Step 6: Start the Application

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5001
- AI Service on http://localhost:8001

## Step 7: Test Authentication

1. Open http://localhost:3000
2. You should see a login page
3. Click "Sign up" to create a new account
4. Check your email for verification (if email confirmation is enabled)
5. Sign in and start using the app!

## Features Enabled

✅ User registration and login
✅ Secure password authentication
✅ User-specific data isolation
✅ Protected API routes
✅ Automatic token refresh
✅ Session management

## Troubleshooting

### "Supabase environment variables are not set"
- Make sure you created `.env` files in both `frontend` and `backend` directories
- Check that variable names start with `VITE_` for frontend
- Restart your development servers after adding environment variables

### "Invalid or expired token"
- Make sure you're using the correct Supabase URL and keys
- Check that your Supabase project is active
- Try signing out and signing back in

### Database errors
- Make sure PostgreSQL is running
- Check that the database connection string is correct
- The backend will automatically migrate tables on startup

## Free Tier Limits

Supabase free tier includes:
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Up to 50,000 monthly active users
- ✅ Email authentication
- ✅ Social logins (Google, GitHub, etc.)

Perfect for personal projects and small applications!

## Next Steps

- Enable email verification in Supabase dashboard (Settings → Auth)
- Add social login providers (Settings → Auth → Providers)
- Set up Row Level Security (RLS) policies in Supabase dashboard for extra security
- Configure email templates (Settings → Auth → Email Templates)
