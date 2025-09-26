'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManageProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const loadProfiles = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      console.log('🔍 Loading profiles for user:', user.id)

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError)
        setError(`Error fetching profiles: ${profilesError.message}`)
      } else {
        console.log('👤 Profiles found:', profilesData)
        setProfiles(profilesData || [])
      }
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    
    setLoading(false)
  }

  const cleanupProfiles = async () => {
    if (profiles.length <= 1) {
      setError('No duplicate profiles to clean up')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Keep the most recent profile (first in the ordered list)
      const keepProfile = profiles[0]
      const duplicateProfiles = profiles.slice(1)

      console.log(`🧹 Cleaning up ${duplicateProfiles.length} duplicate profiles`)
      console.log(`✅ Keeping profile: ${keepProfile.id} (${keepProfile.display_name})`)

      // Delete duplicate profiles
      const duplicateIds = duplicateProfiles.map(p => p.id)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .in('id', duplicateIds)

      if (deleteError) {
        console.error('Error deleting duplicate profiles:', deleteError)
        setError(`Failed to delete duplicate profiles: ${deleteError.message}`)
      } else {
        console.log(`🗑️ Deleted ${duplicateIds.length} duplicate profiles`)
        setSuccess(`Successfully cleaned up ${duplicateIds.length} duplicate profiles!`)
        // Reload profiles
        await loadProfiles()
      }
    } catch (err) {
      console.error('❌ Error cleaning up profiles:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Management</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Profiles</h2>
              <div className="space-x-2">
                <button
                  onClick={loadProfiles}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Refresh
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={cleanupProfiles}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Clean Up Duplicates
                  </button>
                )}
              </div>
            </div>
            
            {loading && <p className="text-gray-600">Loading...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
            {success && <p className="text-green-600">Success: {success}</p>}
            
            {!loading && !error && (
              <div>
                <p className="text-lg font-medium mb-4">
                  Total Profiles: {profiles.length}
                  {profiles.length > 1 && (
                    <span className="text-red-600 ml-2">⚠️ You have duplicate profiles!</span>
                  )}
                </p>
                
                {profiles.length === 0 ? (
                  <p className="text-gray-500">No profiles found</p>
                ) : (
                  <div className="space-y-2">
                    {profiles.map((profile, index) => (
                      <div key={profile.id} className={`p-4 rounded border ${
                        index === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">ID:</span> {profile.id}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                              index === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {index === 0 ? 'KEEP (Most Recent)' : 'DUPLICATE'}
                            </span>
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
                          <div>
                            <span className="font-medium">Allow Follow:</span> {profile.allow_stack_follow ? 'Yes' : 'No'}
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
