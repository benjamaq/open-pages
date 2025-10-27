'use client';

import { useState, useEffect } from 'react';
import SafeType from '@/components/elli/SafeType';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { TONE_PROFILES, type ToneProfileType } from '@/lib/elli/toneProfiles';
import { createClient } from '@/lib/supabase/client'

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
  const [resolvedName, setResolvedName] = useState<string>(userName);

  useEffect(() => {
    if (isOpen) {
      setShowTyping(true);
      setShowMessage(false);
      
      // Brief thinking indicator before typing
      const timer = setTimeout(() => {
        setShowTyping(false);
        setShowMessage(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Resolve a friendly first name if the passed userName is missing or placeholder
  useEffect(() => {
    (async () => {
      try {
        const candidate = (userName || '').trim();
        if (candidate && candidate.toLowerCase() !== 'there') {
          setResolvedName(candidate);
          return;
        }

        const supabase = createClient();

        // 1) Try profiles.display_name
        let first = '';
        try {
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', userId)
            .single();
          first = (data?.display_name || '').trim().split(' ')[0] || '';
        } catch {}

        // 2) Try auth metadata name, then email local-part
        if (!first) {
          const { data: auth } = await supabase.auth.getUser();
          const metaName = (auth?.user?.user_metadata as any)?.name as string | undefined;
          const emailLocal = (auth?.user?.email || '')?.split('@')[0] || '';
          first = (metaName || emailLocal || '').trim().split(' ')[0] || '';
        }

        setResolvedName(first || 'friend');
      } catch {
        setResolvedName('friend');
      }
    })();
  }, [userId, userName]);

  if (!isOpen) return null;

  // Get tone profile
  const profile = TONE_PROFILES[toneProfile as ToneProfileType] || TONE_PROFILES.general_wellness;
  
  console.log('💙 PostCheckinResponseModal:', {
    toneProfile,
    empathyLevel: profile.empathyLevel,
    category,
    checkInData
  });

  // Generate tone-aware response from tone profile (also for first check-in)
  const { pain, mood, sleep } = checkInData;
  let response = '';
  const nameForMessage = (resolvedName || userName || '').trim() || 'friend';
  response = profile.fallbackTemplates.postCheckin(pain, mood, sleep, nameForMessage);
  if (typeof pain === 'number' && pain > 0 && !/\bpain\b/i.test(response)) {
    response = `Pain at ${pain}/10. ${response}`;
  }

  // Gentle note if caffeine-related chip/tag was selected
  try {
    const tags = Array.isArray(checkInData?.tags) ? checkInData.tags : [];
    const hasCaffeine = tags.some((t: any) => typeof t === 'string' && t.toLowerCase().includes('caffeine'));
    if (hasCaffeine) {
      const suffix = `Noted caffeine today — it can make pain feel sharper and sleep harder. It might be worth easing up or moving it earlier; I’ll watch how it affects the next few days.`;
      response = response.endsWith('\n') ? `${response}\n${suffix}` : `${response}\n\n${suffix}`;
    }
  } catch {}

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
              <SafeType text={response} speed={15} className="text-gray-700 whitespace-pre-line leading-relaxed" />
            ) : null}
          </div>

          {/* Transition to Supplements */}
          {showMessage && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 mb-4">
                  Now let's add what you're taking, doing, or trying out.
                </p>
                {/* Post-checkin encouragement */}
                <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                  <div className="text-xs text-indigo-900">
                    <div className="font-semibold">Great start! 💪</div>
                    Want faster insights? Try selecting lifestyle tags like "caffeine," "exercise," or supplements you're taking.
                  </div>
                </div>
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


