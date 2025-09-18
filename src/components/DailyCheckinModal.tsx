'use client'

import { useState, useEffect } from 'react'
import { X, Download, Copy } from 'lucide-react'

// Types
export type WearableSource = 'WHOOP' | 'Oura' | 'Apple Health' | 'Garmin' | 'None'

export type MoodPreset = 
  | 'f—ing broken' | 'Running on fumes' | 'Under-slept' | 'Wired & tired' | 'Tired but trying'
  | 'Foggy' | 'A bit wonky' | 'A bit sore' | 'Glassy-eyed' | 'Low and slow'
  | 'Slow burn' | 'Overcaffeinated' | 'A bit spicy' | 'Resetting' | 'Rebuilding'
  | 'Solid baseline' | 'Back online' | 'Calm & steady' | 'Cruising' | 'Climbing'
  | 'Crisp and clear' | 'Quietly powerful' | 'Renegade mode' | 'Dialed in' | 'Peaking'
  | 'Laser-focused' | 'Flow state' | 'Bulletproof' | 'Angel in the sky' | 'Unstoppable'

export interface DailyCheckinInput {
  dateISO: string
  energy: number
  mood?: MoodPreset | string
  moodComment?: string
  wearable?: {
    source: WearableSource
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

// Share Card Preview Component
function ShareCardPreview({ draft }: { draft: DailyCheckinInput }) {
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
          <span className="font-medium">{draft.wearable!.source}</span>
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
  todayItems 
}: DailyCheckinModalProps) {
  const [draft, setDraft] = useState<DailyCheckinInput>({
    dateISO: new Date().toISOString().split('T')[0],
    energy: currentEnergy,
    publicUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/u/your-profile`
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Load saved data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedData()
    }
  }, [isOpen])

  const loadSavedData = () => {
    // Load daily check-in data
    const saved = localStorage.getItem('biostackr_last_daily_checkin')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        
        if (data.date === today) {
          setDraft(prev => ({
            ...prev,
            energy: data.energy,
            mood: data.mood || undefined
          }))
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
      // Save to localStorage
      const today = new Date().toISOString().split('T')[0]
      
      // Save daily check-in state for dashboard
      localStorage.setItem('biostackr_last_daily_checkin', JSON.stringify({
        energy: draft.energy,
        mood: draft.mood,
        date: today
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
    setMessage('📥 Image download coming soon!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(draft.publicUrl)
    setMessage('✅ Link copied to clipboard!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleShare = async (platform: string) => {
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
    const shareUrl = draft.publicUrl
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
        break
      case 'instagram':
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        setMessage('✅ Text copied! Paste into Instagram post')
        setTimeout(() => setMessage(''), 3000)
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
        break
    }
    
    setMessage('✅ Shared!')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
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

        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Section 1: Personal Check-in - Light Gray Container */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Personal Check-in</h3>
              
              {/* Energy and Mood Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Energy Slider */}
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Energy</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={draft.energy}
                      onChange={(e) => setDraft(d => ({ ...d, energy: Number(e.target.value) }))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          #ef4444 0%, 
                          #f97316 20%, 
                          #eab308 40%, 
                          #84cc16 60%, 
                          #22c55e 80%, 
                          #16a34a 100%)`
                      }}
                    />
                    <span className="w-10 text-right text-sm text-zinc-700 font-medium">{draft.energy}/10</span>
                  </div>
                </div>

                {/* Mood Selector */}
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Mood</label>
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
                      'Laser-focused', 'Flow state', 'Bulletproof', 'Angel in the sky', 'Unstoppable'] as MoodPreset[]).map(mood => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>
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
                  {isSaving ? 'Saving...' : 'Save Check-in'}
                </button>
              </div>
            </div>

            {/* Section 2: Share to Social Media - Light Gray Container */}
            <div className="bg-gray-50 rounded-lg p-5">
              {/* Centered Heading for Entire Bottom Section */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-zinc-900">Share to Social Media</h3>
                <span className="text-sm text-gray-400">optional</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Share Options */}
                <div>
                  {/* Live Preview Title - Centered and aligned with preview */}
                  <div className="md:hidden text-center mb-4">
                    <h4 className="text-sm font-medium text-zinc-900">Live Preview</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Add Wearables - positioned to align with preview */}
                    <div className="mt-8">
                      <details className="rounded-lg border border-zinc-200 bg-white p-3">
                        <summary className="cursor-pointer text-sm font-medium">Add wearables data</summary>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <select
                            value={draft.wearable?.source ?? 'None'}
                            onChange={(e) => setDraft(d => ({
                              ...d,
                              wearable: e.target.value === 'None'
                                ? null
                                : { 
                                    source: e.target.value as WearableSource, 
                                    sleepScore: d.wearable?.sleepScore, 
                                    recoveryScore: d.wearable?.recoveryScore 
                                  },
                            }))}
                            className="rounded-md border border-zinc-300 bg-white p-2 text-sm"
                          >
                            <option>None</option>
                            <option>WHOOP</option>
                            <option>Oura</option>
                            <option>Apple Health</option>
                            <option>Garmin</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Sleep"
                            min="0"
                            max="100"
                            value={draft.wearable?.sleepScore ?? ''}
                            onChange={(e) => setDraft(d => ({ 
                              ...d, 
                              wearable: { 
                                ...(d.wearable ?? { source: 'WHOOP' as WearableSource }), 
                                sleepScore: e.target.value ? Number(e.target.value) : undefined 
                              } 
                            }))}
                            className="rounded-md border border-zinc-300 p-2 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Recovery"
                            min="0"
                            max="100"
                            value={draft.wearable?.recoveryScore ?? ''}
                            onChange={(e) => setDraft(d => ({ 
                              ...d, 
                              wearable: { 
                                ...(d.wearable ?? { source: 'WHOOP' as WearableSource }), 
                                recoveryScore: e.target.value ? Number(e.target.value) : undefined 
                              } 
                            }))}
                            className="rounded-md border border-zinc-300 p-2 text-sm"
                          />
                        </div>
                      </details>
                    </div>

                    {/* Add Note */}
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <label className="block text-sm font-medium text-zinc-900 mb-2">Add a note</label>
                      <textarea
                        value={draft.moodComment ?? ''}
                        onChange={(e) => setDraft(d => ({ ...d, moodComment: e.target.value || undefined }))}
                        rows={3}
                        maxLength={280}
                        className="w-full rounded-md border border-zinc-300 p-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
                        placeholder="How are you feeling about today's routine?"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{(draft.moodComment || '').length}/280</div>
                    </div>

                    {/* Share Buttons */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          className="rounded-md bg-black px-3 py-2 text-white text-sm hover:bg-gray-800 transition-colors"
                          onClick={() => handleShare('twitter')}
                        >
                          Twitter
                        </button>
                        <button 
                          className="rounded-md bg-gray-900 px-3 py-2 text-white text-sm hover:bg-gray-800 transition-colors"
                          onClick={() => handleShare('facebook')}
                        >
                          Facebook
                        </button>
                        <button 
                          className="rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-white text-sm hover:from-purple-600 hover:to-pink-600 transition-colors"
                          onClick={() => handleShare('instagram')}
                        >
                          Instagram
                        </button>
                        <button 
                          className="rounded-md bg-gray-900 px-3 py-2 text-white text-sm hover:bg-gray-800 transition-colors"
                          onClick={() => handleShare('linkedin')}
                        >
                          LinkedIn
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 transition-colors" 
                          onClick={handleDownload}
                        >
                          Download image
                        </button>
                        <button 
                          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 transition-colors" 
                          onClick={handleCopyLink}
                        >
                          Copy link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-sm font-medium text-zinc-900">Live Preview</h4>
                  </div>
                  <div className="transform scale-75 origin-top">
                    <ShareCardPreview draft={draft} />
                  </div>
                  
                  {message && message.includes('Shared') && (
                    <div className="text-center text-sm text-green-600 mt-3">
                      {message}
                    </div>
                  )}
                </div>
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
      `}</style>
    </div>
  )
}
