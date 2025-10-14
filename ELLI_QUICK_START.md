# 🚀 ELLI QUICK START GUIDE

## 1️⃣ Run Database Migrations (REQUIRED)

Open Supabase SQL Editor and run these two files in order:

```bash
# In Supabase Dashboard → SQL Editor → New Query
```

**Migration 1:** `database/add-condition-fields.sql`
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS condition_primary TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_condition_primary ON profiles(condition_primary);
```

**Migration 2:** `database/create-elli-messages-table.sql`  
(Copy entire file contents - includes table, indexes, and RLS policies)

---

## 2️⃣ Add Environment Variable (OPTIONAL)

In `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```

**Note:** Elli works perfectly WITHOUT this. Template fallbacks are warm and empathetic.

---

## 3️⃣ Test Elli Works

### Test 1: New User Journey
1. Create new account
2. Complete first check-in (mood, sleep, pain)
3. **Expect:** Post-check-in modal with Elli's typing animation
4. Select a condition (e.g., "Fibromyalgia")
5. **Expect:** Modal continues to dashboard

### Test 2: Dashboard
1. Navigate to `/dash`
2. **Expect:** ElliCard visible at top (purple gradient background, 💙 avatar)
3. **Expect:** ElliMoodComment below mood sliders

### Test 3: Multiple Days
1. Complete check-in for 3 days in a row
2. **Expect:** Day 3 milestone message appears in ElliCard
3. Complete 7 days
4. **Expect:** Day 7 milestone with pattern insights

---

## 🎯 Where Elli Appears

| Location | When | Component |
|----------|------|-----------|
| Post-Check-In Modal | After 1st check-in | `post-checkin-modal.tsx` |
| Dashboard Card | Always visible | `ElliCard.tsx` |
| Mood Tracker | After check-in | `ElliMoodComment.tsx` |
| Post-Supplement | After adding supplement | `PostSupplementModal.tsx` |

---

## 🐛 Quick Troubleshooting

**Elli not showing:**
- Did you run BOTH database migrations?
- Check browser console for errors
- Hard refresh (Cmd+Shift+R)

**Typing animation broken:**
- Check `react-type-animation` is installed: `npm list react-type-animation`
- Verify component imports correctly

**OpenAI errors (safe to ignore):**
- Elli falls back to templates automatically
- Add `OPENAI_API_KEY` to `.env.local` if you want AI-generated messages

---

## 📁 Key Files

```
Components:
  src/components/elli/ElliCard.tsx
  src/components/elli/ElliMoodComment.tsx
  src/components/elli/TypingIndicator.tsx
  src/components/elli/PostSupplementModal.tsx

Logic:
  src/lib/elli/generateElliMessage.ts
  src/lib/elli/elliPrompts.ts
  src/lib/elli/elliTemplates.ts
  src/lib/elli/elliTriggers.ts

Database:
  src/lib/db/elliMessages.ts
  src/lib/db/userCondition.ts

API:
  src/app/api/elli/generate/route.ts

Migrations:
  database/add-condition-fields.sql
  database/create-elli-messages-table.sql
```

---

## ✅ Checklist

Before deploying:

- [ ] Run both database migrations in Supabase
- [ ] Test new user sign-up → first check-in → Elli appears
- [ ] Test ElliCard appears on dashboard
- [ ] Test ElliMoodComment appears in Mood Tracker
- [ ] Test on mobile (375px width)
- [ ] Verify no console errors
- [ ] (Optional) Add OPENAI_API_KEY for AI messages

---

**That's it! Elli is ready to ship. 💙**

