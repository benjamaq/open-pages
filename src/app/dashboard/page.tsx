import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardPageClient, DashboardSkeleton } from '@/app/dashboard/page.client'
import DashboardUnauthGate from '@/app/dashboard/DashboardUnauthGate'

/** Auth + cohort state must never come from a statically cached shell. */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <DashboardUnauthGate />
  }
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageClient />
    </Suspense>
  )
}
