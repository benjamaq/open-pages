'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Download, Copy, ChevronDown, Plus } from 'lucide-react'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'
import { getLocalDateYmd } from '@/lib/utils/localDateYmd'
import CohortCheckinLayout from '@/components/CohortCheckinLayout'
import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'

// Constants for symptom tracking
const coreSymptoms = [
  { id: 'brain_fog', label: 'Brain fog', category: 'cognitive' },
  { id: 'fatigue', label: 'Fatigue', category: 'physical' },
  { id: 'headache', label: 'Headache', category: 'physical' },
  { id: 'muscle_pain', label: 'Muscle pain', category: 'physical' },
  { id: 'joint_pain', label: 'Joint pain', category: 'physical' },
  { id: 'anxiety', label: 'Anxiety', category: 'emotional' },
  { id: 'irritability', label: 'Irritability', category: 'emotional' },
  { id: 'nausea', label: 'Nausea', category: 'physical' },
  { id: 'hot_flashes', label: 'Hot flashes', category: 'physical' },
  { id: 'nerve_pain', label: 'Nerve pain', category: 'physical' },
  { id: 'stiffness', label: 'Stiffness', category: 'physical' },
  { id: 'racing_thoughts', label: 'Racing thoughts', category: 'cognitive' },
  { id: 'overwhelm', label: 'Overwhelm', category: 'emotional' },
  { id: 'low_mood', label: 'Low mood', category: 'emotional' },
  { id: 'inflammation', label: 'Inflammation', category: 'physical' }
]

const painLocations = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'back', label: 'Back' },
  { id: 'joints', label: 'Joints' },
  { id: 'full_body', label: 'Full body' },
  { id: 'other', label: 'Other' }
]

// Types
export type WearableSource = 'WHOOP' | 'Oura' | 'Apple Health' | 'Garmin' | 'Fitbit' | 'Polar' | 'Suunto' | 'Coros' | 'Amazfit' | 'Samsung Health' | 'Google Fit' | 'Strava' | 'MyFitnessPal' | 'Cronometer' | 'Eight Sleep' | 'Other' | 'None'

export type MoodPreset = 
  | 'f—ing broken' | 'Running on fumes' | 'Under-slept' | 'Wired & tired' | 'Tired but trying'
  | 'Foggy' | 'A bit wonky' | 'A bit sore' | 'Glassy-eyed' | 'Low and slow'
  | 'Slow burn' | 'Overcaffeinated' | 'A bit spicy' | 'Resetting' | 'Rebuilding'
  | 'Solid baseline' | 'Back online' | 'Calm & steady' | 'Cruising' | 'Climbing'
  | 'Crisp and clear' | 'Quietly powerful' | 'Renegade mode' | 'Dialed in' | 'Peaking'
  | 'Laser-focused' | 'Flow state' | 'Bulletproof' | 'Angel in the sky' | 'Unstoppable'
  | '⚡ Dialed in' | '🌧️ Walking storm cloud' | '🧊 Chill & unbothered' | '🤹 Spinning too many plates'
  | '🐢 Slow but steady' | '🔄 Restart required' | '🫠 Melted but managing' | '🌤️ Quietly optimistic'

export interface DailyCheckinInput {
  dateISO: string
  energy: number
  mood?: MoodPreset | string
  moodComment?: string
  pain?: number
  sleep?: number
  symptoms?: string[]
  painLocations?: string[]
  customSymptoms?: string[]
  wearable?: {
    source: WearableSource
    customName?: string // For when source is 'Other'
    sleepScore?: number
    recoveryScore?: number
  } | null
  supplementsCount?: number
  protocols?: string[]
  mindfulness?: string[]
  movement?: string[]
  publicUrl: string
}

interface DailyCheckinModalProps {
  isOpen: boolean
  onClose: () => void
  onEnergyUpdate: (energy: number) => void
  currentEnergy: number
  todayItems: any
  userId: string
  profileSlug?: string
  /** From /api/me (server session). Browser Supabase often cannot read profiles.cohort_id under RLS. */
  cohortIdHint?: string | null
  /** From public.cohorts.checkin_fields via /api/me; null = use defaults; undefined = same as null for layout */
  cohortCheckinFieldsHint?: string[] | null
  /** From /api/me; cohort check-in modal title */
  cohortStudyProductName?: string | null
  /**
   * From /api/me `showCohortStudyDashboard`. When false (e.g. graduated to main product), use standard
   * check-in even if `profiles.cohort_id` is still set. When undefined, keep legacy behavior (cohort UI if cohort id present).
   */
  showCohortStudyDashboard?: boolean
  /**
   * From /api/me — matches POST /api/checkin cohort branch (`shouldUseCohortCheckinBranch`).
   * When true, always render cohort check-in fields (never B2C fallback) so saves match API validation.
   */
  cohortCheckinBranch?: boolean
  /** From /api/me `cohortConfirmed` — drives compliance “confirm your place” copy in cohort modal. */
  cohortSpotConfirmed?: boolean
  /** From /api/me `cohortCheckinCount` during compliance (distinct days); omit when spot already confirmed. */
  cohortComplianceDistinctDays?: number | null
  /** From /api/me `cohortStudyStartedAtIso` — distinguishes study-phase vs post-confirm baseline toasts/copy. */
  cohortStudyStartedAtIso?: string | null
  /** From /api/me `cohortParticipantProductArrivedAt` — cohort modal subtitle (baseline vs active study). */
  cohortParticipantProductArrivedAtYmd?: string | null
}

// Helper functions
const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

const isNum = (n: unknown): n is number => typeof n === 'number' && !Number.isNaN(n)

function trimCohortId(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  return s !== '' ? s : null
}

function energyToColor(n: number) {
  if (n >= 8) return 'text-emerald-600'
  if (n >= 5) return 'text-amber-600'
  return 'text-rose-600'
}

function toMoodSentence(mood: string) {
  const map: Record<string, string> = {
    'Charged': 'Feeling charged and ready for the day.',
    'Calm': 'Feeling calm and steady.',
    'Focused': 'Focused and on task.',
    'Flow state': 'In the flow and feeling great.',
    'Under-slept': 'A bit tired but pushing through.',
    'Unstoppable': 'Feeling absolutely unstoppable today.',
    'f—ing broken': 'Having a really tough day.',
    'Running on fumes': 'Running low but still going.',
    'Bulletproof': 'Feeling invincible and strong.'
  }
  return map[mood] ?? `Feeling ${mood.toLowerCase()}.`
}

// Legacy Share Card Preview Component (kept for backward compatibility)
function LegacyShareCardPreview({ draft }: { draft: DailyCheckinInput }) {
  const showSupp = (draft.supplementsCount ?? 0) > 0
  const showProt = (draft.protocols?.length ?? 0) > 0
  const showMind = (draft.mindfulness?.length ?? 0) > 0
  const showMove = (draft.movement?.length ?? 0) > 0
  const showWear = !!draft.wearable?.source && draft.wearable.source !== 'None'

  const energyColor = energyToColor(draft.energy)
  const date = new Date(draft.dateISO)

  return (
    <section className="w-full max-w-[720px] rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 sm:p-8 space-y-4">
      {/* Date */}
      <div className="text-sm text-zinc-500">{formatDate(date)}</div>

      {/* Energy headline */}
      <div className="text-3xl sm:text-4xl font-semibold">
        <span className={energyColor}>{draft.energy}/10</span> <span className="text-zinc-900">Energy</span>
      </div>

      {/* Mood preset sentence */}
      {draft.mood && (
        <p className="text-base text-zinc-700">{toMoodSentence(draft.mood)}</p>
      )}

      {/* Wearables */}
      {showWear && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
          <span className="font-medium">
            {draft.wearable!.source === 'Other' && draft.wearable!.customName 
              ? draft.wearable!.customName 
              : draft.wearable!.source}
          </span>
          {isNum(draft.wearable!.sleepScore) && <span>Sleep {draft.wearable!.sleepScore}</span>}
          {isNum(draft.wearable!.recoveryScore) && <span>Recovery {draft.wearable!.recoveryScore}</span>}
        </div>
      )}

      {(showSupp || showProt || showMind || showMove) && <hr className="border-zinc-200" />}

      {/* Categories */}
      <div className="space-y-3">
        {showSupp && (
          <div>
            <h4 className="font-semibold text-zinc-900">💊 Supplements</h4>
            <p className="text-zinc-700">{draft.supplementsCount} {draft.supplementsCount === 1 ? 'supplement' : 'supplements'}</p>
          </div>
        )}
        {showProt && (
          <div>
            <h4 className="font-semibold text-zinc-900">🧪 Protocols</h4>
            <p className="text-zinc-700">{draft.protocols!.join(', ')}</p>
          </div>
        )}
        {showMind && (
          <div>
            <h4 className="font-semibold text-zinc-900">🧘 Mindfulness</h4>
            <p className="text-zinc-700">{draft.mindfulness!.join(', ')}</p>
          </div>
        )}
        {showMove && (
          <div>
            <h4 className="font-semibold text-zinc-900">🏃 Movement</h4>
            <p className="text-zinc-700">{draft.movement!.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Note */}
      {draft.moodComment && (
        <p className="italic text-zinc-700">"{draft.moodComment}"</p>
      )}

      <hr className="border-zinc-200" />

      {/* Links + branding */}
      <div className="flex items-center justify-between text-sm">
        <a href={draft.publicUrl} className="font-medium text-blue-600 hover:underline">
          View my full stack →
        </a>
        <span className="text-zinc-500">Powered by BioStackr.io</span>
      </div>
    </section>
  )
}

// Main Modal Component
export default function DailyCheckinModal({
  isOpen,
  onClose,
  onEnergyUpdate,
  currentEnergy,
  todayItems,
  userId,
  profileSlug,
  cohortIdHint,
  cohortCheckinFieldsHint,
  cohortStudyProductName,
  showCohortStudyDashboard,
  cohortCheckinBranch,
  cohortSpotConfirmed,
  cohortComplianceDistinctDays,
  cohortStudyStartedAtIso,
  cohortParticipantProductArrivedAtYmd,
}: DailyCheckinModalProps) {
  // Minimal, analytical UI per brief
  
  const [draft, setDraft] = useState<DailyCheckinInput>({
    dateISO: new Date().toISOString().split('T')[0],
    energy: Number.isFinite(Number(currentEnergy)) && Number(currentEnergy) > 0 ? Math.max(1, Math.min(10, Number(currentEnergy))) : 5,
    pain: 5,
    sleep: 5,
    symptoms: [],
    painLocations: [],
    customSymptoms: [],
    publicUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/daily/${new Date().toISOString().split('T')[0]}`
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showWearables, setShowWearables] = useState(false)
  const [selectedSupps, setSelectedSupps] = useState<Record<string, boolean>>({})
  const [selectedLifestyleFactors, setSelectedLifestyleFactors] = useState<string[]>([])
  const [focus, setFocus] = useState<number>(5)
  const [moodScore, setMoodScore] = useState<number>(5)
  /** B2C path only: require real interaction so Save doesn’t re-post default 5/5/5 after DB cleanup. */
  const [b2cFormTouched, setB2cFormTouched] = useState(false)
  const [customSymptomInput, setCustomSymptomInput] = useState('')
  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false)
  const [cohortIdFromClient, setCohortIdFromClient] = useState<string | null>(null)

  // If server passes null (failed / missing in payload), still fall back to client profile.cohort_id under RLS.
  const hintTrimmed =
    cohortIdHint !== undefined && cohortIdHint !== null ? trimCohortId(cohortIdHint) : null
  const effectiveCohortId =
    hintTrimmed != null && hintTrimmed !== '' ? hintTrimmed : cohortIdFromClient

  /** Must stay in sync with POST /api/checkin — cohort branch requires cohort slider keys from cohorts.checkin_fields. */
  const useCohortCheckinLayout =
    cohortCheckinBranch === true
      ? true
      : showCohortStudyDashboard === false
        ? false
        : Boolean(effectiveCohortId)

  /** Same guard as dashboard `page.client` / `CheckinLauncher` — only real arrays are a valid hint. */
  const cohortCheckinFieldsResolved = Array.isArray(cohortCheckinFieldsHint)
    ? cohortCheckinFieldsHint
    : null
  /** Remount cohort layout when normalized field set changes; dep string is stable if contents match. */
  const cohortCheckinLayoutKey = useMemo(() => {
    return normalizeCohortCheckinFields(cohortCheckinFieldsResolved).join('|')
  }, [
    Array.isArray(cohortCheckinFieldsHint) ? cohortCheckinFieldsHint.join('|') : '',
  ])

  // Allowed confounders
  const CONFOUNDERS = [
    { id: 'alcohol', label: 'Alcohol' },
    { id: 'poor_sleep', label: 'Poor sleep' },
    { id: 'high_stress', label: 'High stress' },
    { id: 'illness', label: 'Illness' },
    { id: 'travel', label: 'Travel' },
    { id: 'heavy_training', label: 'Heavy training' },
    { id: 'no_training', label: 'No training' },
    { id: 'late_caffeine', label: 'Late caffeine' },
    { id: 'very_high_carbs', label: 'Very high carbs' },
  ]

  // Cohort: prefer server hint; when hint is null/empty, fetch profile.cohort_id from browser (may work under RLS).
  useEffect(() => {
    if (!isOpen || !userId || userId === 'guest') {
      setCohortIdFromClient(null)
      return
    }
    const serverResolved =
      cohortIdHint !== undefined && cohortIdHint !== null && String(cohortIdHint).trim() !== ''
    if (serverResolved) {
      setCohortIdFromClient(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const sb = createClient()
        const { data } = await sb.from('profiles').select('cohort_id').eq('user_id', userId).maybeSingle()
        if (cancelled) return
        const raw = (data as { cohort_id?: string | null } | null)?.cohort_id
        setCohortIdFromClient(trimCohortId(raw))
      } catch {
        if (!cancelled) setCohortIdFromClient(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, userId, cohortIdHint])

  // Load saved data when modal opens
useEffect(() => {
  if (isOpen) {
      setB2cFormTouched(false)
      loadSavedData()
      // Initialize default supplement selections based on today's rotation:
      // take all by default except those explicitly listed in todayItems.skipNames.
      try {
        const skipNames: string[] = Array.isArray((todayItems as any)?.skipNames) ? (todayItems as any).skipNames : []
        const skipSet = new Set(skipNames.map(n => String(n).trim().toLowerCase()))
        const initial: Record<string, boolean> = {}
        const supps: Array<{ id: string; name?: string; title?: string }> = Array.isArray((todayItems as any)?.supplements)
          ? (todayItems as any).supplements
          : []
        for (const it of supps) {
          const id = String((it as any).id || '')
          const nmLower = String((it as any).name || (it as any).title || '').trim().toLowerCase()
          if (!id) continue
          // default taken unless explicitly in skip list
          initial[id] = !skipSet.has(nmLower)
        }
      try {
        console.log('[checkin-modal] skipNames:', skipNames)
        console.log('[checkin-modal] initial selection:', initial)
        console.log('[checkin-modal] existing selectedSupps keys:', Object.keys(selectedSupps || {}))
      } catch {}
      // Always enforce skip items to be unchecked; also seed any missing ids with their default
      if (Object.keys(initial).length > 0) {
        setSelectedSupps(prev => {
          const next: Record<string, boolean> = { ...prev }
          for (const it of supps) {
            const id = String((it as any).id || '')
            const nmLower = String((it as any).name || (it as any).title || '').trim().toLowerCase()
            if (!id) continue
            // Seed missing keys with default (taken unless skipped)
            if (!(id in next)) {
              next[id] = !skipSet.has(nmLower)
            }
            // Force scheduled OFF items to unchecked so the UI reflects the rotation
            if (skipSet.has(nmLower)) {
              next[id] = false
            }
          }
          return next
        })
      }
      } catch {}
    } else {
      // Reset state when modal closes
      setShowWearables(false)
    }
}, [isOpen, todayItems])


  // Symptom handling functions
  const toggleSymptom = (symptomId: string) => {
    setDraft(prev => {
      const currentSymptoms = prev.symptoms || []
      return {
        ...prev,
        symptoms: currentSymptoms.includes(symptomId)
          ? currentSymptoms.filter(s => s !== symptomId)
          : [...currentSymptoms, symptomId]
      }
    })
  }

  const togglePainLocation = (locationId: string) => {
    setDraft(prev => {
      const currentLocations = prev.painLocations || []
      return {
        ...prev,
        painLocations: currentLocations.includes(locationId)
          ? currentLocations.filter(l => l !== locationId)
          : [...currentLocations, locationId]
      }
    })
  }

  const handleAddCustomSymptom = () => {
    if (customSymptomInput.trim()) {
      setDraft(prev => ({
        ...prev,
        customSymptoms: [...(prev.customSymptoms || []), customSymptomInput.trim()]
      }))
      setCustomSymptomInput('')
      setShowCustomSymptomInput(false)
    }
  }

  const removeCustomSymptom = (symptom: string) => {
    setDraft(prev => ({
      ...prev,
      customSymptoms: (prev.customSymptoms || []).filter(s => s !== symptom)
    }))
  }

  const loadSavedData = () => {
    // Load daily check-in data (use local calendar day — must match handleSave / local_date)
    const saved = localStorage.getItem(`biostackr_last_daily_checkin_${userId}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const todayLocal = getLocalDateYmd()
        if (data.date === todayLocal) {
          setDraft(prev => ({
            ...prev,
            energy: data.energy,
            mood: data.mood || undefined,
            pain: data.pain || 0,
            sleep: data.sleep || 5,
            symptoms: data.symptoms || [],
            painLocations: data.painLocations || [],
            customSymptoms: data.customSymptoms || []
          }))
          if (typeof data.focus === 'number') {
            setFocus(data.focus)
          }
          setSelectedLifestyleFactors(Array.isArray(data.lifestyleFactors) ? data.lifestyleFactors : [])
          setB2cFormTouched(true)
        }
      } catch (error) {
        console.error('Error loading saved check-in:', error)
      }
    }

    // Load wearables data
    const savedSleep = localStorage.getItem('biostackr_last_sleep_score')
    const savedRecovery = localStorage.getItem('biostackr_last_recovery_score')
    const savedSource = localStorage.getItem('biostackr_last_wearable_source')
    
    if (savedSource && savedSource !== 'None') {
      setDraft(prev => ({
        ...prev,
        wearable: {
          source: savedSource as WearableSource,
          sleepScore: savedSleep ? Number(savedSleep) : undefined,
          recoveryScore: savedRecovery ? Number(savedRecovery) : undefined
        }
      }))
      setShowWearables(true) // Auto-expand if we have saved wearable data
    } else {
      // Only reset if we don't have saved data and the modal just opened
      // Don't reset if user has manually toggled the section
      setShowWearables(false)
    }

    // Load today's items
    setDraft(prev => ({
      ...prev,
      supplementsCount: todayItems.supplements?.length || 0,
      protocols: [],
      mindfulness: [],
      movement: []
    }))

    // Load saved note
    const savedUpdate = localStorage.getItem(`biostackr_daily_update_${getLocalDateYmd()}`)
    if (savedUpdate) {
      try {
        const data = JSON.parse(savedUpdate)
        setDraft(prev => ({
          ...prev,
          moodComment: data.note || undefined
        }))
      } catch (error) {
        console.error('Error loading saved note:', error)
      }
    }
  }

  const handleSave = async () => {
    if (!useCohortCheckinLayout && !b2cFormTouched) {
      setMessage('Move a slider or change supplements/tags to confirm your check-in.')
      return
    }
    setIsSaving(true)
    setMessage('')

    try {
      const todayLocal = getLocalDateYmd()
      // Persist the exact skip list shown in this modal for same-day dashboard display
      try {
        const names = Array.isArray((todayItems as any)?.skipNames) ? (todayItems as any).skipNames as string[] : []
        if (names.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem('biostackr_skip_names_today', JSON.stringify({ date: todayLocal, names }))
        }
      } catch {}

      // Map 1–10 UI slider to DB 3‑point scale: 1–3→1, 4–6→2, 7–10→3
      const toThree = (n: number | undefined | null) => {
        const v = typeof n === 'number' ? n : 0
        if (v <= 3) return 1
        if (v <= 6) return 2
        return 3
      }
      // Persist RAW 1–10 values for energy/focus/sleep; backend clamps to 1–10
      const energyScore = draft.energy
      const focusScore = typeof focus === 'number' ? focus : 0
      const sleepScore = typeof draft.sleep === 'number' ? draft.sleep : 0

      // Build supplement intake map from selected checkboxes + rotation skip list
      // - Explicitly record every supplement as 'taken' or 'off'
      // - Items in today's skip list are forced to 'off'
      const supplement_intake: Record<string, string> = {}
      const skipNameSet = new Set(
        Array.isArray((todayItems as any)?.skipNames)
          ? (todayItems as any).skipNames.map((n: string) => String(n).trim().toLowerCase())
          : []
      )
      try {
        const supps: Array<{ id: string; name?: string; title?: string }> = Array.isArray((todayItems as any)?.supplements)
          ? (todayItems as any).supplements
          : []
        for (const it of supps) {
          const id = String((it as any).id || '')
          if (!id) continue
          const nmLower = String((it as any).name || (it as any).title || '').trim().toLowerCase()
          const isChecked = !!selectedSupps[id]
          const isInSkip = skipNameSet.has(nmLower)
          if (isInSkip) {
            supplement_intake[id] = 'off'
          } else {
            supplement_intake[id] = isChecked ? 'taken' : 'off'
          }
        }
      } catch {}

      // Tags: confounders only
      const tags: string[] = Array.isArray(selectedLifestyleFactors) ? [...selectedLifestyleFactors] : []

      // Save via BioStackr check-in API
      const payload = {
        local_date: getLocalDateYmd(),
        mood: moodScore,
        energy: energyScore,
        focus: focusScore,
        sleep: sleepScore,
        tags,
        supplement_intake
      }
      try { console.log('CHECKIN submit payload:', payload) } catch {}
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({} as any))
      try { console.log('CHECKIN response:', { status: res.status, ok: res.ok, json }) } catch {}
      if (!res.ok) {
        // Surface error to user
        setMessage(typeof json?.error === 'string' ? `❗ ${json.error}` : '❗ Failed to save check-in')
        setIsSaving(false)
        return
      }

      // Save to localStorage for backward compatibility
      localStorage.setItem(`biostackr_last_daily_checkin_${userId}`, JSON.stringify({
        energy: draft.energy,
        mood: draft.mood,
        focus: focus,
        pain: draft.pain,
        sleep: draft.sleep,
        symptoms: draft.symptoms,
        painLocations: draft.painLocations,
        customSymptoms: draft.customSymptoms,
        lifestyleFactors: selectedLifestyleFactors,
        exerciseType: 'none',
        exerciseIntensity: '',
        protocols: [],
        date: todayLocal,
        userId: userId
      }))

      // Save wearables data
      if (draft.wearable?.source && draft.wearable.source !== 'None') {
        localStorage.setItem('biostackr_last_wearable_source', draft.wearable.source)
        if (draft.wearable.sleepScore) {
          localStorage.setItem('biostackr_last_sleep_score', draft.wearable.sleepScore.toString())
        }
        if (draft.wearable.recoveryScore) {
          localStorage.setItem('biostackr_last_recovery_score', draft.wearable.recoveryScore.toString())
        }
      }

      // Save full update data
      const updateData = {
        energy_score: draft.energy,
        mood_label: draft.mood,
        note: draft.moodComment,
        wearable_source: draft.wearable?.source,
        wearable_sleep_score: draft.wearable?.sleepScore,
        wearable_recovery: draft.wearable?.recoveryScore,
        date: todayLocal
      }
      localStorage.setItem(`biostackr_daily_update_${todayLocal}`, JSON.stringify(updateData))

      // Update dashboard energy
      onEnergyUpdate(draft.energy)

      setMessage('✅ Check-in saved successfully!')

      // Immediately refresh dashboard progress (without full reload)
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('progress:refresh'))
        }
      } catch {}

      // Trigger dashboard reload (legacy path only)
      if (window.location.pathname.includes('/dash')) {
        setTimeout(() => window.location.reload(), 800)
      }

      // Clear any ?checkin=open param to avoid auto-reopen loops
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('checkin')
        window.history.replaceState({}, '', url.toString())
      } catch {}

      setTimeout(() => {
        setMessage('')
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Error saving check-in:', error)
      setMessage('Failed to save check-in. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    // Generate a beautiful image for sharing
    const { shareText, checkinShareUrl } = generateShareContent()
    
    // Create a canvas element to generate the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      setMessage('❌ Image generation failed')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    // Set canvas size (Instagram/Facebook optimal)
    canvas.width = 1080
    canvas.height = 1080
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#f8f9fa')
    gradient.addColorStop(1, '#e9ecef')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add BioStackr branding
    ctx.fillStyle = '#0F1115'
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('BioStackr', canvas.width / 2, 120)
    
    // Add date
    ctx.fillStyle = '#6B7280'
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), canvas.width / 2, 180)
    
    // Add energy level (large and prominent)
    ctx.fillStyle = '#16A34A'
    ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(`${draft.energy}/10`, canvas.width / 2, 320)
    
    // Add "Energy" label
    ctx.fillStyle = '#0F1115'
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('Energy', canvas.width / 2, 380)
    
    // Add mood if present
    if (draft.mood) {
      ctx.fillStyle = '#6B7280'
      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(draft.mood, canvas.width / 2, 440)
    }
    
    // Add routine summary
    let yPos = 520
    const routineParts = []
    
    if (draft.supplementsCount && draft.supplementsCount > 0) {
      routineParts.push(`💊 ${draft.supplementsCount} supplements`)
    }
    if (draft.protocols && draft.protocols.length > 0) {
      routineParts.push(`🧪 ${draft.protocols.join(', ')}`)
    }
    if (draft.movement && draft.movement.length > 0) {
      routineParts.push(`🏃 ${draft.movement.join(', ')}`)
    }
    if (draft.mindfulness && draft.mindfulness.length > 0) {
      routineParts.push(`🧘 ${draft.mindfulness.join(', ')}`)
    }
    
    if (routineParts.length > 0) {
      ctx.fillStyle = '#0F1115'
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('Today\'s Routine:', canvas.width / 2, yPos)
      yPos += 50
      
      routineParts.forEach(part => {
        ctx.fillStyle = '#374151'
        ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText(part, canvas.width / 2, yPos)
        yPos += 40
      })
    }
    
    // Add note if present
    if (draft.moodComment) {
      yPos += 20
      ctx.fillStyle = '#6B7280'
      ctx.font = 'italic 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(`"${draft.moodComment}"`, canvas.width / 2, yPos)
    }
    
    // Add footer
    yPos = canvas.height - 80
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('Powered by BioStackr', canvas.width / 2, yPos)
    
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `biostackr-checkin-${draft.dateISO}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        setMessage('✅ Image downloaded! Share this beautiful image instead of text.')
        setTimeout(() => setMessage(''), 4000)
      } else {
        setMessage('❌ Image generation failed')
        setTimeout(() => setMessage(''), 3000)
      }
    }, 'image/png')
  }

  const handleCopyLink = async () => {
    // Generate the same share text as social media
    const routineParts = []
    
    // Supplements - just count
    if (draft.supplementsCount && draft.supplementsCount > 0) {
      routineParts.push(`${draft.supplementsCount} supplements`)
    }
    
    // Protocols - actual names
    if (draft.protocols && draft.protocols.length > 0) {
      routineParts.push(draft.protocols.join(', '))
    }
    
    // Movement - actual activities
    if (draft.movement && draft.movement.length > 0) {
      routineParts.push(draft.movement.join(', '))
    }
    
    // Mindfulness - actual practices
    if (draft.mindfulness && draft.mindfulness.length > 0) {
      routineParts.push(draft.mindfulness.join(', '))
    }

    const shareText = `Energy ${draft.energy}/10${draft.mood ? ` • ${draft.mood}` : ''}${routineParts.length > 0 ? `\nToday: ${routineParts.join(' • ')}` : ''}`
    
    // Get the current user's profile URL using current window location
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create a dedicated sharing URL with check-in data
    const checkinDate = draft.dateISO
    const shareParams = new URLSearchParams({
      energy: draft.energy.toString(),
      mood: draft.mood || '',
      supplements: draft.supplementsCount?.toString() || '0',
      protocols: draft.protocols?.join(',') || '',
      movement: draft.movement?.join(',') || '',
      mindfulness: draft.mindfulness?.join(',') || '',
      note: draft.moodComment || ''
    })
    
    const checkinShareUrl = profileSlug 
      ? `${baseUrl}/share/checkin/${profileSlug}/${checkinDate}?${shareParams.toString()}`
      : `${baseUrl}/u/${profileSlug}?public=true`
    
    const fullShareText = `${shareText}\n\n${checkinShareUrl}`
    
    await navigator.clipboard.writeText(fullShareText)
    setMessage('✅ Daily check-in copied to clipboard!')
    setTimeout(() => setMessage(''), 2000)
  }

  // Generate share text and URL - extracted to be reusable
  const generateShareContent = () => {
    const routineParts = []
    
    // Supplements - just count
    if (draft.supplementsCount && draft.supplementsCount > 0) {
      routineParts.push(`${draft.supplementsCount} supplements`)
    }
    
    // Protocols - actual names
    if (draft.protocols && draft.protocols.length > 0) {
      routineParts.push(draft.protocols.join(', '))
    }
    
    // Movement - actual activities
    if (draft.movement && draft.movement.length > 0) {
      routineParts.push(draft.movement.join(', '))
    }
    
    // Mindfulness - actual practices
    if (draft.mindfulness && draft.mindfulness.length > 0) {
      routineParts.push(draft.mindfulness.join(', '))
    }

    const shareText = `Energy ${draft.energy}/10${draft.mood ? ` • ${draft.mood}` : ''}${routineParts.length > 0 ? `\nToday: ${routineParts.join(' • ')}` : ''}`
    
    // Use current window location for social sharing too
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create a dedicated sharing URL with check-in data
    const checkinDate = draft.dateISO
    const shareParams = new URLSearchParams({
      energy: draft.energy.toString(),
      mood: draft.mood || '',
      supplements: draft.supplementsCount?.toString() || '0',
      protocols: draft.protocols?.join(',') || '',
      movement: draft.movement?.join(',') || '',
      mindfulness: draft.mindfulness?.join(',') || '',
      note: draft.moodComment || ''
    })
    
    const checkinShareUrl = profileSlug 
      ? `${baseUrl}/share/checkin/${profileSlug}/${checkinDate}?${shareParams.toString()}`
      : `${baseUrl}/u/${profileSlug}?public=true`
    
    return { shareText, checkinShareUrl }
  }

  // Generate clean, professional Twitter text
  const generateTwitterText = () => {
    let tweet = `Today's check-in: ${draft.energy}/10`
    
    if (draft.mood) {
      tweet += ` — ${draft.mood}`
    }
    
    // Add sleep and recovery if available
    if (draft.wearable?.sleepScore || draft.wearable?.recoveryScore) {
      tweet += `\nSleep: ${draft.wearable?.sleepScore || 'N/A'} • Recovery: ${draft.wearable?.recoveryScore || 'N/A'}`
    }
    
    // Add stack summary
    const parts = []
    
    if (draft.supplementsCount && draft.supplementsCount > 0) {
      parts.push(`Supplements: ${draft.supplementsCount}`)
    }
    if (draft.protocols && draft.protocols.length > 0) {
      parts.push(`Protocols: ${draft.protocols.length}`)
    }
    if (draft.movement && draft.movement.length > 0) {
      const movementSummary = draft.movement.length === 1 ? draft.movement[0] : `${draft.movement.length} activities`
      parts.push(`Movement: ${movementSummary}`)
    }
    if (draft.mindfulness && draft.mindfulness.length > 0) {
      const mindfulnessSummary = draft.mindfulness.length === 1 ? draft.mindfulness[0] : `${draft.mindfulness.length} practices`
      parts.push(`Mindfulness: ${mindfulnessSummary}`)
    }
    
    if (parts.length > 0) {
      tweet += `\n${parts.join(' • ')}`
    }
    
    // Add call to action and hashtags
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    tweet += `\nSee my stack → ${profileSlug ? `${baseUrl}/u/${profileSlug}?public=true` : `${baseUrl}/dash`}`
    tweet += `\n#biostackr #biohacking #accountability`
    
    return tweet
  }

  const handleShare = async (platform: string) => {
    const { shareText, checkinShareUrl } = generateShareContent()
    
    // Get base URL for simple links
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    switch (platform) {
      case 'twitter':
        const twitterText = generateTwitterText()
        // Just use text, no URL - cleaner and more shareable
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`, '_blank')
        break
      case 'facebook':
        // Facebook doesn't allow pre-filling text, so copy for user to paste
        await navigator.clipboard.writeText(`${shareText}\n\n${checkinShareUrl}`)
        setMessage('✅ Text copied! Open Facebook and paste (Ctrl+V) to share')
        setTimeout(() => setMessage(''), 4000)
        break
      case 'instagram':
        // Instagram doesn't have direct sharing API, so copy text for user to paste
        await navigator.clipboard.writeText(`${shareText}\n\n${checkinShareUrl}`)
        setMessage('✅ Text copied! Open Instagram and paste (Ctrl+V) to share')
        setTimeout(() => setMessage(''), 4000)
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(checkinShareUrl)}`, '_blank')
        break
    }
    
    setMessage('✅ Shared!')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!isOpen) return null

  if (useCohortCheckinLayout) {
    return (
      <CohortCheckinLayout
        key={cohortCheckinLayoutKey}
        isOpen={isOpen}
        onClose={onClose}
        onEnergyUpdate={onEnergyUpdate}
        userId={userId}
        checkinFields={cohortCheckinFieldsResolved}
        cohortStudyProductName={cohortStudyProductName}
        cohortSpotConfirmed={cohortSpotConfirmed}
        cohortComplianceDistinctDays={cohortComplianceDistinctDays}
        cohortStudyStartedAtIso={cohortStudyStartedAtIso}
        cohortParticipantProductArrivedAtYmd={cohortParticipantProductArrivedAtYmd}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header (sticky, neutral) */}
        <div className="sticky top-0 flex items-center gap-2 border-b bg-white px-5 py-4 sm:px-8 sm:py-6">
          <div className="w-9 shrink-0 sm:w-10" aria-hidden />
          <h2 className="flex-1 text-center text-xl font-bold text-gray-900 sm:text-2xl">Daily Check-in</h2>
          <div className="flex w-9 shrink-0 justify-end sm:w-10">
            <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content (neutral, reusing Add Supplement spacing rhythm) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
          <div className="p-5 sm:p-8 space-y-6">
            {/* Skip reminder (optional) */}
            {Array.isArray((todayItems as any)?.skipNames) && (todayItems as any).skipNames.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <div className="font-medium mb-2">Skipping today:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {((todayItems as any).skipNames as string[]).map((raw, idx) => {
                    const clean = abbreviateSupplementName ? abbreviateSupplementName(String(raw || '')) : String(raw || '')
                    return <li key={`${clean}-${idx}`}>{clean}</li>
                  })}
                </ul>
              </div>
            )}
            {/* Section 1: Personal Check-in (very light container, soft radius, generous padding) */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Personal Check-in</h3>
              
              {/* Three Sliders: Energy, Focus, Sleep */}
              <div className="space-y-6 mb-6">
                {/* Energy Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Energy</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={draft.energy}
                      onChange={(e) => {
                        setB2cFormTouched(true)
                        setDraft(d => ({ ...d, energy: Number(e.target.value) }))
                      }}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
                    />
                    <span className="w-8 text-right text-sm text-gray-700 font-medium flex-shrink-0">{draft.energy}/10</span>
                  </div>
                </div>

                {/* Focus Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Focus</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={focus}
                      onChange={(e) => {
                        setB2cFormTouched(true)
                        setFocus(Number(e.target.value))
                      }}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
                    />
                    <span className="w-8 text-right text-sm text-gray-700 font-medium flex-shrink-0">{focus}/10</span>
                  </div>
                </div>

                {/* Sleep Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Sleep</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={draft.sleep || 5}
                      onChange={(e) => {
                        setB2cFormTouched(true)
                        setDraft(d => ({ ...d, sleep: Number(e.target.value) }))
                      }}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
                    />
                    <span className="w-8 text-right text-sm text-gray-700 font-medium flex-shrink-0">{draft.sleep || 5}/10</span>
                  </div>
                </div>
                {/* Mood Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Mood</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={moodScore}
                      onChange={(e) => {
                        setB2cFormTouched(true)
                        setMoodScore(Number(e.target.value))
                      }}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
                    />
                    <span className="w-8 text-right text-sm text-gray-700 font-medium flex-shrink-0">{moodScore}/10</span>
                  </div>
                </div>
            </div>

            {/* Supplements today (same section container style as Add Supplement) */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Supplements today</h3>
              <div className="mb-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {}
                    try {
                      (todayItems?.supplements || []).forEach((it: any) => { all[it.id] = true })
                    } catch {}
                    setB2cFormTouched(true)
                    setSelectedSupps(all)
                  }}
                  className="text-xs text-gray-700 underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setB2cFormTouched(true)
                    setSelectedSupps({})
                  }}
                  className="text-xs text-gray-500 underline"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(todayItems?.supplements || []).map((it: any) => (
                    <label key={it.id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white hover:border-gray-300 transition-colors">
                      <input
                        type="checkbox"
                        className="accent-gray-900"
                        checked={!!selectedSupps[it.id]}
                        onChange={() => {
                          setB2cFormTouched(true)
                          setSelectedSupps(prev => ({ ...prev, [it.id]: !prev[it.id] }))
                        }}
                      />
                      <span className="text-sm text-gray-800">{it.name || it.title || 'Item'}</span>
                    </label>
                  ))}
              </div>
              </div>

              {/* Mood preset removed per spec */}

              {/* Symptoms removed per spec */}

              {/* Confounders (optional) */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Anything unusual today? (optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'alcohol', label: 'Alcohol' },
                    { id: 'poor_sleep', label: 'Poor sleep' },
                    { id: 'high_stress', label: 'High stress' },
                    { id: 'illness', label: 'Illness' },
                    { id: 'travel', label: 'Travel' },
                    { id: 'intense_exercise', label: 'Intense exercise' }
                  ].map(factor => (
                    <button
                      key={factor.id}
                      type="button"
                      onClick={() => {
                        setB2cFormTouched(true)
                        setSelectedLifestyleFactors(prev =>
                          prev.includes(factor.id) ? prev.filter(id => id !== factor.id) : [...prev, factor.id],
                        )
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm border transition-colors
                        ${selectedLifestyleFactors.includes(factor.id)
                          ? 'bg-gray-200 text-gray-900 border-gray-400'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tag anything that might have affected your sleep — we&apos;ll exclude these days from your results.
                </p>
              </div>

              {/* Exercise removed per spec */}

              {/* Protocols removed per spec */}

              {/* Notes section removed per spec */}

              {/* Wearables removed per spec */}

            </div>

            {/* Baseline explainer per brief */}
            <hr className="border-gray-200" />
            <div className="text-sm text-gray-600">
              Check-ins are compared against your baseline to estimate real effects.
            </div>

          </div>
        </div>

        {/* Footer (sticky, neutral) */}
        <div className="sticky bottom-0 bg-white border-t px-5 sm:px-8 py-4 sm:py-6 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 sm:py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
          >Cancel</button>
          <div className="flex items-center gap-3">
            {message && (
              <div className="text-sm text-gray-600">
                {message.replace('✅ ', '').replace('❌ ', '')}
              </div>
            )}
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 py-3 sm:py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #111827; /* neutral dark */
          cursor: pointer;
          border: none; /* no ring */
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #111827; /* neutral dark */
          cursor: pointer;
          border: none; /* no ring */
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          border: 2px solid #ffffff;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

    </div>
  )
}
