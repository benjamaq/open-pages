'use client';

import { useState } from 'react';
import ElliIntroModal from './ElliIntroModal';
import HowItWorksScreen from './HowItWorksScreen';
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2';
import Step5MissionStatement from './Step5MissionStatement';
import Step2CoreCheckin from './Step2CoreCheckin';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import PostCheckinResponseModal from './PostCheckinResponseModal';
import AddStackItemForm from '@/components/AddStackItemForm';
import Step5MissionProfile from './Step5MissionProfile';
import { getToneProfileType } from '@/lib/toneProfiles';
import { trackEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client';

/**
 * OnboardingOrchestrator
 * 
 * Manages the complete onboarding flow with correct order:
 * 1. Intro (generic welcome)
 * 2. Category selection
 * 3. Subcategory (if chronic pain)
 * 4. Category validation (tone profile SET here)
 * 5. Transition to check-in
 * 6. Check-in sliders
 * 7. Tone-aware response
 * 8. Supplements
 * 9. Complete
 * 
 * CRITICAL: Category MUST come before check-in so Elli knows who she's talking to
 */

type OnboardingStep = 
  | 'intro'           // ElliIntroModal - generic welcome
  | 'how_it_works'    // New explanation screen
  | 'checkin'         // EnhancedDayDrawerV2 - mood/sleep/pain sliders
  | 'response'        // PostCheckinResponseModal - tone-aware response
  | 'add_supplement'  // AddStackItemForm - add supplement/medication
  | 'post_supplement' // PostSupplementModal - after adding supplement
  | 'mission_profile' // New combined mission + profile
  | 'complete';       // Done - go to dashboard

interface CheckInData {
  mood: number;
  sleep: number;
  pain: number;
  symptoms?: string[];
  pain_locations?: string[];
  pain_types?: string[];
  custom_symptoms?: string[];
  tags?: string[];
  journal?: string;
}

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
  console.log('🚩 Onboarding flags:', {
    ENABLE_NEW_STEP2: FEATURE_FLAGS.ENABLE_NEW_STEP2,
    ENABLE_MISSION_STEP: FEATURE_FLAGS.ENABLE_MISSION_STEP,
    currentStep: 'check what renders'
  });
  // State management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecific, setSelectedSpecific] = useState<string | null>(null);
  const [toneProfile, setToneProfile] = useState<string | null>(null); // CRITICAL - set before check-in
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [supplementName, setSupplementName] = useState<string>('');

  console.log('🎯 OnboardingOrchestrator State:', {
    currentStep,
    selectedCategory,
    selectedSpecific,
    toneProfile,
    hasCheckInData: !!checkInData
  });

  if (!isOpen) return null;

  // ========================================================================
  // STEP 1: Intro → Category
  // ========================================================================
  const handleIntroComplete = async (category: string) => {
    console.log('✅ Intro complete with category:', category);
    // Set category and tone profile immediately (no separate category step)
    setSelectedCategory(category);
    const tone = (getToneProfileType as any)(category, null);
    setToneProfile(tone);
    // Map selection to primary condition for personalization
    const mapToPrimary = (label: string): 'sleep' | 'pain' | 'migraines' | 'energy' | 'other' => {
      const lower = (label || '').toLowerCase();
      if (lower.includes('sleep')) return 'sleep';
      if (lower.includes('migraine') || lower.includes('headache')) return 'migraines';
      if (lower.includes('pain') || lower.includes('fibromyalgia') || lower.includes('arthritis') || lower.includes('back')) return 'pain';
      if (lower.includes('energy') || lower.includes('fatigue')) return 'energy';
      return 'other';
    }
    try {
      const supabase = createClient();
      await (supabase
        .from('profiles') as any)
        .update({ condition_primary: mapToPrimary(category), condition_details: category })
        .eq('user_id', userId);
      try { trackEvent('onboarding_condition_set', { primary: mapToPrimary(category), details: category }) } catch {}
    } catch (e) {
      console.warn('Failed to save primary condition (non-blocking)', e);
    }
    setCurrentStep('how_it_works');
  };

  // ========================================================================
  // STEP 2: Category → Check-in (Direct)
  // ========================================================================
  // Removed separate category step; handled in intro

  // ========================================================================
  // STEP 3: Check-in → Response
  // ========================================================================
  const handleCheckinComplete = (data: CheckInData) => {
    console.log('✅ Check-in complete:', data);
    setCheckInData(data);
    setCurrentStep('response');
  };

  // ========================================================================
  // STEP 4: Response → Add Supplement Form
  // ========================================================================
  const handleResponseComplete = () => {
    console.log('✅ Response complete, moving to supplement form');
    setCurrentStep('add_supplement');
  };

  // ========================================================================
  // STEP 5: Add Supplement → Post-Supplement Message
  // ========================================================================
  const handleSupplementAdded = (supplementName: string) => {
    console.log('✅ Supplement added:', supplementName);
    setSupplementName(supplementName);
    setCurrentStep('post_supplement');
  };

  // ========================================================================
  // STEP 5: Post-Supplement → Profile Setup
  // ========================================================================
  // After supplement step, go directly to mission/profile
  const goToMissionProfile = () => {
    console.log('➡️  Proceeding to mission/profile step');
    setCurrentStep('mission_profile');
  };

  const getBridgeMessage = (d: CheckInData) => {
    if (typeof d?.pain === 'number' && d.pain >= 6) {
      return `I see you're at ${d.pain}/10 pain today. Let's track what you're taking — so I can see what actually moves that number.`
    }
    if (typeof d?.mood === 'number' && d.mood < 5) {
      return `Tough day. Let's track what you're taking — I'm looking for patterns that might help.`
    }
    if (typeof d?.sleep === 'number' && d.sleep < 5) {
      return `Sleep ${d.sleep}/10 is rough. Let's track what you're taking — including anything for sleep — so I can spot what works.`
    }
    return `Let's start tracking what you're taking — so I can see what actually helps you feel better.`
  }

  // ========================================================================
  // STEP 6: Profile Setup → Complete
  // ========================================================================
  const handleProfileSetupComplete = () => {
    console.log('✅ Profile setup complete, onboarding finished!');
    setCurrentStep('complete');

    // Send welcome email (non-blocking)
    (async () => {
      try {
        const resp = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: userName })
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.error('❌ OnboardingOrchestrator welcome email failed:', json);
        } else {
          console.log('✅ OnboardingOrchestrator welcome email sent');
        }
      } catch (e) {
        console.error('❌ OnboardingOrchestrator welcome email error:', e);
      } finally {
        try { trackEvent('onboarding_complete', { user_id: userId, persona_selected: selectedCategory || 'unknown' }) } catch {}
        onComplete();
      }
    })();
  };

  // ========================================================================
  // RENDER CURRENT STEP
  // ========================================================================

  return (
    <>
      {/* Step 1: Elli Intro (Generic Welcome) */}
      {currentStep === 'intro' && (
        <ElliIntroModal
          isOpen={true}
          onContinue={handleIntroComplete}
          userName={userName}
        />
      )}

      {/* Category selection handled inside ElliIntroModal */}

      {/* New Step: How It Works → then Check-in */}
      {currentStep === 'how_it_works' && (
        <HowItWorksScreen
          isOpen={true}
          onContinue={() => setCurrentStep('checkin')}
        />
      )}

      {/* Step 3: Check-in (old/new) */}
      {currentStep === 'checkin' && (
        FEATURE_FLAGS.ENABLE_NEW_STEP2 ? (
          <Step2CoreCheckin
            userId={userId}
            userName={userName}
            onComplete={handleCheckinComplete}
          />
        ) : (
          <EnhancedDayDrawerV2
            isOpen={true}
            onClose={() => {}} // Can't close during onboarding
            date={new Date().toISOString().split('T')[0]}
            userId={userId}
            userName={userName}
            isFirstCheckIn={true}
            isOnboarding={true} // NEW PROP - tells drawer we're in onboarding
            onOnboardingComplete={handleCheckinComplete} // NEW PROP - callback with data
            todayItems={{
              supplements: [],
              protocols: [],
              movement: [],
              mindfulness: [],
              food: [],
              gear: []
            }}
          />
        )
      )}

      {/* Step 4: Tone-Aware Response */}
      {currentStep === 'response' && checkInData && toneProfile && (
        <PostCheckinResponseModal
          isOpen={true}
          onComplete={handleResponseComplete}
          userId={userId}
          userName={userName}
          checkInData={checkInData}
          category={selectedCategory}
          specific={selectedSpecific}
          toneProfile={toneProfile} // CRITICAL - tone profile passed here
          isFirstCheckIn={true}
        />
      )}

      {/* Step 5: Add Supplement Form */}
      {currentStep === 'add_supplement' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Bridge Message */}
            {checkInData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800">{getBridgeMessage(checkInData)}</p>
              </div>
            )}
            <AddStackItemForm
              onClose={goToMissionProfile}
              onSuccess={() => goToMissionProfile()}
              itemType="supplements"
              isOnboarding={true}
              buttonColor="purple"
            />
          </div>
        </div>
      )}

      {/* Step 6: Post-Supplement Message */}
      {/* PostSupplementModal removed per final brief */}

      {/* Step 7: Mission + Profile */}
      {currentStep === 'mission_profile' && (
        <Step5MissionProfile
          userId={userId}
          displayName={userName}
          onNext={handleProfileSetupComplete}
          onSkip={handleProfileSetupComplete}
        />
      )}
    </>
  );
}

