'use server';

import { analyzeSymptoms, CheckInData, SymptomAnalysis } from '@/lib/elli/symptomAnalyzer';
import { analyzeWithFullContext } from '@/lib/elli/enhancedSymptomAnalyzer';
import { createClient } from '@/lib/supabase/server';

/**
 * Server action to analyze symptoms using AI
 * This runs on the server side where OpenAI API key is available
 */
export async function analyzeSymptomsAction(
  checkInData: CheckInData,
  userName: string = 'there'
): Promise<SymptomAnalysis> {
  try {
    // Try to resolve the authenticated user for full-context analysis
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      return await analyzeWithFullContext(user.id, checkInData, userName);
    }

    // Fallback to lightweight analyzer if no user context is available
    return await analyzeSymptoms(checkInData, userName);
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    // Return fallback analysis if AI fails
    return {
      detectedSymptoms: [],
      primaryConcern: null,
      severity: 'low' as const,
      empatheticResponse: `Hey ${userName}, thanks for checking in. I'm here to help you track your patterns.`,
      suggestions: []
    };
  }
}
