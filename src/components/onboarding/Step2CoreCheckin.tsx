'use client'

import { useEffect, useMemo, useState } from 'react'
import SaveInterceptModal from './SaveInterceptModal'
import { trackOnboardingEvent, saveCheckinQualityMetrics } from '@/lib/analytics/onboarding'
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2'

interface Step2CoreCheckinProps {
  userId: string
  userName: string
  onComplete: (data: any) => void
}

function ExpandableHeader({ title, subtitle, examples, onOpen }: { title: string; subtitle: string; examples: string; onOpen: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        onClick={() => { if (!open) { onOpen() } setOpen(!open) }}
        className="w-full text-left p-3 flex items-start justify-between"
      >
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-700">{subtitle}</div>
          <div className="text-xs text-gray-500 mt-1">{examples}</div>
        </div>
        <span className="text-gray-500">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="p-3 pt-0 text-xs text-gray-500">
          {/* Placeholder body to avoid heavy UI change; the real content already exists in the drawer */}
          You can add these details in the check‑in below. Opening here helps us track what’s most relevant.
        </div>
      )}
    </div>
  )
}

export default function Step2CoreCheckin({ userId, userName, onComplete }: Step2CoreCheckinProps) {
  const [expandablesOpened, setExpandablesOpened] = useState<string[]>([])
  const [saveInterceptShown, setSaveInterceptShown] = useState(false)
  const [showIntercept, setShowIntercept] = useState(false)
  const [stepStartTime] = useState<number>(() => Date.now())
  const [pendingData, setPendingData] = useState<any>(null)

  const handleOpen = (key: string) => {
    if (!expandablesOpened.includes(key)) {
      setExpandablesOpened(prev => [...prev, key])
      trackOnboardingEvent({ event_type: 'expandable_opened', step_number: 2, metadata: { section: key } })
    }
  }

  // If user completes check‑in very quickly without opening context, show the intercept once
  const maybeShowInterceptBeforeComplete = (data?: any) => {
    // If user opened any context sections OR selected any tags/symptoms, skip intercept
    if (expandablesOpened.length > 0) return false
    const lfCount = Array.isArray(data?.tags) ? data.tags.length : 0
    const symCount = Array.isArray(data?.symptoms) ? data.symptoms.length : 0
    if ((lfCount + symCount === 0) && !saveInterceptShown) {
      setShowIntercept(true)
      setSaveInterceptShown(true)
      trackOnboardingEvent({ event_type: 'save_intercept_shown', step_number: 2 })
      return true
    }
    return false
  }

  const handleInterceptAddContext = () => {
    setShowIntercept(false)
    trackOnboardingEvent({ event_type: 'save_intercept_accepted', step_number: 2 })
    // No-op: user can open any section headers above; drawer remains available
  }

  const handleInterceptSkip = () => {
    setShowIntercept(false)
    trackOnboardingEvent({ event_type: 'save_intercept_skipped', step_number: 2 })
    if (pendingData) {
      onComplete(pendingData)
      setPendingData(null)
    }
  }

  const handleComplete = async (data: any) => {
    console.log('[Step2] onComplete called with data:', data)
    // If no context opened, surface intercept once right before completing
    if (maybeShowInterceptBeforeComplete(data)) {
      console.log('[Step2] Save intercept shown, blocking completion once')
      setPendingData(data)
      return
    }

    const timeSpentSeconds = Math.floor((Date.now() - stepStartTime) / 1000)
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      console.log('[Step2] Saving quality metrics payload:', {
        user_id: userId,
        entry_local_date: todayStr,
        is_first_checkin: true,
        expandables_opened: expandablesOpened.length,
        life_factors_count: Array.isArray(data?.tags) ? data.tags.length : 0,
        symptoms_count: Array.isArray(data?.symptoms) ? data.symptoms.length : 0,
        has_vibe: !!data?.journal,
        time_spent_seconds: timeSpentSeconds,
        save_intercept_shown: saveInterceptShown,
        save_intercept_clicked: expandablesOpened.length > 0 && saveInterceptShown
      })
      await saveCheckinQualityMetrics({
        user_id: userId,
        entry_local_date: todayStr,
        is_first_checkin: true,
        expandables_opened: expandablesOpened.length,
        life_factors_count: Array.isArray(data?.tags) ? data.tags.length : 0,
        symptoms_count: Array.isArray(data?.symptoms) ? data.symptoms.length : 0,
        has_vibe: !!data?.journal,
        time_spent_seconds: timeSpentSeconds,
        save_intercept_shown: saveInterceptShown,
        save_intercept_clicked: expandablesOpened.length > 0 && saveInterceptShown
      })
      console.log('[Step2] Quality metrics saved OK')
    } catch (e) {
      console.warn('[Step2] Quality metrics save failed (non-blocking):', e)
    }
    onComplete(data)
  }

  useEffect(() => {
    trackOnboardingEvent({ event_type: 'step_started', step_number: 2 })
  }, [])

  return (
    <div className="p-4">
      {/* Blue empathy/info box with exact copy */}
      <div className="text-center mb-6 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">💙</span>
          <p className="text-xl">{require('@/lib/utils/greetings').getGreeting()}, {userName}</p>
        </div>
        <p className="text-base text-gray-700">Let's see where you're at today.</p>
        <div className="space-y-1 text-base">
          <p><strong>1.</strong> Move the sliders</p>
          <p><strong>2.</strong> Choose life factors and symptoms</p>
        </div>
        <p className="text-sm text-gray-500 pt-2">
          The more you add now, the faster I can spot your patterns. 
          Most people who add context get their first insight by Day 3.
        </p>
      </div>

      {/* Expandable headers (tracked opens) */}
      <ExpandableHeader
        title="🌍 Life Factors"
        subtitle="Help us find patterns faster — select what applies"
        examples="Examples: caffeine, alcohol, high stress, work deadline, travel, meditation"
        onOpen={() => handleOpen('life_factors')}
      />
      <ExpandableHeader
        title="🩺 Symptoms"
        subtitle="Tell us what symptoms you're feeling today"
        examples="Examples: headache, nausea, brain fog, dizziness, fatigue, anxiety"
        onOpen={() => handleOpen('symptoms')}
      />
      <ExpandableHeader
        title="💭 Today's Vibe (Optional)"
        subtitle="How would you describe today?"
        examples=""
        onOpen={() => handleOpen('todays_vibe')}
      />

      {/* Embedded check‑in drawer (existing UI) */}
      <EnhancedDayDrawerV2
        isOpen={true}
        onClose={() => {}}
        date={new Date().toISOString().split('T')[0]}
        userId={userId}
        userName={userName}
        isFirstCheckIn={true}
        isOnboarding={true}
        onOnboardingComplete={handleComplete}
        todayItems={{ supplements: [], protocols: [], movement: [], mindfulness: [], food: [], gear: [] }}
      />

      <SaveInterceptModal
        isOpen={showIntercept}
        onAddContext={handleInterceptAddContext}
        onAccept={handleInterceptSkip}
        displayName={userName}
      />
    </div>
  )
}


