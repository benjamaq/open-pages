# 🔄 ONBOARDING FLOW REFACTOR - DETAILED PLAN

## 🎯 OBJECTIVE

**Reverse the onboarding flow order** so category selection comes BEFORE check-in, enabling tone-aware messaging throughout the user journey.

---

## 📊 CURRENT FLOW (WRONG)

```
1. Sign up
2. EnhancedDayDrawerV2 opens (check-in sliders)
3. User completes check-in (mood, sleep, pain, symptoms)
4. PostCheckinModal shows (generic pain-focused message)
5. Category selection
6. Category validation
7. Supplements
8. Dashboard
```

**Problem**: Elli responds to check-in BEFORE knowing the user's category, resulting in generic pain-focused messages for everyone (including biohackers, fertility trackers, etc.)

---

## 🎯 NEW FLOW (CORRECT)

```
1. Sign up
2. ElliIntroModal (generic welcome) ← NEW
3. Category selection
4. Subcategory (if chronic pain)
5. Category validation (tone profile SET here)
6. CheckInTransitionModal ← NEW
7. EnhancedDayDrawerV2 (check-in sliders)
8. PostCheckinResponseModal (tone-aware) ← NEW
9. Supplements
10. Dashboard
```

**Benefit**: Elli knows the user's category BEFORE responding to check-in, enabling personalized, tone-appropriate messages.

---

## 🏗️ IMPLEMENTATION STRATEGY

### Option A: Create New Orchestrator (RECOMMENDED)
**Pros**:
- Clean separation of concerns
- Easier to test and debug
- Doesn't break existing functionality
- Can gradually migrate

**Cons**:
- More files to manage
- Need to update entry point

### Option B: Modify Existing Components
**Pros**:
- Fewer new files
- Reuses existing code

**Cons**:
- High risk of breaking existing functionality
- Complex state management
- Harder to test

**Decision**: Go with Option A - Create new orchestrator

---

## 📁 FILE STRUCTURE

### New Files to Create:

```
src/components/onboarding/
├── OnboardingOrchestrator.tsx          ← NEW (main orchestrator)
├── ElliIntroModal.tsx                  ← DONE ✅
├── CheckInTransitionModal.tsx          ← DONE ✅
├── PostCheckinResponseModal.tsx        ← NEW (tone-aware response)
└── post-checkin-modal-expanded.tsx     ← KEEP (for category selection)
```

### Files to Modify:

```
src/app/components/mood/
└── EnhancedDayDrawerV2.tsx             ← MODIFY (remove post-checkin trigger)

src/lib/elli/
├── generateElliMessage.ts              ← MODIFY (add tone awareness)
└── elliTemplates.ts                    ← MODIFY (add tone-specific templates)
```

---

## 🔧 DETAILED IMPLEMENTATION

### 1. Create `OnboardingOrchestrator.tsx`

```typescript
'use client';

import { useState } from 'react';
import ElliIntroModal from './ElliIntroModal';
import PostCheckinModal from './post-checkin-modal-expanded'; // Category selection
import CheckInTransitionModal from './CheckInTransitionModal';
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2';
import PostCheckinResponseModal from './PostCheckinResponseModal';

type OnboardingStep = 
  | 'intro'           // ElliIntroModal
  | 'category'        // Category selection
  | 'transition'      // CheckInTransitionModal
  | 'checkin'         // EnhancedDayDrawerV2
  | 'response'        // PostCheckinResponseModal
  | 'complete';       // Done

interface OnboardingOrchestratorProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
  userName: string;
}

export default function OnboardingOrchestrator({
  isOpen,
  onComplete,
  userId,
  userName
}: OnboardingOrchestratorProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecific, setSelectedSpecific] = useState<string | null>(null);
  const [checkInData, setCheckInData] = useState<any>(null);

  // Step 1: Intro → Category
  const handleIntroComplete = () => {
    setCurrentStep('category');
  };

  // Step 2: Category → Transition
  const handleCategoryComplete = (category: string, specific: string | null) => {
    setSelectedCategory(category);
    setSelectedSpecific(specific);
    // Tone profile is saved in post-checkin-modal-expanded
    setCurrentStep('transition');
  };

  // Step 3: Transition → Check-in
  const handleTransitionComplete = () => {
    setCurrentStep('checkin');
  };

  // Step 4: Check-in → Response
  const handleCheckinComplete = (data: any) => {
    setCheckInData(data);
    setCurrentStep('response');
  };

  // Step 5: Response → Complete (supplements handled in PostCheckinResponseModal)
  const handleResponseComplete = () => {
    setCurrentStep('complete');
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Step 1: Elli Intro */}
      <ElliIntroModal
        isOpen={currentStep === 'intro'}
        onContinue={handleIntroComplete}
        userName={userName}
      />

      {/* Step 2: Category Selection */}
      <PostCheckinModal
        isOpen={currentStep === 'category'}
        onClose={() => {}} // Can't close during onboarding
        onContinue={handleCategoryComplete}
        userId={userId}
        userName={userName}
        // Don't need dayOneData yet - we haven't done check-in
      />

      {/* Step 3: Transition */}
      <CheckInTransitionModal
        isOpen={currentStep === 'transition'}
        onContinue={handleTransitionComplete}
        userName={userName}
        category={selectedCategory}
      />

      {/* Step 4: Check-in */}
      <EnhancedDayDrawerV2
        isOpen={currentStep === 'checkin'}
        onClose={() => {}} // Can't close during onboarding
        onComplete={handleCheckinComplete}
        userId={userId}
        userName={userName}
        isOnboarding={true} // NEW PROP
      />

      {/* Step 5: Response */}
      <PostCheckinResponseModal
        isOpen={currentStep === 'response'}
        onComplete={handleResponseComplete}
        userId={userId}
        userName={userName}
        checkInData={checkInData}
        category={selectedCategory}
        specific={selectedSpecific}
      />
    </>
  );
}
```

### 2. Create `PostCheckinResponseModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { getToneProfile } from '@/lib/elli/toneProfiles';
import AddStackItemForm from '@/components/AddStackItemForm';

interface PostCheckinResponseModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
  userName: string;
  checkInData: {
    mood: number;
    sleep: number;
    pain: number;
    symptoms?: string[];
    pain_locations?: string[];
    pain_types?: string[];
    custom_symptoms?: string[];
  };
  category: string | null;
  specific: string | null;
}

export default function PostCheckinResponseModal({
  isOpen,
  onComplete,
  userId,
  userName,
  checkInData,
  category,
  specific
}: PostCheckinResponseModalProps) {
  const [showTyping, setShowTyping] = useState(true);
  const [showSupplementModal, setShowSupplementModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get tone profile
  const toneProfile = getToneProfile(category);

  // Generate tone-aware response
  const getResponse = () => {
    const { pain, mood, sleep } = checkInData;
    
    // Use fallback template (or call OpenAI with tone-specific prompt)
    return toneProfile.fallbackTemplates.postCheckin(pain, mood, sleep, userName);
  };

  const response = getResponse();

  // Show supplement modal
  if (showSupplementModal) {
    return (
      <AddStackItemForm
        onClose={() => {
          setShowSupplementModal(false);
          onComplete();
        }}
        itemType="supplements"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-center mb-4">
            <span className="text-5xl">💙</span>
          </div>

          <div className="min-h-[120px]">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : (
              <TypeAnimation
                sequence={[response]}
                speed={75}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed"
                cursor={false}
              />
            )}
          </div>

          {!showTyping && (
            <>
              <p className="text-gray-700">
                Now let's add what you're taking so I can watch for patterns.
              </p>

              <button
                onClick={() => setShowSupplementModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Add what you're taking →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. Modify `EnhancedDayDrawerV2.tsx`

**Changes needed**:
- Add `isOnboarding` prop
- Add `onComplete` callback (instead of triggering post-checkin modal)
- If `isOnboarding`, call `onComplete(checkInData)` instead of showing modal

```typescript
// Add to props:
interface EnhancedDayDrawerV2Props {
  // ... existing props
  isOnboarding?: boolean;
  onComplete?: (data: any) => void;
}

// In handleSubmit, after successful save:
if (isOnboarding && onComplete) {
  // Pass check-in data to orchestrator
  onComplete({
    mood: formData.mood,
    sleep: formData.sleep_quality,
    pain: formData.pain,
    symptoms: selectedSymptoms,
    pain_locations: selectedPainLocations,
    pain_types: selectedPainTypes,
    custom_symptoms: customSymptoms
  });
} else if (isFirstCheckIn) {
  // Existing behavior for non-orchestrated flow
  setShowPostCheckinModal(true);
}
```

### 4. Update Entry Point

**Where onboarding is triggered** (likely in `EnhancedDayDrawerV2` or dashboard):

```typescript
// OLD:
<EnhancedDayDrawerV2
  isOpen={showCheckIn}
  onClose={() => setShowCheckIn(false)}
  isFirstCheckIn={isFirstCheckIn}
  // ...
/>

// NEW:
{isFirstCheckIn ? (
  <OnboardingOrchestrator
    isOpen={showOnboarding}
    onComplete={() => {
      setShowOnboarding(false);
      // Refresh dashboard
    }}
    userId={userId}
    userName={userName}
  />
) : (
  <EnhancedDayDrawerV2
    isOpen={showCheckIn}
    onClose={() => setShowCheckIn(false)}
    // ...
  />
)}
```

---

## 🧪 TESTING CHECKLIST

### Flow Testing:
- [ ] Sign up new user
- [ ] See ElliIntroModal (generic welcome)
- [ ] Click "Let's go"
- [ ] See category selection
- [ ] Select category (e.g., "Chronic pain or illness")
- [ ] See subcategory selection (e.g., "Fibromyalgia")
- [ ] See validation message (high empathy)
- [ ] Click continue
- [ ] See transition modal ("Now let me see where you're at")
- [ ] Click "Start check-in"
- [ ] Complete check-in sliders
- [ ] See tone-aware response (chronic pain tone)
- [ ] Add supplement
- [ ] Land on dashboard

### Tone Testing:
- [ ] Chronic pain: High empathy, "I'm sorry", "That's brutal"
- [ ] Biohacking: Data-focused, "Baseline recorded", "Tracking"
- [ ] Fertility: Warm, hopeful, "We're figuring this out"
- [ ] ADHD: Celebrating, "You did it!", "Executive dysfunction"
- [ ] Sleep: Understanding, "Poor sleep is exhausting"

### Database Testing:
- [ ] `tone_profile` saved correctly
- [ ] Matches selected category
- [ ] Persists for future messages

---

## 📝 IMPLEMENTATION ORDER

1. ✅ Create `OnboardingOrchestrator.tsx`
2. ✅ Create `PostCheckinResponseModal.tsx`
3. ✅ Modify `EnhancedDayDrawerV2.tsx` (add onboarding props)
4. ✅ Update entry point (where onboarding is triggered)
5. ✅ Test complete flow
6. ✅ Update message generation to use tone profiles
7. ✅ Test all 9 tone profiles

---

## 🚀 READY TO IMPLEMENT

All planning complete. Ready to execute implementation.

**Next Action**: Create `OnboardingOrchestrator.tsx`

