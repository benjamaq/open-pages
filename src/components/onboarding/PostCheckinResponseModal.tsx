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
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string>(userName);

  // Fetch Elli message from server (message-service) when modal opens
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const nameForMessage = (resolvedName || userName || '').trim() || 'friend';
        try {
          console.log('🚨 ABOUT TO CALL API');
          console.log('🚨 USER ID:', userId);
          console.log('🚨 USER NAME:', nameForMessage);
          console.log('🚨 VALUES:', {
            sleepValue: typeof checkInData?.sleep === 'number' ? checkInData.sleep : 5,
            moodValue: typeof checkInData?.mood === 'number' ? checkInData.mood : 5,
            painValue: typeof checkInData?.pain === 'number' ? checkInData.pain : 0,
          });
          console.log('🚨 FETCHING...');
        } catch {}
        const resp = await fetch('/api/elli/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageType: 'post_checkin',
            context: {
              userName: nameForMessage,
              checkIn: {
                pain: typeof checkInData?.pain === 'number' ? checkInData.pain : 0,
                mood: typeof checkInData?.mood === 'number' ? checkInData.mood : 5,
                sleep: typeof checkInData?.sleep === 'number' ? checkInData.sleep : 5,
              },
              // Pass category as a loose condition hint (optional)
              condition: category || undefined,
            }
          })
        });
        try { console.log('🌐 API RESPONSE STATUS:', resp.status) } catch {}
        if (!resp.ok) throw new Error('Failed to generate Elli message');
        const json = await resp.json().catch(() => ({}));
        const svcMessage = (json && json.message) || '';
        try { console.log('📥 API RETURNED MESSAGE:', typeof svcMessage === 'string' ? (svcMessage.substring(0, 100) + '...') : svcMessage) } catch {}
        if (!svcMessage || typeof svcMessage !== 'string') throw new Error('Invalid Elli message payload');
        setMessage(svcMessage);
      } catch (e) {
        console.error('🚨 FETCH FAILED:', e);
        // Fallback to tone profile template
        try {
          const profile = TONE_PROFILES[toneProfile as ToneProfileType] || TONE_PROFILES.general_wellness;
          const nameForMessage = (resolvedName || userName || '').trim() || 'friend';
          const fallback = profile.fallbackTemplates.postCheckin(
            typeof checkInData?.pain === 'number' ? checkInData.pain : 0,
            typeof checkInData?.mood === 'number' ? checkInData.mood : 5,
            typeof checkInData?.sleep === 'number' ? checkInData.sleep : 5,
            nameForMessage
          );
          setMessage(fallback);
        } catch (err) {
          setError('Failed to generate message');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMessage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          {/* Elli Avatar */}
          <div className="flex justify-center mb-4">
            <span className="text-5xl">💙</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Elli's Response */}
          <div className="min-h-[120px]">
            {isLoading ? (
              <div className="py-6 flex justify-center"><TypingIndicator /></div>
            ) : (
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{message}</div>
            )}
          </div>

          {/* Transition to Supplements */}
          {!isLoading && (
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
                Continue →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


