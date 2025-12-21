'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportReady() {
  const router = useRouter()
  useEffect(() => {
    // Ensure the education modal shows at least once after upload
    try {
      localStorage.removeItem('checkin_education_dismissed')
    } catch {}
  }, [])
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        backgroundImage: "url('/supp3.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white/95 p-8 sm:p-10 shadow-lg ring-1 ring-black/5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">How results are determined</h1>
          <div className="mt-6 space-y-4 text-left text-gray-700 leading-relaxed text-base">
            <div>
              <div className="font-semibold">What we compare</div>
              <p className="mt-1 text-gray-600">We compare days you take a supplement with days you don’t.</p>
            </div>
            <div>
              <div className="font-semibold">Where the signal comes from</div>
              <p className="mt-1 text-gray-600"><span className="font-medium">If you uploaded wearable data</span> — we measure what changed.</p>
              <p className="mt-1 text-gray-600"><span className="font-medium">If you check in manually</span> — we capture how you felt.</p>
            </div>
            <div>
              <div className="font-semibold">What happens next</div>
              <p className="mt-1 text-gray-600">Either way, the signal builds — and becomes clearer over time.</p>
            </div>
          </div>
          <button
            className="mt-8 inline-flex items-center justify-center w-full h-12 rounded-full bg-slate-900 px-4 text-white hover:bg-slate-800 font-semibold"
            onClick={() => router.push('/dashboard')}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}


