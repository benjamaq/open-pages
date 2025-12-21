export type BiologyRule = {
  id: string
  conditions: {
    mechanismTag?: string
    metric?: string
    direction?: 'positive' | 'negative'
    supplementNameLike?: string
  }
  text: string
}

export const biologyProfiles: BiologyRule[] = [
  {
    id: 'neural_overactivation',
    conditions: { mechanismTag: 'GABAergic', metric: 'sleep_latency_minutes', direction: 'positive' },
    text:
      'Your sleep bottleneck is neural overactivation rather than circadian timing. In plain terms: your brain runs hot at night, and calming circuits helps more than shifting your sleep schedule.'
  },
  {
    id: 'magnesium_brain_deficiency',
    conditions: { supplementNameLike: 'magnesium threonate', direction: 'positive' },
    text:
      'Your strong response to brain-penetrant magnesium suggests a mild deficiency in neural tissue rather than a general magnesium status issue.'
  }
]




