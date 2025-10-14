# 🚀 QUICK FIX - Internal Server Error

## ✅ Server is Running!
Your dev server is now running cleanly at: **http://localhost:3009**

## 🔧 The Issue
The "Internal Server Error" is happening because the **database columns don't exist yet**.

## ⚡ SOLUTION (2 minutes)

### Step 1: Run Database Migration

**Go to your Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this SQL:

```sql
-- Add expanded condition tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS condition_category TEXT,
ADD COLUMN IF NOT EXISTS condition_specific TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_condition_category ON users(condition_category);
CREATE INDEX IF NOT EXISTS idx_users_condition_specific ON users(condition_specific);
```

6. Click **Run** (or press Cmd+Enter)
7. You should see: "Success. No rows returned"

### Step 2: Verify It Worked

Run this query to verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'condition%'
ORDER BY column_name;
```

You should see 4 rows:
- `condition_category` (text)
- `condition_details` (text)
- `condition_provided_at` (timestamp with time zone)
- `condition_specific` (text)

### Step 3: Test It!

1. Go to http://localhost:3009
2. Sign up as a new user (or use an existing account)
3. Complete your first check-in
4. You should see the expanded categories modal with 8 options! 🎉

## 🎯 What You'll See After the Fix

**The Modal Flow:**
1. **Step 1**: Elli welcomes you with a personalized message
2. **Step 2**: "What brings you here today?" with 8 categories:
   - Chronic pain or illness
   - Fertility or pregnancy
   - Sleep issues
   - Energy or fatigue
   - Mental health
   - General wellness
   - Biohacking
   - Something else

3. **If you select "Chronic pain or illness"**: You'll see 7 specific conditions
4. **Validation**: Elli responds with a deeply personalized message using your name 2-3+ times

## ❓ Still Having Issues?

**Check the browser console (F12):**
- Look for specific error messages
- Share the error with me

**Check the server log:**
```bash
tail -f dev-server.log
```

**Verify the server is running:**
```bash
curl http://localhost:3009
```

## 📋 Summary

✅ Server is running cleanly  
✅ All code files are in place  
✅ Build compiles successfully  
⚠️ **Need to run database migration** ← Do this now!  

**After running the SQL migration, the Internal Server Error will be fixed!** 💙
