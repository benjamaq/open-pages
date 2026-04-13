import { generateCohortRewardClaimToken } from '@/lib/cohortRewardClaimToken'
import { supabaseAdmin } from '@/lib/supabase/admin'

const INSERT_RETRY_MAX = 8

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  const code = String(err.code || '')
  const msg = String(err.message || '')
  return code === '23505' || /duplicate key|unique constraint/i.test(msg)
}

/**
 * Ensure one claim row exists for this participant; return token for emails/CTA.
 * Idempotent (unique on cohort_participant_id).
 * Retries on unique violations (e.g. rare token collision) before giving up.
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
    console.error('[cohort-reward-claim] lookup', pid, exErr.message, exErr)
    return null
  }
  const t0 = (existing as { token?: string } | null)?.token
  if (t0 && String(t0).trim() !== '') return String(t0).trim()

  for (let attempt = 0; attempt < INSERT_RETRY_MAX; attempt++) {
    const token = generateCohortRewardClaimToken()
    const { error: insErr } = await supabaseAdmin.from('cohort_reward_claims').insert({
      cohort_participant_id: pid,
      token,
      reward_type: 'pro_3_months',
    } as Record<string, unknown>)

    if (!insErr) return token

    if (isUniqueViolation(insErr)) {
      const { data: again, error: againErr } = await supabaseAdmin
        .from('cohort_reward_claims')
        .select('token')
        .eq('cohort_participant_id', pid)
        .maybeSingle()
      if (againErr) {
        console.error('[cohort-reward-claim] refetch after dup', pid, againErr.message)
        return null
      }
      const t1 = (again as { token?: string } | null)?.token
      if (t1 && String(t1).trim() !== '') return String(t1).trim()
      // Likely token collision without a row yet — retry with a new token.
      continue
    }

    console.error('[cohort-reward-claim] insert', pid, insErr)
    return null
  }

  console.error('[cohort-reward-claim] insert exhausted retries', pid)
  return null
}
