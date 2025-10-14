# 🧪 ELLI TESTING CHECKLIST

## ✅ **PRE-TEST SETUP**
- [x] OpenAI API key added to `.env.local`
- [ ] Database Migration 1 run (condition fields)
- [ ] Database Migration 2 run (elli_messages table)
- [x] Build successful
- [x] Dev server running at http://localhost:3009

---

## 🎯 **TEST 1: NEW USER JOURNEY**

### Step 1: Create New Account
1. Go to: `http://localhost:3009/auth/signup`
2. Sign up with a NEW email (e.g., `test-elli-1@test.com`)
3. ✅ **Expected:** Account created successfully

### Step 2: Complete First Check-In
1. Navigate to dashboard (should auto-redirect)
2. Click **"Daily Check-in"** button in Mood Tracker section
3. Fill in the sliders:
   - **Mood:** 4/10 (moderate)
   - **Sleep:** 5/10 (not great)
   - **Pain:** 8/10 (high - to test "brutal" language)
4. Optionally add mood chips (stressed, exhausted, in pain)
5. Click **"Save"** or **"Next"**

### Step 3: Elli Post-Check-In Modal Appears
✅ **Expected to see:**
- Purple gradient modal with 💙 blue heart
- "Hi [YourName], I'm Elli 💙" header
- **Typing animation** (3 bouncing purple dots for ~1.5 seconds)
- **Then typed message:** 
  > *"I can see you're dealing with pain at 8/10 today. That's brutal, and I'm sorry you're going through this.*
  > 
  > *The fact that you're here? That takes courage."*

- **Condition capture section:**
  - "Mind if I ask - what brings you here?"
  - 7 buttons: Chronic pain, Fibromyalgia, CFS/ME, Autoimmune, ADHD, Perimenopause, Other
  - Optional details text field
  - Skip button

### Step 4: Select Condition
1. Click **"Fibromyalgia"** button
2. (Optional) Add details: "diagnosed 2019, mostly joint pain"
3. ✅ **Expected:** Button turns purple with purple background

### Step 5: Continue to Dashboard
1. Click **"Add What You're Taking →"** button
2. ✅ **Expected:** Modal closes, proceeds to next onboarding step

---

## 🎯 **TEST 2: DASHBOARD ELLI CARD**

### Check Dashboard
1. Navigate to `/dash` (should already be there)
2. Look for **ElliCard** at the top of the page
   - Should be ABOVE the Mood Tracker section
   
✅ **Expected to see:**
- Card with **purple-to-blue gradient background** (`from-purple-50 to-blue-50`)
- Purple border (`border-purple-200`)
- **💙 emoji** + "Elli" header
- **X dismiss button** (top right)
- **Message text** (personalized based on Day 1 check-in)
  - Example: *"Hi, I'm watching your first few days. Pain at 8/10 today. That's brutal. You're building your record. See you tomorrow."*
- **Footer:** "Based on 1 day of tracking"

### Verify Message Quality (OpenAI)
📊 **If OpenAI is working correctly, the message should:**
- Reference your specific pain level (8/10)
- Use empathetic language ("brutal", "I'm sorry", etc.)
- Feel personalized, not templated
- Be 2-4 sentences, under 60 words

**🔍 Check browser console:**
- No errors related to OpenAI
- Look for successful API calls to `/api/elli/generate`

---

## 🎯 **TEST 3: MOOD TRACKER COMMENT**

### Check Mood Tracker Section
1. Scroll down to **"Mood Tracker"** section
2. Look below the Mood/Sleep/Pain sliders

✅ **Expected to see:**
- **ElliMoodComment** component
- Purple background box (`bg-purple-50`)
- **💙 emoji** on the left
- **Short contextual message:**
  - Example: *"Pain at 8/10 today. I'm watching for patterns."*
  - Or: *"Today's really hard. Pain at 8/10. Some days are just survive-the-day days. I'm here."*

### Verify Typing Animation
- If you JUST completed the check-in, should see:
  - Typing indicator (3 small bouncing dots) for ~1 second
  - Then TypeAnimation types out the message

---

## 🎯 **TEST 4: CONDITION SAVED IN DATABASE**

### Verify in Supabase
1. Open Supabase Dashboard → **Table Editor** → `profiles`
2. Find your profile row (search by email or user_id)
3. ✅ **Check these columns exist and have data:**
   - `condition_primary` = "Fibromyalgia"
   - `condition_details` = "diagnosed 2019, mostly joint pain"
   - `condition_provided_at` = timestamp (when you selected it)

---

## 🎯 **TEST 5: ELLI MESSAGES STORED**

### Verify in Supabase
1. Open Supabase Dashboard → **Table Editor** → `elli_messages`
2. ✅ **Should see at least 1 row:**
   - `message_type` = "dashboard" or "post_checkin"
   - `message_text` = the actual message text
   - `context` (JSONB) = contains checkIn data, daysOfTracking, etc.
   - `user_id` = your user ID
   - `dismissed` = false

---

## 🎯 **TEST 6: DAY 2 CHECK-IN**

### Complete Another Check-In
1. Click **"Daily Check-in"** button again
2. Enter different values:
   - Mood: 6/10
   - Sleep: 7/10
   - Pain: 5/10 (lower than yesterday)
3. Click **"Save"**

✅ **Expected:**
- **ElliCard updates** with new message
  - Example: *"Day 2. You came back. Pain dropped from 8/10 to 5/10. That's progress."*
- **ElliMoodComment updates** below sliders
  - Example: *"Pain dropped from 8/10 to 5/10. That's progress."*

---

## 🎯 **TEST 7: DAY 3 MILESTONE**

### Simulate Day 3
To test the milestone message without waiting 3 days:

1. Open Supabase → **Table Editor** → `daily_entries`
2. Add 2 more entries manually with different dates
   - OR complete 2 more check-ins with different dates

✅ **Expected on Day 3:**
- **ElliCard shows milestone message:**
  > *"Day 3. You came back again. Most people quit by now. You didn't. Pain's been around 6-7/10. I'm starting to see patterns forming. Give me a few more days."*

---

## 🎯 **TEST 8: MOBILE RESPONSIVE**

### Test on Mobile Width
1. Open browser DevTools (F12)
2. Click device toolbar (mobile view)
3. Set to iPhone SE (375px width)

✅ **Expected:**
- ElliCard fits screen, no horizontal scroll
- Typing animation works
- Text is readable
- Buttons are clickable
- All spacing looks good

---

## 🎯 **TEST 9: DISMISS ELLI CARD**

### Dismiss Functionality
1. Click **X button** on ElliCard (top right)

✅ **Expected:**
- Card immediately disappears
- Stays gone on page refresh
- In database: `elli_messages` row has `dismissed = true`

### Verify New Message Appears Later
1. Complete another check-in
2. ✅ **New ElliCard should appear** with latest message

---

## 🎯 **TEST 10: OPENAI INTEGRATION**

### Verify OpenAI is Being Used
**Check browser console (Network tab):**
1. Open DevTools → Network
2. Filter: `elli`
3. Complete a check-in
4. ✅ **Should see:**
   - POST request to `/api/elli/generate`
   - Response body includes `message` field
   - Status: 200 OK

**Check server logs:**
```bash
# Look for these in your terminal:
✅ "Generating Elli message with OpenAI"
✅ No "OpenAI not configured" messages
✅ No OpenAI API errors
```

### Test Fallback (Optional)
1. Temporarily remove OpenAI key from `.env.local`
2. Restart dev server
3. Complete check-in
4. ✅ **Should still work** - uses template fallbacks
5. Re-add key and restart

---

## 🐛 **TROUBLESHOOTING**

### Elli Not Showing on Dashboard
- [ ] Did you run BOTH database migrations?
- [ ] Check browser console for errors
- [ ] Check Network tab for failed API calls
- [ ] Verify `elli_messages` table exists in Supabase

### Typing Animation Not Working
- [ ] Check `react-type-animation` is installed: `npm list react-type-animation`
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Check for console errors

### OpenAI Errors
- [ ] Verify `OPENAI_API_KEY` is in `.env.local`
- [ ] Check key is valid (not expired)
- [ ] Check OpenAI account has credits
- [ ] Should fall back to templates if key fails

### Condition Not Saving
- [ ] Check `profiles` table has the 3 new columns
- [ ] Verify RLS policies allow updates
- [ ] Check browser console for save errors

---

## ✅ **SUCCESS CRITERIA**

Elli is working perfectly when:

- [x] Build succeeds with no errors
- [ ] ElliCard visible on dashboard with purple gradient
- [ ] Typing animation plays smoothly
- [ ] Post-check-in modal appears with Elli's personality
- [ ] Condition saves to database
- [ ] ElliMoodComment appears below mood sliders
- [ ] Messages are empathetic and personalized
- [ ] OpenAI integration working (check Network tab)
- [ ] Day 3 milestone message appears
- [ ] Mobile responsive (375px)
- [ ] No console errors
- [ ] Dismiss functionality works

---

## 📊 **WHAT TO LOOK FOR IN MESSAGES**

**Elli's Empathetic Voice:**
- ✅ Validates struggle: *"That's brutal"*, *"I'm sorry"*
- ✅ No fake positivity: Never says *"Great job!"* or *"You got this!"*
- ✅ Acknowledges effort: *"You came back. That's harder than it sounds."*
- ✅ Pattern insights: *"Pain drops on 7+ hour sleep nights"*
- ✅ Condition-aware: *"Fibro is invisible, but your pain isn't imaginary"*

**What Elli Should NEVER Say:**
- ❌ "Great job! You're doing amazing!"
- ❌ "Just stay positive!"
- ❌ "You should try..."
- ❌ Generic wellness platitudes

---

## 🎉 **READY TO SHIP?**

Once all tests pass:
- [ ] Add `OPENAI_API_KEY` to Vercel environment variables
- [ ] Run migrations in production Supabase
- [ ] Deploy to production
- [ ] Test on production URL
- [ ] Monitor logs for errors
- [ ] Celebrate! 🎊

---

**Now go test Elli! Visit http://localhost:3009 and start the journey.** 💙

