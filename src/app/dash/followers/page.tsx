import { createClient } from '../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import FollowersClient from './FollowersClient'

export default async function FollowersPage() {
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
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/dash/settings" className="hover:text-gray-900">Settings</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">Followers</span>
        </div>
      </div>
      
      <FollowersClient profile={profile} />
    </div>
  )
}
