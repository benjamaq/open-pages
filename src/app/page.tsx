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
              <Link href="/examples" className="text-gray-600 hover:text-gray-900 transition-colors">Examples</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="#creators" className="text-gray-600 hover:text-gray-900 transition-colors">Creators?</Link>
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

      {/* Creator Badge */}
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <span className="text-sm">🎨</span>
            <Link href="#creators" className="ml-2 text-sm font-medium hover:underline">
              Creator? Turn your stack into a business →
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Build your stack. Share what works.
          </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Less chaos, more consistency. One place for your supplements, protocols, movement, mindfulness, gear and labs—with a clear Today list so it actually gets done. When you're ready, publish a beautiful profile people can follow.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/signup" 
                  className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
                >
                  Create your stack
                </Link>
                <Link 
                  href="/examples" 
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  See examples of stacks
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-4 text-sm text-gray-600">BioStackr Dashboard</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Today's Progress</span>
                      <span className="text-sm text-gray-600">68% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-900 h-2 rounded-full" style={{width: '68%'}}></div>
                    </div>
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-900">Morning supplements (3/3)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-900">Gym session - Pull day</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        <span className="text-sm text-gray-900">Evening supplements (0/3)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        <span className="text-sm text-gray-900">Ice bath protocol</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A day with BioStackr */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">A day with BioStackr</h2>
          
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Timeline */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">7:00am</span>
                  <div>
                    <p className="text-lg text-gray-900">Your daily reminder email lands: today's supplements, gym at 2, breathwork at 5, tonight's protocol—simple and clear.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">9:00am</span>
                  <div>
                    <p className="text-lg text-gray-900">Daily Check-in: set your energy & mood, pull in sleep and recovery from wearables (optional), add a note. We generate a clean share card—post directly to your socials, or save it for later. Your profile updates automatically.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">Mid-morning</span>
                  <div>
                    <p className="text-lg text-gray-900">New supplement arrived? Add it to your stack in seconds—name, dose, timing, brand.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">2:00pm</span>
                  <div>
                    <p className="text-lg text-gray-900">Gym reminder. Meeting a friend? Share your stack link so they can see what you're doing.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">All day</span>
                  <div>
                    <p className="text-lg text-gray-900">Check things off. Watch progress climb (12% → 42% → 100%). Feels good.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Digest */}
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-6">Today's digest</h3>
                
                {/* Supplements Section */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Supplements</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Morning</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">3 items</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• EPA 1000 mg</p>
                        <p>• Magnesium Glycinate 360 mg</p>
                        <p>• Folate 800 mcg</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Midday</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">2 items</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Vitamin D3 5000 IU</p>
                        <p>• B-Complex</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Evening</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">3 items</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Zinc 15 mg</p>
                        <p>• Melatonin 3 mg</p>
                        <p>• Probiotics</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Protocols Section */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Protocols</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Ice bath</span>
                      <span className="text-xs text-gray-500">8:30 PM • 3 min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Red light therapy</span>
                      <span className="text-xs text-gray-500">9:00 PM • 20 min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Sleep routine</span>
                      <span className="text-xs text-gray-500">9:30 PM</span>
                    </div>
                  </div>
                </div>
                
                {/* Movement Section */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Movement & Mindfulness</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Morning walk</span>
                      <span className="text-xs text-gray-500">7:30 AM • 6,000 steps</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Gym session</span>
                      <span className="text-xs text-gray-500">2:00 PM • Pull day</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Breathwork</span>
                      <span className="text-xs text-gray-500">5:00 PM • 10 min</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 text-center">
                  <span className="text-gray-900 font-medium text-sm">Tap to check off as you go → ✅</span>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Delivered via mobile PWA push or email
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The BioStackr Way */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What's inside</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Supplements</h3>
                <p className="text-lg text-gray-600">Doses & timing (morning / midday / evening) with daily check-offs.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Protocols</h3>
                <p className="text-lg text-gray-600">Sauna, cold, red light, sleep routine—schedule and track.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Movement</h3>
                <p className="text-lg text-gray-600">Gym, run, yoga—simple plans and adherence.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mindfulness</h3>
                <p className="text-lg text-gray-600">Meditation, breathwork, journaling—keep the habit consistent.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Library</h3>
                <p className="text-lg text-gray-600">Labs, doctor notes, training plans & PDFs. Pin a Current Plan to feature on your public page.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-gray-900 font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Gear</h3>
                <p className="text-lg text-gray-600">Wearables & recovery tools; keep notes and links.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Follow or keep it private */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Follow or keep it private</h2>
          <p className="text-lg text-gray-600 mb-8">
            Visitors can follow your stack and get an email when you change something.
          </p>
          <p className="text-lg text-gray-600">
            Every module is toggleable—share everything, nothing, or just a few pieces.<br />
            <span className="text-sm text-gray-500">(On your public page, the button reads "Follow this stack.")</span>
          </p>
        </div>
      </section>

      {/* Your Health Hub */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Health Hub</h2>
          <p className="text-lg text-gray-600">
            One source of truth for your routine and records—stack, schedules, files, and gear—organized, searchable, and always up to date.
          </p>
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
                <p className="text-lg text-gray-600">Add supplements, protocols, movement, mindfulness, gear.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Check in daily</h3>
                <p className="text-lg text-gray-600">Quick mood/energy; check off your routine.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share when ready</h3>
                <p className="text-lg text-gray-600">Publish your page so others can Follow or Copy your stack.</p>
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
      <section id="creators" className="py-16 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">For coaches & creators</h2>
          <p className="text-lg text-white/90 mb-8">
            Turn your expertise into income with affiliate links, custom branding, and monetization tools.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 text-white/90 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Monetization Features</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Affiliate links & buy buttons on supplements and gear</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Shop My Gear page with featured products</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Audience insights (followers, clicks, engagement)</span>
                </div>
          </div>
        </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Branding & Customization</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Custom branding (logo & colors) on your public profile</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Professional profile that builds trust with followers</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 text-white mt-0.5 flex-shrink-0">✓</span>
                  <span>Creator support & profile enhancements</span>
                </div>
              </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose your plan. Build your stack.</h2>
            <p className="text-xl text-gray-600">Start free. Go unlimited when you're ready.</p>
            <p className="text-sm text-gray-500 mt-2">14-day Pro trial included • Cancel anytime • Your data stays yours</p>
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
                  BioStacker Recommends
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                  <span>Pro</span>
                  <span className="text-gray-600">⚡</span>
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
                  <span className="text-gray-600">🎨</span>
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

      {/* Why this beats spreadsheets */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why this beats spreadsheets</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Too many moving parts.</h3>
              <p className="text-lg text-gray-600">Supplements, timing windows, workouts, mindfulness, protocols… it's a lot to juggle.</p>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Files everywhere.</h3>
              <p className="text-lg text-gray-600">Labs and plans buried in email and folders.</p>
          </div>
          
          <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No clear today.</h3>
              <p className="text-lg text-gray-600">BioStackr gives you one list, reminders, and progress—so it actually sticks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to make it effortless?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your stack in minutes and share a link people can follow—only if you want.
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
