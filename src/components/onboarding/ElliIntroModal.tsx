'use client';

import { useState, useEffect } from 'react';
import SafeType from '@/components/elli/SafeType';
import { getGreeting } from '@/lib/utils/greetings';
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const welcomeMessage = `✨\n\nHey ${userName}, welcome to BioStackr\n\nI'm really happy you're here.\n\nLet's figure out what's going on with your health — we'll help you discover patterns you'd never spot on your own.\n\nWhat brings you here today?`;

  const dropdowns: { key: string; label: string; options: string[] }[] = [
    { key: 'sleep', label: 'Sleep', options: ['General sleep issues','Insomnia','Sleep apnea','Other sleep concerns'] },
    { key: 'pain', label: 'Chronic Pain', options: ['Fibromyalgia','Arthritis','Back pain','General chronic pain','Other pain condition'] },
    { key: 'migraines', label: 'Migraines', options: ['Chronic migraines','Cluster headaches','Tension headaches'] },
    { key: 'other', label: 'Other', options: ['Energy or Chronic Fatigue','Mental Health & Focus','Autoimmune or Inflammatory','Fertility or Cycle Tracking','Meds & Treatment Tracking','Pattern Discovery','Complex / Undiagnosed'] },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">✨</span>
          </div>

        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          {/* Category Dropdowns */}
          {!showTyping && (
            <div className="space-y-3">
              {dropdowns.map((d) => (
                <div key={d.key} className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === d.key ? null : d.key)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span>{d.label}</span>
                    <span>▼</span>
                  </button>
                  {openMenu === d.key && (
                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-md">
                      {d.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSelected(opt); onContinue(opt); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => onContinue(selected || 'Sleep & Insomnia Issues')}
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

