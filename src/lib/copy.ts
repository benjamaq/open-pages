import { CONF_THRESHOLDS } from './signals';

export const Copy = {
  ringTooltip:
    'Confidence blends sample size, effect size, and day-to-day consistency. Correlation ≠ causation.',
  insufficient: `Need ≥${CONF_THRESHOLDS.minDays} days for a usable signal.`,
  testing: 'Early signal—keep logging or run a 7-day test.',
  confirmed: 'Strong personal signal detected.',
  hurting: 'Likely harmful to your chosen metric.',
  no_effect: 'No detectable effect at your current dose.',
  blockedByExperiment: 'This period is under an active test. End the experiment first.',
} as const;

export const VerdictCopy = {
  short: {
    insufficient: 'Need data',
    testing: 'Testing',
    confirmed: 'Working',
    hurting: 'Hurting',
    no_effect: 'No effect',
  },
  long: {
    insufficient: 'Need more data',
    testing: 'Signal emerging',
    confirmed: 'Working (personal)',
    hurting: 'Likely harmful',
    no_effect: 'No detectable effect',
  },
  tooltip: {
    insufficient: 'Log at least 7 days or run a 7-day test to establish a signal.',
    testing: 'Early correlation—keep logging or isolate with a 7-day on/off test.',
    confirmed: 'Strong personal signal (high confidence and meaningful effect size).',
    hurting: 'Consistent negative impact on your chosen metric.',
    no_effect: 'High confidence that this dose shows no meaningful effect.',
  },
} as const;


