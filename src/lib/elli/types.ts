export interface Entry {
  local_date?: string
  pain: number
  mood: number
  sleep_quality: number
  tags?: string[]
}

export type MicroInsightType = 'baseline' | 'change' | 'weak_signal' | 'progress' | 'celebration'
export type Confidence = 'fact' | 'low' | 'medium'

export interface MicroInsight {
  type: MicroInsightType
  confidence: Confidence
  badge?: string
  message: string
  data?: Record<string, any>
}

export interface RealInsight {
  key: string
  title: string
  summary: string
  data?: Record<string, any>
}

export interface MessageContext {
  userName: string
  todayEntry: Entry
  microInsights: MicroInsight[]
  realInsights?: RealInsight[]
}

export interface GenerateMessageParams {
  userId: string
  userName: string
  todayEntry: Entry
  recentEntries: Entry[]
  useHumanizer?: boolean
  condition?: string
}


