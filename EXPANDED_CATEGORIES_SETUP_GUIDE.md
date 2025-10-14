# Expanded Categories Setup Guide

## 🚨 TROUBLESHOOTING: Internal Server Error

If you're seeing an "Internal Server Error" after implementing the expanded categories system, follow these steps:

### Step 1: Run Database Migration

The expanded categories system requires new columns in the `users` table. Run this SQL in your Supabase SQL Editor:

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

**Verify the migration worked:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'condition%'
ORDER BY column_name;
```

You should see:
- `condition_category` (text)
- `condition_details` (text)
- `condition_provided_at` (timestamp with time zone)
- `condition_specific` (text)

### Step 2: Check Server Logs

Look at your terminal/console for specific error messages. Common issues:

**Error: "column does not exist"**
- Solution: Run the database migration above

**Error: "Cannot find module"**
- Solution: Restart your dev server (`npm run dev`)

**Error: "saveExpandedUserCondition is not a function"**
- Solution: Check that `src/lib/db/userCondition.ts` has been updated

### Step 3: Verify File Structure

Ensure these files exist:
- ✅ `src/lib/constants/expanded-categories.ts`
- ✅ `src/components/onboarding/post-checkin-modal-expanded.tsx`
- ✅ `src/lib/db/userCondition.ts` (updated)

### Step 4: Test the Flow

1. Clear your browser cache and cookies
2. Sign up as a new user
3. Complete the first check-in
4. You should see the expanded categories modal

### Step 5: Common Issues & Solutions

**Issue: Modal doesn't appear**
- Check browser console for errors
- Verify the modal is being imported correctly in the parent component

**Issue: Categories don't show**
- Check that `BROAD_CATEGORIES` is imported correctly
- Verify the component state is initializing properly

**Issue: Validation messages don't use user's name**
- Check that `userName` prop is being passed to the modal
- Verify `getValidationMessage()` is replacing `{userName}` placeholders

**Issue: Database save fails**
- Check Supabase logs for RLS (Row Level Security) issues
- Verify the user is authenticated when saving

## 📋 Implementation Checklist

- [ ] Run database migration SQL
- [ ] Verify columns exist in `users` table
- [ ] Restart dev server
- [ ] Test with new user signup
- [ ] Verify all 8 broad categories appear
- [ ] Test "Chronic pain or illness" → shows 7 subcategories
- [ ] Test other categories → shows validation immediately
- [ ] Verify user's name appears 2-3+ times in messages
- [ ] Verify typing animation works
- [ ] Verify data saves to database correctly

## 🔍 Debugging Commands

**Check if columns exist:**
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE 'condition%';
```

**Check saved conditions:**
```sql
SELECT id, email, condition_category, condition_specific, condition_provided_at 
FROM users 
WHERE condition_category IS NOT NULL 
ORDER BY condition_provided_at DESC 
LIMIT 10;
```

**Test the validation message function:**
```typescript
import { getValidationMessage } from '@/lib/constants/expanded-categories';

const message = getValidationMessage('Chronic pain or illness', 'Fibromyalgia', 'Ben');
console.log(message);
// Should show personalized message with "Ben" appearing multiple times
```

## 🎯 Expected Behavior

**Step 1: Category Selection**
- User sees 8 broad categories
- "Chronic pain or illness" is at the top
- "Biohacking" is near the bottom
- "Something else" is at the bottom

**Step 2: Specific Selection (if chronic illness)**
- Shows 7 specific conditions
- "Go back" button works
- Selecting a condition triggers validation

**Step 3: Validation Message**
- Shows typing indicator for 1.5 seconds
- Message types out with TypeAnimation
- User's name appears 2-3+ times
- Message is empathetic and personalized
- Button text is contextual

**Step 4: Save & Continue**
- Data saves to `users` table
- Both `condition_category` and `condition_specific` are saved
- User continues to dashboard

## 📞 Still Having Issues?

If you're still seeing errors:

1. **Check the full error message** in your terminal
2. **Share the error** with the specific line number and file
3. **Check Supabase logs** for database-related errors
4. **Verify your environment** - Node version, Next.js version, etc.

## 🎉 Success Indicators

You'll know it's working when:
- ✅ No errors in console
- ✅ Modal shows all 8 categories
- ✅ Two-step flow works for chronic illness
- ✅ Validation messages use user's name
- ✅ Data saves successfully
- ✅ Build completes without errors

---

**Need Help?** Check the implementation files:
- `src/lib/constants/expanded-categories.ts` - All categories and messages
- `src/components/onboarding/post-checkin-modal-expanded.tsx` - Modal component
- `src/lib/db/userCondition.ts` - Database functions
