'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { TONE_PROFILES, type ToneProfileType } from '@/lib/elli/toneProfiles';

/**
 * PostCheckinResponseModal
 * 
 * CRITICAL COMPONENT: Shows tone-aware response after check-in
 * 
 * This is where Elli's personality shines through based on user category:
 * - Chronic pain: High empathy, "I'm sorry", "That's brutal"
 * - Biohacking: Data-focused, "Baseline recorded", "Tracking"
 * - ADHD: Celebrating effort, "You did it!", "Executive dysfunction is real"
 * - Fertility: Warm, hopeful, "We're figuring this out"
 * 
 * The tone profile MUST be set before this modal is shown.
 */

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

interface PostCheckinResponseModalProps {
  isOpen: boolean;
  onComplete: (supplementName?: string) => void;
  userId: string;
  userName: string;
  checkInData: CheckInData;
  category: string | null;
  specific: string | null;
  toneProfile: string; // CRITICAL - determines Elli's personality
  isFirstCheckIn?: boolean;
}

export default function PostCheckinResponseModal({
  isOpen,
  onComplete,
  userId,
  userName,
  checkInData,
  category,
  specific,
  toneProfile,
  isFirstCheckIn = false
}: PostCheckinResponseModalProps) {
  const [showTyping, setShowTyping] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      setShowMessage(false);
      
      // Show typing for 1.5 seconds
      const timer = setTimeout(() => {
        setShowTyping(false);
        setShowMessage(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get tone profile
  const profile = TONE_PROFILES[toneProfile as ToneProfileType] || TONE_PROFILES.general_wellness;
  
  console.log('💙 PostCheckinResponseModal:', {
    toneProfile,
    empathyLevel: profile.empathyLevel,
    category,
    checkInData
  });

  // Generate tone-aware response. For first check-in, use a curated welcome
  const { pain, mood, sleep } = checkInData;
  let response = '';
  if (isFirstCheckIn) {
    response = `Perfect, ${userName}. Your first check-in is saved.

Keep showing up each day and I'll start spotting what works for you.`;
  } else {
    response = profile.fallbackTemplates.postCheckin(pain, mood, sleep, userName);
  }
  if (!isFirstCheckIn && typeof pain === 'number' && pain > 0 && !/\bpain\b/i.test(response)) {
    response = `Pain at ${pain}/10. ${response}`;
  }

  // Note: Supplement form is now handled by PostSupplementModal in the orchestrator

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          {/* Elli Avatar */}
          <div className="flex justify-center mb-4">
            <span className="text-5xl">💙</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Elli's Tone-Aware Response */}
          <div className="min-h-[120px]">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : showMessage ? (
              <TypeAnimation
                sequence={[response]}
                speed={60}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed"
                cursor={false}
              />
            ) : null}
          </div>

          {/* Transition to Supplements */}
          {showMessage && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 mb-4">
                  Now let's add what you're taking, doing, or trying out.
                </p>
              </div>

              <button
                onClick={() => onComplete()}
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

