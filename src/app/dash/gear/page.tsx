import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import GearPageClient from './GearPageClient'

export default async function GearPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dash/create-profile')
  }

  // Fetch user's gear
  const { data: gear, error: gearError } = await supabase
    .from('gear')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (gearError) {
    console.error('Error fetching gear:', gearError)
  }

  return (
    <GearPageClient 
      gear={gear || []} 
      profile={profile}
    />
  )
}
