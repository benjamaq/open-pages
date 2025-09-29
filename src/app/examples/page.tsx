'use client'

import Link from 'next/link'

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-14 w-auto"
              />
            </Link>
            <Link 
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            See BioStackr in action
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            See how health optimizers organize their routines with BioStackr's powerful features.
          </p>
        </div>

        {/* Supplement Management */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Supplement Management</h2>
            <h3 className="text-xl text-gray-700 mb-6">Organize your entire supplement routine</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Manage all your supplements in one place with precise dosages, custom timing, and detailed tracking. Check off items as you take them throughout the day.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Today's Supplements</h4>
              <span className="text-sm text-gray-500">March 15, 2024</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Creatine Monohydrate</h5>
                  <p className="text-sm text-gray-600">5g • Morning with water</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Done</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Vitamin D3</h5>
                  <p className="text-sm text-gray-600">4000 IU • Morning with breakfast</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Done</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">B-Complex</h5>
                  <p className="text-sm text-gray-600">1 capsule • Morning</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Done</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Omega-3 EPA/DHA</h5>
                  <p className="text-sm text-gray-600">2000mg • With lunch</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Pending</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Zinc Picolinate</h5>
                  <p className="text-sm text-gray-600">15mg • With lunch</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Pending</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Magnesium Glycinate</h5>
                  <p className="text-sm text-gray-600">400mg • Before bed</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-sm">Tonight</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button className="text-sm text-gray-600 hover:text-gray-900">+ Show 9 more supplements</button>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Progress today</span> 3 of 15 completed
              </div>
            </div>
          </div>
        </section>

        {/* Health Library */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Document Library</h2>
            <h3 className="text-xl text-gray-700 mb-6">Store all your health documents</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Keep lab results, training plans, doctor's notes, and nutrition guides organized in one secure place. Easy upload, search, and share.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Health Library</h4>
              <button className="text-sm text-gray-600 hover:text-gray-900">+ Add File</button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Blood Panel - Q1 2024</h5>
                    <p className="text-sm text-gray-600">Lab Results • 2.1 MB • March 10</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">12-Week Training Plan</h5>
                    <p className="text-sm text-gray-600">Workout Plan • 856 KB • March 8</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Doctor Consultation Notes</h5>
                    <p className="text-sm text-gray-600">Medical Notes • 124 KB • March 5</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Meal Prep Guide</h5>
                    <p className="text-sm text-gray-600">Nutrition Plan • 1.8 MB • March 3</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Storage used</span>
                <span>4.9 MB of 50 MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Check-in */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Daily Check-in</h2>
            <h3 className="text-xl text-gray-700 mb-6">Track your daily progress</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Quick daily check-ins to log how you're feeling, energy levels, sleep quality, and notes about what's working.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Today's Check-in</h4>
              <span className="text-sm text-gray-500">March 15, 2024</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          level <= 4
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'border-gray-300 text-gray-400'
                        }`}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">High (4/5)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          level <= 3
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'border-gray-300 text-gray-400'
                        }`}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Good (3/5)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">
                    Great workout this morning! The new magnesium dose seems to be helping with sleep. Felt more focused during work today.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">7-day streak</span>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
                  Save Check-in
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Health Protocols */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Health Protocols</h2>
            <h3 className="text-xl text-gray-700 mb-6">Build consistent health protocols</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Create and track structured health protocols like cold therapy, intermittent fasting, or sleep optimization. Monitor your progress and build lasting habits.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Health Protocols</h4>
              <button className="text-sm text-gray-600 hover:text-gray-900">+ Add Protocol</button>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-semibold text-gray-900">Cold Therapy Protocol</h5>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-gray-600 mb-4">
                  2-3 minutes cold shower every morning for improved circulation and mental resilience
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Started: March 1, 2024</span>
                  <span>14 day streak</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-semibold text-gray-900">Intermittent Fasting 16:8</h5>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Eating window: 12pm - 8pm. Focus on nutrient-dense whole foods
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Started: February 15, 2024</span>
                  <span>28 day streak</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-semibold text-gray-900">Sleep Optimization</h5>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Blue light blocking 2hrs before bed, room temp 65-68°F, magnesium supplement
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Started: March 5, 2024</span>
                  <span>10 day streak</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mindfulness & Recovery */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mindfulness & Recovery</h2>
            <h3 className="text-xl text-gray-700 mb-6">Track mindfulness and recovery practices</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Organize your meditation, breathwork, and recovery routines. Set reminders and track your mental wellness journey alongside your physical health.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Today's Mindfulness</h4>
              <span className="text-sm text-gray-500">March 15, 2024</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Morning Meditation</h5>
                  <p className="text-sm text-gray-600">10 minutes • Headspace app • Focus on breathing</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Done</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Wim Hof Breathing</h5>
                  <p className="text-sm text-gray-600">15 minutes • 3 rounds • Before workout</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Pending</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Evening Gratitude</h5>
                  <p className="text-sm text-gray-600">5 minutes • Journal 3 things • Before bed</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-sm">Tonight</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Mindfulness streak</span>
                <span className="font-medium">12 days</span>
              </div>
            </div>
          </div>
        </section>

        {/* Journal */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Journal</h2>
            <h3 className="text-xl text-gray-700 mb-6">Record and share your health journey</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Document your daily health insights, protocol results, and personal reflections. Share progress updates with your followers or keep entries private—your choice.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Journal</h4>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
                New Entry
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Today - March 15</h5>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">Public</span>
                </div>
                <p className="text-gray-700">
                  Amazing morning workout! The new magnesium routine is really helping with recovery. Feeling grateful for consistent progress this week.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Yesterday - March 14</h5>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">Public</span>
                </div>
                <p className="text-gray-700">
                  Cold shower protocol day 14! The mental clarity benefits are incredible. Sharing this journey with my followers has been so motivating.
                </p>
              </div>

              <div className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">March 13</h5>
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">Private</span>
                </div>
                <p className="text-gray-700">
                  Reflecting on sleep patterns and supplement timing. Need to experiment with taking magnesium earlier. Personal notes for optimization.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Journal entries this month</span>
                <span className="font-medium">15 entries</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Ready to organize your<br />health journey?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Start building your personalized health stack today. Track supplements, protocols, and progress all in one beautiful interface.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth/signup" 
                className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Create Your Stack
              </Link>
              <Link 
                href="/" 
                className="text-white/90 hover:text-white px-6 py-3 text-lg font-medium hover:bg-white/10 rounded-lg transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-white/70 text-sm">
                ✨ Free to start • No credit card required • Setup in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}