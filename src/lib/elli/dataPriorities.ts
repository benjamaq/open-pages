/**
 * DATA PRIORITY CONFIGURATION BY USER CATEGORY
 * 
 * Defines which data sources matter most for each user type.
 * This ensures Elli focuses on relevant information and stays within token limits.
 */

import { ToneProfileType } from './toneProfiles';

export type DataSource = 
  | 'pain'
  | 'pain_location'
  | 'pain_type'
  | 'treatment_schedule'
  | 'labs'
  | 'sleep'
  | 'mood'
  | 'energy'
  | 'readiness'
  | 'symptoms'
  | 'mood_chips'
  | 'notes'
  | 'supplements'
  | 'exercise'
  | 'treatments'
  | 'mindfulness'
  | 'protocols'
  | 'gear'
  | 'wearables'
  | 'cycle_day'
  | 'stress';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface DataPriorities {
  critical: DataSource[];
  high: DataSource[];
  medium: DataSource[];
  low: DataSource[];
}

/**
 * Priority configuration for each user category
 * Critical/High data always included, Medium/Low only if space allows
 */
export const DATA_PRIORITIES: Record<ToneProfileType, DataPriorities> = {
  // ========================================================================
  // SERIOUS ILLNESS - treatment cycles and side-effects
  // ========================================================================
  serious_illness: {
    critical: ['treatment_schedule', 'symptoms', 'pain', 'notes', 'labs'],
    high: ['sleep', 'supplements', 'pain_location', 'pain_type', 'hydration' as any],
    medium: ['mood', 'energy', 'exercise', 'mindfulness'],
    low: ['wearables', 'protocols'],
  },

  // ========================================================================
  // CHRONIC PAIN - Focus on pain tracking and interventions
  // ========================================================================
  chronic_pain: {
    critical: ['pain', 'pain_location', 'pain_type', 'notes'],
    high: ['sleep', 'supplements', 'gear', 'treatments'],
    medium: ['mood', 'exercise', 'mindfulness'],
    low: ['wearables', 'protocols', 'mood_chips'],
  },

  // ========================================================================
  // BIOHACKING - Focus on metrics and optimization
  // ========================================================================
  biohacking: {
    critical: ['readiness', 'wearables', 'supplements', 'protocols'],
    high: ['exercise', 'sleep', 'energy'],
    medium: ['mood', 'mindfulness'],
    low: ['pain', 'symptoms', 'mood_chips'],
  },

  // ========================================================================
  // FERTILITY - Focus on cycle tracking and hormonal patterns
  // ========================================================================
  fertility: {
    critical: ['cycle_day', 'symptoms', 'mood', 'energy'],
    high: ['supplements', 'stress', 'sleep', 'mood_chips'],
    medium: ['exercise', 'mindfulness'],
    low: ['pain', 'wearables'],
  },

  // ========================================================================
  // SLEEP - Focus on sleep quality and disruptors
  // ========================================================================
  sleep: {
    critical: ['sleep', 'wearables', 'notes'],
    high: ['mood', 'energy', 'supplements', 'mindfulness'],
    medium: ['exercise', 'stress', 'mood_chips'],
    low: ['pain', 'treatments'],
  },

  // ========================================================================
  // ENERGY - Focus on fatigue and energy patterns
  // ========================================================================
  energy: {
    critical: ['energy', 'sleep', 'notes'],
    high: ['supplements', 'exercise', 'mood'],
    medium: ['wearables', 'mindfulness', 'stress'],
    low: ['pain', 'treatments'],
  },

  // ========================================================================
  // MENTAL HEALTH - Focus on mood and emotional patterns
  // ========================================================================
  mental_health: {
    critical: ['mood', 'mood_chips', 'notes', 'stress'],
    high: ['sleep', 'symptoms', 'pain', 'supplements'],
    medium: ['exercise', 'mindfulness', 'energy'],
    low: ['wearables', 'protocols'],
  },

  // ========================================================================
  // ADHD - Focus on executive function and consistency
  // ========================================================================
  adhd: {
    critical: ['mood', 'energy', 'notes', 'mood_chips'],
    high: ['sleep', 'supplements', 'protocols'],
    medium: ['exercise', 'mindfulness', 'stress'],
    low: ['pain', 'wearables', 'treatments'],
  },

  // ========================================================================
  // PERIMENOPAUSE - Focus on hormone symptoms and tracking
  // ========================================================================
  perimenopause: {
    critical: ['symptoms', 'mood', 'energy', 'sleep'],
    high: ['mood_chips', 'supplements', 'pain', 'stress'],
    medium: ['exercise', 'mindfulness', 'wearables'],
    low: ['protocols', 'treatments'],
  },

  // ========================================================================
  // GENERAL WELLNESS - Balanced approach
  // ========================================================================
  general_wellness: {
    critical: ['mood', 'sleep', 'energy'],
    high: ['supplements', 'exercise', 'notes'],
    medium: ['mindfulness', 'wearables', 'mood_chips'],
    low: ['pain', 'treatments', 'protocols'],
  },
};

/**
 * Get priority data sources for a specific tone profile
 */
export function getPriorityDataSources(
  toneProfile: ToneProfileType
): DataPriorities {
  return DATA_PRIORITIES[toneProfile] || DATA_PRIORITIES.general_wellness;
}

/**
 * Get priority level for a specific data source
 */
export function getPriorityLevel(
  dataSource: DataSource,
  toneProfile: ToneProfileType
): PriorityLevel {
  const priorities = getPriorityDataSources(toneProfile);
  
  if (priorities.critical.includes(dataSource)) return 'critical';
  if (priorities.high.includes(dataSource)) return 'high';
  if (priorities.medium.includes(dataSource)) return 'medium';
  return 'low';
}

/**
 * Check if a data source should be included based on priority
 */
export function shouldIncludeDataSource(
  dataSource: DataSource,
  toneProfile: ToneProfileType,
  tokenBudget: 'minimal' | 'standard' | 'full'
): boolean {
  const level = getPriorityLevel(dataSource, toneProfile);
  
  switch (tokenBudget) {
    case 'minimal':
      return level === 'critical';
    case 'standard':
      return level === 'critical' || level === 'high';
    case 'full':
      return level !== 'low';
    default:
      return true;
  }
}

