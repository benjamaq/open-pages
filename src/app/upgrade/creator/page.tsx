'use client'

import { useState } from 'react'
import Link from 'next/link'
import { handleUpgradeRedirect } from '../../../lib/actions/stripe'
import AuthCheck from '../auth-check'

export default function UpgradeCreatorPage() {
  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      await handleUpgradeRedirect('creator', billingPeriod)
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/dash" className="flex items-center space-x-2">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                  alt="BioStackr" 
                  className="h-12 w-auto"
                />
              </Link>
              <Link 
                href="/dash"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-6">
              <span className="text-2xl">🎨</span>
              <h1 className="text-4xl font-bold text-gray-900">Upgrade to Creator</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Turn your health stack into a business. Add affiliate links, create a "Shop My Gear" page, 
              and build your personal health brand with custom styling.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly (Save 4 months!)
              </button>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30"></div>
              </div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-sm border border-purple-300/20 rounded-full px-3 py-1 mb-4">
                    <span className="text-purple-200 text-sm font-medium">Most Popular</span>
                  </div>
                  <h2 className="text-2xl font-bold flex items-center justify-center space-x-2 mb-4">
                    <span>Creator</span>
                    <span className="text-purple-300">🎨</span>
                  </h2>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">
                      ${billingPeriod === 'monthly' ? '29.95' : '199.90'}
                    </span>
                    <span className="text-purple-200">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="inline-flex items-center bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      Save $159.50 per year
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    'Everything in Pro',
                    'Affiliate links & buy buttons on supplements and gear',
                    'Shop My Gear page',
                    'Custom branding (logo & colors)',
                    'Follower tracking and engagement metrics',
                    'Priority support and creator resources'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-purple-100">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  {loading ? 'Processing...' : `Upgrade to Creator - $${billingPeriod === 'monthly' ? '29.95' : '199.90'}`}
                </button>

                <div className="text-center mt-4 space-y-2">
                  <p className="text-sm text-purple-200">
                    14-day trial included • Cancel anytime
                  </p>
                  <p className="text-xs text-purple-300">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Detail */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monetize Your Stack</h3>
              <p className="text-gray-600">
                Add affiliate links to supplements and gear. Earn commissions when followers purchase through your recommendations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛍️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop My Gear</h3>
              <p className="text-gray-600">
                Create a dedicated "Shop My Gear" page showcasing all your recommended products with buy buttons.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Branding</h3>
              <p className="text-gray-600">
                Upload your logo and customize colors to match your brand. Make your profile truly yours.
              </p>
            </div>
          </div>

          {/* Creator Benefits */}
          <div className="mt-16 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect for Health Creators</h2>
              <p className="text-gray-600">Join coaches, influencers, and wellness experts who are building their brand on BioStackr</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Follower Insights</h3>
                  <p className="text-gray-600 text-sm">Track followers, link clicks, and engagement to understand what resonates with your audience.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">🤝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Creator Support</h3>
                  <p className="text-gray-600 text-sm">Priority support channel and resources to help you succeed as a health creator.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Creator Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How do affiliate links work?
                </h3>
                <p className="text-gray-600">
                  Add your affiliate links to any supplement or gear item. When followers click "Buy Now," they go to your affiliate link. You earn commissions from purchases.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I customize my profile colors?
                </h3>
                <p className="text-gray-600">
                  Yes! Upload your logo and choose custom colors for your profile header, buttons, and accents to match your brand.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  What kind of analytics do I get?
                </h3>
                <p className="text-gray-600">
                  Track follower growth, link clicks, most popular items, and engagement metrics to understand your audience better.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  )
}