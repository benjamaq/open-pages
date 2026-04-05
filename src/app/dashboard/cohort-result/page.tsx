import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardUnauthGate from '@/app/dashboard/DashboardUnauthGate'
import CohortResultPageClient from '@/app/dashboard/cohort-result/CohortResultPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CohortResultPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return <DashboardUnauthGate />
  }
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading…</p>}>
      <CohortResultPageClient />
    </Suspense>
  )
}
