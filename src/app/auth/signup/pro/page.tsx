'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { handleUpgradeRedirect } from '../../../../lib/actions/stripe'
import BetaCodeInput from '../../../../components/BetaCodeInput'

export default function ProSignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [betaCode, setBetaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Client-side validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }

    if (!betaCode.trim()) {
      setError('Beta code is required for Pro signup')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Upsert profile with name and referral code - handles race conditions atomically
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: data.user.id,
              display_name: name.trim(),
              referral_code: referralCode.trim() || null,
              referral_source: referralCode.trim() === 'redditgo' ? 'reddit' : null,
              slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
              bio: null,
              avatar_url: null,
              public: true
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            })

          if (profileError) {
            console.error('Profile upsert error:', profileError)
            // Don't fail the signup if profile upsert fails
          }
        } catch (profileError) {
          console.error('Profile upsert error:', profileError)
        }

        // Validate and activate beta code
        try {
          const response = await fetch('/api/beta/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: betaCode.trim() }),
          })

          const result = await response.json()

          if (!response.ok) {
            setError(result.error || 'Invalid beta code')
            setLoading(false)
            return
          }
        } catch (betaError) {
          console.error('Beta code validation error:', betaError)
          setError('Failed to validate beta code. Please try again.')
          setLoading(false)
          return
        }

        // Redirect to Stripe checkout session for payment
        const successMessage = referralCode.trim() === 'redditgo' 
          ? 'Account created successfully! Welcome from Reddit! 🎉 Redirecting to payment...'
          : 'Account created successfully! Redirecting to payment...'
        setMessage(successMessage)
        
        // Create Stripe checkout session and redirect using server action
        try {
          await handleUpgradeRedirect('pro', 'monthly')
        } catch (error) {
          console.error('Checkout session error:', error)
          // Don't show error for redirects (NEXT_REDIRECT is normal)
          if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
            setError('Failed to redirect to payment. Please try again.')
          }
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img 
              src="/BIOSTACKR LOGO 2.png" 
              alt="Biostackr" 
              className="h-14 w-auto"
              style={{ width: '280px' }}
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Start sharing your health journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                Referral Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="mt-1">
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter referral code (e.g., redditgo)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Got a referral code? Enter it here to get special benefits!
              </p>
            </div>

            <div>
              <label htmlFor="betaCode" className="block text-sm font-medium text-gray-700">
                Beta Code <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <BetaCodeInput
                  onSuccess={(code) => setBetaCode(code)}
                  placeholder="Enter your beta code"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                A valid beta code is required for Pro signup
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              >
                Sign in instead
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/pricing"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}