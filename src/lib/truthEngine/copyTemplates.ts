export const verdictLabels: Record<string, string> = {
  proven_positive: 'PROVEN EFFECT',
  no_effect: 'NO MEASURABLE EFFECT',
  negative: 'NEGATIVE EFFECT',
  confounded: 'CAN’T TRUST THIS YET',
  too_early: 'TOO EARLY TO CALL'
}

export const verdictTitles: Record<string, string> = {
  proven_positive: 'Strong positive effect on {{metricLabel}}',
  no_effect: 'No meaningful change detected',
  negative: 'Net-negative effect on {{metricLabel}}',
  confounded: 'Signal is too noisy to trust yet',
  too_early: 'We don’t have enough clean data yet'
}

export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''))
}




