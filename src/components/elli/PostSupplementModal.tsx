'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { X, CheckCircle } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { getPostSupplementTemplate } from '@/lib/elli/elliTemplates';

interface PostSupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  supplement: {
    name: string;
  };
  condition?: string;
  userName?: string;
}

/**
 * PostSupplementModal
 * Shown after user adds their first supplement
 * Elli acknowledges what they added and sets expectations
 */
export default function PostSupplementModal({ 
  isOpen, 
  onClose, 
  onContinue,
  supplement,
  condition,
  userName = 'there'
}: PostSupplementModalProps) {
  const [showTyping, setShowTyping] = useState(true);

  const elliMessage = getPostSupplementTemplate(supplement.name, condition, userName);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Elli Avatar */}
          <div className="flex justify-center mb-4">
            <span className="text-4xl">💙</span>
          </div>

          {/* Header */}
          <h2 className="text-xl font-semibold text-center mb-4">
            Perfect, I've got it 💙
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Elli's Message with Typing */}
          <div className="min-h-[60px] text-left">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : (
              <TypeAnimation
                sequence={[elliMessage]}
                speed={35}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed"
                cursor={false}
              />
            )}
          </div>

          {/* Timeline */}
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">
              Here's what happens next:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Day 1</span> - Baseline recorded
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Day 3</span> - I'll check in with you
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Day 7</span> - First patterns emerge
                </p>
              </div>
            </div>
          </div>

          {/* Closing Message */}
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              The more you track, the more I can help. But for now? You did the hardest part - you showed up.
            </p>
            <p className="text-gray-600 text-sm">
              See you tomorrow.
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Continue to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

