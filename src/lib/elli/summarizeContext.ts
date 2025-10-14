/**
 * SMART DATA SUMMARIZATION FOR OPENAI
 * 
 * Converts full context into token-efficient summaries
 * Prioritizes data based on user category
 * Stays within token limits while maximizing insight
 */

import type { FullContext } from './getFullContext';
import type { ComprehensivePatterns } from './analyzePatterns';
import { getPriorityDataSources, shouldIncludeDataSource } from './dataPriorities';
import type { ToneProfileType } from './toneProfiles';

export interface OpenAISummary {
  userName: string;
  toneProfile: ToneProfileType;
  daysOfTracking: number;
  milestoneType?: string;
  
  // Core metrics (always included)
  recentCheckIns: Array<{
    date: string;
    pain: number;
    mood: number;
    sleep: number;
    topSymptoms?: string[];
    notePreview?: string;
  }>;
  
  // Calculated patterns (always included)
  patterns: {
    sleepPainCorrelation?: string;
    sleepMoodCorrelation?: string;
    trends?: string[];
    bestWorstDays?: string;
  };
  
  // Priority-based data (varies by category)
  supplements?: string[];
  exerciseInsights?: string[];
  treatments?: string[];
  wearableData?: string;
  
  // Key insights (generated from pattern analysis)
  keyInsights: string[];
  
  // Previous messages (to avoid repetition)
  recentMessages?: string[];
}

/**
 * Summarize full context for OpenAI consumption
 * Optimized to stay under token limits (~2000 tokens for full analysis)
 */
export function summarizeForOpenAI(
  fullContext: FullContext,
  patterns: ComprehensivePatterns,
  tokenBudget: 'minimal' | 'standard' | 'full' = 'standard'
): OpenAISummary {
  const { user, recentCheckIns, allCheckIns, supplements, exercises, recentMessages } = fullContext;
  const priorities = getPriorityDataSources(user.tone_profile);
  
  // 1. Core metrics (always included, last 7 check-ins max)
  const checkInsToInclude = tokenBudget === 'minimal' ? recentCheckIns.slice(0, 3) : recentCheckIns;
  const recentCheckInsSummary = checkInsToInclude.map(c => ({
    date: c.date,
    pain: c.pain,
    mood: c.mood,
    sleep: c.sleep_quality,
    topSymptoms: c.tags?.slice(0, 3), // Top 3 symptoms only
    notePreview: c.journal?.substring(0, 100), // First 100 chars
  }));
  
  // 2. Pattern summaries (text format, not raw data)
  const patternSummaries: OpenAISummary['patterns'] = {};
  
  if (patterns.sleepPainCorrelation.hasCorrelation) {
    patternSummaries.sleepPainCorrelation = 
      `Pain averages ${patterns.sleepPainCorrelation.avgPainHighSleep}/10 on high sleep nights ` +
      `vs ${patterns.sleepPainCorrelation.avgPainLowSleep}/10 on poor sleep ` +
      `(${patterns.sleepPainCorrelation.sampleSize} days tracked, ` +
      `${patterns.sleepPainCorrelation.confidence} confidence)`;
  }
  
  if (patterns.sleepMoodCorrelation.hasCorrelation) {
    patternSummaries.sleepMoodCorrelation =
      `Mood improves by ${Math.abs(patterns.sleepMoodCorrelation.difference || 0).toFixed(1)} points ` +
      `on good sleep nights`;
  }
  
  if (patterns.trends.length > 0) {
    patternSummaries.trends = patterns.trends
      .filter(t => t.direction !== 'stable')
      .map(t => `${capitalizeFirst(t.metric)} is ${t.direction} by ${t.changeAmount} points`);
  }
  
  if (patterns.bestDay && patterns.worstDay) {
    // Avoid concrete calendar dates; use relative phrasing for recency
    const bestLabel = relativeDayLabel(patterns.bestDay.date);
    const worstLabel = relativeDayLabel(patterns.worstDay.date);
    patternSummaries.bestWorstDays =
      `Best day: ${bestLabel} (pain ${patterns.bestDay.pain}/10). ` +
      `Toughest: ${worstLabel} (pain ${patterns.worstDay.pain}/10)`;
  }
  
  // 3. Priority-based data (only if relevant to user category)
  const supplementsList = shouldIncludeDataSource('supplements', user.tone_profile, tokenBudget)
    ? supplements.map(s => `${s.name}${s.dosage ? ` (${s.dosage})` : ''}`).slice(0, 5)
    : undefined;
  
  const exerciseInsightsList = shouldIncludeDataSource('exercise', user.tone_profile, tokenBudget) && patterns.exerciseImpact.length > 0
    ? patterns.exerciseImpact
        .slice(0, 3)
        .map(e => `${e.exerciseType}: ${e.sessions} sessions, avg mood ${e.avgMoodAfter}/10`)
    : undefined;
  
  // 4. Recent messages (to avoid repetition)
  const recentMessagesList = tokenBudget !== 'minimal'
    ? recentMessages.map(m => m.message_text.substring(0, 150)).slice(0, 2)
    : undefined;
  
  // 5. Key insights (most important findings)
  const keyInsights = patterns.insights.slice(0, 5); // Top 5 insights only
  
  return {
    userName: user.first_name,
    toneProfile: user.tone_profile,
    daysOfTracking: allCheckIns.length,
    recentCheckIns: recentCheckInsSummary,
    patterns: patternSummaries,
    supplements: supplementsList,
    exerciseInsights: exerciseInsightsList,
    keyInsights,
    recentMessages: recentMessagesList,
  };
}

/**
 * Build OpenAI prompt from summary
 */
export function buildPromptFromSummary(
  summary: OpenAISummary,
  messageType: 'milestone' | 'pattern_discovery' | 'weekly_summary'
): string {
  let prompt = `Generate an Elli message for ${summary.userName}.\n\n`;
  
  // Context
  prompt += `USER CONTEXT:\n`;
  prompt += `- Tone profile: ${summary.toneProfile}\n`;
  prompt += `- Days of tracking: ${summary.daysOfTracking}\n`;
  if (summary.milestoneType) {
    prompt += `- Milestone: ${summary.milestoneType}\n`;
  }
  prompt += `\n`;
  
  // Recent check-ins
  prompt += `RECENT CHECK-INS (last ${summary.recentCheckIns.length} days):\n`;
  for (const checkIn of summary.recentCheckIns) {
    prompt += `- ${checkIn.date}: Pain ${checkIn.pain}/10, Mood ${checkIn.mood}/10, Sleep ${checkIn.sleep}/10`;
    if (checkIn.topSymptoms && checkIn.topSymptoms.length > 0) {
      prompt += ` [${checkIn.topSymptoms.join(', ')}]`;
    }
    if (checkIn.notePreview) {
      prompt += ` "${checkIn.notePreview}"`;
    }
    prompt += `\n`;
  }
  prompt += `\n`;
  
  // Patterns discovered
  if (Object.keys(summary.patterns).length > 0) {
    prompt += `PATTERNS DETECTED:\n`;
    if (summary.patterns.sleepPainCorrelation) {
      prompt += `- Sleep-Pain: ${summary.patterns.sleepPainCorrelation}\n`;
    }
    if (summary.patterns.sleepMoodCorrelation) {
      prompt += `- Sleep-Mood: ${summary.patterns.sleepMoodCorrelation}\n`;
    }
    if (summary.patterns.trends) {
      for (const trend of summary.patterns.trends) {
        prompt += `- Trend: ${trend}\n`;
      }
    }
    if (summary.patterns.bestWorstDays) {
      prompt += `- ${summary.patterns.bestWorstDays}\n`;
    }
    prompt += `\n`;
  }
  
  // Interventions (if relevant)
  if (summary.supplements && summary.supplements.length > 0) {
    prompt += `SUPPLEMENTS: ${summary.supplements.join(', ')}\n\n`;
  }
  
  if (summary.exerciseInsights && summary.exerciseInsights.length > 0) {
    prompt += `EXERCISE:\n`;
    for (const insight of summary.exerciseInsights) {
      prompt += `- ${insight}\n`;
    }
    prompt += `\n`;
  }
  
  // Key insights
  if (summary.keyInsights.length > 0) {
    prompt += `KEY INSIGHTS:\n`;
    for (const insight of summary.keyInsights) {
      prompt += `- ${insight}\n`;
    }
    prompt += `\n`;
  }
  
  // Previous messages (avoid repetition)
  if (summary.recentMessages && summary.recentMessages.length > 0) {
    prompt += `RECENT MESSAGES (avoid repeating):\n`;
    for (const msg of summary.recentMessages) {
      prompt += `- "${msg}..."\n`;
    }
    prompt += `\n`;
  }
  
  // Message type instructions
  prompt += `MESSAGE TYPE: ${messageType}\n\n`;
  
  if (messageType === 'milestone') {
    prompt += `INSTRUCTIONS:\n`;
    prompt += `1. Celebrate the milestone genuinely\n`;
    prompt += `2. Share the most significant pattern(s) you detected\n`;
    prompt += `3. Reference specific numbers from the data\n`;
    prompt += `4. Be detailed (4-6 sentences)\n`;
    prompt += `5. End with encouragement to keep tracking\n`;
    prompt += `6. Match the tone profile (${summary.toneProfile})\n`;
  } else if (messageType === 'pattern_discovery') {
    prompt += `INSTRUCTIONS:\n`;
    prompt += `1. Start with "I noticed something important..."\n`;
    prompt += `2. Explain the pattern with specific numbers\n`;
    prompt += `3. Make it actionable (suggest testing it)\n`;
    prompt += `4. Be detailed but focused (3-4 sentences)\n`;
    prompt += `5. Match the tone profile (${summary.toneProfile})\n`;
  } else if (messageType === 'weekly_summary') {
    prompt += `INSTRUCTIONS:\n`;
    prompt += `1. Summarize the week's data\n`;
    prompt += `2. Highlight best and worst days\n`;
    prompt += `3. Note trends (improving/worsening/stable)\n`;
    prompt += `4. Suggest focus for next week\n`;
    prompt += `5. Be comprehensive (5-7 sentences)\n`;
    prompt += `6. Match the tone profile (${summary.toneProfile})\n`;
  }
  
  return prompt;
}

/**
 * Estimate token count for summary (rough approximation)
 * Average: 1 token ≈ 4 characters
 */
export function estimateTokenCount(summary: OpenAISummary): number {
  const prompt = buildPromptFromSummary(summary, 'milestone');
  return Math.ceil(prompt.length / 4);
}

/**
 * Utility: Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Relative label helper to avoid hard dates in same-day summaries
function relativeDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((today.setHours(0,0,0,0) as any) - (d.setHours(0,0,0,0) as any));
  const days = Math.round(diff / oneDay);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/**
 * Utility: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

