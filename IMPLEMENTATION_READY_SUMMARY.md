# 🎯 TONE PROFILE SYSTEM - READY FOR IMPLEMENTATION

## ✅ COMPLETED SO FAR

### Phase 1: Core Infrastructure (100% DONE)

1. **Database Migration** ✅
   - File: `ADD_TONE_PROFILE_COLUMN.sql`
   - Adds `tone_profile` column to `profiles` table
   - **ACTION REQUIRED**: Run this SQL in Supabase

2. **Tone Profile System** ✅
   - File: `src/lib/elli/toneProfiles.ts`
   - All 9 tone profiles defined
   - System prompts for OpenAI
   - Fallback templates for each tone

3. **New Onboarding Components** ✅
   - `src/components/onboarding/ElliIntroModal.tsx` - Generic welcome
   - `src/components/onboarding/CheckInTransitionModal.tsx` - Transition to check-in

4. **Database Integration** ✅
   - `src/lib/db/userCondition.ts` - Saves tone_profile automatically

5. **Planning Documents** ✅
   - `TONE_PROFILE_IMPLEMENTATION_STATUS.md` - Overall status
   - `ONBOARDING_REFACTOR_PLAN.md` - Detailed implementation plan

---

## 🚧 NEXT STEPS (Phase 2)

### Critical Files to Create:

1. **`src/components/onboarding/OnboardingOrchestrator.tsx`**
   - Main orchestrator for new flow
   - Manages state across all steps
   - Coordinates: intro → category → transition → checkin → response

2. **`src/components/onboarding/PostCheckinResponseModal.tsx`**
   - Tone-aware response after check-in
   - Uses tone profile to generate appropriate message
   - References symptoms from check-in

### Files to Modify:

1. **`src/app/components/mood/EnhancedDayDrawerV2.tsx`**
   - Add `isOnboarding` prop
   - Add `onComplete` callback
   - Pass check-in data to orchestrator instead of showing modal

2. **Entry point** (where onboarding is triggered)
   - Replace direct `EnhancedDayDrawerV2` call with `OnboardingOrchestrator`
   - For first-time users only

---

## 🎯 THE BIG PICTURE

### What We're Fixing:

**BEFORE (WRONG)**:
```
User signs up → Check-in (sliders) → Generic pain message → Category selection
```
Problem: Elli doesn't know who she's talking to, so everyone gets pain-focused messages

**AFTER (CORRECT)**:
```
User signs up → Intro → Category → Validation → Transition → Check-in → Tone-aware response
```
Benefit: Elli knows the user's category BEFORE responding, enabling personalized messages

### Example: Same Check-In Data, Different Messages

**Check-in**: Pain 3/10, Mood 8/10, Sleep 7/10

**Chronic Pain User** (Empathy 10/10):
> "Ben, thank you for checking in. Pain at 3/10 today - that's a lighter day, and I'm glad. Your mood is 8/10 and sleep was 7/10. These better days matter. I'm watching what made today different."

**Biohacker** (Empathy 5/10):
> "Ben, baseline recorded. Readiness: 8/10. Energy 8/10, sleep 7/10. Solid starting point. Let's track interventions against outcomes."

**ADHD User** (Empathy 8/10):
> "Marcus, you did it! First check-in complete. That's huge with ADHD - executive dysfunction makes even small things hard. Mood 8/10, sleep 7/10. You showed up - that's what matters."

---

## 📋 WHAT YOU NEED TO DO

### 1. Run SQL Migration (CRITICAL)
```sql
-- Copy and run ADD_TONE_PROFILE_COLUMN.sql in Supabase SQL Editor
-- This adds the tone_profile column to profiles table
```

### 2. Test the Site
After I complete the implementation:
1. **Sign up as a new user**
2. **Verify new flow**:
   - See generic Elli intro
   - Select category (e.g., "Chronic pain or illness")
   - See validation message
   - See transition ("Now let me see where you're at")
   - Complete check-in
   - See tone-appropriate response
3. **Test multiple tone profiles**:
   - Chronic pain user
   - Biohacker
   - Fertility tracker
   - ADHD user

### 3. Verify Database
```sql
-- Check that tone_profile is being saved
SELECT user_id, condition_category, tone_profile
FROM profiles
WHERE tone_profile IS NOT NULL
LIMIT 10;
```

---

## 🚀 IMPLEMENTATION STATUS

- ✅ Phase 1: Core Infrastructure (COMPLETE)
- 🚧 Phase 2: Onboarding Flow Refactor (IN PROGRESS)
- ⏳ Phase 3: Apply Tone Everywhere (PENDING)

**Current Task**: Creating `OnboardingOrchestrator.tsx` and `PostCheckinResponseModal.tsx`

**ETA**: 1-2 hours for complete implementation and testing

---

## 💡 KEY INSIGHTS

1. **Tone is set ONCE** during onboarding and persists forever
2. **Category MUST come before check-in** (critical fix)
3. **Same data, different messages** based on tone profile
4. **9 distinct personalities** for Elli (chronic_pain, biohacking, fertility, sleep, energy, mental_health, adhd, perimenopause, general_wellness)
5. **Fallback templates** ensure messages work even if OpenAI fails

---

## 📞 READY FOR YOUR REVIEW

I've completed Phase 1 (core infrastructure). Before I proceed with Phase 2 (onboarding refactor), please:

1. **Review the approach** - Does this match your vision?
2. **Run the SQL migration** - Add the `tone_profile` column
3. **Confirm to proceed** - I'll create the orchestrator and complete the flow

**This is a significant refactor that will transform how Elli communicates with users. Once complete, every user will get personalized, tone-appropriate messaging throughout their entire journey with BioStackr.**

Ready to proceed? 🚀

