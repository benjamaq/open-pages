'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BetaCodeInput from '../../../../components/BetaCodeInput'

export default function ProSignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [betaCode, setBetaCode] = useState('')
  const [isBetaUser, setIsBetaUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsLoggedIn(true)
          // If user is logged in, show a message that they can enter beta code or proceed to payment
          setMessage('You are already logged in. Enter a beta code below for free Pro access, or proceed to payment.')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // If user is already logged in, handle beta code or redirect to payment
    if (isLoggedIn) {
      if (isBetaUser && betaCode.trim()) {
        // Activate beta code for logged-in user
        try {
          const response = await fetch('/api/beta/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: betaCode.trim() }),
          })

          if (response.ok) {
            setMessage('Beta code activated! You now have 6 months of free Pro access! Redirecting to dashboard...')
            setTimeout(() => {
              router.push('/dash')
              router.refresh()
            }, 2000)
            return
          } else {
            const errorData = await response.json()
            setError('Invalid beta code. Please check and try again.')
            setLoading(false)
            return
          }
        } catch (betaError) {
          console.error('Beta code activation error:', betaError)
          setError('Failed to validate beta code. Please try again.')
          setLoading(false)
          return
        }
      } else {
        // No beta code, redirect to payment page
        const successMessage = referralCode.trim() === 'redditgo' 
          ? 'Account created successfully! Welcome from Reddit! 🎉 Redirecting to payment...'
          : 'Account created successfully! Redirecting to payment...'
        setMessage(successMessage)
        
        // Wait a moment for auth state to settle, then redirect to payment page
        setTimeout(async () => {
          try {
            // Force refresh auth state
            await supabase.auth.getSession()
            // Redirect to payment page instead of direct checkout
            router.push('/auth/signup/pro-payment?billing=monthly')
          } catch (error) {
            console.error('Payment redirect error:', error)
            setError('Failed to redirect to payment. Please try again.')
            setLoading(false)
          }
        }, 1500)
        return
      }
    }

    // Client-side validation for new users
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


        // Activate beta code if provided
        if (isBetaUser && betaCode.trim()) {
          console.log('🔄 Attempting to activate beta code:', betaCode)
          try {
            const response = await fetch('/api/beta/validate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: betaCode.trim() }),
            })

            if (response.ok) {
              console.log('✅ Beta code activated for user:', data.user.id)
              // Beta users get 6 months free - redirect to dashboard
              const successMessage = referralCode.trim() === 'redditgo' 
                ? 'Account created successfully! Welcome from Reddit! 🎉 You have 6 months of Pro access! Redirecting...'
                : 'Account created successfully! You have 6 months of Pro access! Redirecting...'
              setMessage(successMessage)
              setTimeout(() => {
                router.push('/dash')
                router.refresh()
              }, 2000)
              return
            } else {
              const errorData = await response.json()
              console.error('❌ Failed to activate beta code:', errorData)
              setError('Invalid beta code. Please check and try again.')
              setLoading(false)
              return
            }
          } catch (betaError) {
            console.error('Beta code activation error:', betaError)
            setError('Failed to validate beta code. Please try again.')
            setLoading(false)
            return
          }
        }

        // Non-beta users go to payment
        const successMessage = referralCode.trim() === 'redditgo' 
          ? 'Account created successfully! Welcome from Reddit! 🎉 Redirecting to payment...'
          : 'Account created successfully! Redirecting to payment...'
        setMessage(successMessage)
        
        // Wait a moment for auth state to settle, then redirect to payment page
        // This handles Safari's authentication state issues
        setTimeout(async () => {
          try {
            // Force refresh auth state
            await supabase.auth.getSession()
            // Redirect to payment page instead of direct checkout
            router.push('/auth/signup/pro-payment?billing=monthly')
          } catch (error) {
            console.error('Payment redirect error:', error)
            setError('Failed to redirect to payment. Please try again.')
            setLoading(false)
          }
        }, 1500)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
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
          {isLoggedIn ? 'Upgrade to Pro' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoggedIn ? 'Enter a beta code for free Pro access or proceed to payment' : 'Start sharing your health journey'}
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

            {!isLoggedIn && (
              <>
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
              </>
            )}

            <div>
              <label htmlFor="betaCode" className="block text-sm font-medium text-gray-700">
                Beta Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="mt-1">
                <BetaCodeInput
                  onSuccess={(code) => {
                    setIsBetaUser(true)
                    setBetaCode(code)
                  }}
                  onError={(error) => setError(error)}
                  placeholder="Enter your beta code for 6 months free Pro access"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Have a beta code? Enter it here for 6 months of free Pro access!
              </p>
            </div>

            {!isLoggedIn && (
              <>
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
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLoggedIn ? 'Processing...' : 'Creating account...'}
                  </div>
                ) : (
                  isLoggedIn ? 'Proceed to Payment' : 'Create account'
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