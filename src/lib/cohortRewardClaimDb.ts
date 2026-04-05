import { generateCohortRewardClaimToken } from '@/lib/cohortRewardClaimToken'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Ensure one claim row exists for this participant; return token for emails/CTA.
 * Idempotent (unique on cohort_participant_id).
 */
export async function ensureCohortRewardClaimToken(participantId: string): Promise<string | null> {
  const pid = String(participantId || '').trim()
  if (!pid) return null

  const { data: existing, error: exErr } = await supabaseAdmin
    .from('cohort_reward_claims')
    .select('token')
    .eq('cohort_participant_id', pid)
    .maybeSingle()
  if (exErr) {
    console.error('[cohort-reward-claim] lookup', exErr.message)
    return null
  }
  const t0 = (existing as { token?: string } | null)?.token
  if (t0 && String(t0).trim() !== '') return String(t0).trim()

  const token = generateCohortRewardClaimToken()
  const { error: insErr } = await supabaseAdmin.from('cohort_reward_claims').insert({
    cohort_participant_id: pid,
    token,
    reward_type: 'pro_3_months',
  } as Record<string, unknown>)

  if (!insErr) return token

  const code = String((insErr as { code?: string }).code || '')
  const msg = String((insErr as { message?: string }).message || '')
  if (code === '23505' || /duplicate key|unique constraint/i.test(msg)) {
    const { data: again } = await supabaseAdmin
      .from('cohort_reward_claims')
      .select('token')
      .eq('cohort_participant_id', pid)
      .maybeSingle()
    const t1 = (again as { token?: string } | null)?.token
    return t1 && String(t1).trim() !== '' ? String(t1).trim() : null
  }

  console.error('[cohort-reward-claim] insert', insErr)
  return null
}
