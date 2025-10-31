'use client';

import { useState, useEffect } from 'react';
import SafeType from '@/components/elli/SafeType';
import { TypingIndicator } from '@/components/elli/TypingIndicator';

interface ElliIntroModalProps {
  isOpen: boolean;
  onContinue: (category: string) => void;
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
      const timer = setTimeout(() => setShowTyping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const welcomeMessage = `Hey ${userName}, I'm so glad you're here. I know you're exhausted from trying everything — and I know how hard it is to keep showing up when nothing seems to work.

Let's find out why you're here today, and start building a plan that actually helps.`;

  const categories = [
    'Chronic Pain or Illness',
    'Autoimmune or Inflammatory',
    'Energy or Chronic Fatigue',
    'Sleep & Insomnia Issues',
    'Mental Health & Focus',
    'Fertility or Cycle Tracking',
    'Meds & Treatment Tracking',
    'Pattern Discovery',
    'Complex / Undiagnosed'
  ];

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
              <SafeType
                text={welcomeMessage}
                speed={15}
                className="text-gray-700 whitespace-pre-line leading-relaxed text-lg"
              />
            )}
          </div>

          {/* Category Grid */}
          {!showTyping && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onContinue(cat)}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors text-left"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onContinue(categories[0])}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                I'm Ready →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

