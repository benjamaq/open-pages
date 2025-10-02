export const FEATURE_FLAGS = {
  MOOD_TRACKING: process.env.NEXT_PUBLIC_MOOD_TRACKING_ENABLED === 'true',
  MOOD_TRACKING_BETA: process.env.NEXT_PUBLIC_MOOD_TRACKING_BETA === 'true'
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
