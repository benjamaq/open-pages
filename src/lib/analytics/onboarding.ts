import { createClient } from '@/lib/supabase/client'

export interface OnboardingEvent {
  event_type: string
  step_number: number
  metadata?: Record<string, any>
}

export const trackOnboardingEvent = async (event: OnboardingEvent) => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('onboarding_events').insert({
      user_id: user.id,
      event_type: event.event_type,
      step_number: event.step_number,
      metadata: event.metadata || {}
    })
  } catch (e) {
    // Best-effort; never block UX
    console.warn('[onboarding] trackOnboardingEvent failed', e)
  }
}

export const saveCheckinQualityMetrics = async (metrics: {
  user_id: string
  entry_local_date: string
  is_first_checkin: boolean
  expandables_opened: number
  life_factors_count: number
  symptoms_count: number
  has_vibe: boolean
  time_spent_seconds: number
  save_intercept_shown: boolean
  save_intercept_clicked: boolean
}) => {
  try {
    const supabase = createClient()
    await supabase.from('checkin_quality_metrics').insert(metrics)
  } catch (e) {
    console.warn('[onboarding] saveCheckinQualityMetrics failed', e)
  }
}


