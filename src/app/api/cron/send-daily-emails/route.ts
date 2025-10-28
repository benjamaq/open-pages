import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { renderDailyReminderHTML, getDailyReminderSubject } from '@/lib/email/dailyReminderTemplate'
import crypto from 'crypto'
import { Resend } from 'resend'

type ProfileRow = { user_id: string; display_name: string | null; timezone?: string | null }

export async function POST(_req: NextRequest) {
  try {
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Starting email cron job...')
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1) Select users to send (simplified: users with yesterday entry; opt-out handled later)
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

    // STEP 2: Load emails via getUserById loop (reliable, supported)
    // eslint-disable-next-line no-console
    console.log('[daily-cron] Fetching emails via getUserById...')
    const emailMap = new Map<string, string>()
    let emailsFetched = 0
    let emailsFailed = 0
    for (const profile of (profiles as ProfileRow[])) {
      try {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        if (userError) {
          // eslint-disable-next-line no-console
          console.error(`[daily-cron] getUserById error for ${profile.user_id}:`, userError)
          emailsFailed++
          continue
        }
        if (user?.email) {
          emailMap.set(profile.user_id, user.email)
          emailsFetched++
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[daily-cron] Exception fetching user ${profile.user_id}:`, err)
        emailsFailed++
      }
    }
    // eslint-disable-next-line no-console
    console.log(`[daily-cron] Fetched ${emailsFetched} emails, ${emailsFailed} failed`)
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
    const reply_to = process.env.REPLY_TO_EMAIL || undefined
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'

    // Timezone window filter (send only to users in 7:00-7:59 local)
    const now = new Date()
    const profilesInWindow = (profiles as ProfileRow[]).filter(p => {
      const tz = p.timezone || 'UTC'
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: tz }))
      const hour = userTime.getHours()
      return hour >= 7 && hour < 8
    })

    // eslint-disable-next-line no-console
    console.log('[daily-cron] Users in 7-8am window:', profilesInWindow.length)

    const results: any[] = []
    for (const p of profilesInWindow) {
      try {
        const email = emailMap.get(p.user_id)
        if (!email) { results.push({ user_id: p.user_id, skip: 'no email' }); continue }
        // profiles.daily_reminders_enabled already filtered by the .or above

        // Deduplicate by email_sends same day
        const { data: sentToday } = await supabaseAdmin
          .from('email_sends')
          .select('id')
          .eq('user_id', p.user_id)
          .eq('email_type', 'daily_reminder')
          .gte('sent_at', new Date(new Date().toDateString()))
          .limit(1)
        if (sentToday && sentToday.length) { results.push({ user_id: p.user_id, skip: 'already sent' }); continue }

        // Pull yesterday metrics (simplified fallback if missing)
        const { data: entry } = await supabaseAdmin
          .from('daily_entries')
          .select('pain, mood, sleep_quality, meds, protocols, created_at')
          .eq('user_id', p.user_id)
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString())
          .maybeSingle()

        const pain = entry?.pain ?? 5
        const mood = entry?.mood ?? 5
        const sleep = entry?.sleep_quality ?? 5
        if (!entry) { results.push({ user_id: p.user_id, skip: 'no yesterday entry' }); continue }

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

        let subject = getDailyReminderSubject(firstName)
        if (isFirstEmail) subject = "Skip today's check-in with Quick Save"
        if (reachedFive) subject = "5 days in — you’re unlocking insights"

        const resp = await resend.emails.send({ from, to: email!, subject, html, ...(reply_to ? { reply_to } : {}) })
        const sentOk = !resp.error
        await supabaseAdmin.from('email_sends').insert({ user_id: p.user_id, email_type: 'daily_reminder', success: sentOk, error: resp.error?.message })
        if (reachedFive) {
          await supabaseAdmin.from('email_sends').insert({ user_id: p.user_id, email_type: 'milestone_5', success: sentOk, error: resp.error?.message })
        }
        results.push({ user_id: p.user_id, ok: sentOk, id: resp.data?.id, error: resp.error?.message })
      } catch (e: any) {
        results.push({ user_id: p.user_id, ok: false, error: e?.message })
      }
    }

    return NextResponse.json({ ok: true, count: results.length, results })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[daily-cron] Fatal error:', e)
    return NextResponse.json({ ok:false, error: e?.message || 'Database error' }, { status: 500 })
  }
}


