import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

// Force fresh data on every request to prevent caching issues
export const dynamic = 'force-dynamic'
import DashboardClient from './DashboardClient'
import type { Metadata } from 'next'

// Add cache-busting metadata for Safari
export const metadata: Metadata = {
  title: 'Dashboard - BioStackr',
  description: 'Your health and wellness dashboard',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`
  }
}

// Force dynamic rendering for Safari
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // First, try to fetch existing profile
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  let profile = profiles && profiles.length > 0 ? profiles[0] : null

  // If no profile exists, create one using upsert to handle race conditions
  if (!profile) {
    const { generateUniqueSlug } = await import('../../lib/slug')
    const slug = generateUniqueSlug(user.email?.split('@')[0] || 'user')
    
    const { data: newProfiles, error: createError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        slug: slug,
        bio: null,
        avatar_url: null,
        public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .order('created_at', { ascending: false })

    if (createError) {
      console.error('Error creating profile:', createError)
      // If it's a duplicate key error, try to fetch the existing profile
      if (createError.code === '23505') {
        console.log('ℹ️ Profile already exists, fetching existing profile')
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        profile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null
      } else {
        redirect('/dash/create-profile')
      }
    } else {
      profile = newProfiles && newProfiles.length > 0 ? newProfiles[0] : null
    }
  }

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    redirect('/dash/create-profile')
  }

  // Get user's tier information from user_usage table
  const { data: usageData, error: usageError } = await supabase
    .from('user_usage')
    .select('tier, is_in_trial, trial_ended_at')
    .eq('user_id', user.id)
    .single()

  // Add tier information to profile
  const profileWithTier = {
    ...profile,
    tier: usageData?.tier || 'free',
    isInTrial: usageData?.is_in_trial || false,
    trialEndedAt: usageData?.trial_ended_at
  }

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const dayOfWeek = today.getDay()
  
  // Helper function to check if bi-weekly item should show today
  const shouldShowBiWeekly = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const weeksDiff = Math.floor((today.getTime() - createdDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return weeksDiff % 2 === 0 // Show every other week
  }

  // Fetch counts and today's items for dashboard
  const [stackItemsResult, protocolsResult, uploadsResult, followersResult, todaySupplements, todayMindfulness, todayMovement, todayProtocols, todayFood, userGear] = await Promise.all([
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
      .from('stack_followers')
      .select('id, created_at', { count: 'exact' })
      .eq('owner_user_id', user.id)
      .not('verified_at', 'is', null),
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
    uploads: uploadsResult.count || 0,
    followers: followersResult.count || 0
  }

  // Filter bi-weekly items based on creation date
  const filterBiWeekly = (items: any[]) => {
    return items.filter(item => {
      // If item has frequency field, check if it's bi-weekly
      if (item.frequency === 'bi-weekly') {
        return shouldShowBiWeekly(item.created_at)
      }
      return true // Show all other items
    })
  }

  const todayItems = {
    supplements: filterBiWeekly(todaySupplements.data || []),
    mindfulness: filterBiWeekly(todayMindfulness.data || []),
    movement: filterBiWeekly(todayMovement.data || []),
    protocols: filterBiWeekly(todayProtocols.data || []),
    food: filterBiWeekly(todayFood.data || []),
    gear: userGear.data || [] // Gear doesn't have scheduling
  }

  // Debug logging for movement items
  console.log('🔍 Dashboard filtering debug:')
  console.log(`Today is day ${dayOfWeek} (0=Sunday, 1=Monday, etc.)`)
  console.log(`Movement items scheduled for today: ${todayMovement.data?.length || 0}`)
  console.log(`Movement items after bi-weekly filter: ${todayItems.movement.length}`)
  if (todayMovement.data) {
    todayMovement.data.forEach(item => {
      const isScheduledToday = item.schedule_days?.includes(dayOfWeek)
      console.log(`- ${item.name}: schedule_days=[${item.schedule_days?.join(', ')}], scheduled today: ${isScheduledToday}`)
    })
  }

  return (
    <DashboardClient profile={profileWithTier} counts={counts} todayItems={todayItems} userId={user.id} />
  )
}
