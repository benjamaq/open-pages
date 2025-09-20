import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserLibraryItems } from '../../../lib/actions/library'
import LibraryClient from './LibraryClient'

export default async function LibraryPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/dash/create-profile')
  }

  // Get library items
  let libraryItems = []
  try {
    libraryItems = await getUserLibraryItems()
  } catch (error) {
    console.error('Failed to load library items:', error)
  }

  return (
    <LibraryClient 
      profile={profile}
      initialItems={libraryItems}
    />
  )
}
