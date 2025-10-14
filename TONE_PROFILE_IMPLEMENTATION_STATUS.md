# 🎯 TONE PROFILE SYSTEM - IMPLEMENTATION STATUS

## ✅ COMPLETED (Phase 1: Core Infrastructure)

### 1. Database Migration
- ✅ Created `ADD_TONE_PROFILE_COLUMN.sql`
- ✅ Adds `tone_profile` column to `profiles` table
- ✅ Creates index for performance
- ✅ Migrates existing users based on `condition_category`
- ✅ Includes verification queries and rollback instructions

**Action Required**: Run this SQL in Supabase SQL Editor

### 2. Tone Profile System
- ✅ Created `src/lib/elli/toneProfiles.ts`
- ✅ Defined all 9 tone profiles with:
  - Empathy levels (1-10)
  - OpenAI system prompts
  - Fallback templates (welcome, postCheckin, milestone)
- ✅ Profiles: chronic_pain, biohacking, fertility, sleep, energy, mental_health, adhd, perimenopause, general_wellness
- ✅ Helper functions: `getToneProfile()`, `getToneProfileType()`

### 3. New Onboarding Components
- ✅ Created `src/components/onboarding/ElliIntroModal.tsx`
  - Generic welcome message (works for everyone)
  - First thing users see after signup
  - Typing animation with Elli avatar
  
- ✅ Created `src/components/onboarding/CheckInTransitionModal.tsx`
  - Shown between category validation and check-in
  - Tone-adapted transition messages
  - Prepares user for sliders

### 4. Database Integration
- ✅ Updated `src/lib/db/userCondition.ts`
  - Imports `getToneProfileType`
  - `saveExpandedUserCondition()` now saves `tone_profile`
  - Tone profile set automatically when category is selected

---

## 🚧 IN PROGRESS (Phase 2: Onboarding Flow Refactor)

### Next Steps:

#### 1. Update `post-checkin-modal-expanded.tsx`
**Current state**: This modal handles category selection and validation
**Needed changes**:
- Rename to `OnboardingOrchestrator.tsx` (manages entire flow)
- Add state management for new flow:
  ```typescript
  type OnboardingStep = 
    | 'intro'           // ElliIntroModal
    | 'category'        // Category selection
    | 'specific'        // Subcategory (if chronic pain)
    | 'validation'      // Elli validates category
    | 'transition'      // CheckInTransitionModal
    | 'checkin'         // EnhancedDayDrawerV2
    | 'response'        // Elli responds to check-in (tone-aware)
    | 'supplements'     // Add supplements
    | 'complete';       // Go to dashboard
  ```
- Orchestrate flow: intro → category → validation → transition → checkin → response → supplements → complete

#### 2. Update `EnhancedDayDrawerV2.tsx`
**Current state**: Handles check-in and shows post-checkin modal
**Needed changes**:
- Remove post-checkin modal trigger (orchestrator handles this now)
- Just collect check-in data and pass to orchestrator
- Orchestrator will show tone-aware response modal

#### 3. Create `PostCheckinResponseModal.tsx`
**New component needed**:
- Shows AFTER check-in sliders
- Uses tone profile to generate appropriate response
- References symptoms from check-in
- Tone-aware message (chronic pain vs biohacker vs fertility, etc.)

#### 4. Update Message Generation
**File**: `src/lib/elli/generateElliMessage.ts`
**Changes needed**:
- Fetch user's `tone_profile` from database
- Use `TONE_PROFILES[tone_profile].systemPrompt` for OpenAI
- Fall back to `TONE_PROFILES[tone_profile].fallbackTemplates` if OpenAI fails
- Apply to ALL message types (welcome, postCheckin, milestone, dashboard)

---

## 📋 TODO (Phase 3: Apply Tone Everywhere)

### Files to Update:

1. **`src/lib/elli/elliTemplates.ts`**
   - Update all template functions to accept `toneProfile` parameter
   - Use tone-specific language
   - Different messages for same data based on tone

2. **`src/app/actions/generate-elli-message.ts`**
   - Fetch user's tone_profile from database
   - Pass to message generation
   - Use tone-aware prompts

3. **`src/app/api/elli/generate/route.ts`**
   - Same updates as above
   - Ensure tone profile is used in API route

4. **Dashboard Messages**
   - Day 3, 7, 14, 30 milestones
   - Pattern discoveries
   - All future Elli messages

---

## 🎯 NEW ONBOARDING FLOW (Target)

```
1. Sign up
2. ElliIntroModal (generic welcome) ← NEW
3. Category selection
4. Subcategory (if chronic pain)
5. Category validation (tone set here)
6. CheckInTransitionModal ← NEW
7. Check-in sliders (EnhancedDayDrawerV2)
8. PostCheckinResponseModal (tone-aware) ← NEW
9. Add supplements
10. Dashboard
```

**OLD FLOW (WRONG)**:
```
Sign up → Check-in → Generic response → Category → Validation → Supplements
```

**NEW FLOW (CORRECT)**:
```
Sign up → Intro → Category → Validation → Transition → Check-in → Tone-aware response → Supplements
```

---

## 🧪 TESTING PLAN

### Test Each Tone Profile:

1. **Chronic Pain User**
   - Select "Chronic pain or illness" → "Fibromyalgia"
   - Check-in: Pain 8/10, Mood 4/10, Sleep 5/10
   - Expected: High empathy, "That's brutal", "I'm sorry", validation

2. **Biohacker**
   - Select "Biohacking"
   - Check-in: Pain 2/10, Mood 8/10, Sleep 7/10
   - Expected: Data-focused, "Baseline recorded", "Tracking interventions"

3. **Fertility Tracker**
   - Select "Fertility or pregnancy"
   - Check-in: Pain 3/10, Mood 7/10, Sleep 6/10
   - Expected: Warm, hopeful, "I'm tracking your cycle", "We're figuring this out"

4. **ADHD User**
   - Select "Chronic pain or illness" → "ADHD"
   - Check-in: Pain 2/10, Mood 6/10, Sleep 5/10
   - Expected: "You did it!", "Executive dysfunction is real", celebration

5. **Sleep Issues**
   - Select "Sleep issues"
   - Check-in: Pain 3/10, Mood 5/10, Sleep 3/10
   - Expected: "Poor sleep is exhausting", understanding, practical

### Verify:
- ✅ Category comes BEFORE check-in
- ✅ Tone profile saved to database
- ✅ Response message matches tone profile
- ✅ Same data produces different messages based on tone
- ✅ Flow feels logical and conversational

---

## 📝 IMPLEMENTATION NOTES

### Key Decisions Made:

1. **Tone Profile Storage**: Stored in `profiles` table, not `users`
2. **Fallback Strategy**: Each tone profile has template-based fallbacks
3. **Migration Strategy**: Existing users get tone profile based on current `condition_category`
4. **Flow Order**: Category MUST come before check-in (critical fix)

### Important Files:

- `ADD_TONE_PROFILE_COLUMN.sql` - Run this first!
- `src/lib/elli/toneProfiles.ts` - Core tone system
- `src/components/onboarding/ElliIntroModal.tsx` - First modal
- `src/components/onboarding/CheckInTransitionModal.tsx` - Transition modal
- `src/lib/db/userCondition.ts` - Saves tone profile

---

## 🚀 NEXT ACTIONS

1. **Run SQL migration** in Supabase
2. **Create OnboardingOrchestrator** to manage new flow
3. **Create PostCheckinResponseModal** for tone-aware responses
4. **Update message generation** to use tone profiles
5. **Test with all 9 tone profiles**
6. **Verify flow order** is correct

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Onboarding Flow Refactor 🚧  
**ETA**: ~2-3 hours for complete implementation and testing

