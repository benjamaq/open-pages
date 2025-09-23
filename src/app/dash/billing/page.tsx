import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from './BillingClient'

export default async function BillingPage() {
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
    redirect('/dash/create-profile')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Brand First Design */}
      <div className="bg-white shadow-sm">
        {/* Row 1: Brand Only */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3 sm:py-4">
            <a href="/dash" className="inline-flex items-center">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="Biostackr"
                className="h-14 w-auto"
              />
              <span className="sr-only">Biostackr dashboard</span>
            </a>
          </div>
        </div>

        {/* Row 2: Utility Toolbar */}
        <div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-3 py-2">
              {/* Back to Settings */}
              <a
                href="/dash/settings"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Settings
              </a>
              
              {/* Dashboard Button */}
              <a
                href="/dash"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BillingClient profile={profile} userEmail={user.email!} />
      </div>
    </div>
  )
}
