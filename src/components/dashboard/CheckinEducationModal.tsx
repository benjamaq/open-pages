'use client'

import { useEffect, useState } from 'react'
import { dedupedJson } from '@/lib/utils/dedupedJson'

export function CheckinEducationModal({ wearableStatusPayload }: { wearableStatusPayload?: any }) {
  const [show, setShow] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // If user has just uploaded wearables in this session, skip education
        try {
          const uploaded = typeof window !== 'undefined' ? localStorage.getItem('bs_uploaded_wearables') === '1' : false
          if (uploaded) {
            setShow(false)
            setLoaded(true)
            return
          }
        } catch {}
        // If server reports wearables connected/imported, skip education
        try {
          const wj = wearableStatusPayload
          if (wj?.wearable_connected || Number(wj?.wearable_days_imported || 0) > 0) {
            setShow(false)
            setLoaded(true)
            return
          }
        } catch {}
        // Fallback: fetch wearable status only if parent didn't provide it
        if (wearableStatusPayload === undefined) {
          try {
            const ws = await dedupedJson<any>('/api/user/wearable-status?since=all', { cache: 'no-store' })
            if (ws.ok) {
              const wj = ws.data
              if (wj?.wearable_connected || Number(wj?.wearable_days_imported || 0) > 0) {
                setShow(false)
                setLoaded(true)
                return
              }
            }
          } catch {}
        }
        // Check server-side flag first to persist across devices
        const res = await fetch('/api/onboarding/context/status', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          if (j?.completed) {
            setShow(false)
            setLoaded(true)
            return
          }
        }
      } catch {}
      // Fallback to localStorage gating
      try {
        const dismissed = localStorage.getItem('checkin_education_dismissed')
        setShow(dismissed !== '1')
      } catch {
        setShow(false)
      } finally {
        setLoaded(true)
      }
    })()
    return () => { mounted = false }
  }, [wearableStatusPayload])

  const handleDismiss = () => {
    try {
      localStorage.setItem('checkin_education_dismissed', '1')
    } catch {}
    // Persist completion to server so it won't reappear on re-login
    fetch('/api/onboarding/context/complete', { method: 'POST' }).catch(() => {})
    setShow(false)
  }

  if (!loaded || !show) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(85, 81, 74, 0.45)' }}>
      <div className="bg-white/95 border border-gray-200 rounded-2xl max-w-[520px] w-full p-8 sm:p-10 shadow-lg ring-1 ring-black/5">
        <h2 className="text-2xl font-semibold text-center mb-3">How we find your verdict</h2>
        <div className="space-y-5 text-gray-700 leading-relaxed">
          <div className="text-base text-gray-600 space-y-1">
            <p>Your daily check-ins capture energy, focus, sleep, and mood scores.</p>
            <p>Your wearable data (if uploaded) adds objective biometrics like HRV, resting heart rate, and sleep stages.</p>
          </div>
          <div className="text-base text-gray-600">
            Our Truth Engine runs statistical analysis across your ON days vs OFF days — the same approach used in clinical trials — to measure whether each supplement is actually moving the needle for you.
          </div>
          <div className="text-base">
            <p className="font-semibold mb-1">What builds as you check in</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Enough ON vs OFF days to compare</li>
              <li>Noise filtering (travel, illness, stress days excluded)</li>
              <li>Statistical confidence in the result</li>
            </ul>
          </div>
          <div className="text-base">
            <p className="font-semibold mb-1">What you get when it’s ready</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Effect size: how much it moved your metrics</li>
              <li>Confidence score: how reliable the finding is</li>
              <li>A clear verdict: KEEP, DROP, or NO CLEAR SIGNAL</li>
            </ul>
          </div>
          <p className="text-base text-gray-600">Each clean check-in day sharpens the signal.</p>
        </div>
        <button
          onClick={handleDismiss}
          className="w-full h-12 mt-6 bg-slate-900 text-white rounded-full hover:bg-slate-800 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  )
}


