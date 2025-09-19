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

  // Check if user has a profile, create one if missing
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no profile exists, create a basic one automatically
  if (!profile) {
    const { generateUniqueSlug } = await import('../../lib/slug')
    const slug = generateUniqueSlug(user.email?.split('@')[0] || 'user')
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        slug: slug,
        bio: null,
        avatar_url: null,
        public: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      // Still redirect to create-profile if automatic creation fails
      redirect('/dash/create-profile')
    }
    
    profile = newProfile
  }

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Fetch counts and today's items for dashboard
  const [stackItemsResult, protocolsResult, uploadsResult, todaySupplements, todayMindfulness, todayMovement, todayProtocols, todayFood, userGear] = await Promise.all([
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
      .eq('item_type', 'supplements')
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('stack_items')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('item_type', 'mindfulness')
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('stack_items')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('item_type', 'movement')
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('protocols')
      .select('*')
      .eq('profile_id', profile.id)
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('stack_items')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('item_type', 'food')
      .contains('schedule_days', [dayOfWeek]),
    supabase
      .from('gear')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
  ])

  const counts = {
    stackItems: stackItemsResult.count || 0,
    protocols: protocolsResult.count || 0,
    uploads: uploadsResult.count || 0
  }

  const todayItems = {
    supplements: todaySupplements.data || [],
    mindfulness: todayMindfulness.data || [],
    movement: todayMovement.data || [],
    protocols: todayProtocols.data || [],
    food: todayFood.data || [],
    gear: userGear.data || []
  }

  return (
    <DashboardClient profile={profile} counts={counts} todayItems={todayItems} userId={user.id} />
  )
}
