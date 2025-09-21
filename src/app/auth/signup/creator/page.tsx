'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CreatorSignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [wantsCreatorTrial, setWantsCreatorTrial] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if trial parameter is set
    const trialParam = searchParams.get('trial')
    if (trialParam === 'true') {
      setWantsCreatorTrial(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            creator_intent: true, // Mark as creator
            wants_creator_trial: wantsCreatorTrial,
          }
        }
      })

      if (error) {
        setMessage(error.message)
        return
      }

      if (data.user) {
        // Create profile with creator intent
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: data.user.id,
                display_name: name.trim(),
                slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
                bio: null,
                avatar_url: null,
                public: true,
                tier: wantsCreatorTrial ? 'creator' : 'free' // Set initial tier
              }
            ])

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
        }

        setMessage('Creator account created successfully! Check your email to verify your account.')
        
        // Redirect to creator welcome page
        setTimeout(() => {
          router.push('/welcome/creator')
        }, 2000)
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-16 w-auto"
              />
            </Link>
            <Link 
              href="/pricing/creator"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>⭐</span>
            <span>Creator Account</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Get Started as a Creator
          </h1>
          <p className="text-lg text-gray-600">
            {wantsCreatorTrial ? 'Start your 14-day Creator trial' : 'Join BioStackr as a Creator'}
          </p>
        </div>

        {/* Simple Form */}
        <div className="bg-white border-2 border-purple-200 rounded-lg p-8 shadow-lg">
          {/* Trial Toggle */}
          {!searchParams.get('trial') && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <input
                  id="creator-trial"
                  type="checkbox"
                  checked={wantsCreatorTrial}
                  onChange={(e) => setWantsCreatorTrial(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 bg-white border-purple-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="creator-trial" className="text-sm font-medium text-purple-900 cursor-pointer">
                    Start 14-Day Creator Trial
                  </label>
                  <p className="text-xs text-purple-700 mt-1">
                    Try Creator features free for 14 days. No credit card required.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
              />
            </div>

            {message && (
              <div className="text-sm text-center p-4 rounded-lg bg-gray-50 text-gray-900 border border-gray-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-800 hover:bg-purple-900 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                wantsCreatorTrial ? 'Start 14-Day Creator Trial' : 'Create Creator Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-gray-900 hover:text-black">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Simple Features List */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Creator features include:</p>
          <div className="space-y-2 text-sm text-gray-700">
            <div>• Custom branding and colors</div>
            <div>• Affiliate links and buy buttons</div>
            <div>• Shop My Gear page</div>
            <div>• Follower tracking</div>
          </div>
        </div>
      </div>
    </div>
  )
}