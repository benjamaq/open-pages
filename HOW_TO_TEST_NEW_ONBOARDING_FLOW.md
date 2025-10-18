# How to Test the New Onboarding Flow

## 🚨 CRITICAL: Your Current Account is Stuck in the Old Flow

Looking at your terminal logs, your test account has:
- `first_checkin_completed: true` ✅ (completed with OLD flow)
- `first_supplement_added: false` ❌ (stuck on step 2)
- `tone_profile: 'chronic_pain'` ✅ (set during old flow)

**This means:** You already went through the check-in with the OLD flow (where check-in came before category selection), so you're now stuck in the supplement step of that old flow.

---

## ✅ SOLUTION: Reset Your Account OR Create Fresh Account

### **Option 1: Reset Your Current Account (Recommended for Testing)**

1. Go to Supabase SQL Editor
2. Run this SQL (replace `YOUR_EMAIL_HERE` with your test account email):

```sql
UPDATE profiles
SET 
  first_checkin_completed = false,
  first_supplement_added = false,
  onboarding_completed = false,
  onboarding_step = 0,
  tone_profile = NULL,
  condition_category = NULL,
  condition_specific = NULL,
  condition_provided_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);
```

3. Refresh your browser (hard refresh: Cmd+Shift+R)
4. You should now see the NEW orchestrated flow!

---

### **Option 2: Create a Completely Fresh Account**

1. Sign out
2. Sign up with a brand new email
3. Go through onboarding
4. You should see the NEW flow:
   - ✅ Elli intro FIRST
   - ✅ Category selection SECOND
   - ✅ Check-in sliders THIRD

---

## 📋 THE NEW FLOW (What You Should See)

1. **Elli Intro Modal** 💙
   - "Hi! I'm Elli. I'm here to help you figure out your health patterns..."
   - Button: "Continue →"

2. **Category Selection Modal** 🎯
   - "What brings you here?"
   - Options: Chronic pain, Biohacking, Fertility, Sleep, Energy, Mental health, ADHD, Perimenopause, General wellness
   - If you pick "Chronic pain" → Sub-options appear
   - Elli validates your choice with tone-specific message

3. **Check-In Sliders** 📊
   - Mood, Sleep, Pain sliders
   - Optional: Symptoms, pain locations, etc.
   - "Continue" button

4. **Post-Check-In Response** 💬
   - Elli responds with tone-aware message
   - References your scores (mood/sleep/pain)
   - Simple acknowledgment (NO symptom analysis yet)

5. **Add Supplement** 💊
   - Text input: "What are you taking?"
   - Placeholder: "e.g., Magnesium, Vitamin D, Ashwagandha..."
   - "Continue →" or "Skip for now"

6. **Post-Supplement Message** ✨
   - Tone-aware encouragement about tracking

7. **Profile Setup** 📸
   - Upload photo
   - Add mission/bio

8. **Dashboard** 🎉
   - Detailed symptom analysis appears here
   - Elli shows deeper intelligence

---

## 🧪 TESTING CHECKLIST

After resetting or creating fresh account:

- [ ] Elli intro appears FIRST
- [ ] Category selection appears SECOND (before check-in!)
- [ ] Check-in sliders appear THIRD
- [ ] Elli's response uses appropriate tone for your category
- [ ] Typing animation is fast (speed 30)
- [ ] Supplement input is a text field (not hardcoded "magnesium")
- [ ] Dashboard shows detailed symptom analysis

---

## 🐛 WHY YOU WERE STUCK

The logic is:
```typescript
if (!first_checkin_completed) {
  // Show orchestrated flow (category first)
  return <OnboardingOrchestrator />
} else if (!first_supplement_added) {
  // Show old supplement modal
  return <OldSupplementModal />
}
```

You had `first_checkin_completed: true` from the old flow, so the system skipped the orchestrator and went straight to the old supplement modal.

**The fix:** Reset your account so `first_checkin_completed` is `false` again, then the orchestrator will run!

---

## 📝 SQL FILE READY

I've created `RESET_USER_ONBOARDING.sql` in your project root.
Just replace `YOUR_EMAIL_HERE` with your email and run it in Supabase!






