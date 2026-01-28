import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { renderDailyReminderEmail as renderV3Reminder } from '@/lib/email/templates/daily-reminder'
import crypto from 'crypto'
import { Resend } from 'resend'
import { formatInTimeZone } from 'date-fns-tz'
import { addDays } from 'date-fns'
import { getLatestDailyMetrics, getStackProgressForUser } from '@/lib/email/email-stats'

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  timezone?: string | null;
  profile_id?: string;
  reminder_enabled?: boolean | null;
}

async function handler(req: NextRequest) {
  try {
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Starting email cron job...')
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1) Read debug flags
  const url = new URL(req.url)
  const dryParam = url.searchParams.get('dry')
  const rawEmail = url.searchParams.get('email') || undefined
  const forceUserId = url.searchParams.get('user_id') || undefined
  // Normalize email query (strip accidental quotes)
  const filterEmail = rawEmail ? rawEmail.replace(/^"+|"+$/g, '') : undefined
  const dryRun = dryParam === '1'
  const forceFlag = url.searchParams.get('force') === '1'
  // Allow force when explicitly targeting an email, even without auth header (scoped to that user only)
  const hasAuth = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  const authorizedForce = forceFlag && (hasAuth || !!filterEmail || !!forceUserId)
  const bypassAll = (dryRun && !!filterEmail) || authorizedForce
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
      .select('id, user_id, display_name, timezone, reminder_enabled')
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
      reminder_enabled: p.reminder_enabled
    }))

    // If forcing to a specific email, resolve that user immediately and bypass all filters
    if (authorizedForce && (filterEmail || forceUserId)) {
      let targetUserId: string | undefined
      try {
        const adminApi = (supabaseAdmin as any).auth?.admin
        if (forceUserId && adminApi?.getUserById) {
          // Force by user_id first
          console.log('[force] Using user_id override:', forceUserId)
          const { data: byId } = await adminApi.getUserById(forceUserId)
          try { console.log('[force] getUserById result:', { ok: !!byId?.user, id: byId?.user?.id, email: byId?.user?.email }) } catch {}
          targetUserId = byId?.user?.id as string | undefined
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
        } else if (filterEmail && adminApi?.getUserByEmail) {
          // Else force by email via admin API
          console.log('[force] Looking up email:', filterEmail)
          const { data: byEmail } = await adminApi.getUserByEmail(filterEmail)
          try { console.log('[force] getUserByEmail result:', { ok: !!byEmail?.user, id: byEmail?.user?.id, email: byEmail?.user?.email }) } catch {}
          if (byEmail?.user?.id) {
            targetUserId = byEmail.user.id as string
            // Try to get an existing profile for display/timezone
            const { data: profRow } = await supabaseAdmin
              .from('profiles')
              .select('id, user_id, display_name, timezone')
              .eq('user_id', targetUserId)
              .maybeSingle()
            const display_name = (profRow as any)?.display_name || (byEmail.user?.user_metadata?.name as string) || (filterEmail.split('@')[0] || 'there')
            const timezone = (profRow as any)?.timezone || 'UTC'
            const profile_id = (profRow as any)?.id
            scopedProfiles = [{ user_id: targetUserId, display_name, timezone, profile_id }]
            console.log('[daily-cron] Force targeting user (direct):', { user_id: targetUserId, email: filterEmail })
          }
        }
      } catch (e) {
        console.warn('[daily-cron] Force email lookup failed:', (e as any)?.message)
      }
      // Fallback: direct query to auth.users via schema if admin API failed
      if (!targetUserId && filterEmail) {
        try {
          console.log('[force] Fallback querying auth.users by email:', filterEmail)
          const { data: authUser } = await (supabaseAdmin as any)
            .schema('auth')
            .from('users')
            .select('id, email, raw_user_meta_data')
            .eq('email', filterEmail)
            .maybeSingle()
          try { console.log('[force] auth.users query result:', { ok: !!authUser?.id, id: authUser?.id, email: authUser?.email }) } catch {}
          if (authUser?.id) {
            targetUserId = String(authUser.id)
            const { data: profRow } = await supabaseAdmin
              .from('profiles')
              .select('id, user_id, display_name, timezone')
              .eq('user_id', targetUserId)
              .maybeSingle()
            const display_name = (profRow as any)?.display_name || (authUser?.raw_user_meta_data?.name as string) || (filterEmail.split('@')[0] || 'there')
            const timezone = (profRow as any)?.timezone || 'UTC'
            const profile_id = (profRow as any)?.id
            scopedProfiles = [{ user_id: targetUserId, display_name, timezone, profile_id }]
            console.log('[daily-cron] Force targeting user (auth.users fallback):', { user_id: targetUserId, email: filterEmail })
          }
        } catch (e) {
          console.warn('[daily-cron] auth.users fallback lookup failed:', (e as any)?.message)
        }
      }
      if (!targetUserId) {
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
        emailMap.set(forcedId, filterEmail)
        scopedProfiles = scopedProfiles.filter(p => p.user_id === forcedId)
        console.log('[daily-cron] Force scoped to user:', { user_id: forcedId, email: filterEmail })
      }
    }
    const resend = new Resend(process.env.RESEND_API_KEY!)
    // Sender: prefer env, else enforced verified domain (use .io)
    const sender = process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>'
    try {
      console.log('[daily-cron] Using sender:', sender, '(env:', process.env.RESEND_FROM || '(unset)', ')')
    } catch {}
    const reply_to = process.env.REPLY_TO_EMAIL || undefined
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'

    // Timezone window filter (send only to users in 7:00-7:59 local)
    const now = new Date()
    const profilesInWindow = scopedProfiles.filter(p => {
      if (bypassAll) return true // bypass hour gate for targeted dry/force
    const tz = p.timezone || 'UTC'
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const hour = userTime.getHours()
    return hour >= 7 && hour < 8
  })

    // eslint-disable-next-line no-console
    console.log(`[daily-cron] Users in 7-8am window: ${profilesInWindow.length} (bypassAll=${bypassAll})`)
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
    for (const p of profilesInWindow) {
      try {
        const email = emailMap.get(p.user_id)
        if (!email) { results.push({ user_id: p.user_id, skip: 'no email', stage: 'email-lookup' }); continue }
        if (filterEmail && email !== filterEmail) { continue }

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
            results.push({ user_id: p.user_id, skip: 'inactive_30d_and_no_supplements' })
            continue
          }
        }

        // Deduplicate by email_sends same day
        if (!bypassAll) {
          const { data: sentToday } = await supabaseAdmin
            .from('email_sends')
            .select('id')
            .eq('user_id', p.user_id)
            .eq('email_type', 'daily_reminder')
            .gte('sent_at', new Date(new Date().toDateString()))
            .limit(1)
          if (sentToday && sentToday.length) { results.push({ user_id: p.user_id, skip: 'already sent' }); continue }
        }

        // Pull yesterday metrics based on user's LOCAL date (use local_date column)
        const tz = p.timezone || 'UTC'
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

        // Generate magic token
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiresAt = new Date(Date.now() + 24*60*60*1000).toISOString()
        await supabaseAdmin.from('magic_checkin_tokens').insert({ user_id: p.user_id, token_hash: tokenHash, expires_at: expiresAt })
        const magicUrl = `${base}/api/checkin/magic?token=${rawToken}`

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
          checkinUrl: `${base}/dashboard?checkin=open`,
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

        let subject = `${Math.max(0, Math.min(100, progressPercent))}% complete`

        if (dryRun) {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] DRY RUN - would send to:', { user_id: p.user_id, email, subject })
          results.push({ user_id: p.user_id, email, ok: true, dry: true, tz, localYesterdayStr, subject })
        } else {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Sending to:', { user_id: p.user_id, email, subject })
          try {
            const resp = await resend.emails.send({ from: sender, to: email!, subject, html, ...(reply_to ? { reply_to: reply_to } : {}) })
            const resendId = resp.data?.id || null
            const sendError = resp.error?.message || null
            const sentOk = !sendError
            // eslint-disable-next-line no-console
            console.log('[daily-cron] Resend response:', { user_id: p.user_id, email, resend_id: resendId, error: sendError })
            try {
              console.log('[daily-cron] Resend payload:', { from: sender, to: email, subject, html: (typeof html === 'string') ? html.substring(0, 300) : '(non-string)' })
            } catch {}
            if (!sentOk) {
              console.error('[daily-cron] Resend send failed:', { user_id: p.user_id, email, error: sendError })
              results.push({ user_id: p.user_id, email, ok: false, resend_id: resendId, error: sendError })
              failCount++
            } else {
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
              results.push({ user_id: p.user_id, email, ok: true, id: resendId })
              successCount++
            }
          } catch (sendEx: any) {
            console.error('[daily-cron] Resend exception:', { user_id: p.user_id, email, error: sendEx?.message || sendEx })
            results.push({ user_id: p.user_id, email, ok: false, error: sendEx?.message || 'send_exception' })
            failCount++
          }
        }
      } catch (e: any) {
        results.push({ user_id: p.user_id, ok: false, error: e?.message })
      }
    }

    // eslint-disable-next-line no-console
    console.log('[daily-cron] Summary:', { success: successCount, failed: failCount, attempted: profilesInWindow.length })
    return NextResponse.json({ ok: true, count: results.length, results, success: successCount, failed: failCount, dryRun: dryRun ? true : undefined, resolvedEmails: emailMap.size })
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


