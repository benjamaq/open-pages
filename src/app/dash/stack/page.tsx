import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import StackPageClient from './StackPageClient'

export default async function StackPage() {
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

  // Fetch stack items for this profile
  // Temporarily showing all items until item_type column is added
  const { data: stackItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <StackPageClient 
      stackItems={stackItems || []} 
      profile={profile} 
    />
  )
}
