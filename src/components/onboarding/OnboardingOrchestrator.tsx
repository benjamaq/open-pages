'use client';

import { useState } from 'react';
import ElliIntroModal from './ElliIntroModal';
import CategorySelectionModal from './CategorySelectionModal';
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2';
import PostCheckinResponseModal from './PostCheckinResponseModal';
import AddStackItemForm from '@/components/AddStackItemForm';
import PostSupplementModal from './PostSupplementModal';
import ProfileSetupModal from './ProfileSetupModal';
import { getToneProfileType } from '@/lib/elli/toneProfiles';

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
  | 'category'        // Category selection
  | 'checkin'         // EnhancedDayDrawerV2 - mood/sleep/pain sliders
  | 'response'        // PostCheckinResponseModal - tone-aware response
  | 'add_supplement'  // AddStackItemForm - add supplement/medication
  | 'post_supplement' // PostSupplementModal - after first supplement added
  | 'profile_setup'   // ProfileSetupModal - photo and mission
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
  const handleIntroComplete = () => {
    console.log('✅ Intro complete, moving to category selection');
    setCurrentStep('category');
  };

  // ========================================================================
  // STEP 2: Category → Check-in (Direct)
  // ========================================================================
  const handleCategoryComplete = (category: string, specific: string | null) => {
    console.log('✅ Category selected:', { category, specific });
    
    // Set category and specific
    setSelectedCategory(category);
    setSelectedSpecific(specific);
    
    // CRITICAL: Set tone profile immediately
    const tone = getToneProfileType(category, specific);
    setToneProfile(tone);
    
    console.log('✅ Tone profile set:', tone);
    
    // Move directly to check-in (no transition modal needed)
    setCurrentStep('checkin');
  };

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
  const handlePostSupplementComplete = () => {
    console.log('✅ Post-supplement complete, moving to profile setup');
    setCurrentStep('profile_setup');
  };

  // ========================================================================
  // STEP 6: Profile Setup → Complete
  // ========================================================================
  const handleProfileSetupComplete = () => {
    console.log('✅ Profile setup complete, onboarding finished!');
    setCurrentStep('complete');
    onComplete();
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

      {/* Step 2: Category Selection */}
      {currentStep === 'category' && (
        <CategorySelectionModal
          isOpen={true}
          onClose={() => {}} // Can't close during onboarding
          onContinue={handleCategoryComplete}
          userId={userId}
          userName={userName}
        />
      )}

      {/* Step 3: Check-in Sliders */}
      {currentStep === 'checkin' && (
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
        />
      )}

      {/* Step 5: Add Supplement Form */}
      {currentStep === 'add_supplement' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Add what you're taking</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Add your first supplement, medication, or anything you're trying. We'll add the rest on your dashboard.
            </p>
            <AddStackItemForm
              onClose={() => {
                // If they close without adding, skip to profile setup
                setCurrentStep('profile_setup');
              }}
              onSuccess={(itemName) => {
                // They successfully added a supplement!
                console.log('✅ Supplement added:', itemName);
                setSupplementName(itemName);
                setCurrentStep('post_supplement');
              }}
              itemType="supplements"
              isOnboarding={true}
            />
          </div>
        </div>
      )}

      {/* Step 6: Post-Supplement Message */}
      {currentStep === 'post_supplement' && supplementName && toneProfile && (
        <PostSupplementModal
          isOpen={true}
          onContinue={handlePostSupplementComplete}
          userName={userName}
          supplementName={supplementName}
          toneProfile={toneProfile}
        />
      )}

      {/* Step 7: Profile Setup */}
      {currentStep === 'profile_setup' && (
        <ProfileSetupModal
          isOpen={true}
          onComplete={handleProfileSetupComplete}
          userName={userName}
          userId={userId}
        />
      )}
    </>
  );
}

