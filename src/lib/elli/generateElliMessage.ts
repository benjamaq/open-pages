/**
 * Generate Elli Messages using OpenAI
 * Falls back to templates if OpenAI fails
 */

import OpenAI from 'openai';
import { ELLI_SYSTEM_PROMPT, buildUserPrompt } from './elliPrompts';
import type { ToneProfileType } from './toneProfiles';
import { 
  getPostCheckInTemplate, 
  getDashboardTemplate, 
  getMilestoneTemplate 
} from './elliTemplates';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ElliContext {
  userName: string;
  condition?: {
    primary: string;
    details?: string;
  };
  checkIn: {
    pain: number;
    mood: number;
    sleep: number;
  };
  readinessToday?: number; // 0-100
  readinessYesterday?: number | null; // 0-100 or null when none
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  supplements?: Array<{ name: string }>;
  streak?: number;
  previousCheckIns?: any[];
  daysOfTracking: number;
  flags?: {
    newSleepPattern?: boolean;
    newTrendWarning?: boolean;
    newGoodNews?: boolean;
    hasAnyNewPatterns?: boolean;
  };
  factors?: {
    symptoms?: string[];
    lifestyle_factors?: string[];
  };
  primaryInsight?: {
    type?: string;
    topLine?: string;
    discovery?: string;
    action?: string;
    icon?: string;
    insight_key?: string;
  } | null;
  toneProfile?: ToneProfileType;
}

/**
 * Generate an Elli message using OpenAI (or fallback to templates)
 */
export async function generateElliMessage(
  messageType: 'post_checkin' | 'post_supplement' | 'dashboard' | 'milestone',
  context: ElliContext
): Promise<string> {
  
  // For day 1 users, force concise, name-addressed template to avoid over-claims
  const days = context?.daysOfTracking ?? 0;
  if ((messageType === 'post_checkin' || messageType === 'milestone') && days <= 1) {
    return getTemplateFallback('post_checkin', context);
  }

  // If OpenAI is not configured, use templates
  if (!openai) {
    console.log('OpenAI not configured, using template fallback');
    return getTemplateFallback(messageType, context);
  }
  
  // For post_supplement, always use template (don't need AI for this)
  if (messageType === 'post_supplement') {
    return getTemplateFallback(messageType, context);
  }
  
  try {
    // Map message type to prompt type
    const promptType = messageType === 'post_checkin' ? 'post_checkin' :
                      messageType === 'milestone' ? 'milestone' :
                      'dashboard';
    
    const userPrompt = buildUserPrompt(promptType, context);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency
      messages: [
        // Balanced default; if toneProfile is extreme, the user prompt already constrains content.
        { role: 'system', content: ELLI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 320,
      temperature: 0.6, // Slightly steadier, reduces over-empathy verbosity
    });
    
    let message = response.choices[0]?.message?.content || '';
    
    // If OpenAI returns empty, use template
    if (!message.trim()) {
      return ensurePainMention(getTemplateFallback(messageType, context), context);
    }
    
    message = message.trim();
    message = sanitizeMessage(ensurePainMention(maybePrependGreeting(message, context), context), context);
    message = enforceBalancedLength(message, context);

    // Append pattern flag as P.S. (non-duplicative and short)
    const flags = context.flags || {};
    if (flags.hasAnyNewPatterns || flags.newSleepPattern || flags.newTrendWarning || flags.newGoodNews) {
      let ps = 'P.S. We discovered some patterns about your pain. See below. 👇';
      if (flags.newSleepPattern) {
        ps = 'P.S. We just found your biggest pain lever — sleep. See below. 👇';
      } else if (flags.newTrendWarning) {
        ps = 'P.S. Your pain is climbing this week — take a look below. 👇';
      } else if (flags.newGoodNews) {
        ps = `P.S. You're improving — see what’s working below. 👇`;
      }
      message = `${message}\n\n${ps}`;
    }
    return message;
    
  } catch (error) {
    console.error('Error generating Elli message with OpenAI:', error);
    // Fall back to templates on error
    return getTemplateFallback(messageType, context);
  }
}

/**
 * Template-based fallback if OpenAI fails or is unavailable
 */
function getTemplateFallback(
  messageType: string, 
  context: ElliContext
): string {
  
  if (messageType === 'post_checkin') {
    return enforceBalancedLength(
      sanitizeMessage(ensurePainMention(getPostCheckInTemplate(context), context), context),
      context
    );
  }
  
  if (messageType === 'milestone') {
    return enforceBalancedLength(
      sanitizeMessage(getMilestoneTemplate(context), context),
      context
    );
  }
  
  if (messageType === 'dashboard' || messageType === 'post_supplement') {
    return enforceBalancedLength(
      sanitizeMessage(ensurePainMention(getDashboardTemplate(context), context), context),
      context
    );
  }
  
  // Ultimate fallback
  return enforceBalancedLength(
    sanitizeMessage(ensurePainMention("I'm here watching your journey.", context), context),
    context
  );
}

/**
 * Ensure pain is explicitly referenced when pain > 0
 */
function ensurePainMention(message: string, context: ElliContext): string {
  try {
    const pain = context?.checkIn?.pain ?? 0;
    if (typeof pain === 'number' && pain > 0) {
      const mentionsPain = /\bpain\b/i.test(message);
      if (!mentionsPain) {
        return `Pain at ${pain}/10. ${message}`;
      }
    }
    return message;
  } catch {
    return message;
  }
}

/**
 * Ensure message is at least ~4 sentences; append gentle, empathetic lines if too short.
 */
function enforceBalancedLength(message: string, context: ElliContext): string {
  try {
    const sentences = message
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
    // Balanced default: 3–5 sentences. If longer than 5, trim gently. If shorter than 3, append concise, action-forward lines.
    if (sentences.length > 5) {
      return sentences.slice(0, 5).join(' ');
    }
    if (sentences.length >= 3) return message;

    const { pain, mood, sleep } = context.checkIn || { pain: 0, mood: 0, sleep: 0 };
    const extras: string[] = [];
    // Action-forward, concise add-ons
    if (typeof pain === 'number') extras.push(`Noted pain ${pain}/10; I’ll watch what changes it.`);
    if (typeof sleep === 'number') extras.push(`Sleep ${sleep}/10 is a key lever; I’ll track what improves it.`);
    if (typeof mood === 'number') extras.push(`Mood ${mood}/10 noted; I’ll look for repeatable lifts.`);
    extras.push(`One step at a time—I'll surface the clearest next lever.`);

    const needed = Math.max(0, 4 - sentences.length);
    const toAppend = extras.slice(0, needed).join(' ');
    return toAppend ? `${message.trim()} ${toAppend}` : message;
  } catch {
    return message;
  }
}

function maybePrependGreeting(message: string, context: ElliContext): string {
  try {
    if (!context?.timeOfDay || !context?.userName) return message;
    const hasGreeting = /\b(good\s+morning|evening|hey\b)/i.test(message);
    if (hasGreeting) return message;
    const name = context.userName;
    const greeting = context.timeOfDay === 'morning'
      ? `Good morning, ${name}! Welcome back.`
      : context.timeOfDay === 'afternoon'
      ? `Hey ${name}! How's your day going so far?`
      : `Evening, ${name}! Let's check in.`;
    return `${greeting}\n\n${message}`;
  } catch {
    return message;
  }
}

/**
 * Sanitize content based on context to avoid incorrect claims (first day, chat invites, absolute dates)
 */
function sanitizeMessage(message: string, context: ElliContext): string {
  let result = message;

  try {
    const days = context?.daysOfTracking ?? 0;
    const prevLen = context?.previousCheckIns?.length ?? 0;

    // On Day 1 (or no history), remove over-claims and first-day references
    if (days <= 1 || prevLen === 0) {
      result = result
        .replace(/[^.!?]*pattern[s]?[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*(came\s+back|back\s+today|back\s+again|kept\s+showing\s+up|most\s+people\s+quit)[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*first\s+(check[-\s]?in|day)[^.!?]*[.!?]/gi, '');
    }

    // GLOBAL hard block: never allow "best day"/"best so far" claims, ever
    result = result
      .replace(/[^.!?]*\b(best\s+day|best\s+so\s+far|best\s+day\s+so\s+far|today\s+(?:is|was)\s+(?:your\s+)?best)[^.!?]*[.!?]/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Never call pain "best" or set numeric pain goals
    result = result
      .replace(/[^.!?]*\bbest\s+pain[^.!?]*[.!?]/gi, '')
      .replace(/\b(to|toward|towards)\s+a\s*([0-9]{1,2})\/10\s+in\s+pain\b/gi, 'to lower pain')
      .replace(/\bto\s+a\s*([0-9]{1,2})\/10\s+in\s+pain\s+and\s+mood\b/gi, 'to lower pain and a steadier mood');

    // Never invite chat or sharing details (no chat UI yet)
    result = result
      .replace(/[^.!?]*(don['’]t\s+hesitate\s+to\s+share|share\s+any\s+details|talk\s+to\s+me|reach\s+out)[^.!?]*[.!?]/gi, '');

    // Replace absolute references to today's date with "today" (rough heuristic)
    const now = new Date();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const month = monthNames[now.getMonth()];
    const day = now.getDate();
    const dateRegex = new RegExp(`${month}\\s+${day}(?:st|nd|rd|th)?`, 'gi');
    result = result.replace(dateRegex, 'today');

    // Collapse extra spaces after removals
    result = result.replace(/\s{2,}/g, ' ').trim();
  } catch {
    // If anything fails, return the original
  }

  return result;
}

