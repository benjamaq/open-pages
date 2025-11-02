'use server'

import { createClient } from '@/lib/supabase/server'
import { computeAndPersistSupplementInsights } from '@/app/actions/supplementsEffectiveness'

function isoDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  // Use sv-SE for YYYY-MM-DD
  return d.toLocaleDateString('sv-SE')
}

export async function seedMagnesiumTestData(): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { ok: false, error: 'Unauthorized' }

    // Ensure profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (profileError || !profile) return { ok: false, error: 'Profile not found' }

    // Ensure Magnesium supplement exists and is scheduled daily (0..6)
    const scheduleDays = [0, 1, 2, 3, 4, 5, 6]
    const { data: existing } = await supabase
      .from('stack_items')
      .select('id, name')
      .eq('profile_id', profile.id)
      .eq('item_type', 'supplements')
      .ilike('name', 'magnesium')
      .limit(1)
    let magnesiumId: string | null = existing?.[0]?.id || null

    if (!magnesiumId) {
      const { data: inserted, error: insertErr } = await supabase
        .from('stack_items')
        .insert({
          profile_id: profile.id,
          item_type: 'supplements',
          name: 'Magnesium',
          public: false,
          frequency: 'daily',
          time_preference: 'anytime',
          schedule_days: scheduleDays,
        })
        .select('id')
        .single()
      if (insertErr || !inserted) return { ok: false, error: 'Failed to create supplement' }
      magnesiumId = inserted.id
    } else {
      // Make sure it is daily scheduled
      await supabase
        .from('stack_items')
        .update({ schedule_days: scheduleDays, frequency: 'daily', time_preference: 'anytime' })
        .eq('id', magnesiumId)
    }

    // Last 21 days: skip on these indices (3,7,11,15,19)
    const skipIndices = new Set([3, 7, 11, 15, 19])
    let created = 0

    for (let i = 20; i >= 0; i--) {
      const local_date = isoDaysAgo(i)
      const ordinal = 21 - i // 1..21 oldest->newest
      const isSkip = skipIndices.has(ordinal)
      const pain = isSkip ? 8 : 5

      // Upsert pain for the day
      await supabase
        .from('daily_entries')
        .upsert({
          user_id: user.id,
          local_date,
          pain,
          sleep_quality: isSkip ? 5 : 7,
          mood: isSkip ? 5 : 7,
          lifestyle_factors: []
        }, { onConflict: 'user_id,local_date' })

      // Upsert supplement log (explicit skip on skip days, else taken)
      if (magnesiumId) {
        // Never mark TODAY as taken automatically
        const isToday = i === 0
        await supabase
          .from('supplement_logs')
          .upsert({
            user_id: user.id,
            supplement_id: magnesiumId,
            local_date,
            taken: isToday ? false : !isSkip,
          }, { onConflict: 'user_id,supplement_id,local_date' })
      }
      created++
    }

    // Compute supplement effectiveness insights
    await computeAndPersistSupplementInsights(user.id)

    return { ok: true, created }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Seed failed' }
  }
}


