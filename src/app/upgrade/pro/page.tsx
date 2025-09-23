'use client'

import { useState } from 'react'
import Link from 'next/link'
import { handleUpgradeRedirect } from '../../../lib/actions/stripe'
import PromoCodeInput from '../../../components/PromoCodeInput'
import AuthCheck from '../auth-check'

export default function UpgradeProPage() {
  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState<{ type: 'percent' | 'amount'; value: number; description: string } | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      await handleUpgradeRedirect('pro', billingPeriod)
    } catch (error) {
      console.error('Upgrade error:', error)
      // Don't show error for redirects (NEXT_REDIRECT is normal)
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        alert('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePromoApplied = (code: string, discountInfo: { type: 'percent' | 'amount'; value: number; description: string }) => {
    setPromoCode(code)
    setDiscount(discountInfo)
  }

  const handlePromoRemoved = () => {
    setPromoCode(null)
    setDiscount(null)
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
                className="h-14 w-auto"
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
            <span className="text-2xl">⚡</span>
            <h1 className="text-4xl font-bold text-gray-900">Upgrade to Pro</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited supplements, protocols, movement, mindfulness, gear & files. 
            Build the complete health optimization system you've been waiting for.
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
              Yearly (Save 2 months!)
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2 mb-4">
                <span>Pro</span>
                <span className="text-gray-600">⚡</span>
              </h2>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingPeriod === 'monthly' ? '9.99' : '99.90'}
                </span>
                <span className="text-gray-600">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Save $19.98 per year
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              {[
                'Everything in Free',
                'Unlimited supplements, protocols, movement, mindfulness, gear & files',
                'Featured Current Plan on public profile',
                'Priority support',
                'Enhanced progress tracking'
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="mb-6">
              <PromoCodeInput 
                onPromoApplied={handlePromoApplied}
                onPromoRemoved={handlePromoRemoved}
              />
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              {loading ? 'Processing...' : promoCode ? 'Start Free Trial' : `Upgrade to Pro - $${billingPeriod === 'monthly' ? '9.99' : '99'}`}
            </button>

            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                14-day trial included • Cancel anytime
              </p>
              <p className="text-xs text-gray-500">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Features Detail */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited Everything</h3>
            <p className="text-gray-600">
              Add as many supplements, protocols, movement routines, mindfulness practices, and gear as you want. No limits.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Featured Profile</h3>
            <p className="text-gray-600">
              Your "Current Plan" gets highlighted on your public profile, showing followers what you're actively working on.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Common Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600">
                Your data is always safe. If you downgrade, you keep everything you created but return to Free tier limits for new additions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, cancel anytime from your account settings. You'll keep Pro features until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! Every new user gets a 14-day Pro trial. You can try all Pro features before deciding.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthCheck>
  )
}
