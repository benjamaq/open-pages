import { supabaseAdmin } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeLoginLinkRequestEmail(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
}

export function isValidLoginLinkRequestEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeLoginLinkRequestEmail(email))
}

/** auth.users row (id + canonical email) from case-insensitive email match, or null. */
export async function getAuthUserByEmailNorm(
  emailNorm: string,
): Promise<{ id: string; email: string } | null> {
  const em = normalizeLoginLinkRequestEmail(emailNorm)
  if (!em) return null
  try {
    const { data: authUser } = await (supabaseAdmin as any)
      .schema('auth')
      .from('users')
      .select('id, email')
      .ilike('email', em)
      .maybeSingle()
    const row = authUser as { id?: string; email?: string } | null
    if (row?.id && row?.email) {
      return { id: String(row.id), email: String(row.email) }
    }
  } catch (e) {
    console.warn('[cohortLoginLinkEligibility] auth.users lookup', String(e))
  }
  return null
}

export async function getProfileIdForAuthUser(authUserId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('profiles').select('id').eq('user_id', authUserId).maybeSingle()
  return data && typeof (data as { id?: string }).id === 'string' ? String((data as { id: string }).id) : null
}

/**
 * True if this person has any cohort_participants row. `user_id` may reference profiles.id or,
 * in some databases, auth.users.id — check both when profile id is known.
 */
export async function isCohortParticipantForProfileOrAuth(
  profileId: string | null,
  authUserId: string,
): Promise<boolean> {
  const ids = [...new Set([profileId, authUserId].filter(Boolean))] as string[]
  for (const uid of ids) {
    const { count, error } = await supabaseAdmin
      .from('cohort_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
    if (!error && (count ?? 0) > 0) return true
  }
  return false
}
