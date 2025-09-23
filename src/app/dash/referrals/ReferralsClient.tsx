'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, ExternalLink } from 'lucide-react'

interface ReferralAnalytics {
  total_referrals: number
  analytics: Array<{
    code: string
    count: number
    sources: Record<string, number>
  }>
}

export default function ReferralsClient() {
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReferralAnalytics()
  }, [])

  const loadReferralAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/referrals')
      if (!response.ok) {
        throw new Error('Failed to load referral analytics')
      }
      
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error loading referral analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load referral analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading referral analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-700">
          <h3 className="font-medium">Error Loading Analytics</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referral Analytics</h1>
        <p className="text-gray-600 mt-2">Track how users are finding your app through referral codes</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Referrals</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics?.total_referrals || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Code</h3>
              <p className="text-xl font-bold text-gray-900">
                {analytics?.analytics[0]?.code || 'None'}
              </p>
              <p className="text-sm text-gray-600">
                {analytics?.analytics[0]?.count || 0} uses
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <ExternalLink className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Codes</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics?.analytics.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Referral Code Breakdown</h2>
        
        {analytics?.analytics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No referrals yet. Share your referral codes to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics?.analytics.map((item) => (
              <div key={item.code} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-900">{item.code}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.code}</h3>
                      <p className="text-sm text-gray-600">{item.count} total uses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">uses</p>
                  </div>
                </div>
                
                {/* Sources breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sources:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.sources).map(([source, count]) => (
                      <span
                        key={source}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {source}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Use Referral Codes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">How to Use Referral Codes</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Share your referral code with others: <code className="bg-blue-100 px-1 rounded">redditgo</code></p>
          <p>• Users can enter the code during signup to get special benefits</p>
          <p>• Track which codes are most effective for bringing in new users</p>
          <p>• Monitor referral sources to optimize your marketing efforts</p>
        </div>
      </div>
    </div>
  )
}

