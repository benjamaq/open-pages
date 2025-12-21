export type MechanismRule = {
  tags: string[]
  primaryMetric: string
  direction: 'positive' | 'negative'
  templateId: string
}

export const mechanismInferenceRules: MechanismRule[] = [
  {
    tags: ['GABAergic', 'NMDA_antagonist'],
    primaryMetric: 'sleep_latency_minutes',
    direction: 'positive',
    templateId: 'gaba_hyperarousal'
  },
  {
    tags: ['cortisol_modulation'],
    primaryMetric: 'hrv_evening',
    direction: 'positive',
    templateId: 'stress_buffering'
  }
]

export const mechanismTemplates: Record<string, { label: string; text: string }> = {
  gaba_hyperarousal: {
    label: 'GABA-dominant responder type',
    text:
      'Your pattern suggests cortical hyper-arousal: your nervous system calms significantly when we nudge GABA and dampen glutamate. This is a classic magnesium-responsive signature.'
  },
  stress_buffering: {
    label: 'Stress-buffer responder',
    text:
      'Your improvements show up most clearly on high-stress days, which is typical when a supplement is buffering cortisol or stress pathways rather than directly boosting energy.'
  }
}




