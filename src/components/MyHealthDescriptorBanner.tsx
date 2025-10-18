'use client'

import { useEffect, useState } from 'react'

export default function MyHealthDescriptorBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('myhealth_descriptor_dismissed') === '1'
      if (!dismissed) setVisible(true)
    } catch {}
  }, [])

  if (!visible) return null

  return (
    <div className="relative bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-sm">
      <button
        aria-label="Dismiss"
        onClick={() => { try { localStorage.setItem('myhealth_descriptor_dismissed', '1') } catch {}; setVisible(false) }}
        className="absolute right-2 top-2 text-blue-700/70 hover:text-blue-900"
      >
        ×
      </button>
      <span className="font-medium">Your health, ready to share.</span> This page shows everything you track—exactly how it appears when you share it with your doctor.
    </div>
  )
}


