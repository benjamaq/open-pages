import Link from "next/link";
import CompoundGrid from "@/components/CompoundGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
              <div>
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-14 w-auto"
                />
              </Link>
              </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/examples" className="text-gray-600 hover:text-gray-900 transition-colors">Examples</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                href="/auth/signin" 
                className="text-gray-600 text-xs sm:text-sm hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gray-900 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Beta Badge - Positioned below nav */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-black text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-sm sm:text-lg font-bold">
              BETA
            </div>
          </div>
          
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center -mt-4 lg:-mt-8">
            <div className="lg:col-span-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Your Health Hub.
                <br />
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Organised Shareable Intentional</span>
          </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-[60ch]">
                Track supplements, protocols, training, labs—and the story behind your journey. Share your link with your coach, your doctor, your community. People can follow along and see what's working.
              </p>
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/auth/signup" 
                    className="bg-gray-900 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-black transition-colors w-full sm:w-auto text-center"
                >
                    Create your hub
                </Link>
                <Link 
                  href="/examples"
                    className="text-gray-600 hover:text-gray-900 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors border border-gray-300 hover:border-gray-400 w-full sm:w-auto text-center"
                >
                    See examples
                </Link>
                  </div>
                  
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              {/* Stack Page Preview Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    AJ
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Alex J</h3>
                    <p className="text-sm text-gray-600">Optimizing human potential through science-backed protocols</p>
                    <div className="mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">187 followers</span>
                </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-full px-3 py-1 ring-1 ring-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white cursor-pointer">Follow</span>
                      </div>
                        </div>
                    
                {/* Sections Preview */}
                <div className="space-y-3">
                  {/* Supplements */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Supplements</h4>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-medium text-gray-900">Morning</p>
                        <p>• Vitamin D3 5000 IU (Thorne) with breakfast</p>
                        <p>• Omega-3 2000mg EPA (Nordic Naturals) with fat</p>
                        </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-medium text-gray-900">Mid-day</p>
                        <p>• B-Complex (Garden of Life) with lunch</p>
                        <p>• Zinc 15mg (Thorne) with food</p>
                        </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-medium text-gray-900">Evening</p>
                        <p>• Magnesium Glycinate 400mg (KAL) before bed</p>
                        <p>• Probiotics 50B CFU (Seed) on empty stomach</p>
                        </div>
                      </div>
                    </div>
                    
                  {/* Protocols */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Protocols</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>• Ice bath (3 min daily), Red light therapy (20 min)</p>
                      <p>• Sleep optimization routine, Breathwork (10 min)</p>
                      </div>
                        </div>
                    
                  {/* Library */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Library</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                        <p>📄 Lab Results Q3 2024</p>
                        <p>📋 Training Plan - Hypertrophy</p>
                      </div>
                    </div>
                    
                  {/* Movement */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Movement</h4>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>• Strength training 4x/week (Push/Pull/Legs/Upper)</p>
                      <p>• Zone 2 cardio 3x/week, Daily walks 8k+ steps</p>
                      <p>• Mobility work, Yoga 2x/week</p>
                      </div>
                      </div>
                    </div>
                    
                {/* Footer */}
                <div className="text-xs text-gray-500 flex justify-between pt-3 border-t border-gray-100 mt-4">
                  <span>View full stack ↗</span>
                  <span>Powered by BioStackr.io</span>
                      </div>
                    </div>
                    
              {/* Caption */}
              <p className="text-xs text-gray-500 text-center mt-3">Auto-updates when the owner changes their stack.</p>
                      </div>
                      </div>
                    </div>
      </section>

      {/* Why this beats scattered files */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Problems */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                Why this beats scattered files
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Too Many Places</h3>
                  <p className="text-gray-600">
                    Supplements in Notes. Training in Sheets. Labs in email. Protocols in head. Journal in five different apps. Finding anything takes 10 minutes.
                  </p>
                      </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Can't Share Easily</h3>
                  <p className="text-gray-600">
                    Coach asks for your stack. You type it out. Doctor asks two weeks later. You type it again. Friend asks what you're taking. You give up and say 'I'll send it later.'
                  </p>
                  </div>
                  
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No Privacy Control</h3>
                  <p className="text-gray-600">
                    You want to share training with gym friends but not supplements. Want to show doctor just medical stuff. Impossible with spreadsheets or screenshots.
                  </p>
                    </div>
                    </div>
                    </div>
            
            {/* Right side - BioStackr Solution */}
            <div className="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">BioStackr Solution</h3>
              
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>One unified dashboard for everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Smart daily checklist (what to take today)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Selective sharing with granular control</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Progress journal tracks what's actually working</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Searchable library where nothing gets lost</span>
                </li>
              </ul>
                    </div>
                  </div>
                </div>
      </section>

      {/* What you can track */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Everything that matters for your health
            </h2>
              </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
            </div>
                <h3 className="text-lg font-bold text-gray-900">Supplements ✓</h3>
          </div>
              <p className="text-gray-600">Form, dose, timing, brand, notes</p>
        </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  </div>
                <h3 className="text-lg font-bold text-gray-900">Protocols ✓</h3>
                </div>
              <p className="text-gray-600">Cold plunges, breath work, fasting windows, sleep hygiene</p>
              </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  </div>
                <h3 className="text-lg font-bold text-gray-900">Training ✓</h3>
                </div>
              <p className="text-gray-600">Programs, splits, exercise selection, progression</p>
              </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  </div>
                <h3 className="text-lg font-bold text-gray-900">Labs ✓</h3>
                </div>
              <p className="text-gray-600">Upload results, track trends, share with providers</p>
              </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  </div>
                <h3 className="text-lg font-bold text-gray-900">Journal ✓</h3>
                </div>
              <p className="text-gray-600">Daily progress updates, how you feel, what's working</p>
              </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="4" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 2v4m6-4v4M9 18v4m6-4v4" />
                    <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
                  </svg>
                  </div>
                <h3 className="text-lg font-bold text-gray-900">Gear & Extras ✓</h3>
                </div>
              <p className="text-gray-600">Equipment, apps, mindfulness practices, anything else</p>
              </div>
            </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Organised, searchable, always accessible. Each category is optional. Build what matters to you. Toggle everything individually when sharing.
            </p>
                      </div>
                      </div>
      </section>

      {/* Share what matters. Hide what doesn't. */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Right side - Copy (moved to left for mobile) */}
            <div className="order-2 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Share what matters. Hide what doesn't.
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart privacy controls</h3>
              <p className="text-lg text-gray-600 mb-6">
                Your health stack is personal. Share your complete profile with your coach, just supplements with friends, or keep everything private. You control exactly what gets shared.
              </p>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Module-level controls (show/hide entire categories)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Item-level controls (show/hide individual entries)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>One link, multiple views—people see only what you allow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Change anytime—people see updates instantly</span>
                </li>
              </ul>
            </div>
            
            {/* Left side - Visual (moved to right for mobile) */}
            <div className="order-1 lg:order-1 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy Controls</h3>
              
              {/* Module-level toggles */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Supplements</span>
                      </div>
                  <span className="text-sm text-green-600 font-medium">ON</span>
                    </div>
                    
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Protocols</span>
                      </div>
                  <span className="text-sm text-green-600 font-medium">ON</span>
                      </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="font-medium text-gray-900">Movement</span>
                    </div>
                  <span className="text-sm text-gray-500 font-medium">OFF</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="font-medium text-gray-900">Labs</span>
                    </div>
                  <span className="text-sm text-gray-500 font-medium">OFF</span>
                  </div>
                </div>
                
              {/* Item-level toggle example */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">Individual items:</p>
                  <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">• Vitamin D3 5000 IU</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">• Magnesium Glycinate</span>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </section>

      {/* One hub. Multiple uses. */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              One hub. Multiple uses.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Coach</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your complete profile—supplements, training splits, protocols, labs, and progress journal. Everything they need to guide you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Doctor</h3>
              <p className="text-gray-600 leading-relaxed">
                Toggle on just labs and supplements. Toggle off training and journal. Give them medical context without the noise.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your stack with community and socials. One clean link. No screenshots, no retyping your list every time someone asks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Yourself</h3>
              <p className="text-gray-600 leading-relaxed">
                Finally, everything in one place. No more Notes app chaos, lost lab results, or forgotten training plans from three phones ago.
                </p>
            </div>
              </div>
            </div>
      </section>


      {/* Your Life Journal */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-100 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
              </div>
          
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              Your stack isn't what you take. It's the future you.
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
              Use the journal to tell your story behind the data, the metrics, and the supplements.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left side - Visual */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/50">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Today's Reflection</h3>
                    <p className="text-sm text-gray-500">March 15, 2024</p>
                </div>
              </div>

                <div className="space-y-6">
                  <div className="border-l-4 border-amber-300 pl-6 py-2">
                    <p className="text-gray-800 italic leading-relaxed text-lg">
                      "Finally hit that 225lb bench press after months of grinding. But more than the number—it's the mental shift. I stopped seeing limits and started seeing possibilities."
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Public</span>
                      <span className="text-xs text-gray-500">Training Victory</span>
              </div>
            </div>

                  <div className="border-l-4 border-gray-300 pl-6 py-2">
                    <p className="text-gray-700 italic leading-relaxed">
                      "Meditation before sunrise. The city is still quiet, and for the first time in years, so is my mind. This practice is changing everything."
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Private</span>
                      <span className="text-xs text-gray-500">Mindfulness Journey</span>
                </div>
                    </div>
                  </div>
                    </div>
              
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white shadow-xl">
                <p className="text-amber-100 leading-relaxed text-center text-lg italic">
                  "The most powerful optimization isn't in the supplements or protocols—it's in understanding yourself, celebrating your growth, and sharing that journey with others."
                </p>
                  </div>
                    </div>
            
            {/* Right side - Copy */}
            <div className="space-y-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  Write your story
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed mb-8 font-light">
                  This isn't just about tracking—it's about understanding yourself. 
                  Every entry captures a moment in your journey.
            </p>
          </div>

              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-2 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Document your victories</h4>
                    <p className="text-gray-700 leading-relaxed text-lg">Celebrate every breakthrough—that new PR, the meditation streak, the morning routine that finally clicked. These moments define who you're becoming.</p>
                  </div>
            </div>

                <div className="flex items-start gap-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-2 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Track your training history</h4>
                    <p className="text-gray-700 leading-relaxed text-lg">From first steps to personal records, document your physical journey. Every rep, every run, every moment of pushing past your limits.</p>
            </div>
            </div>

                <div className="flex items-start gap-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-2 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Share your journey with followers</h4>
                    <p className="text-gray-700 leading-relaxed text-lg">Once you've documented your progress, share your journal entries with the people following your health hub. Let them see your growth, learn from your experiences, and celebrate your wins together.</p>
            </div>
              </div>
            </div>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Modular design—one module for everything. Keep it simple, keep it clear.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create</h3>
                <p className="text-gray-600 leading-relaxed">Add what you're taking, doing, and tracking. Supplements, training programs, labs, protocols, journal entries. Everything in one organized hub.</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Control</h3>
                <p className="text-gray-600 leading-relaxed">Toggle privacy at module or item level. Share your link knowing people will only see what you've made visible to them.</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                3
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Share & Update</h3>
                <p className="text-gray-600 leading-relaxed">Send your link. When you update anything, the link stays current. People following your page get notified of changes (optional).</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-black transition-colors shadow-lg"
            >
              <span>Start building your stack</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-sm text-gray-500 mt-3">Free to start • Upgrade when ready</p>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Is my data private?</h3>
              <p className="text-gray-600">
                Yes. Everything is private by default. You manually choose what to publish. You can unpublish or delete anything anytime.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Can I use this just for personal tracking?</h3>
              <p className="text-gray-600">
                Absolutely. Many users never publish anything. It's a great personal health dashboard even if you never share.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">How do I get feedback on my stack?</h3>
              <p className="text-gray-600">
                Share your link on Reddit, Discord, or with friends to get feedback. People can follow your page to get email updates when you make changes, keeping them in the loop on your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose your plan. Build your stack.</h2>
            <p className="text-xl text-gray-600">Start free. Go unlimited when you're ready.</p>
            <p className="text-sm text-gray-500 mt-2">Cancel anytime • Your data stays yours</p>
        </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Free</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">Perfect for getting started</p>
              </div>
              <div className="mt-8 flex-grow">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Up to 20 stack items (supplements, protocols, movement, mindfulness)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">5 library files (10 MB each)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">Stack page with followers</span>
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
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Get started
                </Link>
                <div className="h-6"></div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-900 p-8 relative flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                  Recommended
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
              <div className="mt-8 flex-grow">
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
                    <span className="text-gray-700">Featured Current Plan on stack page</span>
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
                  href="/pricing/pro"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Get Started with Pro
                </Link>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Save with annual billing
                </p>
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
          <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
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
              Publish in minutes and share your success—only if you want.
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
              <p className="text-white/70 text-sm">Get your complete health stack organized and ready to publish in minutes</p>
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
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Create your stack
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
            <p>&copy; 2024 BioStackr. Built for people who believe health is a craft.</p>
            <div className="mt-4">
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
