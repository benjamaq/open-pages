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
                className="h-12 w-auto"
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
            Real health stacks in action
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            See how biohackers, coaches, and creators organize their routines.
          </p>
        </div>

        {/* Example Profiles Grid */}
        <div className="mt-16 grid lg:grid-cols-3 gap-8">
          {/* Example 1: Biohacker */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AC</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Alex Chen</h3>
                  <p className="text-sm text-gray-600">@alex-chen-biohacker</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">32 supplements</span>
                    <span className="text-xs text-gray-500">8 protocols</span>
                    <span className="text-xs text-gray-500">5 followers</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Morning Stack (6am)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Creatine Monohydrate</span>
                    <span className="text-xs text-gray-500">5g</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Omega-3 EPA/DHA</span>
                    <span className="text-xs text-gray-500">2000mg</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Magnesium Glycinate</span>
                    <span className="text-xs text-gray-500">400mg</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Today's Protocols</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Cold plunge</span>
                    <span className="text-xs text-gray-500">3 min</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Red light therapy</span>
                    <span className="text-xs text-gray-500">20 min</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Progress today</span>
                  <span className="text-xs font-medium text-gray-700">68% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-gray-900 h-1.5 rounded-full" style={{width: '68%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <Link 
                href="/u/alex-chen-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors text-sm"
              >
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Example 2: Coach */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SM</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sarah Martinez</h3>
                  <p className="text-sm text-gray-600">@sarah-martinez-coach</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">15 supplements</span>
                    <span className="text-xs text-gray-500">6 protocols</span>
                    <span className="text-xs text-gray-500">23 followers</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Performance Stack</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Whey Protein</span>
                    <span className="text-xs text-gray-500">post-workout</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Creatine HCL</span>
                    <span className="text-xs text-gray-500">3g</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Beta-Alanine</span>
                    <span className="text-xs text-gray-500">3g</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Recovery Protocols</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Ice baths</span>
                    <span className="text-xs text-gray-500">2x/week</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Normatec compression</span>
                    <span className="text-xs text-gray-500">daily</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Progress today</span>
                  <span className="text-xs font-medium text-gray-700">92% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '92%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <Link 
                href="/u/sarah-martinez-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors text-sm"
              >
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Example 3: Creator */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">MJ</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Marcus Johnson</h3>
                  <p className="text-sm text-gray-600">@marcus-johnson-creator</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">20 supplements</span>
                    <span className="text-xs text-gray-500">5 protocols</span>
                    <span className="text-xs text-gray-500">156 followers</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Cognitive Stack</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Lion's Mane</span>
                    <span className="text-xs text-gray-500">1000mg</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Rhodiola Rosea</span>
                    <span className="text-xs text-gray-500">400mg</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">L-Theanine</span>
                    <span className="text-xs text-gray-500">200mg</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Wellness Protocols</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Meditation</span>
                    <span className="text-xs text-gray-500">20 min daily</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Breathwork</span>
                    <span className="text-xs text-gray-500">10 min daily</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Progress today</span>
                  <span className="text-xs font-medium text-gray-700">45% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <Link 
                href="/u/marcus-johnson-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors text-sm"
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to build your own?
          </h2>
          <p className="text-gray-600 mb-8">
            Create your personalized health stack and share it with the world.
          </p>
          <Link 
            href="/auth/signup" 
            className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Create Your Stack
          </Link>
        </div>
      </div>
    </div>
  )
}
