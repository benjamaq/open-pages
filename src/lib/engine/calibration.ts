import { createClient } from '@/lib/supabase/server'

type StressLevel = 'low' | 'moderate' | 'high'

/**
 * Update user baseline from their check-in history
 * Runs after each check-in to keep baseline current
 */
export async function updateUserBaseline(userId: string): Promise<void> {
  console.log('📊 Updating baseline for user:', userId)
  
  const supabase = await createClient()
  
  // Get last 90 days of check-ins for calibration
  const sinceDate = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)
  
  const { data: checks } = await supabase
    .from('checkins')
    .select('date, mood')
    .eq('user_id', userId)
    .gte('date', sinceDate)
    .order('date', { ascending: false })
  
  if (!checks || checks.length < 14) {
    console.log('  ⏳ Not enough data yet:', checks?.length || 0, '/ 14 needed')
    
    // Update with incomplete calibration
    await supabase.from('user_baselines').upsert({
      user_id: userId,
      calibration_complete: false,
      calibration_days: checks?.length || 0,
      updated_at: new Date().toISOString()
    })
    return
  }
  
  console.log('  ✅ Sufficient data:', checks.length, 'check-ins')
  
  // Analyze mood distribution
  const moodCounts = {
    sharp: checks.filter(c => (c as any).mood === 'sharp').length,
    ok: checks.filter(c => (c as any).mood === 'ok').length,
    low: checks.filter(c => (c as any).mood === 'low').length
  }
  
  const total = checks.length
  const lowPct = (moodCounts.low / total) * 100
  const sharpPct = (moodCounts.sharp / total) * 100
  
  console.log('  📈 Mood distribution:', {
    sharp: `${sharpPct.toFixed(0)}%`,
    ok: `${((moodCounts.ok / total) * 100).toFixed(0)}%`,
    low: `${lowPct.toFixed(0)}%`
  })
  
  // Infer stress level from mood patterns
  let stressLevel: StressLevel
  if (lowPct > 40) {
    stressLevel = 'high'
  } else if (lowPct > 20 || sharpPct < 20) {
    stressLevel = 'moderate'
  } else {
    stressLevel = 'low'
  }
  
  console.log('  🎯 Inferred stress level:', stressLevel)
  
  // Calculate mood streak variability (how stable are moods day-to-day?)
  let streakChanges = 0
  for (let i = 1; i < checks.length && i < 30; i++) {
    const prev = (checks[i - 1] as any).mood
    const curr = (checks[i] as any).mood
    if (curr !== prev) {
      streakChanges++
    }
  }
  const volatility = (streakChanges / Math.min(29, checks.length - 1)) * 100
  
  console.log('  📊 Mood volatility:', volatility.toFixed(0) + '%')
  
  // Save baseline
  const baseline = {
    user_id: userId,
    calibration_complete: checks.length >= 14,
    calibration_days: checks.length,
    stress_level: stressLevel,
    typical_sharp_hrv: null as number | null,  // TODO: Add when we have HRV data
    typical_ok_hrv: null as number | null,
    typical_low_hrv: null as number | null,
    avg_sleep_score: null as number | null,    // TODO: Add when we have sleep data
    updated_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('user_baselines')
    .upsert(baseline)
  
  if (error) {
    console.error('  ❌ Error saving baseline:', error)
  } else {
    console.log('  ✅ Baseline saved successfully')
  }
}

/**
 * Get user's baseline (or null if not calibrated yet)
 */
export async function getUserBaseline(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_baselines')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  return data
}

/**
 * Get adjusted thresholds based on user's stress level
 * High stress = noisier data = need bigger effects to be confident
 */
export function getAdjustedThresholds(stressLevel: StressLevel | null) {
  // Lower baseline thresholds to create progression
  let minEffect = 2
  let minConfidence = 60
  let minDays = 7
  if (stressLevel === 'high') {
    minEffect += 2
    minConfidence += 10
    minDays = 10
  } else if (stressLevel === 'moderate') {
    minEffect += 1
    minConfidence += 5
  }
  return { minEffect, minConfidence, minDays }
}


