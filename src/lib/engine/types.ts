export type Mood = 'low' | 'ok' | 'sharp'

export type SupplementCategory = 'performance' | 'protective' | 'synergistic'

export type SupplementProfile = {
  id?: string
  name: string
  category: SupplementCategory
  expected_window_days: number
  loading_phase_days?: number | null
  peak_effect_days?: number | null
  builds_tolerance: boolean
  tolerance_days?: number | null
  primary_metrics: string[]
  literature_effect: 'positive' | 'protective' | 'minimal'
  literature_confidence: number
  notes?: string | null
}

export type PatternType = 
  | 'rapid_plateau'      // Deficiency correction - fast improvement then plateau
  | 'slow_linear'        // Accumulation effect - steady gradual improvement
  | 'immediate_spike'    // Pharmacological - works immediately
  | 'cyclical'           // Tolerance building - effect varies over time

export type SignalStatus = 
  | 'insufficient'       // Not enough data (<7 days)
  | 'calibrating'        // User baseline still being established
  | 'loading'            // Supplement in loading phase (e.g. creatine)
  | 'testing'            // Collecting data, not conclusive yet
  | 'confirmed'          // Positive effect confirmed (high confidence)
  | 'protective'         // Protective supplement working (stability detected)
  | 'no_effect'          // No measurable effect (consider dropping)
  | 'hurting'            // Negative effect detected
  | 'confounded'         // Multiple supplements changed at once
  | 'tolerance'          // Tolerance building detected

export type DayRow = {
  date: string           // YYYY-MM-DD
  treated: boolean
  mood: Mood | null
  sleep_score?: number | null
  hrv?: number | null
  rhr?: number | null
}

export type SignalSnapshot = {
  n: number                        // Number of treated days with data
  effectPct: number                // Effect size as percentage (-100 to +100)
  confidence: number               // Statistical confidence (0-100)
  status: SignalStatus
  window: '7d' | '14d' | '30d' | '60d' | '90d' | '365d'
  warnings: string[]
  pattern?: PatternType             // Detected pattern shape
  explanation?: string              // Human-readable explanation
  daysUntilPeak?: number           // Days until expected peak effect
  confoundedWith?: string[]        // Names of confounding supplements
  varianceReduction?: number       // For protective supplements (%)
  preMean?: number | null          // Control/baseline mean (for numeric metrics)
  postMean?: number | null         // Treated mean (for numeric metrics)
}

export type UserBaseline = {
  user_id: string
  calibration_complete: boolean
  calibration_days: number
  typical_sharp_hrv?: number | null
  typical_ok_hrv?: number | null
  typical_low_hrv?: number | null
  avg_sleep_score?: number | null
  stress_level?: 'low' | 'moderate' | 'high' | null
}

export type ExperimentSuggestion = {
  id?: string
  user_id: string
  supplement_id: string
  suggestion_type: 'isolation_test' | 'dose_optimization' | 'cycle_off'
  message: string
  priority: 'low' | 'medium' | 'high'
  dismissed: boolean
}

export type DataQualityFlag = {
  id?: string
  user_id: string
  start_date: string
  end_date?: string | null
  flag_type: 'sick' | 'traveling' | 'stress' | 'alcohol' | 'sleep_deprived'
  auto_detected: boolean
  note?: string | null
}
