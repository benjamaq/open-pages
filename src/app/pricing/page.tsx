'use client'

import Link from 'next/link'

const freeFeatures = [
  '10 supplements',
  '3 protocols',
  '2 movement items',
  '2 mindfulness items',
  '5 file uploads (10MB)',
  'Unlimited journal entries',
  'Daily reminder emails',
  'Basic analytics'
]

const proFeatures = [
  'Unlimited supplements',
  'Unlimited protocols',
  'Unlimited movement items',
  'Unlimited mindfulness items',
  '100 file uploads (1GB)',
  'Unlimited followers',
  'Weekly digest emails',
  'Advanced analytics & trends',
  'Priority support',
  'Advanced privacy controls'
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/dash" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">Biostackr</span>
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

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Start free, upgrade when you're ready to unlock your full potential.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Free</h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-2 text-gray-600">Perfect for getting started</p>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">What's included:</h3>
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/dash"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                Current Plan
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-green-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <span>Pro</span>
                <span className="text-yellow-500">⚡</span>
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-2 text-gray-600">For serious health optimizers</p>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Everything in Free, plus:</h3>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => alert('Stripe integration coming soon! For now, this is a demo.')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Cancel anytime. No long-term contracts.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently asked questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade to Pro anytime, and downgrade at the end of your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600">
                Your data is always safe. If you exceed free limits, you'll just need to remove some items to add new ones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial for Pro?
              </h3>
              <p className="text-gray-600">
                The free plan is generous enough to try most features. Pro adds unlimited capacity and advanced features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer yearly pricing?
              </h3>
              <p className="text-gray-600">
                Yes! Annual subscribers get 2 months free ($99.90/year vs $119.88 monthly).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
