import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-12 w-auto"
                />
              </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Product</Link>
              <Link href="#examples" className="text-gray-600 hover:text-gray-900 transition-colors">Examples</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Create your stack
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Build your health stack.<br />
                <span className="text-gray-600">Share what works.</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Create a clean, professional profile for your biohacking routine. Track supplements, protocols, movement, mindfulness—and share a beautiful public page people can follow or copy.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/signup" 
                  className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
                >
                  Create your stack
                </Link>
                <Link 
                  href="/u/benjamaq-550507?public=true" 
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  View example profile
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <p className="text-sm text-gray-500 mb-4">Screenshot placeholder</p>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-medium text-gray-900">Benjamin's Health Stack</p>
                  <p className="text-sm text-gray-600 mt-1">Energy 8/10 • Mediterranean • 19 supplements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Switch */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Why people switch</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Spreadsheets Problem */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-red-600 mb-4">Spreadsheets aren't it.</h3>
              <ul className="text-left space-y-3 text-gray-600">
                <li>• Many people can't (or won't) use them</li>
                <li>• They're ugly, time-consuming, and easy to break</li>
                <li>• Not a joy to update—so they get abandoned</li>
              </ul>
            </div>

            {/* Too Many Parts Problem */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-red-600 mb-4">Too many moving parts.</h3>
              <ul className="text-left space-y-3 text-gray-600">
                <li>• 20+ supplements, doses, and timing windows</li>
                <li>• Gym, movement, mindfulness, recovery protocols</li>
                <li>• Lab PDFs, training plans—scattered in email</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The BioStackr Way */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">The BioStackr way</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">One place, one plan.</h3>
                <p className="text-gray-600">Your stack, your files, your gear—organized and searchable.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Daily checklist.</h3>
                <p className="text-gray-600">Morning/Midday/Evening supplements, movement, mindfulness, protocols—check off as you go.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Today digest.</h3>
                <p className="text-gray-600">Get a morning summary with what's on deck (push/email/PWA).</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Library.</h3>
                <p className="text-gray-600">Keep labs, doctor notes, and training plans in one place; feature your Current Plan.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Public profile.</h3>
                <p className="text-gray-600">Share a clean link; people can Follow this stack or Copy this stack.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Optional sharing.</h3>
                <p className="text-gray-600">Post a daily check-in card to socials—only if you want to.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Today" Digest Example */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">"Today" digest</h2>
            <p className="text-xl text-gray-600">Concrete example</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Good morning!</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">2:00 pm</span>
                  <span className="font-medium">Gym (Pull day)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">5:00 pm</span>
                  <span className="font-medium">Mindfulness (Breathwork, 10 min)</span>
                </div>
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-900 mb-2">Supplements (AM):</p>
                  <p className="text-gray-600">EPA 1000 mg, Magnesium Glycinate 360 mg, Folate 800 mcg</p>
                </div>
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-900 mb-2">Protocol:</p>
                  <p className="text-gray-600">Ice bath tonight (3 min)</p>
                </div>
                <div className="border-t pt-3 text-center">
                  <span className="text-gray-900 font-medium">Tap to check off as you go → ✅</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                (Delivered via mobile PWA push or email; adjustable in Settings.)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Public Profiles</h3>
              <p className="text-gray-600 text-sm">
                A clean URL that showcases your stack, plan, and gear. People can follow or copy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stack Management</h3>
              <p className="text-gray-600 text-sm">
                Doses, schedules, brands, and adherence—Morning/Midday/Evening with one-tap checkoffs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Library & Files</h3>
              <p className="text-gray-600 text-sm">
                Upload labs, doctor notes, training plans, PDFs. Pin a Current Plan to your public page.
              </p>
            </div>

        <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Gear Module</h3>
              <p className="text-gray-600 text-sm">
                Wearables and recovery tools, notes, and (on Creator) optional buy links with disclosure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create your stack</h3>
                <p className="text-gray-600">Add supplements, protocols, movement, mindfulness, gear.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Check in daily</h3>
                <p className="text-gray-600">Quick mood/energy; check off your routine.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share when ready</h3>
                <p className="text-gray-600">Publish your page so others can Follow or Copy your stack.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/auth/signup" 
              className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create your stack
            </Link>
          </div>
        </div>
      </section>

      {/* For Coaches & Creators */}
      <section className="py-16 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built for coaches & creators</h2>
          <div className="grid md:grid-cols-2 gap-8 text-white/90">
            <div>
              <p>• Link-in-bio profile people can follow or copy</p>
              <p>• Feature your Current Plan and gear</p>
              <p>• Optional affiliate links (with disclosure) on the Creator plan</p>
            </div>
            <div>
              <p>• Post updates once—everyone sees the latest version</p>
              <p>• Analytics on follows and engagement</p>
              <p>• Creator support & profile enhancements</p>
            </div>
          </div>
          <Link 
            href="#pricing" 
            className="inline-block mt-8 bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            See Creator features →
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you're ready to unlock your full potential.</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Free</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">Perfect for getting started</p>
              </div>
              <div className="mt-8">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">10 supplements</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">3 protocols</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">5 file uploads</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Public profile</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link 
                  href="/auth/signup" 
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                  <span>Pro</span>
                  <span className="text-yellow-500">⚡</span>
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For serious health optimizers</p>
              </div>
              <div className="mt-8">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Everything in Free</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Unlimited everything</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Featured Current Plan</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link 
                  href="/pricing"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Upgrade to Pro
                </Link>
              </div>
          </div>
          
            {/* Creator Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                  <span>Creator</span>
                  <span className="text-purple-500">🎨</span>
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$29.95</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For coaches & creators</p>
              </div>
              <div className="mt-8">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Everything in Pro</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Affiliate links & buy buttons</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Shop My Gear page</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Custom branding</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link 
                  href="/pricing"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Upgrade to Creator
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              View detailed pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to stop wrestling spreadsheets?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your stack in minutes and share a link people can follow or copy.
          </p>
          <Link 
            href="/auth/signup" 
            className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Create your stack
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 BioStackr. Built for the health optimization community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
