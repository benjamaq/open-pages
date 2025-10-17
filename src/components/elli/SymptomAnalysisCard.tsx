'use client';

import { useState, useEffect, useMemo } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from './TypingIndicator';
import { analyzeSymptomsAction } from '@/lib/actions/analyze-symptoms';
import type { CheckInData, SymptomAnalysis } from '@/lib/elli/symptomAnalyzer';

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
                const merged: SymptomAnalysis = {
                  detectedSymptoms: computed?.detectedSymptoms || [],
                  primaryConcern: computed?.primaryConcern || null,
                  severity: computed?.severity || 'low',
                  empatheticResponse: msg.message_text,
                  suggestions: computed?.suggestions || []
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
        
        if (mounted) {
          setAnalysis(result);
          setIsAnalyzing(false);
          
          // Show suggestions after a delay (only if meaningful)
          setTimeout(() => {
            if (mounted && result) {
              const painScore = memoizedCheckInData?.pain ?? 0;
              const allow = result.severity !== 'low' || painScore >= 4;
              if (allow && result.suggestions.length > 0) setShowSuggestions(true);
            }
          }, 3000);
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
          <span className="text-2xl">💙</span>
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
        <span className="text-3xl sm:text-4xl">💙</span>
        <div className="flex-1">
          {/* Main empathetic response */}
          <div className="mb-3">
            {fromSavedToday ? (
              <p className="text-gray-700 leading-relaxed text-[15px] sm:text-base">{analysis.empatheticResponse}</p>
            ) : (
              <TypeAnimation
                sequence={[analysis.empatheticResponse]}
                speed={35}
                wrapper="p"
                className="text-gray-700 leading-relaxed text-[15px] sm:text-base"
                cursor={false}
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
