export type EffectData = {
  name?: string
  effect_direction?: 'positive' | 'negative' | 'neutral' | null
  effect_magnitude?: number | null
  effect_confidence?: number | null
  effect_category?: 'works' | 'no_effect' | 'inconsistent' | 'needs_more_data' | null
  pre_start_average?: number | null
  post_start_average?: number | null
  days_on?: number | null
  days_off?: number | null
  clean_days?: number | null
  noisy_days?: number | null
}

function strengthLabel(d: number): 'negligible' | 'small' | 'moderate' | 'strong' {
  const x = Math.abs(d)
  if (x < 0.2) return 'negligible'
  if (x < 0.5) return 'small'
  if (x < 0.8) return 'moderate'
  return 'strong'
}

function confidenceLabel(c: number): 'low' | 'moderate' | 'high' {
  if (c >= 0.8) return 'high'
  if (c >= 0.6) return 'moderate'
  return 'low'
}

export function interpretEffect(effect: EffectData) {
  const name = effect.name || 'This supplement'
  const dir = effect.effect_direction || 'neutral'
  const d = Number(effect.effect_magnitude ?? 0) || 0
  const conf = Number(effect.effect_confidence ?? 0) || 0
  const cat = effect.effect_category || 'needs_more_data'
  const sLabel = strengthLabel(d)
  const cLabel = confidenceLabel(conf)

  let summarySentence = ''
  let nextSteps: string[] = []

  if (cat === 'works') {
    const pct = Math.round(Math.abs(d) * 100)
    const directionWord = dir === 'positive' ? 'improved' : dir === 'negative' ? 'worsened' : 'changed'
    summarySentence = `${name} ${directionWord} your scores by ~${pct}% (${sLabel} effect, ${cLabel} confidence).`
    nextSteps = [
      'Keep taking this supplement',
      'Retest in 60 days for long‑term tracking'
    ]
  } else if (cat === 'no_effect') {
    const clean = Number(effect.clean_days ?? 0)
    summarySentence = `No measurable improvement detected. ${name} did not change your scores after ${clean} clean days.`
    nextSteps = [
      'Consider stopping this supplement',
      'You could save money by removing it from your stack'
    ]
  } else if (cat === 'inconsistent') {
    summarySentence = 'Results are unstable — too much noise (alcohol, travel, stress) disrupted the signal.'
    nextSteps = [
      'Try 7–10 clean days without alcohol/travel/stress',
      'Results will stabilize with cleaner data'
    ]
  } else {
    summarySentence = `We need more ON/OFF variation to determine if ${name} works. Try skipping it for a few days, or upload wearable history.`
    nextSteps = [
      'Skip this supplement for 2–3 days to create comparison data',
      'Or upload Whoop/Oura history for baseline comparison'
    ]
  }

  return {
    summarySentence,
    confidenceLabel: cLabel,
    effectStrengthLabel: sLabel,
    nextSteps
  }
}


