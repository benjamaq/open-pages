# 🧪 ELLI TESTING - DO THIS NOW

## ⚠️ CRITICAL: Run These 2 SQL Migrations First

### Migration 1: Condition Fields
Open **Supabase → SQL Editor** → Run this:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS condition_primary TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_condition_primary ON profiles(condition_primary);
```

### Migration 2: Elli Messages Table  
Run this in Supabase:

```sql
DROP POLICY IF EXISTS "Users can view their own Elli messages" ON elli_messages;
DROP POLICY IF EXISTS "Users can insert their own Elli messages" ON elli_messages;
DROP POLICY IF EXISTS "Users can update their own Elli messages" ON elli_messages;

CREATE TABLE IF NOT EXISTS elli_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS elli_messages_user_id_idx ON elli_messages(user_id);
CREATE INDEX IF NOT EXISTS elli_messages_created_at_idx ON elli_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS elli_messages_type_idx ON elli_messages(message_type);
CREATE INDEX IF NOT EXISTS elli_messages_dismissed_idx ON elli_messages(dismissed);

ALTER TABLE elli_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Elli messages"
  ON elli_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Elli messages"
  ON elli_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Elli messages"
  ON elli_messages FOR UPDATE USING (auth.uid() = user_id);
```

---

## 📝 Add Your OpenAI Key

Edit `.env.local` and replace `your-key-here` with your actual OpenAI API key:

```bash
OPENAI_API_KEY=sk-proj-...
```

---

## 🧪 Test Flow

1. **Clear your browser completely** (Cmd+Shift+Delete → Clear all)
2. Visit: `http://localhost:3009/auth/signup`
3. Create brand new account (e.g., `test-elli-final@test.com`)
4. Complete first check-in:
   - Mood: 4/10
   - Sleep: 5/10
   - Pain: 8/10
5. Click **"Save"** or **"Next"**

---

## ✅ What Should Happen

### In Terminal - You MUST See These Logs:
```
💙 Generating Elli message...
💙 Elli message generated successfully
```

If you DON'T see these logs, Elli is not running!

### On Screen - Post-Check-In Modal:
1. Modal with 💙 blue heart appears
2. Purple bouncing dots (typing animation)
3. Message appears: "I can see you're dealing with pain at 8/10 today. That's brutal..."
4. Condition buttons (Chronic pain, Fibromyalgia, etc.)
5. Select **Fibromyalgia**
6. Button turns purple
7. Click "Add What You're Taking →"

### In Supabase - Check Data Saved:
Open Supabase → Table Editor → `profiles`

Find your user row and verify:
- `condition_primary` = "Fibromyalgia" ✅ (should NOT be null!)
- `condition_provided_at` = timestamp ✅

Open Table Editor → `elli_messages`

Should see at least 1 row:
- `message_type` = "post_checkin" or "dashboard"
- `message_text` = actual message
- `user_id` = your user ID
- `dismissed` = false

### On Dashboard:
1. **ElliCard** appears at top (purple gradient, 💙 emoji)
2. Has personalized message
3. "Based on 1 day of tracking" footer
4. **ElliMoodComment** below mood sliders
5. Short contextual message like "Pain at 8/10 today..."

---

## 🐛 If It's NOT Working

### Problem: No "💙 Generating Elli message..." in terminal
**Solution:** Code isn't running. Check:
- Did you save all files?
- Did server restart after edits?
- Check browser console for errors

### Problem: condition_primary is null in database
**Solution:** Migration didn't run or condition save failed
- Run Migration 1 again in Supabase
- Check browser console for save errors
- Check network tab for failed API calls

### Problem: No rows in elli_messages table
**Solution:** Elli generation failed
- Check OpenAI key is correct in `.env.local`
- Check terminal for error logs
- Check if table exists (run Migration 2)

### Problem: ElliCard doesn't appear on dashboard
**Solution:** 
- Check elli_messages table has data
- Check browser console for errors
- Hard refresh (Cmd+Shift+R)

---

## 📊 Debug Checklist

- [ ] Ran Migration 1 (condition fields) in Supabase ✅
- [ ] Ran Migration 2 (elli_messages table) in Supabase ✅
- [ ] Added OPENAI_API_KEY to `.env.local` ✅
- [ ] Restarted dev server after adding key ✅
- [ ] Created brand NEW test account (fresh user) ✅
- [ ] Completed first check-in with pain >= 7 ✅
- [ ] See "💙 Generating Elli message..." in terminal ✅
- [ ] See condition_primary saved in database ✅
- [ ] See rows in elli_messages table ✅
- [ ] See ElliCard on dashboard ✅
- [ ] See ElliMoodComment below mood sliders ✅

---

**After running both migrations and adding your API key, try the test flow again!** 💙

