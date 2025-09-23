'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import StripePaymentForm from '../../../../components/StripePaymentForm'

export default function CreatorPaymentPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    billingPeriod: 'monthly' as 'monthly' | 'yearly'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            creator_intent: true,
            wants_immediate_creator: true,
          }
        }
      })

      if (error) {
        setMessage(error.message)
        return
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              display_name: formData.name.trim(),
              slug: formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
              bio: null,
              avatar_url: null,
              public: true,
              tier: 'free' // Will be upgraded after payment
            }
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        setUserId(data.user.id)
        setAccountCreated(true)
        setMessage('Account created! Complete your payment below to activate Creator features.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setMessage('Payment successful! Welcome to BioStackr Creator. Redirecting to your dashboard...')
    setTimeout(() => {
      router.push('/dash')
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    setMessage(`Payment failed: ${error}. Please try again.`)
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
                className="h-14 w-auto"
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>⭐</span>
            <span>Creator Account + Payment</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Creator Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create your account and complete payment in one simple process
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Account Details */}
          <div className="bg-white rounded-lg border-2 border-purple-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {accountCreated ? 'Account Ready' : 'Account Details'}
            </h2>
            
            {!accountCreated ? (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-800 hover:bg-purple-900 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Simple Success Message */}
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Created</h3>
                  <p className="text-sm text-gray-600">Complete payment to activate Creator features</p>
                </div>
                
                {/* Clean Account Summary */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium text-gray-900">Creator ({formData.billingPeriod})</span>
                  </div>
                </div>

                {/* Simple Next Step */}
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">→ Complete payment on the right</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Payment */}
          <div className="bg-white rounded-lg border-2 border-purple-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {accountCreated ? 'Complete Payment' : 'Creator Plan'}
            </h2>
            
            {/* Price Summary */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg text-gray-900">Creator Plan</span>
                <span className="text-xl font-bold text-gray-900">
                  ${formData.billingPeriod === 'monthly' ? '29.95' : '199.90'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Billed {formData.billingPeriod}
                {formData.billingPeriod === 'yearly' && (
                  <span className="block text-gray-900 font-medium">Save $159.50 per year!</span>
                )}
              </div>
            </div>

            {/* Features Included */}
            <div className="space-y-2 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
              {[
                'Everything in Pro (unlimited)',
                'Affiliate links & buy buttons',
                'Shop My Gear page',
                'Custom branding & colors',
                'Follower tracking',
                'Priority support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Payment Form or Waiting */}
            {accountCreated ? (
              <StripePaymentForm
                amount={formData.billingPeriod === 'monthly' ? 2995 : 19990} // cents
                currency="usd"
                planType="creator"
                billingPeriod={formData.billingPeriod}
                customerEmail={formData.email}
                customerName={formData.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-semibold text-gray-700 mb-2">Secure Payment</h3>
                <p className="text-sm text-gray-600">
                  Complete your account details on the left, then your payment form will appear here
                </p>
              </div>
            )}

            {/* Security Icons */}
            <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center max-w-2xl mx-auto ${
            message.includes('success') || message.includes('created') || message.includes('successful')
              ? 'bg-gray-50 text-gray-900 border border-gray-200'
              : 'bg-gray-50 text-gray-900 border border-gray-200'
          }`}>
            {message}
          </div>
        )}

        {/* Help */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/support" className="text-gray-900 hover:text-black font-medium">
              Contact support
            </Link>
            {' '}or{' '}
            <Link href="/auth/signin" className="text-gray-900 hover:text-black font-medium">
              sign in to existing account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}