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
              <Link href="#creators" className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-purple-600 hover:to-purple-700 transition-colors">
                <span>🎨</span>
                <span>Creator?</span>
              </Link>
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
      <section className="pt-24 pb-20 lg:pt-32 lg:pb-28">
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

      {/* What's Inside */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What's inside</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to build, track, and share your complete health optimization system</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supplements</h3>
              <p className="text-gray-600 leading-relaxed">Precise doses & timing (morning / midday / evening) with daily check-offs and progress tracking.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Protocols</h3>
              <p className="text-gray-600 leading-relaxed">Sauna, cold therapy, red light, sleep routines—schedule, track, and optimize your recovery.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Movement</h3>
              <p className="text-gray-600 leading-relaxed">Gym sessions, runs, yoga—create simple plans and maintain consistent adherence.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mindfulness</h3>
              <p className="text-gray-600 leading-relaxed">Meditation, breathwork, journaling—build and maintain consistent mindfulness habits.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Library</h3>
              <p className="text-gray-600 leading-relaxed">Lab results, doctor notes, training plans & PDFs. Pin your Current Plan to feature on your public page.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gear</h3>
              <p className="text-gray-600 leading-relaxed">Wearables, recovery tools, and equipment—organize with notes, links, and recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Follow or keep it private */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Follow or keep it private</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Complete control over your privacy and sharing preferences</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Following</h3>
                  <p className="text-gray-600 leading-relaxed">Visitors can follow your stack and receive email updates when you make changes to your routine.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Granular Privacy</h3>
                  <p className="text-gray-600 leading-relaxed">Every module is toggleable—share everything, nothing, or just selected pieces. Complete control over your data.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Community</h3>
                  <p className="text-gray-600 leading-relaxed">Your public profile features a "Follow this stack" button, making it easy for others to learn from your approach.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Privacy Settings</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Supplements</span>
                    <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Protocols</span>
                    <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Library</span>
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gear</span>
                    <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Health Hub */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Health Hub</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One centralized command center for your complete health optimization journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Organized</h3>
              <p className="text-gray-600 leading-relaxed">All your routines, schedules, files, and gear in one place—no more scattered spreadsheets or forgotten protocols.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Searchable</h3>
              <p className="text-gray-600 leading-relaxed">Instantly find any supplement, protocol, or document with powerful search across your entire health library.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Always Updated</h3>
              <p className="text-gray-600 leading-relaxed">Real-time sync across all devices—your stack evolves with you, accessible anywhere, anytime.</p>
            </div>
          </div>
        </div>
      </section>



      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Get started in minutes, build your perfect routine, and share your success</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Build Your Stack</h3>
                <p className="text-gray-600 leading-relaxed">Add supplements, protocols, movement routines, mindfulness practices, and gear. Organize everything with precise timing and dosages.</p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-8 -right-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Track Daily</h3>
                <p className="text-gray-600 leading-relaxed">Quick daily check-ins for mood and energy. Check off your routine items and watch your consistency scores climb.</p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-8 -right-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                3
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Share & Inspire</h3>
                <p className="text-gray-600 leading-relaxed">Publish your profile when ready. Let others follow your stack or keep it private—complete control is yours.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            >
              <span>Start Building Your Stack</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-sm text-gray-500 mt-3">Free to start • 14-day Pro trial included</p>
          </div>
        </div>
      </section>

      {/* For Coaches & Creators */}
      <section id="creators" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">🎨</span>
              <span className="text-white/90 font-medium">Creator Features</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">For coaches & creators</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Transform your health expertise into a thriving business with professional tools and monetization features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Monetization Features</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Affiliate links & buy buttons on supplements and gear</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Dedicated "Shop My Gear" page with featured products</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Comprehensive audience insights and engagement analytics</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Branding & Customization</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Custom branding with your logo and color scheme</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Professional profile that builds trust and authority</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 leading-relaxed">Dedicated creator support and profile optimization</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="#pricing" 
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <span>Explore Creator Features</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-white/60 text-sm mt-3">Starting at $29.95/month • Full creator toolkit included</p>
          </div>
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
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Up to 10 supplements</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Up to 3 protocols</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">2 movement items</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">2 mindfulness items</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">5 library files (10 MB each)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Public profile with followers</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Daily Check-in & progress tracking</span>
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
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium">
                  BioStacker Recommends
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For serious health optimizers</p>
              </div>
              <div className="mt-8">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Everything in Free</span>
                  </li>
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
                  href="/upgrade/pro"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Upgrade to Pro
                </Link>
                <p className="text-xs text-gray-500 text-center mt-2">
                  14-day trial included • Save with annual
                </p>
              </div>
          </div>
          
            {/* Creator Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Creator</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$29.95</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For coaches & creators</p>
              </div>
              <div className="mt-8">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Everything in Pro</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Affiliate links & buy buttons on supplements and gear</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Shop My Gear page</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Custom branding (logo & colors)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Audience insights (followers, clicks)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Creator support</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link 
                  href="/upgrade/creator"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Upgrade to Creator
                </Link>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Turn your stack into a shareable business hub
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Why this beats spreadsheets */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why this beats spreadsheets</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Stop wrestling with scattered files and complex tracking systems</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Too Many Moving Parts</h3>
                    <p className="text-gray-600 leading-relaxed">Supplements, timing windows, workouts, mindfulness, protocols, lab results—juggling everything across multiple spreadsheets and apps creates chaos, not clarity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Files Everywhere</h3>
                    <p className="text-gray-600 leading-relaxed">Lab results buried in email, training plans lost in folders, supplement research scattered across bookmarks—finding what you need becomes a daily treasure hunt.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Clear "Today"</h3>
                    <p className="text-gray-600 leading-relaxed">Without a unified daily view, important protocols get skipped, supplements are forgotten, and consistency—the key to results—falls apart.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
                </div>
                <h3 className="text-2xl font-bold">BioStackr Solution</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/90 leading-relaxed"><strong>One unified dashboard</strong> for everything—no more app-switching or lost files</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/90 leading-relaxed"><strong>Smart daily list</strong> that tells you exactly what to take and when</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/90 leading-relaxed"><strong>Progress tracking</strong> that actually motivates you to stick with it</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/90 leading-relaxed"><strong>Searchable library</strong> where everything important is instantly findable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">🚀</span>
              <span className="text-white/90 font-medium">Ready to Transform Your Health Journey?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to make it effortless?
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Join thousands of health optimizers who've simplified their routines and achieved better results. 
              Create your stack in minutes and share your success—only if you want.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Setup in Minutes</h3>
              <p className="text-white/70 text-sm">Get your complete health stack organized and ready to track in under 10 minutes</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Track Everything</h3>
              <p className="text-white/70 text-sm">From supplements to protocols, movement to mindfulness—all in one place</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Share & Inspire</h3>
              <p className="text-white/70 text-sm">Help others on their health journey or keep it private—your choice</p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Start Your Free Trial</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/examples" 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-lg font-medium"
              >
                <span>See Examples First</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>14-day Pro trial included</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
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
