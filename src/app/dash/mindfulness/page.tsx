import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import MindfulnessPageClient from './MindfulnessPageClient'

export default async function MindfulnessPage() {
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

  // Fetch mindfulness items for this profile
  const { data: mindfulnessItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('item_type', 'mindfulness')
    .order('created_at', { ascending: false })

  return (
    <MindfulnessPageClient 
      mindfulnessItems={mindfulnessItems || []} 
      profile={profile} 
    />
  )
}
