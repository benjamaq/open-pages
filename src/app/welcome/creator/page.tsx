'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'

export default function CreatorWelcomePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [hasCreatorTrial, setHasCreatorTrial] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if user has creator trial
        const { data: usage } = await supabase
          .from('user_usage')
          .select('is_in_creator_trial, creator_trial_started_at')
          .eq('user_id', user.id)
          .single()
        
        if ((usage as any)?.is_in_creator_trial) {
          setHasCreatorTrial(true)
        }
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/dash" className="flex items-center space-x-2">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-14 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 mb-8">
            <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Welcome Message */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>⭐</span>
            <span>Creator Account</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to BioStackr, Creator! 🎉
          </h1>
          
          {hasCreatorTrial ? (
            <p className="text-xl text-gray-600 mb-8">
              Your 14-day Creator trial is now active! You have full access to all monetization 
              and branding features to build your health business.
            </p>
          ) : (
            <p className="text-xl text-gray-600 mb-8">
              Your Creator account is ready! Start building your health stack and turn your 
              expertise into a thriving business.
            </p>
          )}

          {/* Creator Features Highlights */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Monetize Your Stack</h3>
              <p className="text-sm text-gray-600">Add affiliate links to supplements and gear to earn commissions from your recommendations.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Custom Branding</h3>
              <p className="text-sm text-gray-600">Upload your logo and customize colors to match your personal brand.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛍️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Shop My Gear</h3>
              <p className="text-sm text-gray-600">Create a dedicated page showcasing all your recommended products.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Followers</h3>
              <p className="text-sm text-gray-600">Monitor your audience growth and engagement to optimize your content.</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">
              Build your complete health stack, set up your branding, and start sharing your expertise with the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dash"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/dash/settings"
                className="bg-white hover:bg-gray-50 text-purple-600 font-semibold py-3 px-6 rounded-lg transition-colors border border-purple-200"
              >
                Set Up Branding
              </Link>
            </div>
          </div>

          {/* Trial Info */}
          {hasCreatorTrial && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-800">
                <strong>Creator Trial Active:</strong> You have 14 days to explore all Creator features. 
                After the trial, you can continue with Creator ($29.95/month) or switch to Pro/Free.
              </p>
            </div>
          )}

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Questions about Creator features?{' '}
              <Link href="/contact" className="text-purple-600 hover:text-purple-500 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
