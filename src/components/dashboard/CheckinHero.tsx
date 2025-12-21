'use client'

import { useRouter } from 'next/navigation'

export function CheckinHero({ firstName }: { firstName?: string }) {
  const router = useRouter()
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'morning' : 'day'}{firstName ? `, ${firstName}` : ''}</h2>
      <p className="text-indigo-100">Ready for today&apos;s check‑in?</p>
      <p className="text-indigo-200 mb-6">30 seconds to get closer to answers</p>
      <button
        onClick={() => router.push('/dashboard?checkin=1')}
        className="mt-2 inline-flex items-center px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50"
      >
        Complete Check-in →
      </button>
    </div>
  )
}


