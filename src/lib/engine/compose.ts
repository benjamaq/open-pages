import { DayRow, SignalSnapshot, PatternType } from './types'
import { MOOD_VAL, mean, deltaToEffectPct, bootstrapSignConfidence } from './math'
import { getOrCreateProfile } from './profiles'
import { detectConfounds } from './confounding'
import { detectPattern, explainPattern } from './patterns'
import { getUserBaseline, getAdjustedThresholds } from './calibration'

function weeklyBlocks(len: number): number[][] {
  const blocks: number[][] = []
  let i = 0
  while (i < len) {
    const block: number[] = []
    for (let k = 0; k < 7 && i < len; k++, i++) {
      block.push(i)
    }
    blocks.push(block)
  }
  return blocks.length ? blocks : [[0]]
}

function calculateVariance(vals: number[]): number {
  if (vals.length < 2) return 0
  const m = mean(vals)
  const squaredDiffs = vals.map(v => Math.pow(v - m, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / vals.length
}

function validate(rows: DayRow[]): string[] {
  const warnings: string[] = []
  
  const treatedDays = rows.filter(r => r.treated && r.mood != null)
  const controlDays = rows.filter(r => !r.treated && r.mood != null)
  
  if (treatedDays.length < 7) {
    warnings.push(`Only ${treatedDays.length} treated days - need at least 7 for reliable analysis`)
  }
  
  if (controlDays.length < 7) {
    warnings.push(`Only ${controlDays.length} control days - need at least 7 for comparison`)
  }
  
  if (treatedDays.length < 7 && controlDays.length < 7) {
    warnings.push('Insufficient data for both treated and control periods')
  }
  
  return warnings
}

export async function finalizeSnapshot(
  rows: DayRow[],
  window: '30d' | '90d' | '365d',
  supplementId: string,
  supplementName: string,
  profileId: string,
  userId: string
): Promise<SignalSnapshot> {
  console.log('🧮 Computing signal for:', supplementName)
  console.log('  → Window:', window, '| Rows:', rows.length)
  
  const profile = await getOrCreateProfile(supplementId, supplementName)
  console.log('  → Category:', profile.category, '| Expected window:', profile.expected_window_days, 'days')
  
  // Calibration thresholds based on user baseline
  const baseline = await getUserBaseline(userId)
  const thresholds = getAdjustedThresholds((baseline as any)?.stress_level || null)
  console.log('  → User stress level:', (baseline as any)?.stress_level || 'unknown')
  console.log('  → Thresholds:', thresholds)
  
  const confounds = await detectConfounds(supplementId, profileId)
  
  const hasNumeric = rows.some(r => (r as any).metric_value != null || (r as any).sleep_score != null)
  if (hasNumeric) {
    const tSleep = rows.filter(r => r.treated && ((r as any).metric_value != null || (r as any).sleep_score != null)).map(r => ((r as any).metric_value ?? (r as any).sleep_score) as number)
    const cSleep = rows.filter(r => !r.treated && ((r as any).metric_value != null || (r as any).sleep_score != null)).map(r => ((r as any).metric_value ?? (r as any).sleep_score) as number)
    console.log('  💤 Using numeric sleep_quality for analysis')
    console.log('    · Treated mean:', Math.round(mean(tSleep) * 100) / 100, 'n=', tSleep.length)
    console.log('    · Control mean:', Math.round(mean(cSleep) * 100) / 100, 'n=', cSleep.length)
  }
  const tVals = hasNumeric
    ? rows.filter(r => r.treated && ((r as any).metric_value != null || (r as any).sleep_score != null)).map(r => ((r as any).metric_value ?? (r as any).sleep_score) as number)
    : rows.filter(r => r.treated && r.mood != null).map(r => MOOD_VAL[r.mood!])
  const cVals = hasNumeric
    ? rows.filter(r => !r.treated && ((r as any).metric_value != null || (r as any).sleep_score != null)).map(r => ((r as any).metric_value ?? (r as any).sleep_score) as number)
    : rows.filter(r => !r.treated && r.mood != null).map(r => MOOD_VAL[r.mood!])
  
  const n = tVals.length
  console.log('  → Data: n=', n, '(treated)', cVals.length, '(control)')
  
  const warnings = validate(rows)
  
  if (n < 7) {
    return {
      n,
      effectPct: 0,
      confidence: 0,
      status: 'insufficient',
      window,
      warnings: ['Need at least 7 days of check-ins while taking this supplement']
    }
  }
  
  if (confounds.length > 0 && n < 21) {
    console.log('  ⚠️  CONFOUNDED with:', confounds.join(', '))
    return {
      n,
      effectPct: 0,
      confidence: 0,
      status: 'confounded',
      window,
      warnings: [`Started within 7 days of: ${confounds.join(', ')}. Cannot isolate effect.`],
      confoundedWith: confounds,
      explanation: `You changed multiple supplements at once. Wait 21+ days or stop one to isolate the effect.`
    }
  }
  
  const currentDay = n
  
  if (profile.loading_phase_days && currentDay < profile.loading_phase_days) {
    console.log('  ⏳ Still in loading phase')
    return {
      n,
      effectPct: 0,
      confidence: 0,
      status: 'loading',
      window,
      warnings: [`Day ${currentDay}/${profile.loading_phase_days} - still loading`],
      daysUntilPeak: profile.peak_effect_days ? profile.peak_effect_days - currentDay : undefined,
      explanation: `${profile.name} needs ${profile.loading_phase_days} days to load into your system. Be patient.`
    }
  }
  
  const delta = mean(tVals) - mean(cVals)
  let effectPct = 0
  let preMean: number | null = null
  let postMean: number | null = null
  if (hasNumeric) {
    preMean = cVals.length ? Math.round(mean(cVals) * 100) / 100 : null
    postMean = tVals.length ? Math.round(mean(tVals) * 100) / 100 : null
    const base = mean(cVals)
    effectPct = base !== 0 ? Math.round(((delta) / base) * 100) : 0
  } else {
    effectPct = deltaToEffectPct(delta)
  }
  const blocks = weeklyBlocks(Math.max(tVals.length, cVals.length))
  const confidence = bootstrapSignConfidence(tVals, cVals, blocks, 800)
  
  console.log('  → Effect:', effectPct + '%', '| Confidence:', confidence + '%')
  
  if (profile.category === 'protective') {
    console.log('  🛡️  Analyzing as PROTECTIVE supplement')
    
    if (n < 21) {
      return {
        n,
        effectPct,
        confidence,
        status: 'testing',
        window,
        warnings: ['Protective supplements need 21+ days for reliable analysis'],
        explanation: 'Measuring baseline stability - not expecting immediate mood changes. Keep going.'
      }
    }
    
    const tVariance = calculateVariance(tVals)
    const cVariance = calculateVariance(cVals)
    const varianceReduction = cVariance > 0 
      ? ((cVariance - tVariance) / cVariance) * 100 
      : 0
    
    console.log('  → Variance reduction:', Math.round(varianceReduction) + '%')
    
    if (varianceReduction > 15 && confidence > 70) {
      return {
        n,
        effectPct: Math.round(varianceReduction),
        confidence,
        status: 'protective',
        window,
        warnings: [],
        varianceReduction: Math.round(varianceReduction),
        explanation: `Keeping your metrics ${Math.round(varianceReduction)}% more stable. This is expected for protective supplements - they prevent decline rather than boost performance.`
      }
    }
    
    if (n >= 60) {
      return {
        n,
        effectPct: Math.round(varianceReduction),
        confidence,
        status: 'no_effect',
        window,
        warnings: [],
        varianceReduction: Math.round(varianceReduction),
        explanation: `After ${n} days, no measurable protective effect detected. Consider dropping unless taken for other specific reasons.`
      }
    }
    
    return {
      n,
      effectPct: Math.round(varianceReduction),
      confidence,
      status: 'testing',
      window,
      warnings: [],
      varianceReduction: Math.round(varianceReduction),
      explanation: `${n}/60+ days collected. Keep going to confirm protective effect.`
    }
  }
  
  console.log('  ⚡ Analyzing as PERFORMANCE supplement')
  
  // Build history for pattern detection (treated days only)
  let detectedPattern: PatternType | undefined
  let patternExplanation = ''
  const treatedRows = rows.filter(r => r.treated && r.mood != null)
  if (treatedRows.length >= 7) {
    const history = treatedRows.map(r => ({
      date: r.date,
      value: MOOD_VAL[r.mood!]
    }))
    const { pattern, confidence: patternConfidence } = detectPattern(history)
    if (pattern && patternConfidence > 0.6) {
      console.log('  🔍 Pattern detected:', pattern, `(${Math.round(patternConfidence * 100)}% confidence)`)
      detectedPattern = pattern
      patternExplanation = explainPattern(pattern, supplementName, n)
    }
  }
  
  if (effectPct > thresholds.minEffect && confidence > thresholds.minConfidence) {
    let explanation = patternExplanation || `Clear positive effect detected. Your metrics improved by ${effectPct}% when taking this.`
    
    if ((baseline as any)?.stress_level === 'high') {
      explanation += ` (Given your stress level, this is a strong signal - noise typically masks smaller effects.)`
    }
    
    if (profile.peak_effect_days && currentDay < profile.peak_effect_days) {
      explanation += ` Effect may continue improving - peak expected around day ${profile.peak_effect_days}.`
    }
    
    return {
      n,
      effectPct,
      confidence,
      status: 'confirmed',
      window,
      warnings,
      preMean,
      postMean,
      pattern: detectedPattern,
      explanation
    }
  }
  
  if (effectPct < -thresholds.minEffect && confidence > thresholds.minConfidence) {
    return {
      n,
      effectPct,
      confidence,
      status: 'hurting',
      window,
      warnings,
      preMean,
      postMean,
      pattern: detectedPattern,
      explanation: patternExplanation || `This supplement appears to be hurting your metrics (${effectPct}%). Consider stopping.`
    }
  }
  
  if (Math.abs(effectPct) < thresholds.minEffect && confidence > thresholds.minConfidence && n >= thresholds.minDays) {
    return {
      n,
      effectPct,
      confidence,
      status: 'no_effect',
      window,
      warnings,
      preMean,
      postMean,
      pattern: detectedPattern,
      explanation: patternExplanation || `After ${n} days, no measurable effect on your mood or energy. Consider dropping unless taken for specific non-mood reasons.`
    }
  }
  
  if (n < thresholds.minDays) {
    return {
      n,
      effectPct,
      confidence,
      status: 'testing',
      window,
      warnings,
      preMean,
      postMean,
      pattern: detectedPattern,
      explanation: `Collecting data - ${n}/${thresholds.minDays} days needed for your stress level. Keep going.`
    }
  }
  
  let testingExplanation = `Collecting data - ${n} days so far. `
  
  if (n < 14) {
    testingExplanation += `Keep going to ${profile.expected_window_days} days for conclusive results.`
  } else if (confidence < 70) {
    testingExplanation += `Data is noisy - need more consistent check-ins for clear signal.`
  } else {
    testingExplanation += `Effect size is small but might become clearer with more data.`
  }
  
  return {
    n,
    effectPct,
    confidence,
    status: 'testing',
    window,
    warnings,
    preMean,
    postMean,
    pattern: detectedPattern,
    explanation: patternExplanation || testingExplanation
  }
}


