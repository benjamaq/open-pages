/**
 * Generate Elli Messages using OpenAI
 * Falls back to templates if OpenAI fails
 */

import OpenAI from 'openai';
import { ELLI_SYSTEM_PROMPT, buildUserPrompt } from './elliPrompts';
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
}

/**
 * Generate an Elli message using OpenAI (or fallback to templates)
 */
export async function generateElliMessage(
  messageType: 'post_checkin' | 'post_supplement' | 'dashboard' | 'milestone',
  context: ElliContext
): Promise<string> {
  
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
        { role: 'system', content: ELLI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 450,
      temperature: 0.8, // Warm but stable
    });
    
    let message = response.choices[0]?.message?.content || '';
    
    // If OpenAI returns empty, use template
    if (!message.trim()) {
      return ensurePainMention(getTemplateFallback(messageType, context), context);
    }
    
    message = message.trim();
    message = sanitizeMessage(ensurePainMention(maybePrependGreeting(message, context), context), context);
    message = ensureMinimumSentences(message, context);

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
    return ensureMinimumSentences(
      sanitizeMessage(ensurePainMention(getPostCheckInTemplate(context), context), context),
      context
    );
  }
  
  if (messageType === 'milestone') {
    return ensureMinimumSentences(
      sanitizeMessage(getMilestoneTemplate(context), context),
      context
    );
  }
  
  if (messageType === 'dashboard' || messageType === 'post_supplement') {
    return ensureMinimumSentences(
      sanitizeMessage(ensurePainMention(getDashboardTemplate(context), context), context),
      context
    );
  }
  
  // Ultimate fallback
  return ensureMinimumSentences(
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
function ensureMinimumSentences(message: string, context: ElliContext): string {
  try {
    const sentences = message
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
    if (sentences.length >= 4) return message;

    const { pain, mood, sleep } = context.checkIn || { pain: 0, mood: 0, sleep: 0 };
    const extras: string[] = [];
    if (typeof pain === 'number') {
      extras.push(`I'm tracking how pain at ${pain}/10 interacts with your sleep and mood.`);
    }
    if (typeof sleep === 'number') {
      extras.push(`Sleep at ${sleep}/10 can shift how the whole day feels; I'll watch for what improves it.`);
    }
    if (typeof mood === 'number') {
      extras.push(`Mood at ${mood}/10 matters too—I'll note what lifts it on better days.`);
    }
    extras.push(`Keep tracking—each day adds signal, and together we'll see what actually helps you.`);

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

    // On Day 1 (or no history), remove claims about "best day", "patterns", and similar
    if (days <= 1 || prevLen === 0) {
      result = result
        .replace(/[^.!?]*best day[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*best\s+so\s+far[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*best\s+day\s+so\s+far[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*today\s+is\s+(?:your\s+)?best[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*\bbest\b[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*pattern[s]?[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*(came\s+back|back\s+today|back\s+again|kept\s+showing\s+up|most\s+people\s+quit)[^.!?]*[.!?]/gi, '');
      // Also remove any sentence explicitly referencing "first check-in" or "first day"
      result = result
        .replace(/[^.!?]*first\s+(check[-\s]?in|day)[^.!?]*[.!?]/gi, '');
    }

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

