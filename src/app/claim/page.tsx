import { Suspense } from 'react'
import ClaimPageClient from '@/app/claim/ClaimPageClient'

export const dynamic = 'force-dynamic'

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600 text-sm">Loading…</div>
      }
    >
      <ClaimPageClient />
    </Suspense>
  )
}
