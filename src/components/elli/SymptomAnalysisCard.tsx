'use client';

import { useState, useEffect, useMemo } from 'react';
import SafeType from './SafeType';
import { TypingIndicator } from './TypingIndicator';
import { analyzeSymptomsAction } from '@/lib/actions/analyze-symptoms';
import type { CheckInData, SymptomAnalysis } from '@/lib/symptomAnalyzer';

interface SymptomAnalysisCardProps {
  checkInData: CheckInData;
  userName?: string;
  className?: string;
}

/**
 * SymptomAnalysisCard
 * Analyzes user's check-in data and provides empathetic, AI-powered responses
 */
export default function SymptomAnalysisCard({ 
  checkInData, 
  userName = 'there',
  className = '' 
}: SymptomAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fromSavedToday, setFromSavedToday] = useState(false);

  // Map tags/symptoms to domain-specific suggestions (max 3 overall later)
  const deriveSuggestionsFromTags = (tags: string[] = []): string[] => {
    const recs: string[] = [];
    const has = (slug: string) => tags.includes(slug);
    // Illness context
    if (has('getting_sick') || has('fever_chills') || has('cold_flu')) {
      recs.push('Prioritize rest and fluids today; lighten non‑essential tasks');
      recs.push('Aim for an earlier bedtime to support recovery (7–9 hours)');
    }
    // GI upset
    if (has('gi_upset') || has('nausea') || has('stomach_pain') || has('vomit') || has('diarrhea')) {
      recs.push('Keep meals simple (bland/low‑fat) and hydrate with electrolytes');
      recs.push('Skip alcohol and heavy foods until symptoms settle');
    }
    // Alcohol / dehydration
    if (has('alcohol_last_night') || has('hangover') || has('dehydrated')) {
      recs.push('Extra water + electrolytes this morning; gentle movement only');
      recs.push('Protect tonight’s sleep (7+ hrs) to normalize tomorrow’s readiness');
    }
    // Poor sleep
    if (has('poor_sleep_last_night') || has('poor_sleep')) {
      recs.push('Protect tonight’s sleep: consistent wind‑down, dim lights, screens off early');
    }
    // Stress / anxiety
    if (has('high_stress') || has('stress_at_work') || has('anxiety')) {
      recs.push('Short breathing break (4‑7‑8) or 5‑10 minute walk to reset');
    }
    // Food triggers
    if (has('ate_gluten') || has('ate_dairy') || has('heavy_meal') || has('ate_out')) {
      recs.push('Keep meals simple today and note any symptom changes');
    }
    return Array.from(new Set(recs));
  };

  // Memoize checkInData to prevent unnecessary re-renders
  const memoizedCheckInData = useMemo(() => checkInData, [
    checkInData.mood,
    checkInData.sleep,
    checkInData.pain,
    checkInData.tags?.join(','),
    checkInData.journal,
    checkInData.symptoms?.join(','),
    checkInData.painLocations?.join(','),
    checkInData.painTypes?.join(','),
    checkInData.customSymptoms?.join(',')
  ]);

  useEffect(() => {
    let mounted = true;

    const performAnalysis = async () => {
      try {
        setIsAnalyzing(true);
        // 1) Try to load today's saved Elli message first to avoid re-generating
        try {
          const res = await fetch('/api/elli/generate', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const msg = data?.message;
            if (msg?.message_text && msg?.created_at) {
              const created = new Date(msg.created_at);
              const now = new Date();
              const ageMs = now.getTime() - created.getTime();
              const within24h = ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000;
              if (within24h) {
                // Defensive: ensure it's a post_checkin message, never insight
                if (msg?.message_type && msg.message_type !== 'post_checkin') {
                  console.warn('⚠️ Latest Elli message is not post_checkin, ignoring for main card:', msg.message_type)
                } else {
                // Compute structured chips/suggestions even when using saved message text
                const computed = await analyzeSymptomsAction(memoizedCheckInData, userName);
                // Ensure we always have 2–3 practical suggestions by merging tag‑based recs
                const tagRecs = deriveSuggestionsFromTags(memoizedCheckInData.tags || computed?.detectedSymptoms as any);
                const mergedRecs = Array.from(new Set([...(computed?.suggestions || []), ...tagRecs])).slice(0, 3);
                const sanitizedText = (msg.message_text as string)
                  .replace(/[^.!?]*\b(best\s+day|best\s+so\s+far|best\s+day\s+so\s+far|today\s+(?:is|was)\s+(?:your\s+)?best)[^.!?]*[.!?]/gi, '')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
                const merged: SymptomAnalysis = {
                  detectedSymptoms: computed?.detectedSymptoms || [],
                  primaryConcern: computed?.primaryConcern || null,
                  severity: computed?.severity || 'low',
                  empatheticResponse: sanitizedText,
                  suggestions: mergedRecs
                };
                if (mounted) {
                  setAnalysis(merged);
                  setIsAnalyzing(false);
                  setFromSavedToday(true); // render statically without typing
                  setTimeout(() => {
                    if (mounted) {
                      const painScore = memoizedCheckInData?.pain ?? 0;
                      const allow = merged.severity !== 'low' || painScore >= 4;
                      if (allow && merged.suggestions.length > 0) setShowSuggestions(true);
                    }
                  }, 1200);
                  return; // Use saved message with computed structure
                }
                }
              }
            }
          }
        } catch (e) {
          // Ignore and fall back to generating
        }

        // 2) Fallback: analyze on the fly (e.g., first ever load without saved message)
        const result = await analyzeSymptomsAction(memoizedCheckInData, userName);
        const tagRecs = deriveSuggestionsFromTags(memoizedCheckInData.tags || result?.detectedSymptoms as any);
        let mergedRecs = Array.from(new Set([...(result?.suggestions || []), ...tagRecs]))
          .filter(s => !/best day|best so far|today was your best|oct\s*\d{1,2}/i.test(s))
          .slice(0, 3);

        // Add only relevant fallbacks based on what was actually shared (scores/tags)
        if (mergedRecs.length < 2) {
          const mood = memoizedCheckInData?.mood ?? 5;
          const sleep = memoizedCheckInData?.sleep ?? memoizedCheckInData?.sleep_quality ?? 5;
          const pain = memoizedCheckInData?.pain ?? 0;
          const tags = memoizedCheckInData?.tags || [];
          const fallbacks: string[] = [];
          if (sleep <= 4 || tags.includes('poor_sleep_last_night') || tags.includes('poor_sleep')) {
            fallbacks.push('Protect tonight’s sleep (wind‑down, consistent bedtime)');
          }
          if (pain >= 6 || tags.includes('muscle_pain') || tags.includes('joint_pain')) {
            fallbacks.push('Gentle movement + heat/ice as tolerated; avoid overexertion');
          }
          if (mood <= 4 || tags.includes('high_stress') || tags.includes('anxiety')) {
            fallbacks.push('Low‑energy self‑care: 5‑10 minute walk or breathing break');
          }
          if (tags.includes('alcohol_last_night') || tags.includes('hangover') || tags.includes('dehydrated')) {
            fallbacks.push('Hydrate with water + electrolytes and keep the day light');
          }
          mergedRecs = Array.from(new Set([...mergedRecs, ...fallbacks])).slice(0, 3);
        }
        
        if (mounted) {
          setAnalysis({ ...result, suggestions: mergedRecs });
          setIsAnalyzing(false);
          
          // Show only when we actually have relevant suggestions
          setTimeout(() => {
            if (mounted && mergedRecs.length > 0) {
              const painScore = memoizedCheckInData?.pain ?? 0;
              const shouldShow = (result.severity !== 'low') || painScore >= 4 || (tagRecs.length > 0);
              if (shouldShow) setShowSuggestions(true);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error analyzing symptoms:', error);
        if (mounted) {
          // Always show a minimal fallback so the card never disappears
          const { mood, sleep, pain } = memoizedCheckInData || { mood: 5, sleep: 5, pain: 0 };
          const fallback: SymptomAnalysis = {
            detectedSymptoms: [],
            primaryConcern: null,
            severity: 'low',
            empatheticResponse: `Thanks for checking in. Mood ${mood}/10, sleep ${sleep}/10, pain ${pain}/10. I'm tracking your data and will surface patterns as we learn more. Keep tracking - the more I know about you, the more we can find what helps.`,
            suggestions: []
          };
          setAnalysis(fallback);
          setIsAnalyzing(false);
        }
      }
    };

    performAnalysis();

    return () => {
      mounted = false;
    };
  }, [memoizedCheckInData, userName]);

  if (isAnalyzing) {
    return (
      <div className={`bg-purple-50 border border-purple-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Elli is analyzing your check-in...</span>
              <TypingIndicator />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  // Always show at least the empatheticResponse so the section isn't empty

  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="flex-1">
          {/* Main empathetic response */}
          <div className="mb-3">
            {fromSavedToday ? (
              <p className="text-gray-700 leading-relaxed text-[15px] sm:text-base">{analysis.empatheticResponse}</p>
            ) : (
              <SafeType
                text={analysis.empatheticResponse}
                speed={15}
                className="text-gray-700 leading-relaxed text-[15px] sm:text-base"
              />
            )}
          </div>

          {/* Detected symptoms (if any) */}
          {analysis.detectedSymptoms.length > 0 && (
            <div className="mb-3">
              {/* Removed label per request */}
              <div className="flex flex-wrap gap-1">
                {analysis.detectedSymptoms.slice(0, 5).map((symptom, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {symptom}
                  </span>
                ))}
                {analysis.detectedSymptoms.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{analysis.detectedSymptoms.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Gentle suggestions - show only when severity warrants or pain is elevated */}
          {showSuggestions && analysis.suggestions.length > 0 && ((analysis.severity !== 'low') || ((memoizedCheckInData?.pain ?? 0) >= 4)) && (
            <div className="border-t border-purple-200 pt-3 mt-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">Some things that might help:</p>
              <ul className="space-y-1.5">
                {analysis.suggestions
                  .filter(s => !/best day|best so far|today was your best|oct\s*\d{1,2}/i.test(s))
                  .map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                    <span className="mt-0.5">
                      {/^travel|airport|flight/i.test(suggestion) ? '🛫️' :
                       /^sleep|bed|rest/i.test(suggestion) ? '🛌' :
                       /^stress|breathe|calm|meditat/i.test(suggestion) ? '🧘' :
                       /^hydrate|water|drink/i.test(suggestion) ? '💧' :
                       /^food|meal|protein|carb|sugar/i.test(suggestion) ? '🍽️' :
                       /^walk|move|stretch|yoga|exercise/i.test(suggestion) ? '🏃' :
                       /^sauna|cold|ice|heat/i.test(suggestion) ? '🧊' :
                       '🔸'}
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Removed non-functional chat hint */}
        </div>
      </div>
    </div>
  );
}
