import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no profile exists, redirect to create profile
  if (!profile) {
    redirect('/dash/create-profile')
  }

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Fetch counts and today's items for dashboard
  const [stackItemsResult, protocolsResult, uploadsResult, todayStackItems, todayProtocols] = await Promise.all([
    supabase
      .from('stack_items')
      .select('id', { count: 'exact' })
      .eq('profile_id', profile.id),
    supabase
      .from('protocols')
      .select('id', { count: 'exact' })
      .eq('profile_id', profile.id),
    supabase
      .from('uploads')
      .select('id', { count: 'exact' })
      .eq('profile_id', profile.id),
    supabase
      .from('stack_items')
      .select('*')
      .eq('profile_id', profile.id)
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('protocols')
      .select('*')
      .eq('profile_id', profile.id)
      .contains('schedule_days', [dayOfWeek])
  ])

  const counts = {
    stackItems: stackItemsResult.count || 0,
    protocols: protocolsResult.count || 0,
    uploads: uploadsResult.count || 0
  }

  const todayItems = {
    supplements: todayStackItems.data || [],
    protocols: todayProtocols.data || []
  }

  return (
    <DashboardClient profile={profile} counts={counts} todayItems={todayItems} userId={user.id} />
  )
}
