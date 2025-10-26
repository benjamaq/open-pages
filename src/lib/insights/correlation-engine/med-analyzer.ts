import { createClient } from '@/lib/supabase/server'
import type { DailyEntry, MedInsight, FormattedInsight } from './types'
import { mean, cohensD } from '../utils/statistics'
import { formatInsight } from '../formatters/insight-formatter'

export async function analyzeMedicationEffect(userId: string, medName: string): Promise<MedInsight | null> {
  const supabase = await createClient()

  // Find first date med appears
  const { data: firstRows, error: firstErr } = await supabase
    .from('daily_entries' as any)
    .select('local_date, meds')
    .eq('user_id', userId)
    .order('local_date', { ascending: true })
    .limit(60)

  if (firstErr || !firstRows || firstRows.length === 0) return null

  const firstWithMed = (firstRows as any[]).find((r) => Array.isArray(r?.meds) && r.meds.some((m: any) => (m?.name || '').toLowerCase() === medName.toLowerCase()))
  if (!firstWithMed) return null

  const startDate = new Date(firstWithMed.local_date + 'T00:00:00')
  const baselineStart = new Date(startDate)
  baselineStart.setDate(startDate.getDate() - 14)
  const baselineEnd = new Date(startDate)
  baselineEnd.setDate(startDate.getDate() - 1)

  const effectStart = new Date(startDate)
  effectStart.setDate(startDate.getDate() + 3)
  const effectEnd = new Date(startDate)
  effectEnd.setDate(startDate.getDate() + 14)

  const [baselineRes, postRes] = await Promise.all([
    supabase
      .from('daily_entries')
      .select('pain, mood, local_date, meds')
      .eq('user_id', userId)
      .gte('local_date', baselineStart.toISOString().split('T')[0])
      .lte('local_date', baselineEnd.toISOString().split('T')[0]),
    supabase
      .from('daily_entries')
      .select('pain, mood, local_date, meds')
      .eq('user_id', userId)
      .gte('local_date', effectStart.toISOString().split('T')[0])
      .lte('local_date', effectEnd.toISOString().split('T')[0]),
  ])

  const baseline = (baselineRes.data || []) as any[]
  const postStart = (postRes.data || []) as any[]

  if (baseline.length < 7) return null
  const adherentDays = postStart.filter((e) => Array.isArray(e?.meds) && e.meds.some((m: any) => (m?.name || '').toLowerCase() === medName.toLowerCase()))
  if (adherentDays.length < 7) return null

  const painBefore = mean(baseline.map((e) => e.pain).filter((n: any) => typeof n === 'number'))
  const painAfter = mean(adherentDays.map((e) => e.pain).filter((n: any) => typeof n === 'number'))
  const painDelta = painBefore - painAfter

  const moodBefore = mean(baseline.map((e) => e.mood).filter((n: any) => typeof n === 'number'))
  const moodAfter = mean(adherentDays.map((e) => e.mood).filter((n: any) => typeof n === 'number'))
  const moodDelta = moodAfter - moodBefore

  const painEffectSize = cohensD(
    baseline.map((e) => e.pain).filter((n: any) => typeof n === 'number') as number[],
    adherentDays.map((e) => e.pain).filter((n: any) => typeof n === 'number') as number[]
  )
  const moodEffectSize = cohensD(
    baseline.map((e) => e.mood).filter((n: any) => typeof n === 'number') as number[],
    adherentDays.map((e) => e.mood).filter((n: any) => typeof n === 'number') as number[]
  )

  if (Math.abs(painDelta) < 1.5 && Math.abs(moodDelta) < 1.5) return null
  if (painEffectSize < 0.5 && moodEffectSize < 0.5) return null

  const insight: MedInsight = {
    type: 'medication_effect',
    medName,
    startDate,
    baselineDays: baseline.length,
    postStartDays: adherentDays.length,
    painBefore,
    painAfter,
    painDelta,
    painEffectSize,
    moodBefore,
    moodAfter,
    moodDelta,
    moodEffectSize,
    confidence: painEffectSize >= 0.8 || moodEffectSize >= 0.8 ? 'high' : 'medium',
  }

  return insight
}

export async function analyzeMedicationsForUser(userId: string): Promise<FormattedInsight[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('daily_entries')
    .select('meds')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(30)

  const names = new Set<string>()
  ;(rows || []).forEach((r: any) => {
    if (Array.isArray(r?.meds)) {
      r.meds.forEach((m: any) => {
        const nm = (m?.name || '').trim().toLowerCase()
        if (nm) names.add(nm)
      })
    }
  })

  const insights: FormattedInsight[] = []
  for (const name of names) {
    try {
      const res = await analyzeMedicationEffect(userId, name)
      if (res) insights.push(formatInsight(res))
    } catch {}
  }
  return insights
}


