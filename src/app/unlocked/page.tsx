import { Suspense } from 'react'
import UnlockedClient from './UnlockedClient'

export default function UnlockedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">Loading…</div>}>
      <UnlockedClient />
    </Suspense>
  )
}




