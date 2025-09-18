import { createClient } from '../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Brand First Design */}
      <div className="bg-white shadow-sm">
        {/* Row 1: Brand Only */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-5 sm:py-6">
            <Link href="/dash" className="inline-flex items-center">
              <img
                src="/BIOSTACKR LOGO.png"
                alt="Biostackr"
                className="h-16 w-auto"
                style={{ height: '80px', width: 'auto' }}
              />
              <span className="sr-only">Biostackr dashboard</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Utility Toolbar */}
        <div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-3 py-3">
              {/* Dashboard Button */}
              <Link 
                href="/dash" 
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsClient profile={profile} userEmail={user.email!} />
      </div>
    </div>
  )
}
