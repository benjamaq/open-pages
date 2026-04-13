import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { renderDailyReminderEmail as renderV3Reminder } from '@/lib/email/templates/daily-reminder'
import {
  resolveDailyReminderCheckinHrefForUser,
  resolveDailyReminderEmailShellForUser,
} from '@/lib/cohortDailyReminderCheckinHref'
import { dailyReminderEmailSubject } from '@/lib/email/dailyReminderEmailSubject'
import { Resend } from 'resend'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { addDays } from 'date-fns'
import { getLatestDailyMetrics, getStackProgressForUser } from '@/lib/email/email-stats'
import {
  getAuthUserByEmailAdminListUsers,
  getAuthUserByEmailNorm,
} from '@/lib/cohortLoginLinkEligibility'
import {
  fetchExpandedCohortStudyCompletedIdExclusions,
  profileKeysForCohortParticipantFilter,
  profileRowMatchesCohortStudyCompletedExclusion,
} from '@/lib/cohortDailyReminderCompletedFilter'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'

/** Decode email query param: trim, fix `+` lost as space in unencoded query strings. */
function normalizeForceEmailQuery(raw: string): string {
  let s = String(raw || '').trim()
  const at = s.indexOf('@')
  if (at > 0 && s.slice(0, at).includes(' ')) {
    s = s.slice(0, at).replace(/\s+/g, '+') + s.slice(at)
  }
  return s
}

/** Start of calendar `now` in `timeZone`, as UTC ISO string (for `sent_at` lower bound). */
function startOfLocalDayUtcIso(now: Date, timeZone: string): string {
  const tz = (timeZone && String(timeZone).trim()) || 'UTC'
  try {
    const ymd = formatInTimeZone(now, tz, 'yyyy-MM-dd')
    return fromZonedTime(`${ymd}T00:00:00`, tz).toISOString()
  } catch {
    const ymd = formatInTimeZone(now, 'UTC', 'yyyy-MM-dd')
    return fromZonedTime(`${ymd}T00:00:00`, 'UTC').toISOString()
  }
}

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  timezone?: string | null;
  profile_id?: string;
  reminder_enabled?: boolean | null;
  reminder_time?: string | null;
  reminder_timezone?: string | null;
}

async function handler(req: NextRequest) {
  try {
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Starting email cron job...')

    // 1) Read debug flags (before Supabase: production force must fail fast without DB)
    const url = new URL(req.url)
    const dryParam = url.searchParams.get('dry')
    const rawEmail = url.searchParams.get('email') || undefined
    const forceUserId = url.searchParams.get('user_id') || undefined
    // Normalize email query (strip accidental quotes, restore + addresses when + was sent unencoded)
    const filterEmail = rawEmail
      ? normalizeForceEmailQuery(rawEmail.replace(/^"+|"+$/g, ''))
      : undefined
    const dryRun = dryParam === '1'
    const forceFlag = url.searchParams.get('force') === '1'
    const hasAuth = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
    const okVercelCron = Boolean(req.headers.get('x-vercel-cron'))
    /** Production deploy only; preview/local stay loose for testing without leaking secrets. */
    const isProductionDeployment = process.env.VERCEL_ENV === 'production'

    if (forceFlag && isProductionDeployment && !hasAuth && !okVercelCron) {
      return NextResponse.json(
        { ok: false, error: 'force_requires_cron_auth' },
        { status: 401 },
      )
    }

    const forceTrusted =
      hasAuth ||
      okVercelCron ||
      (!isProductionDeployment && (!!filterEmail || !!forceUserId))

    const authorizedForce = forceFlag && forceTrusted
    const bypassAll = (dryRun && !!filterEmail) || authorizedForce

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    // 2) Select users to send (simplified: users with yesterday entry; opt-out handled later)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1)

    // DEBUG: Inspect actual columns to avoid schema guessing
    try {
      const { data: sampleProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(1)
        .single()
      // eslint-disable-next-line no-console
      console.log('[daily-cron] profiles columns:', sampleProfile ? Object.keys(sampleProfile) : [])
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[daily-cron] profiles column introspection error:', (e as any)?.message)
    }

    try {
      const { data: samplePref } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .limit(1)
        .single()
      // eslint-disable-next-line no-console
      console.log('[daily-cron] notification_preferences columns:', samplePref ? Object.keys(samplePref) : [])
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[daily-cron] notification_preferences column introspection error:', (e as any)?.message)
    }

    // STEP 1: Load profiles
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Querying profiles...')
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, display_name, timezone, reminder_enabled, reminder_time, reminder_timezone')
      .eq('reminder_enabled', true)
      .limit(10000)
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Found profiles:', (profiles as any)?.length || 0)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[daily-cron] Profiles error:', error)
      return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
    }

    // Start with all profiles
    let scopedProfiles: ProfileRow[] = (((profiles as any) || []) as Array<any>).map((p: any) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      timezone: p.timezone,
      profile_id: p.id,
      reminder_enabled: p.reminder_enabled,
      reminder_time: p.reminder_time,
      reminder_timezone: p.reminder_timezone,
    }))

    /** Canonical auth email when force-targeting by `email=` (for Resend). */
    let forceResolvedEmail: string | undefined
    // If forcing to a specific email, resolve that user immediately and bypass all filters
    if (authorizedForce && (filterEmail || forceUserId)) {
      // eslint-disable-next-line no-console
      console.log('[force-email-debug] force block entered', {
        rawEmailParam: rawEmail ?? null,
        filterEmailAfterNormalize: filterEmail ?? null,
        forceUserId: forceUserId ?? null,
        forceFlag,
        hasAuth,
        authorizedForce,
      })
      let targetUserId: string | undefined
      try {
        const adminApi = (supabaseAdmin as any).auth?.admin
        if (forceUserId && adminApi?.getUserById) {
          // Force by user_id first
          console.log('[force] Using user_id override:', forceUserId)
          const { data: byId } = await adminApi.getUserById(forceUserId)
          try { console.log('[force] getUserById result:', { ok: !!byId?.user, id: byId?.user?.id, email: byId?.user?.email }) } catch {}
          targetUserId = byId?.user?.id as string | undefined
          if (byId?.user?.email) forceResolvedEmail = String(byId.user.email)
          // Lookup profile
          const { data: profRow } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id, display_name, timezone')
            .eq('user_id', forceUserId)
            .maybeSingle()
          const display_name = (profRow as any)?.display_name || (byId?.user?.user_metadata?.name as string) || (byId?.user?.email?.split('@')[0] || 'there')
          const timezone = (profRow as any)?.timezone || 'UTC'
          const profile_id = (profRow as any)?.id
          scopedProfiles = [{ user_id: forceUserId, display_name, timezone, profile_id }]
          console.log('[daily-cron] Force targeting user (by user_id):', { user_id: forceUserId, email: byId?.user?.email })
        } else if (filterEmail) {
          // supabase-js v2 has no auth.admin.getUserByEmail — use auth.users ilike + lowercase (see getAuthUserByEmailNorm).
          // Pass route-scoped admin client so resolution matches this request's Supabase instance.
          console.log('[force] Resolving email via getAuthUserByEmailNorm:', filterEmail)
          let authPair = await getAuthUserByEmailNorm(filterEmail, supabaseAdmin, true)
          // eslint-disable-next-line no-console
          console.log('[force-email-debug] getAuthUserByEmailNorm return to cron', {
            ok: !!authPair?.id,
            id: authPair?.id ?? null,
            email: authPair?.email ?? null,
          })
          if (!authPair?.id) {
            // PostgREST often cannot read auth.users; GoTrue admin listUsers does.
            console.log('[daily-cron] force email: PostgREST/auth.users miss — trying auth.admin.listUsers')
            authPair = await getAuthUserByEmailAdminListUsers(supabaseAdmin, filterEmail, {
              maxPages: 50,
              forceEmailDebug: true,
            })
            // eslint-disable-next-line no-console
            console.log('[force-email-debug] getAuthUserByEmailAdminListUsers return', {
              ok: !!authPair?.id,
              id: authPair?.id ?? null,
              email: authPair?.email ?? null,
            })
          }
          if (!authPair?.id && filterEmail) {
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc(
              'cron_resolve_auth_user_for_force_reminder',
              { target_email: filterEmail },
            )
            const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData
            const rpcRec = rpcRow as Record<string, unknown> | undefined
            const rpcIdRaw = rpcRec?.auth_user_id
            const rpcEmailRaw = rpcRec?.canonical_email
            const rpcId =
              rpcIdRaw != null && String(rpcIdRaw).length > 0 ? String(rpcIdRaw) : null
            const rpcEmail =
              rpcEmailRaw != null && String(rpcEmailRaw).length > 0 ? String(rpcEmailRaw) : null
            // eslint-disable-next-line no-console
            console.log('[daily-cron] force email: DB RPC cron_resolve_auth_user_for_force_reminder', {
              rpcErr: rpcErr
                ? { message: rpcErr.message, code: rpcErr.code, details: rpcErr.details, hint: rpcErr.hint }
                : null,
              auth_user_id: rpcId,
              canonical_email: rpcEmail,
            })
            if (!rpcErr && rpcId && rpcEmail) {
              authPair = { id: rpcId, email: rpcEmail }
            }
          }
          if (authPair?.id) {
            targetUserId = authPair.id
            forceResolvedEmail = authPair.email
            const { data: profRow } = await supabaseAdmin
              .from('profiles')
              .select('id, user_id, display_name, timezone')
              .eq('user_id', targetUserId)
              .maybeSingle()
            const display_name = (profRow as any)?.display_name || (filterEmail.split('@')[0] || 'there')
            const timezone = (profRow as any)?.timezone || 'UTC'
            const profile_id = (profRow as any)?.id
            scopedProfiles = [{ user_id: targetUserId, display_name, timezone, profile_id }]
            console.log('[daily-cron] Force targeting user (by email):', { user_id: targetUserId, email: authPair.email })
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[force-email-debug] Force branch try/catch', {
          message: (e as any)?.message,
          stack: e instanceof Error ? e.stack : undefined,
        })
        console.warn('[daily-cron] Force email lookup failed:', (e as any)?.message)
      }
      if (!targetUserId) {
        // eslint-disable-next-line no-console
        console.error('[force-email-debug] RETURN target_email_not_found (no targetUserId after force resolution)', {
          filterEmail: filterEmail ?? null,
          forceUserId: forceUserId ?? null,
        })
        console.error('[daily-cron] Target not found in force lookup:', { email: filterEmail, user_id: forceUserId })
        return NextResponse.json({ ok: false, error: 'target_email_not_found', email: filterEmail, user_id: forceUserId })
      }
    } else {
      // STEP 1b: Filter by notification preferences (require explicit enable)
      try {
        const { data: prefs } = await supabaseAdmin
          .from('notification_preferences')
          .select('profile_id, email_enabled, daily_reminder_enabled')
        const prefByProfile = new Map<string, { email_enabled: boolean | null; daily_reminder_enabled: boolean | null }>()
        for (const pref of (prefs as any[]) || []) {
          if (pref?.profile_id) {
            prefByProfile.set(String(pref.profile_id), {
              email_enabled: (pref as any).email_enabled ?? null,
              daily_reminder_enabled: (pref as any).daily_reminder_enabled ?? null
            })
          }
        }
        const beforeCount = scopedProfiles.length
        scopedProfiles = scopedProfiles.filter((p: any) => {
          // profiles.reminder_enabled is the source of truth
          if ((p as any)?.reminder_enabled !== true) return false
          const pref = prefByProfile.get(String(p.profile_id))
          if (!pref) return true
          const emailDisabled = (pref as any)?.email_enabled === false
          const dailyDisabled = (pref as any)?.daily_reminder_enabled === false
          // Preferences can only disable if explicitly set to false
          return !(emailDisabled || dailyDisabled)
        })
        // eslint-disable-next-line no-console
        console.log('[daily-cron] Pref filter:', { before: beforeCount, after: scopedProfiles.length })
      } catch (e) {
        console.warn('[daily-cron] Pref filter skipped due to error:', (e as any)?.message)
      }

      // Cohort compliance gate only: exclude `applied` users from this daily baseline reminder flow.
      // Confirmed users (including pre-study / study_started_at NULL, baseline-building) stay IN.
      // Study-completed users are excluded later via study_completed_at filter.
      try {
        const pidList = scopedProfiles
          .map((p) => p.profile_id)
          .filter((id): id is string => Boolean(id))
        if (pidList.length > 0) {
          const { data: profForCp } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id')
            .in('id', pidList)
          const cpUserIdKeys = new Set<string>(pidList)
          for (const row of profForCp || []) {
            const r = row as { id: string; user_id: string }
            cpUserIdKeys.add(r.id)
            cpUserIdKeys.add(r.user_id)
          }
          const { data: appliedRows, error: apErr } = await supabaseAdmin
            .from('cohort_participants')
            .select('user_id')
            .eq('status', 'applied')
            .in('user_id', [...cpUserIdKeys])
          if (apErr) {
            console.warn('[daily-cron] cohort applied-participant lookup:', apErr.message)
          } else {
            const appliedCpUserIds = new Set(
              ((appliedRows as { user_id: string }[]) || []).map((r) => String(r.user_id)),
            )
            const beforeApplied = scopedProfiles.length
            scopedProfiles = scopedProfiles.filter((p) => {
              if (!p.profile_id) return true
              const pid = String(p.profile_id)
              const uid = String((p as { user_id?: string }).user_id || '')
              if (appliedCpUserIds.has(pid) || (uid && appliedCpUserIds.has(uid))) return false
              return true
            })
            // eslint-disable-next-line no-console
            console.log('[daily-cron] Cohort applied (pre-confirmation) filter:', {
              before: beforeApplied,
              after: scopedProfiles.length,
            })
          }
        }
      } catch (e) {
        console.warn('[daily-cron] cohort applied filter skipped:', (e as any)?.message)
      }
    }

    // Cohort study completed: exclude from daily reminders (bulk AND force=1&email= paths).
    try {
      const completionKeys = profileKeysForCohortParticipantFilter(scopedProfiles)
      if (completionKeys.length > 0) {
        const beforeDone = scopedProfiles.length
        const exclusion = await fetchExpandedCohortStudyCompletedIdExclusions(
          supabaseAdmin,
          completionKeys,
        )
        scopedProfiles = scopedProfiles.filter(
          (p) => !profileRowMatchesCohortStudyCompletedExclusion(p, exclusion),
        )
        // eslint-disable-next-line no-console
        console.log('[daily-cron] Cohort study completed filter:', {
          before: beforeDone,
          after: scopedProfiles.length,
          exclusionKeys: exclusion.size,
        })
      }
    } catch (e) {
      console.warn('[daily-cron] cohort study completed filter skipped:', (e as any)?.message)
    }

    if (
      scopedProfiles.length === 0 &&
      authorizedForce &&
      (filterEmail || forceUserId)
    ) {
      // eslint-disable-next-line no-console
      console.log('[daily-cron] Force target excluded: cohort study completed')
      return NextResponse.json({ ok: true, skipped: 'study_completed' })
    }

    // STEP 2: Resolve emails via RPC (server-side), avoids auth API issues
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Resolving emails via RPC get_user_emails...')
    const emailMap = new Map<string, string>()
    const userIds = Array.from(new Set(scopedProfiles.map(p => p.user_id)))
    if (userIds.length === 0) {
      console.log('[daily-cron] No user IDs to resolve emails for')
    } else {
      const { data: authUsers, error: authErr } = await (supabaseAdmin as any)
        .rpc('get_user_emails', { user_ids: userIds })
      if (authErr) {
        console.error('[daily-cron] RPC get_user_emails failed:', authErr)
      } else {
        for (const u of (authUsers as Array<{ id: string; email: string | null }>)) {
          if (u?.id && u?.email) emailMap.set(u.id, u.email)
        }
        console.log('[daily-cron] Emails resolved:', emailMap.size, '/', userIds.length)
      }
    }

    // In force mode + target email, scope to that user and bypass any subsequent list filters
    if (authorizedForce && filterEmail) {
      const forcedId = scopedProfiles[0]?.user_id
      if (forcedId) {
        emailMap.set(forcedId, forceResolvedEmail || filterEmail)
        scopedProfiles = scopedProfiles.filter(p => p.user_id === forcedId)
        console.log('[daily-cron] Force scoped to user:', { user_id: forcedId, email: forceResolvedEmail || filterEmail })
      }
    }
    const resend = new Resend(process.env.RESEND_API_KEY!)
    // Sender: prefer env, else enforced verified domain (use .io)
    const sender = process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>'
    try {
      console.log('[daily-cron] Using sender:', sender, '(env:', process.env.RESEND_FROM || '(unset)', ')')
    } catch {}
    const reply_to = process.env.REPLY_TO_EMAIL || undefined

    // Time window filter: send when user's local time matches their reminder_time.
    // vercel.json: `0 * * * *` → this route runs at :00 UTC each hour. Example: reminder 07:00
    // Europe/Copenhagen in April (CEST, UTC+2) matches the 05:00 UTC invocation (not 06:00 UTC).
    // Slack below absorbs cold-start delay so a 05:00 UTC run that starts at 05:02 UTC still qualifies.
    const REMINDER_MATCH_SLACK_MINUTES = 10
    const now = new Date()
    const profilesInWindow = scopedProfiles.filter(p => {
      if (bypassAll) return true // bypass hour gate for targeted dry/force
      const tz = (p.reminder_timezone || p.timezone || 'UTC').toString()
      const rtRaw = String(p.reminder_time || '09:00').trim()
      const m = rtRaw.match(/^(\d{1,2}):(\d{2})/)
      const targetH = m ? Math.max(0, Math.min(23, parseInt(m[1], 10))) : 9
      const targetM = m ? Math.max(0, Math.min(59, parseInt(m[2], 10))) : 0
      try {
        const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
        const parts = fmt.formatToParts(now)
        const curH = parseInt(parts.find(x => x.type === 'hour')?.value || '0', 10)
        const curM = parseInt(parts.find(x => x.type === 'minute')?.value || '0', 10)
        const diff = Math.abs((curH * 60 + curM) - (targetH * 60 + targetM))
        return diff <= REMINDER_MATCH_SLACK_MINUTES
      } catch {
        // Fallback: treat as UTC.
        const curH = now.getUTCHours()
        const curM = now.getUTCMinutes()
        const diff = Math.abs((curH * 60 + curM) - (targetH * 60 + targetM))
        return diff <= REMINDER_MATCH_SLACK_MINUTES
      }
  })

    // eslint-disable-next-line no-console
    console.log(`[daily-cron] Users in reminder_time window: ${profilesInWindow.length} (bypassAll=${bypassAll})`)
    // eslint-disable-next-line no-console
    console.log(`[daily-cron] Preparing to send ${profilesInWindow.length} emails (dry=${dryRun})`)

    // Active user window for engagement checks
    const ACTIVE_DAYS_THRESHOLD = 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ACTIVE_DAYS_THRESHOLD)
    const cutoffYmd = cutoffDate.toISOString().slice(0, 10) // YYYY-MM-DD

    const results: any[] = []
    let successCount = 0
    let failCount = 0
    let skipCount = 0

    const logCandidate = (phase: string, payload: Record<string, unknown>) => {
      try {
        console.log('[daily-cron] candidate', JSON.stringify({ phase, ...payload }))
      } catch {}
    }
    const recordSkip = (row: Record<string, unknown>) => {
      skipCount++
      results.push({ outcome: 'skipped', ...row })
    }

    if (authorizedForce && (filterEmail || forceUserId)) {
      for (const p of profilesInWindow) {
        if (p.user_id && !p.profile_id) {
          const { data: profFill } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', p.user_id)
            .maybeSingle()
          if (profFill && (profFill as { id?: string }).id) {
            p.profile_id = String((profFill as { id: string }).id)
          }
        }
      }
    }

    for (const p of profilesInWindow) {
      try {
        const emailEarly = emailMap.get(p.user_id) ?? null
        logCandidate('in_reminder_window', {
          user_id: p.user_id,
          profile_id: p.profile_id ?? null,
          email: emailEarly,
          on_final_send_list: true,
        })

        const email = emailMap.get(p.user_id)
        if (!email) {
          logCandidate('branch', { user_id: p.user_id, branch: 'skip_no_email' })
          recordSkip({ user_id: p.user_id, skip: 'no email', skip_reason: 'no email', stage: 'email-lookup' })
          continue
        }
        if (filterEmail && email.toLowerCase() !== filterEmail.toLowerCase()) {
          logCandidate('branch', {
            user_id: p.user_id,
            email,
            branch: 'skip_email_filter_mismatch',
            filterEmail,
          })
          recordSkip({
            user_id: p.user_id,
            email,
            skip: 'email_filter_mismatch',
            skip_reason: 'email_filter_mismatch',
            filterEmail,
          })
          continue
        }

        if (authorizedForce && (filterEmail || forceUserId)) {
          const cohortKeys = cohortParticipantUserIdCandidatesSync(String(p.profile_id || ''), p.user_id)
          if (cohortKeys.length > 0) {
            const { data: completedForced } = await supabaseAdmin
              .from('cohort_participants')
              .select('id')
              .not('study_completed_at', 'is', null)
              .in('user_id', cohortKeys)
              .limit(1)
            if (completedForced && completedForced.length > 0) {
              logCandidate('branch', { user_id: p.user_id, branch: 'skip_study_completed_force_pre_send' })
              recordSkip({ user_id: p.user_id, skip: 'study_completed', skip_reason: 'study_completed', stage: 'force_pre_send' })
              continue
            }
          }
        }

        // Engagement filter: Only send to active users (recent activity OR at least 1 active supplement)
        if (!bypassAll) {
          // Count supplements (active OR legacy-null)
          let supplementCount = 0
          try {
            const { count: suppCount } = await supabaseAdmin
              .from('user_supplement')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', p.user_id)
              .or('is_active.eq.true,is_active.is.null')
            supplementCount = Number(suppCount || 0)
          } catch {}
          // Any daily entry in the last 30 days (based on local_date)
          let recentActive = false
          try {
            const { count: recentCount } = await supabaseAdmin
              .from('daily_entries')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', p.user_id)
              .gte('local_date', cutoffYmd)
            recentActive = Number(recentCount || 0) > 0
          } catch {}
          if (!recentActive && supplementCount === 0) {
            logCandidate('branch', { user_id: p.user_id, email, branch: 'skip_inactive_30d_and_no_supplements' })
            recordSkip({ user_id: p.user_id, email, skip: 'inactive_30d_and_no_supplements', skip_reason: 'inactive_30d_and_no_supplements' })
            continue
          }
        }

        // Deduplicate by email_sends: same calendar day in user's reminder timezone
        if (!bypassAll) {
          const tzForDedupe = (p.reminder_timezone || p.timezone || 'UTC').toString()
          const localDayStartIso = startOfLocalDayUtcIso(new Date(), tzForDedupe)
          const { data: sentToday } = await supabaseAdmin
            .from('email_sends')
            .select('id')
            .eq('user_id', p.user_id)
            .eq('email_type', 'daily_reminder')
            .gte('sent_at', localDayStartIso)
            .limit(1)
          if (sentToday && sentToday.length) {
            logCandidate('branch', { user_id: p.user_id, email, branch: 'skip_already_sent_today' })
            recordSkip({ user_id: p.user_id, email, skip: 'already sent', skip_reason: 'already sent' })
            continue
          }
        }

        logCandidate('branch', { user_id: p.user_id, email, branch: 'post_gates_building_email' })

        // Pull yesterday metrics based on user's LOCAL date (use local_date column)
        const tz = (p.reminder_timezone || p.timezone || 'UTC').toString()
        const localYesterdayStr = formatInTimeZone(addDays(new Date(), -1), tz, 'yyyy-MM-dd')
        // Pull yesterday entry (optional; do not skip)
        const { data: entry } = await supabaseAdmin
          .from('daily_entries')
          .select('energy, focus, sleep, sleep_quality, mood, meds, protocols, local_date')
          .eq('user_id', p.user_id)
          .eq('local_date', localYesterdayStr)
          .maybeSingle()
        // Resolve latest daily metrics (yesterday in user's local tz)
        const latest = await getLatestDailyMetrics(supabaseAdmin as any, p.user_id, { targetLocalYmd: localYesterdayStr, timezone: tz })
        try {
          console.log('[daily-cron] Metrics for user:', p.user_id, 'Result:', JSON.stringify(latest))
        } catch {}
        const energy = (typeof latest?.energy === 'number') ? latest!.energy : null
        const focus  = (typeof latest?.focus  === 'number') ? latest!.focus  : null
        const sleep  = (typeof latest?.sleep  === 'number') ? latest!.sleep  : null
        const mood   = (typeof latest?.mood   === 'number') ? latest!.mood   : null

        // Debug block for forced emails
        if (authorizedForce) {
          const debugInfo = {
            userId: p.user_id,
            targetDate: localYesterdayStr,
            metricsResult: latest,
            energy, focus, sleep, mood
          }
          try { console.log('[daily-cron] DEBUG:', JSON.stringify(debugInfo)) } catch {}
        }

        // TEMP DEBUG (disabled return): log metrics for target email but continue to send
        if (email === 'ben09@icloud.com') {
          try {
            console.log('[force] DEBUG for target email', {
              userId: p.user_id,
              targetDate: localYesterdayStr,
              timezone: tz,
            metricsResult: latest,
            derived: { energy, focus, sleep, mood }
          })
          } catch {}
        }

        const checkinHref = await resolveDailyReminderCheckinHrefForUser({
          authUserId: p.user_id,
          recipientEmail: email,
        })
        const emailShell = await resolveDailyReminderEmailShellForUser({
          authUserId: p.user_id,
          recipientEmail: email,
        })

        // Greeting priority:
        // 1) profiles.display_name (first token)
        // 2) auth.users.user_metadata.name
        // 3) email local part
        let firstName = ''
        const displayName = (p.display_name && String(p.display_name).trim()) ? String(p.display_name).trim() : ''
        if (displayName) { firstName = displayName.split(/\s+/)[0] }
        if (!firstName) {
          try {
            const adminApi = (supabaseAdmin as any).auth?.admin
            if (adminApi?.getUserById) {
              const { data: userById } = await adminApi.getUserById(p.user_id)
              const metaName = (userById?.user?.user_metadata?.name as string) || ''
              if (metaName && metaName.trim().length > 0) {
                firstName = metaName.trim().split(/\s+/)[0]
              }
            }
          } catch {}
        }
        if (!firstName) {
          const em = emailMap.get(p.user_id) || ''
          const localPart = em.includes('@') ? em.split('@')[0] : ''
          firstName = localPart ? localPart.replace(/[._-]+/g, ' ').trim() : 'there'
        }

        // Supplement count from user_supplement (active or legacy-null)
        let supplementCount = 0
        try {
          const { count: suppCount } = await supabaseAdmin
            .from('user_supplement')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', p.user_id)
            .or('is_active.eq.true,is_active.is.null')
          supplementCount = Number(suppCount || 0)
        } catch {}

        // Milestone: first daily email ever
        const { data: previousEmails } = await supabaseAdmin
          .from('email_sends')
          .select('id')
          .eq('user_id', p.user_id)
          .eq('email_type', 'daily_reminder')
          .limit(1)
        const isFirstEmail = !previousEmails || previousEmails.length === 0

        // Milestone: reached 5+ total check-ins and haven't sent milestone_5 yet
        const { count: totalEntries } = await supabaseAdmin
          .from('daily_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', p.user_id)
        const { data: milestone5Sent } = await supabaseAdmin
          .from('email_sends')
          .select('id')
          .eq('user_id', p.user_id)
          .eq('email_type', 'milestone_5')
          .limit(1)
        const reachedFive = (totalEntries || 0) >= 5 && (!milestone5Sent || milestone5Sent.length === 0)

        const milestoneBanner = reachedFive
          ? '👏 Five days in — this is where useful patterns start to emerge. Keep going; consistency unlocks real insight.'
          : undefined

        // Real stack progress to match dashboard (align with /api/progress/loop)
        const progressPercent = await getStackProgressForUser(supabaseAdmin as any, p.user_id)
        try {
          console.log('[daily-cron] Progress for user:', p.user_id, 'Progress:', progressPercent)
        } catch {}
        try {
          console.log('[email] User progress:', { userId: p.user_id, progress: progressPercent })
        } catch {}
        console.log('[daily-cron] TEMPLATE: templates/daily-reminder.tsx | Labels: Energy/Focus/Sleep')
        const html = renderV3Reminder({
          firstName: firstName || 'there',
          supplementCount,
          progressPercent,
          checkinUrl: checkinHref,
          linkHint: null,
          cohortTransactionalShell: emailShell.cohortTransactionalShell,
          ...(emailShell.cohortTransactionalShell
            ? { partnerBrandName: emailShell.partnerBrandName, cohortSlug: emailShell.cohortSlug }
            : {}),
          ...(energy != null ? { energy } : {}),
          ...(focus  != null ? { focus }  : {}),
          ...(sleep  != null ? { sleep }  : {}),
          ...(mood   != null ? { mood }   : {})
        })

        try {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Email HTML length:', (typeof html === 'string') ? html.length : '(non-string)')
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Email preview:', (typeof html === 'string') ? html.substring(0, 200) : '(non-string)')
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Full HTML sample:', (typeof html === 'string') ? html.substring(0, 500) : '(non-string)')
          // eslint-disable-next-line no-console
          console.log('[daily-cron] HTML contains Check in?', (typeof html === 'string') ? html.includes('Check in') : false)
        } catch {}

        const subject = dailyReminderEmailSubject({
          cohortTransactionalShell: emailShell.cohortTransactionalShell,
          partnerBrandName: emailShell.partnerBrandName,
        })

        if (dryRun) {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] DRY RUN - would send to:', { user_id: p.user_id, email, subject })
          logCandidate('branch', { user_id: p.user_id, email, branch: 'dry_run_resend_skipped', resend_called: false })
          recordSkip({
            user_id: p.user_id,
            email,
            ok: true,
            dry: true,
            skip_reason: 'dry_run',
            tz,
            localYesterdayStr,
            subject,
          })
        } else {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Sending to:', { user_id: p.user_id, email, subject })
          logCandidate('resend', { user_id: p.user_id, email, resend_called: true })
          try {
            const resp = await resend.emails.send({ from: sender, to: email!, subject, html, ...(reply_to ? { reply_to: reply_to } : {}) })
            const resendId = resp.data?.id || null
            const sendError = resp.error?.message || null
            const sentOk = !sendError
            // eslint-disable-next-line no-console
            console.log('[daily-cron] Resend response:', { user_id: p.user_id, email, resend_id: resendId, error: sendError })
            try {
              console.log('[daily-cron] Resend raw:', JSON.stringify({ data: resp.data, error: resp.error }))
            } catch {
              console.log('[daily-cron] Resend raw: (unserializable)')
            }
            try {
              console.log('[daily-cron] Resend payload:', { from: sender, to: email, subject, html: (typeof html === 'string') ? html.substring(0, 300) : '(non-string)' })
            } catch {}
            if (!sentOk) {
              console.error('[daily-cron] Resend send failed:', { user_id: p.user_id, email, error: sendError })
              results.push({
                outcome: 'failed',
                user_id: p.user_id,
                email,
                ok: false,
                resend_id: resendId,
                error: sendError,
              })
              failCount++
            } else {
              let emailSendsInsertOk = false
              let lastReminderSentAtUpdated = false
              try {
                const { error: insertErr } = await supabaseAdmin
                  .from('email_sends')
                  .insert({
                    user_id: p.user_id,
                    email_type: 'daily_reminder',
                    sent_at: new Date().toISOString(),
                    resend_id: resendId,
                    metadata: { subject, timezone: tz, local_date: localYesterdayStr }
                  })
                if (insertErr) {
                  console.error('[daily-cron] email_sends insert failed (daily_reminder):', insertErr)
                } else {
                  emailSendsInsertOk = true
                  // eslint-disable-next-line no-console
                  console.log('[daily-cron] email_sends insert OK (daily_reminder):', { user_id: p.user_id, resend_id: resendId })
                }
                if (reachedFive) {
                  const { error: insert5Err } = await supabaseAdmin
                    .from('email_sends')
                    .insert({
                      user_id: p.user_id,
                      email_type: 'milestone_5',
                      sent_at: new Date().toISOString(),
                      resend_id: resendId,
                      metadata: { subject: 'milestone_5', timezone: tz, local_date: localYesterdayStr }
                    })
                  if (insert5Err) {
                    console.error('[daily-cron] email_sends insert failed (milestone_5):', insert5Err)
                  } else {
                    console.log('[daily-cron] email_sends insert OK (milestone_5):', { user_id: p.user_id, resend_id: resendId })
                  }
                }
              } catch (insErr) {
                console.error('[daily-cron] email_sends insert exception:', insErr)
              }
              // Critical for idempotency: mark as sent after successful email delivery.
              try {
                const { error: updErr } = await supabaseAdmin
                  .from('profiles')
                  .update({ last_reminder_sent_at: new Date().toISOString() } as any)
                  .eq('user_id', p.user_id)
                if (updErr) {
                  console.error('[daily-cron] profiles update failed (last_reminder_sent_at):', { user_id: p.user_id, error: updErr })
                } else {
                  lastReminderSentAtUpdated = true
                  console.log('[daily-cron] profiles updated last_reminder_sent_at:', { user_id: p.user_id })
                }
              } catch (updEx) {
                console.error('[daily-cron] profiles update exception (last_reminder_sent_at):', { user_id: p.user_id, error: (updEx as any)?.message || updEx })
              }
              logCandidate('branch', {
                user_id: p.user_id,
                email,
                branch: 'sent',
                email_sends_insert_ok: emailSendsInsertOk,
                last_reminder_sent_at_updated: lastReminderSentAtUpdated,
              })
              results.push({
                outcome: 'sent',
                user_id: p.user_id,
                email,
                ok: true,
                id: resendId,
                email_sends_insert_ok: emailSendsInsertOk,
                last_reminder_sent_at_updated: lastReminderSentAtUpdated,
              })
              successCount++
            }
          } catch (sendEx: any) {
            console.error('[daily-cron] Resend exception:', { user_id: p.user_id, email, error: sendEx?.message || sendEx })
            results.push({
              outcome: 'failed',
              user_id: p.user_id,
              email,
              ok: false,
              error: sendEx?.message || 'send_exception',
            })
            failCount++
          }
        }
      } catch (e: any) {
        const msg = e?.message || String(e)
        failCount++
        console.error('[daily-cron] candidate pipeline exception:', {
          user_id: p.user_id,
          profile_id: p.profile_id,
          email: emailMap.get(p.user_id) ?? null,
          error: msg,
          stack: e instanceof Error ? e.stack : undefined,
        })
        results.push({
          outcome: 'failed',
          user_id: p.user_id,
          profile_id: p.profile_id ?? null,
          email: emailMap.get(p.user_id) ?? null,
          ok: false,
          error: msg,
          stage: 'pipeline_exception',
        })
      }
    }

    const accounted = successCount + failCount + skipCount
    if (accounted !== profilesInWindow.length) {
      // eslint-disable-next-line no-console
      console.error('[daily-cron] Summary invariant broken:', {
        success: successCount,
        failed: failCount,
        skipped: skipCount,
        attempted: profilesInWindow.length,
        accounted,
      })
    }
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Summary:', {
      success: successCount,
      failed: failCount,
      skipped: skipCount,
      attempted: profilesInWindow.length,
      accounted,
    })
    return NextResponse.json({
      ok: true,
      count: results.length,
      results,
      success: successCount,
      failed: failCount,
      skipped: skipCount,
      dryRun: dryRun ? true : undefined,
      resolvedEmails: emailMap.size,
    })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[daily-cron] Fatal error:', e)
    return NextResponse.json({ ok:false, error: e?.message || 'Database error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Immediate entry log to debug route activation issues
  try {
    // eslint-disable-next-line no-console
    console.log('[daily-cron] ========== ROUTE START (GET) ==========')
  } catch {}
  try {
    const u = new URL(req.url)
    if (u.searchParams.get('ping') === '1' || u.searchParams.get('test') === '1') {
      console.log('[daily-cron] ping/test short-circuit OK')
      return NextResponse.json({ ok: true, test: 'ok', ts: Date.now() })
    }
  } catch {}
  try {
    return await handler(req)
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[daily-cron] FATAL ERROR (GET):', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Immediate entry log to debug route activation issues
  try {
    // eslint-disable-next-line no-console
    console.log('[daily-cron] ========== ROUTE START (POST) ==========')
  } catch {}
  try {
    const u = new URL(req.url)
    if (u.searchParams.get('ping') === '1' || u.searchParams.get('test') === '1') {
      console.log('[daily-cron] ping/test short-circuit OK (POST)')
      return NextResponse.json({ ok: true, test: 'ok', ts: Date.now() })
    }
  } catch {}
  try {
    return await handler(req)
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[daily-cron] FATAL ERROR (POST):', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}


