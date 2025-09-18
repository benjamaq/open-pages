import { createClient } from '../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/signin')
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SettingsClient profile={profile} userEmail={user.email!} />
    </div>
  )
}
