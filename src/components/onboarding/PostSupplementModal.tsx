'use client';

import { useState, useEffect } from 'react';
import SafeType from '@/components/elli/SafeType';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { TONE_PROFILES, type ToneProfileType } from '@/lib/elli/toneProfiles';

/**
 * PostSupplementModal
 * 
 * Shows after user adds their first supplement during onboarding.
 * Provides encouragement and explains what happens next.
 */

interface PostSupplementModalProps {
  isOpen: boolean;
  onContinue: () => void;
  userName: string;
  supplementName: string;
  toneProfile: string;
}

export default function PostSupplementModal({
  isOpen,
  onContinue,
  userName,
  supplementName,
  toneProfile
}: PostSupplementModalProps) {
  const [showTyping, setShowTyping] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      setShowMessage(false);
      
      // Brief thinking indicator (match standard 300ms)
      const timer = setTimeout(() => {
        setShowTyping(false);
        setShowMessage(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get tone profile
  const profile = TONE_PROFILES[toneProfile as ToneProfileType] || TONE_PROFILES.general_wellness;

  // Generate tone-aware post-supplement message
  const getPostSupplementMessage = () => {
    const messages = {
      chronic_pain: `${userName}, ${supplementName} is a really good start. I know you're trying everything to manage your pain, and I'm here to help you track what actually works.

I'm looking forward to when you get to the dashboard - you can add everything you're taking, and I'll assess it all. We can discuss further and find patterns that help.`,

      biohacking: `${userName}, ${supplementName} - good choice. I'm tracking this intervention alongside your baseline data.

When you get to the dashboard, add everything else you're testing. I'll analyze the interactions and give you data-driven insights on what's actually moving the needle.`,

      mental_health: `${userName}, ${supplementName} is a solid start. I know mental health can feel overwhelming, and you're doing what you can to support yourself.

On the dashboard, you can add everything you're taking. I'll watch for patterns and help you understand what's helping your mood and energy.`,

      fertility: `${userName}, ${supplementName} is a great foundation. I know this journey can feel uncertain, but you're taking care of yourself.

Once you're on the dashboard, add everything you're taking. I'll track it all alongside your cycle data and help you understand what's supporting your fertility.`,

      adhd: `${userName}, ${supplementName} is a good start. I know with ADHD it's hard to remember to take things consistently, so the fact you're here tracking is huge.

On the dashboard, add everything else you're taking. I'll help you see patterns and remind you what's working for YOUR brain.`,

      sleep: `${userName}, ${supplementName} is a smart choice for sleep. I know poor sleep is exhausting, and you're trying to find what works.

Add everything else on the dashboard - I'll track it all and help you see what's actually helping YOUR sleep patterns.`,

      energy: `${userName}, ${supplementName} is a good start for energy. Being tired all the time is draining, and I'm here to help you find what helps.

On the dashboard, add everything you're taking. I'll track patterns and help you understand what's boosting YOUR energy levels.`,

      perimenopause: `${userName}, ${supplementName} is a solid choice. I know perimenopause symptoms are real and often dismissed - but I see you.

Add everything else on the dashboard. I'll track it all and help you understand what's actually helping YOUR symptoms during this transition.`,

      general_wellness: `${userName}, ${supplementName} is a great start. You're taking a proactive approach to your health, and I'm here to help you optimize.

On the dashboard, add everything you're taking. I'll analyze patterns and help you understand what's working for YOUR body.`
    };

    return messages[toneProfile as keyof typeof messages] || messages.general_wellness;
  };

  const message = getPostSupplementMessage();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="24" y1="8" x2="24" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="24" y1="33" x2="24" y2="40" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="8" y1="24" x2="15" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="33" y1="24" x2="40" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="13" y1="13" x2="18" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="30" y1="30" x2="35" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="35" y1="13" x2="30" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="18" y1="30" x2="13" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 18L28 24L24 30L20 24Z" fill="#F4B860"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Elli's Message */}
          <div className="min-h-[200px]">
            {showTyping ? (
              <div className="py-8 flex justify-center">
                <TypingIndicator />
              </div>
            ) : showMessage ? (
              <SafeType
                text={message}
                speed={15}
                className="text-gray-700 whitespace-pre-line leading-relaxed"
              />
            ) : null}
          </div>

          {/* Continue Button */}
          {showMessage && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={onContinue}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Continue to profile setup →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
