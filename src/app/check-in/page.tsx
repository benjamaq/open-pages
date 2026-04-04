import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import CheckInRequestForm from './CheckInRequestForm'

export const dynamic = 'force-dynamic'

export default async function CheckInPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: prof } = await supabase.from('profiles').select('cohort_id').eq('user_id', user.id).maybeSingle()
    const raw = prof && typeof prof === 'object' ? (prof as { cohort_id?: string | null }).cohort_id : null
    const cohortId = raw != null && String(raw).trim() !== '' ? String(raw).trim() : ''
    if (cohortId) {
      redirect(cohortDashboardStudyPath())
    }
    redirect('/dashboard')
  }

  return <CheckInRequestForm />
}
