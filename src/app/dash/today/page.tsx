import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import TodayPageClient from './TodayPageClient'

export default async function TodayPage() {
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
  
  // Fetch stack items scheduled for today
  const { data: todayStackItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .contains('schedule_days', [dayOfWeek])

  // Fetch protocols scheduled for today
  const { data: todayProtocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .contains('schedule_days', [dayOfWeek])

  return (
    <TodayPageClient 
      profile={profile}
      stackItems={todayStackItems || []}
      protocols={todayProtocols || []}
      currentDate={today.toISOString().split('T')[0]}
    />
  )
}
