'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { getToneProfile } from '@/lib/elli/toneProfiles';

interface CheckInTransitionModalProps {
  isOpen: boolean;
  onContinue: () => void;
  userName: string;
  category: string | null;
}

/**
 * CheckInTransitionModal
 * 
 * Shown AFTER category validation, BEFORE check-in sliders.
 * Transitions user from category selection to daily check-in.
 * Message tone adapts based on selected category.
 * 
 * Flow: Category validation → THIS → Check-in sliders
 */
export default function CheckInTransitionModal({ 
  isOpen, 
  onContinue,
  userName,
  category 
}: CheckInTransitionModalProps) {
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get tone-appropriate transition message
  const getTransitionMessage = () => {
    const toneProfile = getToneProfile(category);
    
    // Tone-specific transitions
    if (toneProfile.empathyLevel >= 9) {
      // High empathy (chronic pain, mental health, perimenopause)
      return `Now let me see where you're at today, ${userName}.

Move the sliders to how you're feeling right now. No wrong answers. Just honest.

I'm watching.`;
    } else if (toneProfile.empathyLevel <= 5) {
      // Low empathy (biohacking)
      return `Now let's establish baseline, ${userName}.

Move the sliders to where you're at today. This is Day 1 of your data set.`;
    } else if (category === 'Fertility or pregnancy') {
      // Fertility-specific
      return `Now let me see where you're at in your cycle, ${userName}.

Move the sliders honestly - I'm tracking everything.`;
    } else if (category === 'ADHD') {
      // ADHD-specific
      return `Now let's check in, ${userName}.

Move the sliders to how you're feeling. This is going to be quick and easy - designed for YOUR brain.`;
    } else {
      // Default (sleep, energy, general wellness)
      return `Now let me see where you're at today, ${userName}.

Move the sliders to how you're feeling right now. Just honest.`;
    }
  };

  const transitionMessage = getTransitionMessage();

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
          {/* Elli's Message with Typing */}
          <div className="min-h-[120px] text-left">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : (
              <TypeAnimation
                sequence={[transitionMessage]}
                speed={15}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed text-center"
                cursor={false}
              />
            )}
          </div>

          {/* Continue Button */}
          {!showTyping && (
            <button
              onClick={onContinue}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Start check-in →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

