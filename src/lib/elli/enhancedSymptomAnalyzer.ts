/**
 * ENHANCED SYMPTOM ANALYZER
 * 
 * Integrates comprehensive pattern analysis with the existing symptom analyzer
 * Uses two-tier data retrieval, smart summarization, and rate limiting
 * Generates contextual responses based on milestone, patterns, and user category
 */

'use server';

import OpenAI from 'openai';
import { getQuickContext } from './getQuickContext';
import { getFullContext, isMilestone, getMilestoneType } from './getFullContext';
import { analyzePatterns } from './analyzePatterns';
import { summarizeForOpenAI, buildPromptFromSummary } from './summarizeContext';
import { decideTrigger, hasSignificantPattern } from './messageTriggers';
import { getToneProfile } from './toneProfiles';
import type { SymptomAnalysis, CheckInData } from './symptomAnalyzer';
import { analyzeSymptoms as fallbackAnalyzeSymptoms } from './symptomAnalyzer';

// Initialize OpenAI client
const openai = typeof window === 'undefined' && process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * Enhanced symptom analysis with comprehensive pattern detection
 * Uses quick context for daily comments, full context for milestones
 */
export async function analyzeWithFullContext(
  userId: string,
  todaysCheckIn: CheckInData,
  userName: string = 'there'
): Promise<SymptomAnalysis> {
  
  try {
    // 1. Get quick context first (fast query)
    const quickContext = await getQuickContext(userId);
    const checkInCount = quickContext.daysOfTracking;
    
    console.log(`🔍 Analyzing check-in for ${userName} (day ${checkInCount})`);
    
    // 2. Decide on trigger type (daily vs milestone vs pattern discovery)
    // Determine if the user has already checked in today to prevent duplicate
    // "first check-in" milestones or repeated milestone messaging on same day
    const hasCheckedInToday = await hasUserCheckedInToday();
    const triggerDecision = await decideTrigger(userId, checkInCount, false, hasCheckedInToday);
    
    console.log(`📊 Trigger decision:`, triggerDecision);
    
    // 3. QUICK COMMENT (daily check-in)
    if (triggerDecision.triggerType === 'daily_comment') {
      // Use lightweight fallback analyzer
      console.log('💬 Using quick daily comment (template-based)');
      return await fallbackAnalyzeSymptoms(todaysCheckIn, userName);
    }
    
    // 4. MILESTONE OR PATTERN DISCOVERY (deep analysis)
    if (triggerDecision.triggerType === 'milestone' || 
        triggerDecision.triggerType === 'pattern_discovery' ||
        triggerDecision.triggerType === 'weekly_summary') {
      
      console.log(`🎯 Milestone/Pattern detection - using full context`);
      
      // Get full context (expensive query)
      const fullContext = await getFullContext(userId);
      
      // Analyze all patterns
      const patterns = analyzePatterns(fullContext);
      
      console.log(`📈 Patterns detected:`, {
        sleepPain: patterns.sleepPainCorrelation.hasCorrelation,
        trends: patterns.trends.length,
        insights: patterns.insights.length,
      });
      
      // Check if patterns are significant
      const hasSignificant = hasSignificantPattern({
        sleepPainCorrelation: patterns.sleepPainCorrelation,
        trends: patterns.trends,
      });
      
      // Update trigger decision if significant patterns found
      if (hasSignificant && triggerDecision.triggerType === 'daily_comment') {
        const patternTrigger = await decideTrigger(userId, checkInCount, true);
        if (patternTrigger.useAI) {
          triggerDecision.useAI = true;
          triggerDecision.triggerType = 'pattern_discovery';
        }
      }
      
      // 5. Generate message (AI or template)
      if (triggerDecision.useAI && openai) {
        return await generateAIResponse(fullContext, patterns, todaysCheckIn, triggerDecision.triggerType);
      } else {
        return await generateTemplateResponse(fullContext, patterns, todaysCheckIn, triggerDecision.triggerType);
      }
    }
    
    // Fallback
    return await fallbackAnalyzeSymptoms(todaysCheckIn, userName);
    
  } catch (error) {
    console.error('Error in enhanced symptom analyzer:', error);
    // Always fallback to basic analyzer
    return await fallbackAnalyzeSymptoms(todaysCheckIn, userName);
  }
}

/**
 * Generate AI-powered response using OpenAI
 */
async function generateAIResponse(
  fullContext: any,
  patterns: any,
  todaysCheckIn: CheckInData,
  messageType: 'milestone' | 'pattern_discovery' | 'weekly_summary'
): Promise<SymptomAnalysis> {
  
  if (!openai) {
    console.warn('OpenAI not configured, using template fallback');
    return generateTemplateResponse(fullContext, patterns, todaysCheckIn, messageType);
  }
  
  try {
    // Summarize context for OpenAI
    const summary = summarizeForOpenAI(fullContext, patterns, 'full');
    
    // Add milestone info if applicable
    if (messageType === 'milestone') {
      summary.milestoneType = getMilestoneType(fullContext.allCheckIns.length) || undefined;
    }
    
    // Build prompt
    const userPrompt = buildPromptFromSummary(summary, messageType);
    
    // Get tone profile for system prompt
    const toneProfile = getToneProfile(fullContext.user.condition_category);
    
    console.log(`🤖 Calling OpenAI for ${messageType} message...`);
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: toneProfile.systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });
    
    const messageText = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    
    console.log(`✅ OpenAI response received (${tokensUsed} tokens)`);
    
    // Ensure message ends with tracking encouragement
    let empatheticResponse = messageText.trim();
    if (!empatheticResponse.includes('Keep tracking')) {
      empatheticResponse += ' Keep tracking - the more I know about you, the more we can find what helps.';
    }
    
    return {
      detectedSymptoms: todaysCheckIn.tags || [],
      primaryConcern: null,
      severity: determineSeverity(todaysCheckIn),
      empatheticResponse,
      suggestions: patterns.insights.slice(0, 2) || ['Keep tracking your patterns'],
    };
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    return generateTemplateResponse(fullContext, patterns, todaysCheckIn, messageType);
  }
}

/**
 * Helper: has the user already checked in today?
 * Uses a lightweight fetch to the today endpoint. Fallback to false on error.
 */
async function hasUserCheckedInToday(): Promise<boolean> {
  try {
    const res = await fetch('/api/mood/today', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.data?.id; // any row for today
  } catch {
    return false;
  }
}

/**
 * Generate template-based response (fallback)
 */
async function generateTemplateResponse(
  fullContext: any,
  patterns: any,
  todaysCheckIn: CheckInData,
  messageType: 'milestone' | 'pattern_discovery' | 'weekly_summary' | 'daily_comment'
): Promise<SymptomAnalysis> {
  
  const { user, allCheckIns } = fullContext;
  const { pain, mood, sleep } = todaysCheckIn;
  
  let empatheticResponse = '';
  const suggestions: string[] = [];
  
  // MILESTONE TEMPLATE
  if (messageType === 'milestone') {
    const milestoneName = getMilestoneType(allCheckIns.length);
    
    if (allCheckIns.length === 3) {
      empatheticResponse = `${user.first_name}, day 3. You came back. Most people quit by now. You didn't. `;
    } else if (allCheckIns.length === 7) {
      empatheticResponse = `${user.first_name}, a full week. Seven days of tracking. `;
    } else if (allCheckIns.length === 14) {
      empatheticResponse = `${user.first_name}, two weeks in. That's real commitment. `;
    } else if (allCheckIns.length === 30) {
      empatheticResponse = `${user.first_name}, one month. Thirty days of showing up. `;
    } else {
      empatheticResponse = `${user.first_name}, ${milestoneName}. `;
    }
    
    // Add pattern insight if available
    if (patterns.sleepPainCorrelation.hasCorrelation) {
      empatheticResponse += `Here's what I'm seeing: your pain drops to ${patterns.sleepPainCorrelation.avgPainHighSleep}/10 when you sleep well, `;
      empatheticResponse += `but spikes to ${patterns.sleepPainCorrelation.avgPainLowSleep}/10 on poor sleep nights. `;
      empatheticResponse += `That's a ${Math.abs(patterns.sleepPainCorrelation.difference).toFixed(1)} point difference. `;
    }
    
    empatheticResponse += `Keep tracking - the more I know about you, the more we can find what helps.`;
    
    if (patterns.insights.length > 0) {
      suggestions.push(...patterns.insights.slice(0, 2));
    }
  }
  
  // PATTERN DISCOVERY TEMPLATE
  else if (messageType === 'pattern_discovery') {
    empatheticResponse = `${user.first_name}, I noticed something important: `;
    
    if (patterns.sleepPainCorrelation.hasCorrelation) {
      empatheticResponse += `On the days you sleep 7+ hours, your pain averages ${patterns.sleepPainCorrelation.avgPainHighSleep}/10. `;
      empatheticResponse += `On poor sleep nights, it jumps to ${patterns.sleepPainCorrelation.avgPainLowSleep}/10. `;
      empatheticResponse += `Worth protecting your sleep when you can. Keep tracking to confirm this pattern.`;
    } else if (patterns.trends.length > 0) {
      const trend = patterns.trends[0];
      empatheticResponse += `Your ${trend.metric} is ${trend.direction} by ${trend.changeAmount} points over the last week. `;
      empatheticResponse += `Keep tracking to see if this continues.`;
    }
    
    suggestions.push('Monitor sleep quality closely');
    suggestions.push('Note what helps on better days');
  }
  
  // WEEKLY SUMMARY TEMPLATE
  else if (messageType === 'weekly_summary') {
    empatheticResponse = `${user.first_name}, week in review: `;
    
    if (patterns.bestDay && patterns.worstDay) {
      empatheticResponse += `Best day was ${formatDate(patterns.bestDay.date)} (pain ${patterns.bestDay.pain}/10). `;
      empatheticResponse += `Toughest was ${formatDate(patterns.worstDay.date)} (pain ${patterns.worstDay.pain}/10). `;
    }
    
    if (patterns.trends.length > 0) {
      const trend = patterns.trends[0];
      empatheticResponse += `Overall, ${trend.metric} is ${trend.direction}. `;
    }
    
    empatheticResponse += `Keep tracking - patterns are getting clearer.`;
    
    suggestions.push('Focus on consistency this week');
    suggestions.push('Note what made good days different');
  }
  
  return {
    detectedSymptoms: todaysCheckIn.tags || [],
    primaryConcern: null,
    severity: determineSeverity(todaysCheckIn),
    empatheticResponse,
    suggestions,
  };
}

/**
 * Determine severity level
 */
function determineSeverity(checkInData: CheckInData): 'low' | 'moderate' | 'high' {
  const { pain, mood, sleep } = checkInData;
  
  if (pain >= 8 || mood <= 3 || sleep <= 3) {
    return 'high';
  }
  
  if (pain >= 6 || mood <= 5 || sleep <= 5) {
    return 'moderate';
  }
  
  return 'low';
}

/**
 * Utility: Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

