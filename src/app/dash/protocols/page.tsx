import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtocolsPageClient from './ProtocolsPageClient'

export default async function ProtocolsPage() {
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

  // Fetch protocols for this profile
  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .order('created_at', { ascending: false })

  return (
    <ProtocolsPageClient 
      protocols={protocols || []} 
      profile={profile} 
    />
  )
}
