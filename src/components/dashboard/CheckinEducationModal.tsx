'use client'

import { useEffect, useState } from 'react'

export function CheckinEducationModal() {
  const [show, setShow] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
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
  }, [])

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
        <h2 className="text-2xl font-semibold text-center mb-3">How the signal builds</h2>
        <div className="space-y-5 text-gray-700 leading-relaxed">
          <div className="text-base text-gray-600 space-y-1">
            <p>Your check-ins show how you feel.</p>
            <p>If you’ve uploaded data, devices show what changed.</p>
            <p>Together, they help separate real effects from noise.</p>
          </div>
          <div className="text-base">
            <p className="font-semibold mb-1">What you’ll see as it builds</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Progress bars updating over time</li>
              <li>Directional trends</li>
              <li>Small wins and streaks</li>
            </ul>
          </div>
          <div className="text-base">
            <p className="font-semibold mb-1">What appears once there’s enough signal</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Measured effect sizes</li>
              <li>Clear keep / drop guidance</li>
            </ul>
          </div>
          <p className="text-base text-gray-600">Each check-in adds clarity over time.</p>
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


