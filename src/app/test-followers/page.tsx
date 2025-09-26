'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestFollowersPage() {
  const [followers, setFollowers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadFollowers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      console.log('🔍 Loading followers for user:', user.id)

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, slug, user_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      console.log('👤 Profile found:', profile)

      // Get followers
      const { data: followersData, error: followersError } = await supabase
        .from('stack_followers')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })

      if (followersError) {
        console.error('❌ Error fetching followers:', followersError)
        setError(`Error fetching followers: ${followersError.message}`)
      } else {
        console.log('👥 Followers found:', followersData)
        setFollowers(followersData || [])
      }
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    
    setLoading(false)
  }

  const testNotifyFollowers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notify-followers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message from followers test page'
        })
      })
      
      const result = await response.json()
      console.log('📧 Notify followers result:', result)
      
      if (response.ok) {
        alert(`Success! Sent to ${result.followersNotified} followers`)
      } else {
        setError(result.error || 'Failed to send notifications')
      }
    } catch (err) {
      console.error('❌ Error testing notify followers:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadFollowers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Followers Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Followers</h2>
              <div className="space-x-2">
                <button
                  onClick={loadFollowers}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Refresh
                </button>
                <button
                  onClick={testNotifyFollowers}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Test Notify Followers
                </button>
              </div>
            </div>
            
            {loading && <p className="text-gray-600">Loading...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
            
            {!loading && !error && (
              <div>
                <p className="text-lg font-medium mb-4">
                  Total Followers: {followers.length}
                </p>
                
                {followers.length === 0 ? (
                  <p className="text-gray-500">No followers found</p>
                ) : (
                  <div className="space-y-2">
                    {followers.map((follower, index) => (
                      <div key={follower.id || index} className="p-3 bg-gray-50 rounded border">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Email:</span> {follower.follower_email}
                          </div>
                          <div>
                            <span className="font-medium">Verified:</span> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                              follower.verified_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {follower.verified_at ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(follower.created_at).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span> {follower.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
