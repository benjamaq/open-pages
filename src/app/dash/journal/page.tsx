import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import JournalPageClient from './JournalPageClient'

export default async function JournalPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
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

  // Get journal entries
  const { data: journalEntries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .order('created_at', { ascending: false })

  return (
    <JournalPageClient 
      profile={profile}
      journalEntries={journalEntries || []}
    />
  )
}
