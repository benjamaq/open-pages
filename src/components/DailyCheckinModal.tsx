'use client'

import { useState, useEffect } from 'react'
import { X, Download, Copy, ChevronDown, Plus } from 'lucide-react'

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
}

// Helper functions
const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

const isNum = (n: unknown): n is number => typeof n === 'number' && !Number.isNaN(n)

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
  profileSlug
}: DailyCheckinModalProps) {
  // Debug: Log when component loads to verify new mood chips
  console.log('🎭 DailyCheckinModal loaded with new emoji mood chips v2.3')
  
  // Debug: Check if emoji mood chips are in the array
  const emojiMoods = ['⚡ Dialed in', '🌧️ Walking storm cloud', '🧊 Chill & unbothered', '🤹 Spinning too many plates', '🐢 Slow but steady', '🔄 Restart required', '🫠 Melted but managing', '🌤️ Quietly optimistic']
  console.log('🎭 Emoji moods array:', emojiMoods)
  console.log('🎭 First emoji mood:', emojiMoods[0])
  console.log('🎭 Emoji test - Lightning:', '⚡')
  console.log('🎭 Emoji test - Cloud:', '🌧️')
  console.log('🎭 Emoji test - Ice:', '🧊')
  
  const [draft, setDraft] = useState<DailyCheckinInput>({
    dateISO: new Date().toISOString().split('T')[0],
    energy: currentEnergy,
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
  const [showSymptoms, setShowSymptoms] = useState(false)
  const [customSymptomInput, setCustomSymptomInput] = useState('')
  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false)
  const [selectedLifestyleFactors, setSelectedLifestyleFactors] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('none')
  const [exerciseIntensity, setExerciseIntensity] = useState<string>('')
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([])

  // Load saved data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedData()
    } else {
      // Reset state when modal closes
      setShowWearables(false)
    }
  }, [isOpen])


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
    // Load daily check-in data
    const saved = localStorage.getItem(`biostackr_last_daily_checkin_${userId}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        
        if (data.date === today) {
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
          setSelectedLifestyleFactors(Array.isArray(data.lifestyleFactors) ? data.lifestyleFactors : [])
          setSelectedExercise(typeof data.exerciseType === 'string' ? data.exerciseType : 'none')
          setExerciseIntensity(typeof data.exerciseIntensity === 'string' ? data.exerciseIntensity : '')
          setSelectedProtocols(Array.isArray(data.protocols) ? data.protocols : [])
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
      protocols: todayItems.protocols?.map((p: any) => p.name) || [],
      mindfulness: todayItems.mindfulness?.map((m: any) => m.name) || [],
      movement: todayItems.movement?.map((m: any) => m.name) || []
    }))

    // Load saved note
    const today = new Date().toISOString().split('T')[0]
    const savedUpdate = localStorage.getItem(`biostackr_daily_update_${today}`)
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
    setIsSaving(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Save to database via mood API
      const moodData = {
        mood: typeof draft.energy === 'number' ? draft.energy : 5, // Map energy to mood score
        sleep_quality: typeof draft.sleep === 'number' ? draft.sleep : 5,
        pain: typeof draft.pain === 'number' ? draft.pain : 5,
        tags: draft.mood ? [draft.mood] : [],
        journal: draft.moodComment || null,
        symptoms: draft.symptoms || [],
        pain_locations: draft.painLocations || [],
        custom_symptoms: draft.customSymptoms || [],
        lifestyle_factors: selectedLifestyleFactors,
        exercise_type: selectedExercise,
        exercise_intensity: exerciseIntensity || null,
        protocols: selectedProtocols
      }

      const moodResponse = await fetch('/api/mood/today', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-tz-offset': (() => { try { return String(new Date().getTimezoneOffset()) } catch { return '0' } })(),
        },
        body: JSON.stringify(moodData)
      })

      if (!moodResponse.ok) {
        throw new Error('Failed to save mood data')
      }

      // Save to localStorage for backward compatibility
      localStorage.setItem(`biostackr_last_daily_checkin_${userId}`, JSON.stringify({
        energy: draft.energy,
        mood: draft.mood,
        pain: draft.pain,
        sleep: draft.sleep,
        symptoms: draft.symptoms,
        painLocations: draft.painLocations,
        customSymptoms: draft.customSymptoms,
        lifestyleFactors: selectedLifestyleFactors,
        exerciseType: selectedExercise,
        exerciseIntensity: exerciseIntensity,
        protocols: selectedProtocols,
        date: today,
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
        date: today
      }
      localStorage.setItem(`biostackr_daily_update_${today}`, JSON.stringify(updateData))

      // Update dashboard energy
      onEnergyUpdate(draft.energy)

      setMessage('✅ Check-in saved successfully!')

      // Trigger dashboard reload
      if (window.location.pathname.includes('/dash')) {
        setTimeout(() => window.location.reload(), 800)
      }

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Daily Check-in</h2>
            <p className="text-sm text-zinc-500">{formatDate(new Date())}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content - This div IS the rounded container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white rounded-b-xl pr-2">
          <div className="p-6 space-y-6">
            {/* Section 1: Personal Check-in - Light Gray Container */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Personal Check-in</h3>
              
              {/* Three Sliders: Mood, Pain, Sleep */}
              <div className="space-y-4 mb-4">
                {/* Mood Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Mood</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={draft.energy}
                      onChange={(e) => setDraft(d => ({ ...d, energy: Number(e.target.value) }))}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-transparent min-w-0"
                      style={{
                        background: `linear-gradient(to right, 
                          #ef4444 0%, 
                          #f97316 20%, 
                          #eab308 40%, 
                          #84cc16 60%, 
                          #22c55e 80%, 
                          #16a34a 100%)`,
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    />
                    <span className="w-8 text-right text-sm text-zinc-700 font-medium flex-shrink-0">{draft.energy}/10</span>
                  </div>
                </div>

                {/* Pain Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Pain</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={draft.pain || 0}
                      onChange={(e) => setDraft(d => ({ ...d, pain: Number(e.target.value) }))}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-transparent min-w-0"
                      style={{
                        background: `linear-gradient(to right, 
                          #16a34a 0%, 
                          #22c55e 20%, 
                          #eab308 40%, 
                          #f97316 60%, 
                          #ef4444 80%, 
                          #dc2626 100%)`,
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    />
                    <span className="w-8 text-right text-sm text-zinc-700 font-medium flex-shrink-0">{draft.pain || 0}/10</span>
                  </div>
                </div>

                {/* Sleep Slider */}
                <div className="overflow-hidden">
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Sleep</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={draft.sleep || 5}
                      onChange={(e) => setDraft(d => ({ ...d, sleep: Number(e.target.value) }))}
                      className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-transparent min-w-0"
                      style={{
                        background: `linear-gradient(to right, 
                          #ef4444 0%, 
                          #f97316 20%, 
                          #eab308 40%, 
                          #84cc16 60%, 
                          #22c55e 80%, 
                          #16a34a 100%)`,
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    />
                    <span className="w-8 text-right text-sm text-zinc-700 font-medium flex-shrink-0">{draft.sleep || 5}/10</span>
                  </div>
                </div>
              </div>

              {/* Mood Preset Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-900 mb-2">Mood Vibe (optional)</label>
                <select
                  value={draft.mood ?? ''}
                  onChange={(e) => setDraft(d => ({ ...d, mood: e.target.value || undefined }))}
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                >
                  <option value="">Pick a vibe…</option>
                  {(['f—ing broken', 'Running on fumes', 'Under-slept', 'Wired & tired', 'Tired but trying',
                    'Foggy', 'A bit wonky', 'A bit sore', 'Glassy-eyed', 'Low and slow',
                    'Slow burn', 'Overcaffeinated', 'A bit spicy', 'Resetting', 'Rebuilding',
                    'Solid baseline', 'Back online', 'Calm & steady', 'Cruising', 'Climbing',
                    'Crisp and clear', 'Quietly powerful', 'Renegade mode', 'Dialed in', 'Peaking',
                    'Laser-focused', 'Flow state', 'Bulletproof', 'Angel in the sky', 'Unstoppable',
                    '⚡ Dialed in', '🌧️ Walking storm cloud', '🧊 Chill & unbothered', '🤹 Spinning too many plates',
                    '🐢 Slow but steady', '🔄 Restart required', '🫠 Melted but managing', '🌤️ Quietly optimistic']).map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>

              {/* Symptom Tracking Section - Collapsible */}
              <div className="bg-white rounded-lg p-4 mb-4 border border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium text-zinc-900">Symptoms today (optional)</h4>
                  <button
                    onClick={() => setShowSymptoms(!showSymptoms)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={showSymptoms ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${showSymptoms ? 'rotate-180' : ''}`} style={{ color: '#6B7280' }} />
                  </button>
                </div>

                {showSymptoms && (
                  <div className="space-y-4">
                    {/* Core Symptoms - Tag Style */}
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Select all that apply</p>
                      <div className="flex flex-wrap gap-2">
                        {coreSymptoms.map(symptom => (
                          <button
                            key={symptom.id}
                            onClick={() => toggleSymptom(symptom.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              (draft.symptoms || []).includes(symptom.id)
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                          >
                            {symptom.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Symptoms */}
                    <div>
                      {(draft.customSymptoms || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(draft.customSymptoms || []).map(symptom => (
                            <div
                              key={symptom}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-900"
                            >
                              <span>{symptom}</span>
                              <button
                                onClick={() => removeCustomSymptom(symptom)}
                                className="ml-1 hover:text-blue-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {!showCustomSymptomInput ? (
                        <button
                          onClick={() => setShowCustomSymptomInput(true)}
                          className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add custom symptom</span>
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customSymptomInput}
                            onChange={(e) => setCustomSymptomInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSymptom()}
                            placeholder="Type your symptom..."
                            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                            autoFocus
                          />
                          <button
                            onClick={handleAddCustomSymptom}
                            className="px-4 py-2 rounded-md bg-zinc-900 text-white text-sm hover:bg-zinc-800"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowCustomSymptomInput(false)
                              setCustomSymptomInput('')
                            }}
                            className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-700 text-sm hover:bg-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pain Locations - Only show if pain > 0 */}
                    {(draft.pain || 0) > 0 && (
                      <div className="pt-3 border-t border-zinc-200">
                        <label className="block text-sm font-medium text-zinc-900 mb-2">Where's your pain?</label>
                        <div className="flex flex-wrap gap-2">
                          {painLocations.map(location => (
                            <button
                              key={location.id}
                              onClick={() => togglePainLocation(location.id)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                (draft.painLocations || []).includes(location.id)
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                            >
                              {location.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Field moved outside dropdown */}
                  </div>
                )}
              </div>

              {/* Lifestyle Factors (optional) */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Anything unusual today? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'alcohol', icon: '🍷', label: 'Alcohol' },
                    { id: 'high_carb_meal', icon: '🍝', label: 'High-carb meal' },
                    { id: 'high_stress', icon: '😰', label: 'High stress' },
                    { id: 'work_deadline', icon: '📅', label: 'Work deadline' },
                    { id: 'sitting_all_day', icon: '💺', label: 'Sitting all day' },
                    { id: 'too_much_caffeine', icon: '☕', label: 'Too much caffeine' },
                    { id: 'dehydrated', icon: '💧', label: 'Dehydrated' },
                    { id: 'ate_out', icon: '🍔', label: 'Ate out' },
                    { id: 'poor_sleep_last_night', icon: '😴', label: 'Slept poorly' },
                    { id: 'no_exercise', icon: '🛋️', label: 'No movement' }
                  ].map(factor => (
                    <button
                      key={factor.id}
                      type="button"
                      onClick={() => setSelectedLifestyleFactors(prev => prev.includes(factor.id) ? prev.filter(id => id !== factor.id) : [...prev, factor.id])}
                      className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                        ${selectedLifestyleFactors.includes(factor.id)
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }
                        hover:bg-purple-50 transition-colors
                      `}
                    >
                      <span>{factor.icon}</span>
                      <span>{factor.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Tap any that apply. This helps us find what affects your pain.</p>
              </div>

              {/* Exercise (optional) */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Did you exercise today? (optional)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { id: 'none', icon: '🛋️', label: 'Rest day' },
                    { id: 'walking', icon: '🚶', label: 'Walking' },
                    { id: 'running', icon: '🏃', label: 'Running' },
                    { id: 'gym', icon: '🏋️', label: 'Gym/Weights' },
                    { id: 'yoga', icon: '🧘', label: 'Yoga/Stretch' },
                    { id: 'swimming', icon: '🏊', label: 'Swimming' }
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedExercise(type.id)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm
                        ${selectedExercise === type.id
                          ? 'bg-green-100 text-green-700 border-2 border-green-400'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }
                      `}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>

                {selectedExercise && selectedExercise !== 'none' && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 mr-2">Intensity:</p>
                    {['light', 'moderate', 'intense'].map(intensity => (
                      <button
                        key={intensity}
                        type="button"
                        onClick={() => setExerciseIntensity(intensity)}
                        className={`
                          px-2 py-1 rounded text-xs
                          ${exerciseIntensity === intensity
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                          }
                        `}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocols (optional) */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Any recovery protocols today? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ice_bath', icon: '🧊', label: 'Ice bath' },
                    { id: 'sauna', icon: '🔥', label: 'Sauna' },
                    { id: 'meditation', icon: '🧘', label: 'Meditation' },
                    { id: 'massage', icon: '💆', label: 'Massage' },
                    { id: 'stretching', icon: '🤸', label: 'Stretching' },
                    { id: 'red_light', icon: '💡', label: 'Red light therapy' }
                  ].map(protocol => (
                    <button
                      key={protocol.id}
                      type="button"
                      onClick={() => setSelectedProtocols(prev => prev.includes(protocol.id) ? prev.filter(id => id !== protocol.id) : [...prev, protocol.id])}
                      className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                        ${selectedProtocols.includes(protocol.id)
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }
                      `}
                    >
                      <span>{protocol.icon}</span>
                      <span>{protocol.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Field (outside of Symptoms) */}
              <div className="bg-white rounded-lg p-4 mt-4 border border-zinc-200">
                <label className="block text-sm font-medium text-zinc-900 mb-2">Notes (optional)</label>
                <textarea
                  value={draft.moodComment || ''}
                  onChange={(e) => setDraft(d => ({ ...d, moodComment: e.target.value }))}
                  placeholder="How are you feeling? Any observations?"
                  className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                  rows={3}
                />
              </div>

              {/* Wearables Section */}
              <div className="bg-gray-50 rounded-lg p-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Wearables</h3>
                  <button
                    onClick={() => setShowWearables(!showWearables)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={showWearables ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${showWearables ? 'rotate-180' : ''}`} style={{ color: '#6B7280' }} />
                  </button>
                </div>

                {showWearables && (
                  <div className="space-y-4">
                    {/* Wearable Source */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 mb-2">Device</label>
                      <select
                        value={draft.wearable?.source || 'None'}
                        onChange={(e) => setDraft(d => ({ 
                          ...d, 
                          wearable: { 
                            ...d.wearable, 
                            source: e.target.value as WearableSource 
                          } 
                        }))}
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                      >
                        <option value="None">Select device...</option>
                        {(['WHOOP', 'Oura', 'Apple Health', 'Garmin', 'Fitbit', 'Polar', 'Suunto', 'Coros', 'Amazfit', 'Samsung Health', 'Google Fit', 'Strava', 'MyFitnessPal', 'Cronometer', 'Eight Sleep', 'Other'] as WearableSource[]).map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sleep Score */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 mb-2">Sleep Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.wearable?.sleepScore || ''}
                        onChange={(e) => setDraft(d => ({ 
                          ...d, 
                          wearable: { 
                            ...d.wearable, 
                            sleepScore: e.target.value ? Number(e.target.value) : undefined 
                          } 
                        }))}
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                        placeholder="Enter sleep score"
                      />
                    </div>

                    {/* Recovery Score */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 mb-2">Recovery Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.wearable?.recoveryScore || ''}
                        onChange={(e) => setDraft(d => ({ 
                          ...d, 
                          wearable: { 
                            ...d.wearable, 
                            recoveryScore: e.target.value ? Number(e.target.value) : undefined 
                          } 
                        }))}
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                        placeholder="Enter recovery score"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button and Message */}
              <div className="flex items-center justify-between">
                <div>
                  {message && !message.includes('Shared') && (
                    <div className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                      {message}
                    </div>
                  )}
                  <p className="text-sm text-zinc-500 mt-1">
                    This will automatically update on your dashboard
                  </p>
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="px-6 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 font-medium"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 3px solid #16a34a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 3px solid #16a34a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
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
