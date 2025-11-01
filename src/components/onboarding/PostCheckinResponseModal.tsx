'use client';

import { useState, useEffect } from 'react';
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
  // Short confirmation only – full Elli message appears on the dashboard
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const handleContinue = () => { try { onComplete(); } catch {} }

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
  
  // Removed verbose console logging to prevent main-thread blocking during typing

  // Message resolved via API (or fallback)

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
        <div className="p-8 text-center">
          <p className="text-lg text-gray-800 mb-3 leading-relaxed">
            Thanks for checking in. I can see you rated sleep {typeof checkInData?.sleep === 'number' ? checkInData.sleep : 5}/10, 
            mood {typeof checkInData?.mood === 'number' ? checkInData.mood : 5}/10, and pain {typeof checkInData?.pain === 'number' ? checkInData.pain : 0}/10.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Over the next few days, we'll start spotting patterns together.
          </p>
          <button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


