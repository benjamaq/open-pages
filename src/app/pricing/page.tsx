'use client'

import Link from 'next/link'

const freeFeatures = [
  'Up to 10 supplements',
  'Up to 3 protocols',
  '2 movement items',
  '2 mindfulness items',
  '5 library files (10 MB each)',
  'Public profile with followers',
  'Daily Check-in & progress tracking'
]

const proFeatures = [
  'Everything in Free',
  'Unlimited supplements, protocols, movement, mindfulness, gear & files',
  'Featured Current Plan on public profile',
  'Priority support',
  'Enhanced progress tracking'
]

const creatorFeatures = [
  'Everything in Pro',
  'Affiliate links & buy buttons on supplements and gear',
  'Shop My Gear page',
  'Custom branding (logo & colors)',
  'Audience insights (followers, clicks)',
  'Creator support'
]

export default function PricingPage() {
  return (
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

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose your plan. Build your stack.
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Start free. Go unlimited when you're ready.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            14-day Pro trial included • Cancel anytime • Your data stays yours
          </p>
        </div>


        {/* Pricing Cards */}
        <div className="mt-16 grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                BioStacker Recommends
              </span>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <span>Pro</span>
                <span className="text-gray-600">⚡</span>
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-2 text-gray-600">For serious health optimizers</p>
            </div>

            <div className="mt-8">
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                Get Started
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">
                14-day Pro trial included • Save with annual
              </p>
            </div>
          </div>

          {/* Creator Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <span>Creator</span>
                <span className="text-gray-600">🎨</span>
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$29.95</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-2 text-gray-600">For coaches & creators</p>
            </div>

            <div className="mt-8">
              <ul className="space-y-3">
                {creatorFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link 
                href="/pricing/creator"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                Get Started with Creator
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">
                Turn your stack into a shareable business hub
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
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes. Upgrade or downgrade at any time; changes apply at the end of your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my trial?
              </h3>
              <p className="text-gray-600">
                You keep everything you created. On Free, you can use your stack with sensible limits; upgrade for unlimited.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer yearly pricing?
              </h3>
              <p className="text-gray-600">
                Yes—save 2 months with annual: Pro $99.90/yr, Creator $199.90/yr.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What's the difference between Pro and Creator?
              </h3>
              <p className="text-gray-600">
                Creator includes affiliate links & buy buttons, Shop My Gear, custom branding, and creator-focused analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Microcopy */}
        <div className="mt-16 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p className="mb-2">
            <strong>No lock-in:</strong> downgrade anytime; your data stays safe.
          </p>
          <p className="mb-2">
            <strong>Fair limits:</strong> after trial, Free limits what you can add/activate—upgrade for unlimited.
          </p>
          <p className="mb-2">
            <strong>Taxes:</strong> prices exclude VAT/GST where applicable.
          </p>
          <p>
            Need details? <Link href="/pricing" className="text-gray-900 hover:underline">View detailed limits →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
