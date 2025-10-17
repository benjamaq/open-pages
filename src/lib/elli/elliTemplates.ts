/**
 * Elli Template Messages
 * Fallback messages when OpenAI is unavailable
 * Follow Elli's voice: warm, validating, grounded
 */

interface CheckIn {
  pain: number;
  mood: number;
  sleep: number;
}

interface TemplateContext {
  userName?: string;
  checkIn: CheckIn;
  condition?: {
    primary: string;
    details?: string;
  };
  daysOfTracking?: number;
  previousCheckIns?: any[];
}

/**
 * Post-check-in welcome message templates
 */
export function getPostCheckInTemplate(context: TemplateContext): string {
  const { checkIn, condition, userName, daysOfTracking, previousCheckIns } = context;
  const { pain, mood, sleep } = checkIn;
  const name = userName || 'there';
  const isFirstDay = !previousCheckIns || previousCheckIns.length === 0 || !daysOfTracking || daysOfTracking <= 1;
  
  // First day: warm baseline message (no “best day” claims)
  if (isFirstDay) {
    return `Hey ${name} — first check‑in saved. Pain ${pain}/10, mood ${mood}/10, sleep ${sleep}/10. Great baseline. I’ll watch the next few days and surface what actually moves the needle for you.`;
  }

  // High pain (8-10) - truly severe
  if (pain >= 8) {
    if (condition?.primary === 'Fibromyalgia') {
      return `Hey ${name}, I can see you're dealing with pain at ${pain}/10 today. Fibro is brutal. The fact that you're here? That takes courage.`;
    }
    if (condition?.primary === 'CFS / ME') {
      return `Hey ${name}, pain at ${pain}/10 today. CFS doesn't play fair. You showed up anyway. That takes courage.`;
    }
    return `Hey ${name}, I can see you're dealing with pain at ${pain}/10 today. That's brutal, and I'm really sorry you're going through this.\n\nThe fact that you're here? That takes courage.`;
  }
  
  // Medium-high pain (6-7) - managing but challenging
  if (pain >= 6) {
    return `Hey ${name}, I can see you logged pain at ${pain}/10 today. Managing, but not easy.\n\nThe fact that you're here? That takes courage.`;
  }
  
  // Medium pain (4-5)
  if (pain >= 4) {
    return `Hey ${name}, I can see you logged pain at ${pain}/10 today. Managing, but not easy.\n\nThe fact that you're here? That takes courage.`;
  }
  
  // Low pain (1-3)
  return `Hey ${name}, I can see today's a lighter pain day at ${pain}/10. I'll watch what's different.\n\nThe fact that you're here? That takes courage.`;
}

/**
 * Dashboard message templates
 */
export function getDashboardTemplate(context: TemplateContext): string {
  const { checkIn, daysOfTracking, previousCheckIns, condition, userName } = context;
  const { pain } = checkIn;
  const name = userName || 'there';
  
  // Day 1
  if (daysOfTracking === 1) {
    return `Hey ${name}, I'm watching your first few days. Pain at ${pain}/10 today. ${pain >= 7 ? "That's brutal." : "I'm building your record."} See you tomorrow.`;
  }
  
  // Day 2
  if (daysOfTracking === 2) {
    return `Hey ${name}, day 2. You came back. Pain at ${pain}/10 today${pain >= 7 ? ' - still tough' : ''}. I'm building your record. Patterns take a few days to emerge.`;
  }
  
  // Day 3 (critical threshold)
  if (daysOfTracking === 3) {
    return `Hey ${name}, day 3. You came back again. Most people quit by now. You didn't. Pain's been around ${pain}/10. I'm starting to see patterns forming. Give me a few more days.`;
  }
  
  // Day 7 (first milestone)
  if (daysOfTracking === 7) {
    if (previousCheckIns && previousCheckIns.length >= 5) {
      const avgPain = previousCheckIns.reduce((sum: any, c: any) => sum + (c.pain || 0), 0) / previousCheckIns.length;
      return `Hey ${name}, a week in. You did it. Pain averaging ${avgPain.toFixed(1)}/10. ${avgPain < pain ? 'Today is rougher.' : 'Some days better than others.'} Patterns are starting to emerge. Keep going.`;
    }
    return `Hey ${name}, a week. Most people quit after Day 2 or 3. You kept showing up even when pain was ${pain}/10. That's strength.`;
  }
  
  // Day 14
  if (daysOfTracking === 14) {
    return `Hey ${name}, two weeks. That's real commitment. Pain at ${pain}/10 today. I'm watching sleep, stress, and what helps. Patterns are clearer now.`;
  }
  
  // Day 30
  if (daysOfTracking === 30) {
    return `Hey ${name}, a month. That's a real record of your life. Good days, bad days, everything in between. You've built something valuable here. Keep going.`;
  }
  
  // Default daily message
  if (previousCheckIns && previousCheckIns.length > 0) {
    const lastCheckIn = previousCheckIns[0];
    if (lastCheckIn && pain > lastCheckIn.pain + 2) {
      return `Hey ${name}, pain spiked from ${lastCheckIn.pain}/10 to ${pain}/10. I'm tracking what's different today.`;
    }
    if (lastCheckIn && pain < lastCheckIn.pain - 2) {
      return `Hey ${name}, pain dropped from ${lastCheckIn.pain}/10 to ${pain}/10. That's progress.`;
    }
  }
  
  return `Hey ${name}, pain at ${pain}/10 today. ${daysOfTracking ? `Day ${daysOfTracking}.` : ''} I'm watching for patterns.`;
}

/**
 * Milestone message templates
 */
export function getMilestoneTemplate(context: TemplateContext): string {
  const { daysOfTracking, condition } = context;
  
  if (daysOfTracking === 3) {
    return `Day 3. You came back again. Most people quit by now. You didn't. ${condition?.primary ? `Living with ${condition.primary} and still showing up.` : ''} Keep going.`;
  }
  
  if (daysOfTracking === 7) {
    return `A week in. You did it. ${condition?.primary ? `Managing ${condition.primary} isn't easy.` : ''} Patterns are starting to emerge. Week 2 is when things get clearer.`;
  }
  
  if (daysOfTracking === 14) {
    return `Two weeks. That's real commitment. The more you track, the more I can help. You're building something valuable.`;
  }
  
  if (daysOfTracking === 30) {
    return `A month. That's a real record of your life. Good days, bad days, everything in between. This data matters.`;
  }
  
  return `Day ${daysOfTracking}. You keep coming back. That's harder than it sounds.`;
}

/**
 * Post-supplement message templates - with encouragement to add everything
 */
export function getPostSupplementTemplate(supplementName: string, condition?: string, userName?: string): string {
  const name = supplementName.toLowerCase();
  let openingLine = '';
  
  // Supplement-specific opening line
  if (name.includes('magnesium')) {
    openingLine = "Magnesium - that's a great start. I'll be watching how it affects your sleep and pain.";
  } else if (name.includes('ibuprofen') || name.includes('advil')) {
    openingLine = "Ibuprofen - okay, pain management. I'll be watching how long it takes to kick in and how much it helps.";
  } else if (name.includes('melatonin') || name.includes('sleep')) {
    openingLine = "Melatonin - sleep support. I'll be watching how it affects your sleep quality and next-day pain.";
  } else if (name.includes('vitamin d') || name.includes('vit d')) {
    openingLine = "Vitamin D - good. I'll be watching how it affects your energy and mood.";
  } else if (name.includes('cbd')) {
    openingLine = "CBD - interesting. I'll be watching how it affects your pain and anxiety levels.";
  } else if (name.includes('turmeric') || name.includes('curcumin')) {
    openingLine = "Turmeric - anti-inflammatory approach. I'll be watching how it affects your pain and inflammation.";
  } else if (name.includes('gabapentin') || name.includes('lyrica') || name.includes('prescription') || name.includes('medication')) {
    openingLine = `${supplementName} - I'll be watching how you feel while on it, and tracking any side effects.`;
  } else {
    openingLine = `${supplementName} - that's a great start. I'll be watching how it affects your pain, sleep, and overall wellbeing.`;
  }
  
  // Full message with encouragement to add more
  return `Hey ${userName || 'there'}, ${openingLine}

But here's the thing:

The more I know about what you're taking, the better I can help. If you're on other supplements, medications, or treatments - add them too.

I need the full picture to spot patterns.

Things like:
• Pain meds (prescription or OTC)
• Other supplements you take regularly
• Anything else you're trying

You can add more anytime from your dashboard.`;
}

