import Link from 'next/link'

const freeFeatures = [
  'Up to 12 stack items',
  '5 library files',
  'Public profile with followers',
  'Daily Check-in & progress tracking',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited items in your stack',
  'Priority support',
  'Enhanced progress tracking',
]

export default function Pricing() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Pricing</h2>
        <div className="mt-8 grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <div className="mt-4"><span className="text-4xl font-bold text-gray-900">$0</span><span className="text-gray-600">/month</span></div>
              <p className="mt-2 text-gray-600">Perfect for getting started</p>
            </div>
            <div className="mt-8">
              <ul className="space-y-3">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3"><span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span><span className="text-gray-700">{feature}</span></li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/auth/signup" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block">Find My Sleep Triggers</Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">Recommended</span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2"><span>Premium</span><span className="text-gray-600">⚡</span></h3>
              <div className="mt-4 flex items-baseline justify-center"><span className="text-4xl font-bold text-gray-900">$9.99</span><span className="text-gray-600 ml-1">/month</span></div>
              <p className="mt-2 text-gray-600">For serious sleep optimizers</p>
            </div>
            <div className="mt-8">
              <ul className="space-y-3">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3"><span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span><span className="text-gray-700">{feature}</span></li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/auth/signup?plan=premium" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block">Get started with Premium</Link>
              <p className="text-xs text-gray-500 text-center mt-2">Save with annual billing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


