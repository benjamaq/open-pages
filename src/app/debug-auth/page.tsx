'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const checkAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`Auth error: ${userError.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        setError('No user found - not authenticated')
        setLoading(false)
        return
      }

      setAuthData({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      })

      console.log('👤 User found:', user)

      // Check profiles with this user ID
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)

      if (profilesError) {
        setError(`Profiles error: ${profilesError.message}`)
      } else {
        setProfiles(profilesData || [])
        console.log('📊 Profiles found:', profilesData)
      }

      // Also check if there are any profiles at all
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, created_at')
        .limit(10)

      console.log('📊 All profiles (first 10):', allProfiles)

    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Authentication</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Authentication Status</h2>
              <button
                onClick={checkAuth}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            
            {loading && <p className="text-gray-600">Loading...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
            
            {authData && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">User ID:</span> {authData.id}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {authData.email}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Created:</span> {new Date(authData.created_at).toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Last Sign In:</span> {new Date(authData.last_sign_in_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Profiles</h2>
            
            {profiles.length === 0 ? (
              <div>
                <p className="text-red-600 mb-4">No profiles found for your user ID</p>
                <p className="text-sm text-gray-600">
                  This means either:
                  <br />• No profile was created when you signed up
                  <br />• The profile was created with a different user ID
                  <br />• There's a database connection issue
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile, index) => (
                  <div key={profile.id} className="p-3 bg-gray-50 rounded border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">ID:</span> {profile.id}
                      </div>
                      <div>
                        <span className="font-medium">Display Name:</span> {profile.display_name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Slug:</span> {profile.slug || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(profile.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
