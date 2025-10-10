'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AuthFormProps {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState('')
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

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }


    try {
      if (mode === 'signup') {
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
          // Create profile with name and referral code - handles race conditions atomically
          try {
            // Generate a unique slug
            const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            const timestamp = Date.now().toString(36)
            const uniqueSlug = `${baseSlug}-${timestamp}`
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: data.user.id,
                display_name: name.trim(),
                referral_code: referralCode.trim() || null,
                referral_source: referralCode.trim() === 'redditgo' ? 'reddit' : null,
                slug: uniqueSlug,
                bio: null,
                avatar_url: null,
                public: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select()

            if (profileError) {
              // If it's a duplicate key error, that's actually okay - profile already exists
              if (profileError.code === '23505') {
                console.log('ℹ️ Profile already exists for user:', data.user.id)
              } else {
                console.error('❌ Profile creation error:', profileError)
              }
            } else {
              console.log('✅ Profile created successfully for user:', data.user.id)
            }
          } catch (profileError) {
            console.error('Profile upsert error:', profileError)
            // Don't fail the signup if profile creation fails
          }

          // Check if referral code is actually a beta code
          if (referralCode.trim()) {
            try {
              const betaResponse = await fetch('/api/beta/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: referralCode.trim() })
              })

              if (betaResponse.ok) {
                // Beta code activated! User gets Pro access
                setMessage('Beta code activated! You now have 6 months of free Pro access! 🎉 Redirecting...')
                setTimeout(() => {
                  router.push('/dash')
                  router.refresh()
                }, 2000)
                return
              }
              // If not a valid beta code, continue as normal (it's just a referral code)
            } catch (betaError) {
              console.log('Not a beta code, treating as referral code:', betaError)
              // Continue as normal - it's just a referral code
            }
          }

          // Redirect to dashboard for new users
          const successMessage = referralCode.trim() === 'redditgo' 
            ? 'Account created successfully! Welcome from Reddit! 🎉 Redirecting...'
            : 'Account created successfully! Redirecting...'
          setMessage(successMessage)
          setTimeout(() => {
            router.push('/dash')
            router.refresh()
          }, 1000)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          router.push('/dash')
          router.refresh()
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isSignUp = mode === 'signup'

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
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Start sharing your health journey' : 'Welcome back to your health profile'}
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

            {isSignUp && (
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
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                  Referral or Beta Code <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white sm:text-sm"
                    placeholder="Enter beta or referral code"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Have a beta code? Enter it here to unlock 6 months of free Pro access!
                </p>
              </div>
            )}


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
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
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
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
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
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={isSignUp ? '/auth/signin' : '/auth/signup'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
