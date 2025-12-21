'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckinCompletePage() {
  const [msg, setMsg] = useState<{ c: string; r: string; i: string; f: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/elli/crif', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (res.ok) setMsg({ c: json?.crif?.celebration, r: json?.crif?.reflection, i: json?.crif?.insight, f: json?.crif?.forwardHook })
      } catch {}
    })()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white shadow-sm p-6">
        <h1 className="text-lg font-semibold mb-2">Check-in complete!</h1>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white grid place-items-center font-semibold">E</div>
          <div className="text-sm text-slate-800 space-y-1">
            {msg ? (
              <>
                <div>{msg.c}</div>
                <div>{msg.r}</div>
                <div>{msg.i}</div>
                <div className="font-medium">{msg.f}</div>
              </>
            ) : (
              <div className="text-slate-600">Loading…</div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Link href="/dashboard" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm">Go to Dashboard</Link>
        </div>
      </div>
    </main>
  )
}





