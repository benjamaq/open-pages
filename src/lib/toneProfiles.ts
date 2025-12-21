export type ToneProfileType = 'clinical' | 'neutral'

export const TONE_PROFILES: Record<ToneProfileType, { greeting: string; style: 'clinical' | 'neutral' }> = {
  clinical: { greeting: 'Status update', style: 'clinical' },
  neutral: { greeting: 'Update', style: 'neutral' }
}

export function getToneProfileType(_input?: unknown): ToneProfileType {
  return 'clinical'
}

export function getToneProfile(type: ToneProfileType = 'clinical') {
  return TONE_PROFILES[type]
}




