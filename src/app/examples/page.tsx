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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">The Biohacker</h3>
              <p className="text-gray-600">Alex Chen - 32 supplements, 8 protocols</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Morning Stack (6am):</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Creatine Monohydrate 5g</li>
                  <li>• Omega-3 EPA/DHA 2000mg</li>
                  <li>• Magnesium Glycinate 400mg</li>
                  <li>• Vitamin D3 5000 IU</li>
                  <li>• B-Complex</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Protocols:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cold plunge (3 min, 3x/week)</li>
                  <li>• Red light therapy (20 min daily)</li>
                  <li>• Sauna (15 min, 4x/week)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Movement:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Weight training (4x/week)</li>
                  <li>• Zone 2 cardio (3x/week)</li>
                  <li>• Daily walks (10k steps)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link 
                href="/u/alex-chen-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors"
              >
                View Full Stack
              </Link>
            </div>
          </div>

          {/* Example 2: Coach */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">The Coach</h3>
              <p className="text-gray-600">Sarah Martinez - 15 supplements, 6 protocols</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Performance Stack:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Whey Protein (post-workout)</li>
                  <li>• Creatine HCL 3g</li>
                  <li>• Beta-Alanine 3g</li>
                  <li>• Citrulline Malate 6g</li>
                  <li>• Ashwagandha 600mg</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recovery Protocols:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ice baths (2x/week)</li>
                  <li>• Normatec compression</li>
                  <li>• Sleep optimization routine</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Training:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Powerlifting (5x/week)</li>
                  <li>• Mobility work (daily)</li>
                  <li>• Conditioning (2x/week)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link 
                href="/u/sarah-martinez-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors"
              >
                View Full Stack
              </Link>
            </div>
          </div>

          {/* Example 3: Creator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">The Creator</h3>
              <p className="text-gray-600">Marcus Johnson - 20 supplements, 5 protocols</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cognitive Stack:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Lion's Mane 1000mg</li>
                  <li>• Rhodiola Rosea 400mg</li>
                  <li>• L-Theanine 200mg</li>
                  <li>• Alpha-GPC 300mg</li>
                  <li>• Bacopa Monnieri 300mg</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Wellness Protocols:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Meditation (20 min daily)</li>
                  <li>• Breathwork (10 min daily)</li>
                  <li>• Digital sunset routine</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Movement:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Yoga (daily)</li>
                  <li>• Strength training (3x/week)</li>
                  <li>• Nature walks (weekends)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link 
                href="/u/marcus-johnson-example?public=true" 
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-center block hover:bg-gray-800 transition-colors"
              >
                View Full Stack
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
