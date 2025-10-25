# 🚀 Quick Start Guide - Backend Setup

## Problem: "Tenant or user not found" Error?

This means your `.env` file is missing or has incorrect Supabase credentials.

---

## ⚡ Quick Fix (3 Steps)

### Step 1️⃣: Run Setup Wizard

```bash
npm run setup:env
```

This interactive wizard will:
- Ask for your Supabase credentials
- Create `.env` file automatically
- Generate JWT secret

### Step 2️⃣: Create Database Tables

```bash
npm run setup:marketplace
```

This will:
- Connect to your Supabase database
- Create all required tables
- Verify setup

### Step 3️⃣: Start Server

```bash
npm start
```

Expected output:
```
✅ Supabase client initialized
✅ PostgreSQL pool initialized
Server running on port 3000
```

---

## 📋 Where to Find Supabase Credentials

### Option A: Use Connection String (Easiest)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (left sidebar, bottom)
4. Click **Database**
5. Scroll to **Connection string**
6. Click **URI** tab
7. Copy the string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdef.supabase.co:5432/postgres
   ```
8. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual password!

When running `npm run setup:env`, paste this as your **DATABASE_URL**

### Option B: Use Individual Fields

**SUPABASE_URL:**
- Settings → API → Project URL
- Format: `https://abcdef.supabase.co`

**Database Password:**
- Settings → Database
- If you forgot it: Click **Reset database password**
- **SAVE IT SOMEWHERE SAFE!**

**SUPABASE_ANON_KEY (optional):**
- Settings → API → Project API keys
- Copy **anon public** key (starts with `eyJ...`)

---

## 🔍 Troubleshooting

### "Tenant or user not found"
❌ **Cause:** Wrong connection string or password
✅ **Fix:** Run `npm run setup:env` again with correct credentials

### "relation does not exist"
❌ **Cause:** Database tables not created
✅ **Fix:** Run `npm run setup:marketplace`

### "Connection timeout"
❌ **Cause:** Supabase project is paused or deleted
✅ **Fix:** Check your Supabase dashboard, unpause project

### "permission denied for table"
❌ **Cause:** Database user doesn't have permissions
✅ **Fix:** Run SQL in Supabase SQL Editor:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

---

## 🎯 Manual Setup (Alternative)

If you prefer to create `.env` manually:

### 1. Create `backend/.env` file

```bash
# Copy template
cp .env.template .env
```

### 2. Edit `.env` with your credentials

**Replace these values:**

```env
# Your Supabase connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Your Supabase URL
SUPABASE_URL=https://YOUR_PROJECT.supabase.co

# Your database password
SUPABASE_DB_PASSWORD=YOUR_PASSWORD

# Generate random JWT secret
JWT_SECRET=use_the_command_below_to_generate

# Server config
NODE_ENV=development
PORT=3000
```

### 3. Generate JWT Secret

Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste as `JWT_SECRET`

---

## ✅ Verify Setup

### Check .env file exists
```bash
ls -la .env
```

### Test database connection
```bash
npm run setup:marketplace
```

Should output:
```
✅ Database connection successful
✅ Database tables created successfully
```

### Start server
```bash
npm start
```

Should output:
```
✅ Supabase client initialized
✅ PostgreSQL pool initialized
Server running on port 3000
```

---

## 📚 Next Steps

Once backend is running:

1. **Test API:** http://localhost:3000
2. **Start Frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```
3. **Create Operator Account:**
   - Go to: http://localhost:5173
   - Click "Register"
   - Login with your account

4. **Tokenize Parking:**
   - Go to "Institutional Operator Dashboard"
   - Click "Tokenize New Asset"
   - Fill the form and submit

5. **Verify in Database:**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run:
     ```sql
     SELECT * FROM parking_assets ORDER BY created_at DESC;
     ```

---

## 🆘 Still Having Issues?

### Check Logs
```bash
npm start
# Watch for error messages
```

### Check Database Status
1. Go to Supabase Dashboard
2. Check if project is active (not paused)
3. Try SQL Editor:
   ```sql
   SELECT NOW();
   ```

### Ask for Help
If you're still stuck:
1. Check `database/SETUP_PARKING_MARKETPLACE.md`
2. Review `CHANGES.md`
3. Check GitHub issues

---

## 📁 File Structure

```
backend/
├── .env                  ← Your credentials (DO NOT COMMIT!)
├── .env.template        ← Template with instructions
├── server.js            ← Main server file
├── package.json         ← Scripts defined here
└── scripts/
    ├── setup-env.js     ← Interactive setup wizard
    └── setup-marketplace-db.js  ← Database setup
```

---

**Status:** Ready for development ✅
