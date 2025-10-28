// EXPLICIT MESSAGING RULES FOR DAILY EMAILS
// Cursor must follow these EXACTLY

export function getGreeting(userName: string, painLevel: number): string {
  if (painLevel >= 7) {
    return `Hey ${userName} 👋\n\nI know today might be tough.`;
  }
  if (painLevel >= 4) {
    return `Hey ${userName} 👋\n\nLet's see how you're doing today.`;
  }
  return `Hey ${userName} 👋\n\nHope you're having a decent morning.`;
}

export function getReadinessMessage(score: number): string {
  if (score >= 80) return "High energy — great day to move.";
  if (score >= 50) return "Take it steady — light activity today.";
  return "Low-energy day — rest is progress.";
}

export function getInsightLine(
  painYesterday: number,
  painToday: number,
  sleepQuality: number
): string {
  // VERY specific rules for what to say
  if (painYesterday > painToday && sleepQuality >= 7) {
    return "Your pain eased a little after better sleep.";
  }
  if (painYesterday < painToday) {
    return "I'm noticing your pain increased — let's track what might have changed.";
  }
  // ... etc
  return "I'm tracking your patterns to find what helps.";
}

// ADD MORE EXPLICIT FUNCTIONS FOR EVERY MESSAGE VARIATION

// Pain tone lines (strict buckets per brief)
export function getPainToneLine(painLevel: number): string {
  if (painLevel >= 7) return "I know today is tough.";
  if (painLevel >= 4) return "Let's see how you're doing.";
  return "Nice work managing symptoms.";
}

// Mood acknowledgement lines
export function getMoodLine(mood: number): string {
  if (mood <= 3) return "Some days are hard.";
  if (mood >= 7) return "Glad you're feeling brighter.";
  return "I'm here with you — let's keep track.";
}

// Sleep impact line (hours-based rule)
export function getSleepImpactLine(sleepHours: number): string {
  if (sleepHours < 5) return "Rough night can make everything harder.";
  return "";
}

// Guard for strong praise usage
export function shouldUseStrongPraise(metrics: number[]): boolean {
  return metrics.every((m) => m >= 8);
}

// Welcome message for first-time/no-history case
export function getWelcomeLine(userName?: string): string {
  const namePart = userName ? `${userName}, ` : "";
  return `${namePart}welcome — we'll start tracking and share helpful patterns.`;
}

// Fallback message when specific data is missing
export function getFallbackLine(): string {
  return "I'm tracking your patterns to find what helps.";
}


