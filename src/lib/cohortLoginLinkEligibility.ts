import type { SupabaseClient } from '@supabase/supabase-js'
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
  adminClient?: SupabaseClient,
  /** When true (daily-reminder force path only), log normalized email + PostgREST error payload. */
  forceEmailDebug?: boolean,
): Promise<{ id: string; email: string } | null> {
  const em = normalizeLoginLinkRequestEmail(emailNorm)
  if (!em) {
    if (forceEmailDebug) {
      // eslint-disable-next-line no-console
      console.log('[force-email-debug] getAuthUserByEmailNorm: empty after normalize', { raw: emailNorm })
    }
    return null
  }
  const sb = (adminClient ?? supabaseAdmin) as SupabaseClient
  try {
    const { data: authUser, error: authErr } = await (sb as any)
      .schema('auth')
      .from('users')
      .select('id, email')
      .ilike('email', em)
      .maybeSingle()
    const row = authUser as { id?: string; email?: string } | null
    if (forceEmailDebug) {
      // eslint-disable-next-line no-console
      console.log('[force-email-debug] getAuthUserByEmailNorm query done', {
        normalizedEmail: em,
        hasRow: !!(row?.id && row?.email),
        rowId: row?.id ?? null,
        rowEmail: row?.email ?? null,
        supabaseError: authErr
          ? {
              message: authErr.message,
              code: (authErr as { code?: string }).code,
              details: (authErr as { details?: string }).details,
              hint: (authErr as { hint?: string }).hint,
            }
          : null,
      })
    }
    if (row?.id && row?.email) {
      return { id: String(row.id), email: String(row.email) }
    }
  } catch (e) {
    if (forceEmailDebug) {
      // eslint-disable-next-line no-console
      console.warn('[force-email-debug] getAuthUserByEmailNorm exception', {
        normalizedEmail: em,
        err: String(e),
        stack: e instanceof Error ? e.stack : undefined,
      })
    }
    console.warn('[cohortLoginLinkEligibility] auth.users lookup', String(e))
  }
  return null
}

/**
 * Resolve auth user by email via GoTrue `GET /auth/v1/admin/users` (paginated).
 * Use when PostgREST cannot read `auth.users` (schema often not exposed on Supabase API).
 * Server-only; pass a service-role Supabase client.
 */
export async function getAuthUserByEmailAdminListUsers(
  adminClient: SupabaseClient,
  rawEmail: string,
  options?: { maxPages?: number; forceEmailDebug?: boolean },
): Promise<{ id: string; email: string } | null> {
  const target = normalizeLoginLinkRequestEmail(rawEmail)
  if (!target) return null
  const maxPages = Math.max(1, Math.min(options?.maxPages ?? 50, 200))
  const dbg = options?.forceEmailDebug === true
  let page: number | null = 1
  let scanned = 0
  while (page != null && scanned < maxPages) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    scanned++
    if (error || !data?.users) {
      if (dbg) {
        // eslint-disable-next-line no-console
        console.log('[force-email-debug] auth.admin.listUsers', {
          page,
          pagesScanned: scanned,
          err: error ? error.message : null,
          batch: 0,
          nextPage: null,
        })
      }
      if (dbg && error) {
        // eslint-disable-next-line no-console
        console.warn('[force-email-debug] listUsers aborted', { message: error.message })
      }
      break
    }
    const pageData = data as { users: { id: string; email?: string }[]; nextPage: number | null }
    if (dbg) {
      // eslint-disable-next-line no-console
      console.log('[force-email-debug] auth.admin.listUsers', {
        page,
        pagesScanned: scanned,
        err: null,
        batch: pageData.users.length,
        nextPage: pageData.nextPage ?? null,
      })
    }
    const hit = pageData.users.find(
      (u) => typeof u.email === 'string' && normalizeLoginLinkRequestEmail(u.email) === target,
    )
    if (hit?.id && hit.email) {
      return { id: String(hit.id), email: String(hit.email) }
    }
    page = pageData.nextPage ?? null
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
