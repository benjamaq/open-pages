// Context tag options for mood tracking
export const CONTEXT_TAGS = {
  sleep: [
    'Slept really bad',
    'Woke up all night', 
    'Late to bed',
    'Short sleep'
  ],
  energy: [
    'Exhausted',
    'Tired', 
    'Wired',
    'Low motivation'
  ],
  stress: [
    'High stress',
    'Sick',
    'Infection suspected'
  ],
  lifestyle: [
    'Alcohol last night',
    'Late caffeine',
    'Travel/jet lag'
  ],
  meds: [
    'New med started',
    'Dose change',
    'Missed dose'
  ],
  pain: [
    'Pain was really bad',
    'Migraine',
    'GI upset'
  ],
  parenting: [
    'Baby frequent wakes',
    'Cluster feeds'
  ],
  cycle: [
    'PMS',
    'Cycle day'
  ],
  other: [
    'Big workout',
    'Rest day'
  ]
} as const;

export const ALL_CONTEXT_TAGS = Object.values(CONTEXT_TAGS).flat();
