/**
 * WHOOP CSV PARSER
 * 
 * Drop this file into your project at: src/lib/parsers/whoop-parser.ts
 * Then import and use parseWhoopCSV() in your import route.
 * 
 * Handles all 4 Whoop export files:
 * - sleeps.csv
 * - physiological_cycles.csv
 * - journal_entries.csv
 * - workouts.csv
 */

export interface WhoopSleepEntry {
  date: string // YYYY-MM-DD
  sleep_performance: number | null
  sleep_efficiency: number | null
  asleep_duration_min: number | null
  deep_sleep_min: number | null
  rem_sleep_min: number | null
  light_sleep_min: number | null
  respiratory_rate: number | null
}

export interface WhoopPhysiologicalEntry {
  date: string
  recovery_score: number | null
  hrv: number | null
  resting_hr: number | null
  strain: number | null
  skin_temp: number | null
  blood_oxygen: number | null
}

export interface WhoopJournalEntry {
  date: string
  question: string
  answered_yes: boolean
  notes: string | null
}

export interface WhoopWorkoutEntry {
  date: string
  duration_min: number | null
  strain: number | null
  calories: number | null
  max_hr: number | null
  avg_hr: number | null
}

export interface ParsedWhoopData {
  sleep: WhoopSleepEntry[]
  physiological: WhoopPhysiologicalEntry[]
  journal: WhoopJournalEntry[]
  workouts: WhoopWorkoutEntry[]
  supplements: Record<string, boolean>[] // date -> supplement -> taken
  confounders: Record<string, boolean>[] // date -> confounder -> present
}

/**
 * Detect if a CSV is from Whoop by checking the first header
 */
export function isWhoopCSV(headerLine: string): boolean {
  return headerLine.startsWith('Cycle start time,')
}

/**
 * Detect which type of Whoop file this is
 */
export function detectWhoopFileType(headerLine: string): 'sleep' | 'physiological' | 'journal' | 'workout' | 'unknown' {
  if (headerLine.includes('Sleep performance %') && !headerLine.includes('Recovery score %')) {
    return 'sleep'
  }
  if (headerLine.includes('Recovery score %')) {
    return 'physiological'
  }
  if (headerLine.includes('Question text')) {
    return 'journal'
  }
  if (headerLine.includes('Activity Strain') || headerLine.includes('Workout start time')) {
    return 'workout'
  }
  return 'unknown'
}

/**
 * Parse a date string from Whoop format to YYYY-MM-DD
 */
function parseWhoopDate(dateStr: string): string {
  // Whoop format: "2025-09-12 22:43:24"
  if (!dateStr) return ''
  return dateStr.substring(0, 10) // Just take YYYY-MM-DD
}

/**
 * Safely parse a number, returning null if empty or invalid
 */
function safeParseFloat(val: string): number | null {
  if (!val || val.trim() === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

/**
 * Parse CSV text into rows, handling quoted fields
 */
function parseCSVRows(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

/**
 * Parse sleeps.csv
 */
export function parseSleepsCSV(text: string): WhoopSleepEntry[] {
  const rows = parseCSVRows(text)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  
  // Find column indices
  const dateIdx = headers.findIndex(h => h === 'Cycle start time')
  const perfIdx = headers.findIndex(h => h === 'Sleep performance %')
  const effIdx = headers.findIndex(h => h === 'Sleep efficiency %')
  const asleepIdx = headers.findIndex(h => h === 'Asleep duration (min)')
  const deepIdx = headers.findIndex(h => h === 'Deep (SWS) duration (min)')
  const remIdx = headers.findIndex(h => h === 'REM duration (min)')
  const lightIdx = headers.findIndex(h => h === 'Light sleep duration (min)')
  const respIdx = headers.findIndex(h => h === 'Respiratory rate (rpm)')
  
  if (dateIdx === -1 || perfIdx === -1) {
    console.error('sleeps.csv missing required columns. Found headers:', headers)
    return []
  }
  
  const entries: WhoopSleepEntry[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= dateIdx) continue
    
    const date = parseWhoopDate(row[dateIdx])
    if (!date) continue
    
    entries.push({
      date,
      sleep_performance: safeParseFloat(row[perfIdx]),
      sleep_efficiency: effIdx >= 0 ? safeParseFloat(row[effIdx]) : null,
      asleep_duration_min: asleepIdx >= 0 ? safeParseFloat(row[asleepIdx]) : null,
      deep_sleep_min: deepIdx >= 0 ? safeParseFloat(row[deepIdx]) : null,
      rem_sleep_min: remIdx >= 0 ? safeParseFloat(row[remIdx]) : null,
      light_sleep_min: lightIdx >= 0 ? safeParseFloat(row[lightIdx]) : null,
      respiratory_rate: respIdx >= 0 ? safeParseFloat(row[respIdx]) : null,
    })
  }
  
  return entries
}

/**
 * Parse physiological_cycles.csv
 */
export function parsePhysiologicalCSV(text: string): WhoopPhysiologicalEntry[] {
  const rows = parseCSVRows(text)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  
  const dateIdx = headers.findIndex(h => h === 'Cycle start time')
  const recoveryIdx = headers.findIndex(h => h === 'Recovery score %')
  const hrvIdx = headers.findIndex(h => h === 'Heart rate variability (ms)')
  const rhrIdx = headers.findIndex(h => h === 'Resting heart rate (bpm)')
  const strainIdx = headers.findIndex(h => h === 'Day Strain')
  const tempIdx = headers.findIndex(h => h === 'Skin temp (celsius)')
  const o2Idx = headers.findIndex(h => h === 'Blood oxygen %')
  
  if (dateIdx === -1) {
    console.error('physiological_cycles.csv missing date column. Found headers:', headers)
    return []
  }
  
  const entries: WhoopPhysiologicalEntry[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= dateIdx) continue
    
    const date = parseWhoopDate(row[dateIdx])
    if (!date) continue
    
    // Skip rows with no recovery score (empty data)
    const recoveryScore = recoveryIdx >= 0 ? safeParseFloat(row[recoveryIdx]) : null
    if (recoveryScore === null) continue
    
    entries.push({
      date,
      recovery_score: recoveryScore,
      hrv: hrvIdx >= 0 ? safeParseFloat(row[hrvIdx]) : null,
      resting_hr: rhrIdx >= 0 ? safeParseFloat(row[rhrIdx]) : null,
      strain: strainIdx >= 0 ? safeParseFloat(row[strainIdx]) : null,
      skin_temp: tempIdx >= 0 ? safeParseFloat(row[tempIdx]) : null,
      blood_oxygen: o2Idx >= 0 ? safeParseFloat(row[o2Idx]) : null,
    })
  }
  
  return entries
}

/**
 * Parse journal_entries.csv
 */
export function parseJournalCSV(text: string): WhoopJournalEntry[] {
  const rows = parseCSVRows(text)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  
  const dateIdx = headers.findIndex(h => h === 'Cycle start time')
  const questionIdx = headers.findIndex(h => h === 'Question text')
  const answerIdx = headers.findIndex(h => h === 'Answered yes')
  const notesIdx = headers.findIndex(h => h === 'Notes')
  
  if (dateIdx === -1 || questionIdx === -1 || answerIdx === -1) {
    console.error('journal_entries.csv missing required columns. Found headers:', headers)
    return []
  }
  
  const entries: WhoopJournalEntry[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= questionIdx) continue
    
    const date = parseWhoopDate(row[dateIdx])
    if (!date) continue
    
    entries.push({
      date,
      question: row[questionIdx],
      answered_yes: row[answerIdx]?.toLowerCase() === 'true',
      notes: notesIdx >= 0 ? row[notesIdx] || null : null,
    })
  }
  
  return entries
}

/**
 * Parse workouts.csv
 */
export function parseWorkoutsCSV(text: string): WhoopWorkoutEntry[] {
  const rows = parseCSVRows(text)
  if (rows.length < 2) return []
  
  const headers = rows[0]
  
  const dateIdx = headers.findIndex(h => h === 'Workout start time')
  const durationIdx = headers.findIndex(h => h === 'Duration (min)')
  const strainIdx = headers.findIndex(h => h === 'Activity Strain')
  const caloriesIdx = headers.findIndex(h => h === 'Energy burned (cal)')
  const maxHrIdx = headers.findIndex(h => h === 'Max HR (bpm)')
  const avgHrIdx = headers.findIndex(h => h === 'Average HR (bpm)')
  
  // Fallback to cycle start time if workout start time not found
  const effectiveDateIdx = dateIdx >= 0 ? dateIdx : headers.findIndex(h => h === 'Cycle start time')
  
  if (effectiveDateIdx === -1) {
    console.error('workouts.csv missing date column. Found headers:', headers)
    return []
  }
  
  const entries: WhoopWorkoutEntry[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= effectiveDateIdx) continue
    
    const date = parseWhoopDate(row[effectiveDateIdx])
    if (!date) continue
    
    entries.push({
      date,
      duration_min: durationIdx >= 0 ? safeParseFloat(row[durationIdx]) : null,
      strain: strainIdx >= 0 ? safeParseFloat(row[strainIdx]) : null,
      calories: caloriesIdx >= 0 ? safeParseFloat(row[caloriesIdx]) : null,
      max_hr: maxHrIdx >= 0 ? safeParseFloat(row[maxHrIdx]) : null,
      avg_hr: avgHrIdx >= 0 ? safeParseFloat(row[avgHrIdx]) : null,
    })
  }
  
  return entries
}

/**
 * Known supplement questions in Whoop journal
 */
const SUPPLEMENT_QUESTIONS: Record<string, string> = {
  'Took a magnesium supplement?': 'magnesium',
  'Used CBD oil in any form?': 'cbd',
  'Took a melatonin supplement?': 'melatonin',
  'Took a vitamin D supplement?': 'vitamin_d',
  'Took a fish oil supplement?': 'fish_oil',
  'Took a probiotic supplement?': 'probiotic',
  'Took a creatine supplement?': 'creatine',
  'Took an ashwagandha supplement?': 'ashwagandha',
}

/**
 * Known confounder questions in Whoop journal
 */
const CONFOUNDER_QUESTIONS: Record<string, string> = {
  'Consumed caffeine?': 'caffeine',
  'Have any alcoholic drinks?': 'alcohol',
  'Experienced stress?': 'stress',
  'Traveled on a plane?': 'travel',
  'Felt sick or ill?': 'illness',
  'Took pain medication?': 'pain_medication',
  'Had an unusually late meal?': 'late_meal',
  'Used screens in bed?': 'screens_in_bed',
}

/**
 * Extract supplements and confounders from journal entries grouped by date
 */
export function extractSupplementsAndConfounders(journalEntries: WhoopJournalEntry[]): {
  supplements: Map<string, Map<string, boolean>>
  confounders: Map<string, Map<string, boolean>>
} {
  const supplements = new Map<string, Map<string, boolean>>()
  const confounders = new Map<string, Map<string, boolean>>()
  
  for (const entry of journalEntries) {
    const { date, question, answered_yes } = entry
    
    // Check if this is a supplement question
    const suppKey = SUPPLEMENT_QUESTIONS[question]
    if (suppKey) {
      if (!supplements.has(date)) {
        supplements.set(date, new Map())
      }
      supplements.get(date)!.set(suppKey, answered_yes)
    }
    
    // Check if this is a confounder question
    const confKey = CONFOUNDER_QUESTIONS[question]
    if (confKey) {
      if (!confounders.has(date)) {
        confounders.set(date, new Map())
      }
      confounders.get(date)!.set(confKey, answered_yes)
    }
  }
  
  return { supplements, confounders }
}

/**
 * Main parser function - detects file type and parses accordingly
 */
export function parseWhoopFile(filename: string, content: string): {
  type: 'sleep' | 'physiological' | 'journal' | 'workout' | 'unknown'
  data: WhoopSleepEntry[] | WhoopPhysiologicalEntry[] | WhoopJournalEntry[] | WhoopWorkoutEntry[]
  count: number
} {
  const firstLine = content.split('\n')[0]
  
  if (!isWhoopCSV(firstLine)) {
    return { type: 'unknown', data: [], count: 0 }
  }
  
  const fileType = detectWhoopFileType(firstLine)
  
  switch (fileType) {
    case 'sleep': {
      const sleepData = parseSleepsCSV(content)
      return { type: 'sleep', data: sleepData, count: sleepData.length }
    }
    case 'physiological': {
      const physData = parsePhysiologicalCSV(content)
      return { type: 'physiological', data: physData, count: physData.length }
    }
    case 'journal': {
      const journalData = parseJournalCSV(content)
      return { type: 'journal', data: journalData, count: journalData.length }
    }
    case 'workout': {
      const workoutData = parseWorkoutsCSV(content)
      return { type: 'workout', data: workoutData, count: workoutData.length }
    }
    default:
      return { type: 'unknown', data: [], count: 0 }
  }
}

/**
 * Convert parsed Whoop data to BioStackr daily_entries format
 */
export function convertToDailyEntries(
  sleepData: WhoopSleepEntry[],
  physData: WhoopPhysiologicalEntry[]
): Array<{
  date: string
  sleep_quality: number | null
  hrv: number | null
  resting_hr: number | null
  recovery_score: number | null
  strain: number | null
  deep_sleep_min: number | null
  rem_sleep_min: number | null
}> {
  // Create a map of all dates
  const dateMap = new Map<string, any>()
  
  // Add sleep data
  for (const entry of sleepData) {
    if (!dateMap.has(entry.date)) {
      dateMap.set(entry.date, { date: entry.date })
    }
    const record = dateMap.get(entry.date)
    record.sleep_quality = entry.sleep_performance
    record.deep_sleep_min = entry.deep_sleep_min
    record.rem_sleep_min = entry.rem_sleep_min
  }
  
  // Add physiological data
  for (const entry of physData) {
    if (!dateMap.has(entry.date)) {
      dateMap.set(entry.date, { date: entry.date })
    }
    const record = dateMap.get(entry.date)
    record.hrv = entry.hrv
    record.resting_hr = entry.resting_hr
    record.recovery_score = entry.recovery_score
    record.strain = entry.strain
  }
  
  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Convert journal entries to BioStackr supplement_logs format
 */
export function convertToSupplementLogs(
  journalEntries: WhoopJournalEntry[]
): Array<{
  date: string
  supplement_name: string
  taken: boolean
}> {
  const logs: Array<{ date: string; supplement_name: string; taken: boolean }> = []
  
  for (const entry of journalEntries) {
    const suppKey = SUPPLEMENT_QUESTIONS[entry.question]
    if (suppKey && entry.answered_yes) {
      logs.push({
        date: entry.date,
        supplement_name: suppKey,
        taken: true,
      })
    }
  }
  
  return logs
}

/**
 * Convenience alias to keep backwards-compat with docs that mention parseWhoopCSV()
 */
export function parseWhoopCSV(filename: string, content: string) {
  return parseWhoopFile(filename, content)
}


