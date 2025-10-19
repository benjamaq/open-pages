'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from './TypingIndicator';
import { TONE_PROFILES, type ToneProfileType } from '@/lib/elli/toneProfiles';

/**
 * DashboardWelcomeMessage
 * 
 * Shows Elli's welcome message when user first lands on dashboard after onboarding.
 * Tone-aware message based on their selected category.
 */

interface DashboardWelcomeMessageProps {
  userName: string;
  toneProfile: string;
  checkInData?: {
    mood: number;
    sleep: number;
    pain: number;
  };
  onComplete?: () => void;
}

export default function DashboardWelcomeMessage({
  userName,
  toneProfile,
  checkInData,
  onComplete
}: DashboardWelcomeMessageProps) {
  const [showTyping, setShowTyping] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Show typing for 2 seconds
    const timer = setTimeout(() => {
      setShowTyping(false);
      setShowMessage(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Get tone profile
  const profile = TONE_PROFILES[toneProfile as ToneProfileType] || TONE_PROFILES.general_wellness;

  // Generate tone-aware welcome message
  const getWelcomeMessage = () => {
    if (!checkInData) {
      return `${userName}, welcome to your dashboard! I'm here to help you track patterns and understand what's working for you.`;
    }

    const { mood, sleep, pain } = checkInData;
    
    const messages = {
      chronic_pain: `${userName}, I'm paying attention to your ${mood}/10 mood and ${pain}/10 pain today. I'll be back to you soon after a few more check-ins to share what I'm seeing in your patterns.`,

      biohacking: `${userName}, baseline data recorded - mood ${mood}/10, sleep ${sleep}/10. I'm tracking your interventions and will provide analysis after collecting more data points.`,

      mental_health: `${userName}, I see your mood at ${mood}/10 today. I'm watching your patterns and will check back after a few more check-ins to share insights about what's helping.`,

      fertility: `${userName}, I'm tracking your mood at ${mood}/10 and energy levels. I'll monitor your patterns alongside your cycle data and share insights soon.`,

      adhd: `${userName}, you did it! You're here on your dashboard. I'm tracking your ${mood}/10 mood and will help you see patterns that work for YOUR brain.`,

      sleep: `${userName}, I'm monitoring your sleep at ${sleep}/10 and mood at ${mood}/10. I'll analyze your patterns and share insights about what's affecting your sleep.`,

      energy: `${userName}, I'm tracking your energy at ${mood}/10 today. I'll watch for patterns and help you understand what's boosting or draining your energy.`,

      perimenopause: `${userName}, I'm paying attention to your ${mood}/10 mood and tracking your symptoms. I'll analyze your patterns and share insights about what's helping during this transition.`,

      general_wellness: `${userName}, I'm tracking your mood at ${mood}/10 and sleep at ${sleep}/10. I'll analyze your patterns and help you optimize your wellness routine.`
    };

    return messages[toneProfile as keyof typeof messages] || messages.general_wellness;
  };

  const message = getWelcomeMessage();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
      <div className="flex items-start space-x-4">
        {/* Elli Avatar */}
        <div className="flex-shrink-0">
          <span className="text-3xl">💙</span>
        </div>

        {/* Message */}
        <div className="flex-1 min-h-[60px]">
          {showTyping ? (
            <div className="py-2 flex items-center">
              <TypingIndicator />
            </div>
          ) : showMessage ? (
            <TypeAnimation
              sequence={[message]}
              speed={90}
              wrapper="div"
              className="text-gray-700 whitespace-pre-line leading-relaxed"
              cursor={false}
              onComplete={onComplete}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
