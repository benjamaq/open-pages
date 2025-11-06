import Link from 'next/link'
import { Crown, Zap, Palette, Check, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <img 
              src="/BIOSTACKR LOGO 2.png" 
              alt="BioStackr" 
              className="h-14 w-auto"
            />
            <Link 
              href="/dash" 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Skip to Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Welcome Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to BioStackr!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your account is ready. Let's choose the perfect plan for your health journey.
          </p>
          
          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
            <Crown className="w-4 h-4" />
            🎁 14-day Pro trial included - Start with unlimited everything!
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Perfect for getting started</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">10 supplements</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">3 protocols</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">5 file uploads</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Public profile</span>
              </div>
            </div>

            <Link
              href="/dash"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Start with Free
            </Link>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-500 p-6 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Recommended
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                Pro
                <Zap className="w-5 h-5 text-yellow-500" />
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">For serious health optimizers</p>
              <div className="mt-2 text-xs text-blue-600 font-medium">
                ✨ 14-day free trial included
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Everything in Free</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Unlimited supplements</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Unlimited protocols</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Unlimited file uploads</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Priority support</span>
              </div>
            </div>

            <Link
              href="/dash"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Start 14-Day Trial
            </Link>
          </div>

          {/* Creator Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                Creator
                <Palette className="w-5 h-5 text-purple-500" />
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$29.95</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">For coaches & creators</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Everything in Pro</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Affiliate links</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Custom branding</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Shop My Gear</span>
              </div>
            </div>

            <Link
              href="/pricing"
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Not sure? Start with the <strong>14-day Pro trial</strong> and explore all features risk-free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dash"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Start Building My Stack
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              View detailed pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Questions? We're here to help. Cancel anytime, no long-term contracts.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
