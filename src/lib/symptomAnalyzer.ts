export type CheckInData = {
  pain: number
  mood: number
  sleep: number
  sleep_quality?: number
  energy?: number
  tags?: string[]
  journal?: string
  symptoms?: string[]
  painLocations?: string[]
  customSymptoms?: string[]
  notes?: string
  [key: string]: any
}

export type SymptomAnalysis = {
  detectedSymptoms: string[]
  primaryConcern: string | null
  severity: 'low' | 'medium' | 'high'
  empatheticResponse: string
  suggestions: string[]
}

export async function analyzeSymptoms(input: CheckInData, userName: string = 'there'): Promise<SymptomAnalysis> {
  const primaryConcern =
    input.pain >= 7 ? 'pain' :
    input.sleep <= 3 ? 'sleep' :
    input.mood <= 2 ? 'mood' : null
  const severity: SymptomAnalysis['severity'] =
    input.pain >= 7 || input.sleep <= 3 ? 'high' :
    input.pain >= 5 || input.sleep <= 4 ? 'medium' : 'low'
  return {
    detectedSymptoms: primaryConcern ? [primaryConcern] : [],
    primaryConcern,
    severity,
    empatheticResponse: `Thanks for logging, ${userName}. Data captured for analysis.`,
    suggestions: []
  }
}




