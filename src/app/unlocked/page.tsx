'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function UnlockedPage() {
  const search = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'done'>('processing')

  useEffect(() => {
    const report = search.get('report') === '1'
    const member = search.get('member') === '1'
    // Set dev cookies to simulate webhook state flip
    if (member) {
      document.cookie = 'biostackr_member=1; path=/; max-age=31536000'
      document.cookie = 'biostackr_has_report=1; path=/; max-age=31536000'
    } else if (report) {
      document.cookie = 'biostackr_has_report=1; path=/; max-age=31536000'
    }
    setTimeout(() => {
      setStatus('done')
      router.replace('/dashboard')
    }, 800)
  }, [router, search])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">{status === 'processing' ? '🎉' : '✅'}</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {status === 'processing' ? 'Unlocking your access…' : 'Unlocked! Redirecting…'}
        </h1>
        <p className="text-slate-600">Thank you — we’re enabling your features now.</p>
      </div>
    </div>
  )
}




