// EXPLICIT MESSAGING RULES FOR DAILY EMAILS
// Cursor must follow these EXACTLY

export function getGreeting(userName: string, _energyLevel?: number): string {
  return `Hey ${userName} 👋\n\nReady to build your baseline?`;
}

export function getReadinessMessage(score: number): string {
  if (score >= 80) return "High energy — great day to move.";
  if (score >= 50) return "Take it steady — light activity today.";
  return "Low-energy day — rest is progress.";
}

export function getInsightLine(_x?: number, _y?: number, _sleepQuality?: number): string {
  return "Consistent check-ins help us test which supplements are actually worth keeping.";
}

// ADD MORE EXPLICIT FUNCTIONS FOR EVERY MESSAGE VARIATION

// Pain tone lines (strict buckets per brief)
export function getPainToneLine(_energyLevel?: number): string {
  return "Yesterday: Energy, Focus, and Sleep give us the clearest signal.";
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


