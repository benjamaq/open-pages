import { createClient } from '@/lib/supabase/server'
import { DashboardPageClient } from '@/app/dashboard/page.client'
import DashboardUnauthGate from '@/app/dashboard/DashboardUnauthGate'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <DashboardUnauthGate />
  }
  return <DashboardPageClient />
}
