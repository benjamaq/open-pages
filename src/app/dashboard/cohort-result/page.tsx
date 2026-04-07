import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardUnauthGate from '@/app/dashboard/DashboardUnauthGate'
import CohortResultPageClient from '@/app/dashboard/cohort-result/CohortResultPageClient'
import { buildCohortParticipantResultPayload } from '@/lib/cohortParticipantResultPayload'

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

  const serverResolved = await buildCohortParticipantResultPayload(user.id)

  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading…</p>}>
      <CohortResultPageClient
        serverResolved={
          serverResolved.ok
            ? { kind: 'ready', payload: serverResolved.payload }
            : { kind: 'not_found', reason: serverResolved.reason }
        }
      />
    </Suspense>
  )
}
