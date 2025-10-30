import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { renderDailyReminderHTML, getDailyReminderSubject } from '@/lib/email/dailyReminderTemplate'
import crypto from 'crypto'
import { Resend } from 'resend'
import { formatInTimeZone } from 'date-fns-tz'
import { addDays } from 'date-fns'

type ProfileRow = { user_id: string; display_name: string | null; timezone?: string | null }

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
  const dryRun = url.searchParams.get('dry') === '1'
  const filterEmail = url.searchParams.get('email') || undefined
  const forceFlag = url.searchParams.get('force') === '1'
  // Allow force when explicitly targeting an email, even without auth header (scoped to that user only)
  const hasAuth = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  const authorizedForce = forceFlag && (hasAuth || !!filterEmail)
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
      .select('user_id, display_name, timezone')
      .limit(10000)
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Found profiles:', (profiles as any)?.length || 0)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[daily-cron] Profiles error:', error)
      return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
    }

    // Optional scope: if a target email was provided, look up its user_id once and scope profiles to that user only
    let scopedProfiles: ProfileRow[] = ((profiles as any) || []) as ProfileRow[]
    let targetedUserId: string | undefined
    if (filterEmail) {
      try {
        const { data: target } = await (supabaseAdmin as any)
          .from('auth.users')
          .select('id')
          .eq('email', filterEmail)
          .maybeSingle()
        targetedUserId = (target as any)?.id
        if (targetedUserId) {
          if (scopedProfiles.some(p => p.user_id === targetedUserId)) {
            scopedProfiles = scopedProfiles.filter(p => p.user_id === targetedUserId)
          } else {
            // If profile not present, synthesize a minimal one; timezone will be ignored when bypassAll
            scopedProfiles = [{ user_id: targetedUserId, display_name: null, timezone: 'UTC' }]
          }
        } else {
          // Hard safety: if email filter provided but user not found, do not fan out to all users
          console.error('[daily-cron] Target email not found in auth.users, aborting targeted run:', filterEmail)
          return NextResponse.json({ ok: false, error: 'target_email_not_found', email: filterEmail })
        }
      } catch {}
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
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
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

    const results: any[] = []
    let successCount = 0
    let failCount = 0
    for (const p of profilesInWindow) {
      try {
        const email = emailMap.get(p.user_id)
        if (!email) { results.push({ user_id: p.user_id, skip: 'no email', stage: 'email-lookup' }); continue }
        if (filterEmail && email !== filterEmail) { continue }
        // profiles.daily_reminders_enabled already filtered by the .or above

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
        const { data: entry } = await supabaseAdmin
          .from('daily_entries')
          .select('pain, mood, sleep_quality, meds, protocols, local_date')
          .eq('user_id', p.user_id)
          .eq('local_date', localYesterdayStr)
          .maybeSingle()

        const pain = (entry as any)?.pain ?? 5
        const mood = (entry as any)?.mood ?? 5
        const sleep = (entry as any)?.sleep_quality ?? 5
        if (!entry && !bypassAll) { results.push({ user_id: p.user_id, email, skip: 'no yesterday entry', stage: 'load-entry', tz, localYesterdayStr }); continue }

        // Calculate readiness
        const readinessPercent = Math.round((((10 - pain) + mood + sleep) / 3) * 10)
        const readinessEmoji = readinessPercent >= 70 ? '🌞' : readinessPercent >= 40 ? '💧' : '🌙'
        const readinessMessage = readinessPercent >= 70
          ? 'High energy — great day to move'
          : readinessPercent >= 40
            ? 'Take it steady — light activity today'
            : 'Low-energy day — rest is progress'

        // Generate magic token
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiresAt = new Date(Date.now() + 24*60*60*1000).toISOString()
        await supabaseAdmin.from('magic_checkin_tokens').insert({ user_id: p.user_id, token_hash: tokenHash, expires_at: expiresAt })
        const magicUrl = `${base}/api/checkin/magic?token=${rawToken}`

        const firstName = (p.display_name || '').toString().split(' ')[0] || (p.display_name || 'there') || 'there'
        // Build supplement list from yesterday's entry
        const supplementList: string[] = []
        try {
          if (Array.isArray((entry as any).meds)) {
            for (const m of (entry as any).meds) if (m?.name) supplementList.push(String(m.name))
          }
          if (Array.isArray((entry as any).protocols)) {
            for (const pr of (entry as any).protocols) if (pr?.name) supplementList.push(String(pr.name))
          }
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

        const html = renderDailyReminderHTML({
          userName: firstName,
          pain, mood, sleep,
          readinessPercent,
          readinessEmoji,
          readinessMessage,
          supplementList: supplementList.length ? supplementList : ['Magnesium','Omega-3','Sauna Protocol'],
          checkInUrl: `${base}/dash`,
          magicUrl,
          optOutUrl: `${base}/settings/notifications`,
          milestoneBanner,
        })

        try {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Email HTML length:', (typeof html === 'string') ? html.length : '(non-string)')
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Email preview:', (typeof html === 'string') ? html.substring(0, 200) : '(non-string)')
        } catch {}

        let subject = getDailyReminderSubject(firstName)
        if (isFirstEmail) subject = "Skip today's check-in with Quick Save"
        if (reachedFive) subject = "5 days in — you’re unlocking insights"

        if (dryRun) {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] DRY RUN - would send to:', { user_id: p.user_id, email, subject })
          results.push({ user_id: p.user_id, email, ok: true, dry: true, tz, localYesterdayStr, subject })
        } else {
          // eslint-disable-next-line no-console
          console.log('[daily-cron] Sending to:', { user_id: p.user_id, email, subject })
          try {
            const resp = await resend.emails.send({ from, to: email!, subject, html, ...(reply_to ? { reply_to } : {}) })
            const resendId = resp.data?.id || null
            const sendError = resp.error?.message || null
            const sentOk = !sendError
            // eslint-disable-next-line no-console
            console.log('[daily-cron] Resend response:', { user_id: p.user_id, email, resend_id: resendId, error: sendError })
            try {
              console.log('[daily-cron] Resend payload:', { from, to: email, subject, html: (typeof html === 'string') ? html.substring(0, 300) : '(non-string)' })
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
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}


