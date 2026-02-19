'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { PromoRedeemer } from '@/components/billing/PromoRedeemer'

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
    return 'Get started with Premium'
  }

  const getCtaHref = () => `/signup?plan=premium&period=${billingPeriod}`

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
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to Pricing</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>⚡</span>
            <span>Premium Plan</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlimited Health Optimization
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your medications and supplements without limits. Priority support and enhanced progress tracking to help you understand what works.
          </p>
          {/* Removed beta code messaging */}
        </div>

        {/* Billing Toggle (global) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden shadow-sm">
            <button
              type="button"
              aria-pressed={billingPeriod === 'monthly'}
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-neutral-900'
                  : 'bg-transparent text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={billingPeriod === 'yearly'}
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 text-sm font-medium transition border-l border-neutral-300 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-neutral-900'
                  : 'bg-transparent text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Yearly <span className="text-neutral-500 ml-1">(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-700 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                Premium
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
              {/* Inline, highly visible toggle */}
              <div className="mt-3 flex justify-center">
                <div className="inline-flex rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    aria-pressed={billingPeriod === 'monthly'}
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-neutral-900'
                        : 'bg-transparent text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    aria-pressed={billingPeriod === 'yearly'}
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-3 py-1.5 text-xs font-medium transition border-l border-neutral-300 ${
                      billingPeriod === 'yearly'
                        ? 'bg-white text-neutral-900'
                        : 'bg-transparent text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingPeriod === 'monthly' ? '19' : '149'}
                </span>
                <span className="text-gray-600">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="mt-2 text-gray-600 text-sm">$12.42/mo • Billed annually</p>
              )}
              <p className="mt-2 text-gray-600">Everything in Free, plus unlimited tracking and priority support</p>
            </div>

            <div className="mt-8">
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-purple-700 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Unlimited supplements, protocols, movement, mindfulness, gear & files</span>
                </li>
                {/* Removed Featured profile per request */}
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-purple-700 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-purple-700 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">Enhanced progress tracking</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href={getCtaHref()}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                {getCtaText()}
              </Link>
              <div className="mt-3">
                <PromoRedeemer compact />
              </div>
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
            <p className="text-gray-600">Track as many medications, supplements, and related items as you need without restrictions.</p>
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
            <p className="text-gray-600">Unlimited tracking of medications and supplements, priority support, and enhanced progress tracking.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get started?</h3>
              <p className="text-gray-600">Click "Get started with Pro" above to begin. If you have a beta code, you can enter it during signup for special benefits!</p>
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
