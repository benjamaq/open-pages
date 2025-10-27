'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from '@/components/elli/TypingIndicator';

interface ElliIntroModalProps {
  isOpen: boolean;
  onContinue: () => void;
  userName: string;
}

/**
 * ElliIntroModal
 * 
 * The FIRST thing users see after signup.
 * Generic welcome that works for everyone (chronic pain, fertility, biohacking, etc.)
 * 
 * Flow: Sign up → THIS → Category selection → etc.
 */
export default function ElliIntroModal({ 
  isOpen, 
  onContinue,
  userName 
}: ElliIntroModalProps) {
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const welcomeMessage = `Hey ${userName}, welcome to BioStackr!

I'm Elli, and I'm really glad you're here.

Whether you're dealing with chronic pain, tracking fertility, optimizing performance, or just trying to feel better - I'm here to help you figure out YOUR patterns.

What's helping. What's not. What's actually going on with your body.

First, let me understand what brings you here.`;

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
          <div className="min-h-[200px] text-left">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : (
            <TypeAnimation
                sequence={[welcomeMessage]}
              speed={25}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed"
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
              Let's go →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

