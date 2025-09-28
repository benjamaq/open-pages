'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'

export default function ProPricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const getCtaText = () => {
    return 'Get started with Pro'
  }

  const getCtaHref = () => {
    // For logged-in users, go directly to payment
    // For new users, go to signup first
    if (isLoggedIn) {
      return `/auth/signup/pro-payment?billing=${billingPeriod}`
    } else {
      return '/auth/signup/pro'
    }
  }

  return (
    <div className="min-h-screen bg-white">
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
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>⚡</span>
            <span>Pro Plan</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlimited Health Optimization
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track unlimited supplements, protocols, and gear. Get priority support and 
            advanced progress tracking to optimize your health journey.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <span className="text-gray-600 ml-1">(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                Recommended
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingPeriod === 'monthly' ? '9.99' : '99.90'}
                </span>
                <span className="text-gray-600">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="mt-2 text-gray-600 text-sm">Billed annually (Save $20)</p>
              )}
              <p className="mt-2 text-gray-600">For serious health optimizers</p>
            </div>

            <div className="mt-8">
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Unlimited supplements, protocols, movement, mindfulness, gear & files</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Featured Current Plan on public profile</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Enhanced progress tracking</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href={getCtaHref()}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                {getCtaText()}
              </Link>
            </div>
          </div>
        </div>

        {/* Why Pro Features Matter */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlimited Everything</h3>
            <p className="text-gray-600">Track as many supplements, protocols, and gear items as you need without restrictions.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Priority Support</h3>
            <p className="text-gray-600">Get faster responses and dedicated help when you need it most.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">Deeper insights into your health optimization journey with enhanced tracking.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's included in the Pro plan?</h3>
              <p className="text-gray-600">Unlimited tracking of all health items, priority support, featured profile status, and enhanced progress tracking.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get started?</h3>
              <p className="text-gray-600">Simply click "Get started with Pro" above to begin your unlimited health optimization journey. No special codes required.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
