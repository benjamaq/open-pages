import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import MovementPageClient from './MovementPageClient'

export default async function MovementPage() {
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

  // Fetch movement items for this profile
  // Note: Temporarily removing item_type filter since column doesn't exist in current schema
  const { data: movementItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <MovementPageClient 
      movementItems={movementItems || []} 
      profile={profile} 
    />
  )
}
