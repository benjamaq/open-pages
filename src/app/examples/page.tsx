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

        {/* Examples Grid */}
        <div className="mt-16 space-y-16">
          
          {/* Example 1: Supplement Stack */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
                Supplement Management
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Organize your entire supplement routine
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Manage all your supplements in one place with precise dosages, custom timing, and detailed tracking. Check off items as you take them throughout the day.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom dosages and timing</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Daily progress tracking</span>
                  </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Notes and observations</span>
                </div>
              </div>
            </div>
            
            {/* Supplement Dashboard Mockup */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Today's Supplements</h3>
                  <span className="text-sm text-gray-500">March 15, 2024</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" checked className="w-5 h-5 text-green-600 rounded border-gray-300" readOnly />
                      <div>
                        <p className="font-medium text-gray-900">Creatine Monohydrate</p>
                        <p className="text-sm text-gray-600">5g • Morning with water</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">✓ Done</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" checked className="w-5 h-5 text-green-600 rounded border-gray-300" readOnly />
                      <div>
                        <p className="font-medium text-gray-900">Vitamin D3</p>
                        <p className="text-sm text-gray-600">4000 IU • Morning with breakfast</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">✓ Done</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" checked className="w-5 h-5 text-green-600 rounded border-gray-300" readOnly />
                      <div>
                        <p className="font-medium text-gray-900">B-Complex</p>
                        <p className="text-sm text-gray-600">1 capsule • Morning</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">✓ Done</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300" readOnly />
              <div>
                        <p className="font-medium text-gray-900">Omega-3 EPA/DHA</p>
                        <p className="text-sm text-gray-600">2000mg • With lunch</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Pending</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300" readOnly />
              <div>
                        <p className="font-medium text-gray-900">Zinc Picolinate</p>
                        <p className="text-sm text-gray-600">15mg • With lunch</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Pending</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="w-5 h-5 text-gray-400 rounded border-gray-300" readOnly />
                      <div>
                        <p className="font-medium text-gray-900">Magnesium Glycinate</p>
                        <p className="text-sm text-gray-600">400mg • Before bed</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Tonight</span>
                  </div>
                  
                  <div className="text-center py-2 border-t border-gray-200">
                    <button className="text-sm text-gray-600 hover:text-gray-800">
                      + Show 9 more supplements
                    </button>
                </div>
              </div>
              
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress today</span>
                    <span className="font-medium text-gray-900">3 of 15 completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '20%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example 2: Library/Files */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              {/* Library Dashboard Mockup */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Health Library</h3>
                    <button className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      + Add File
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Blood Panel - Q1 2024</p>
                          <p className="text-xs text-gray-500">Lab Results • 2.1 MB • March 10</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">12-Week Training Plan</p>
                          <p className="text-xs text-gray-500">Workout Plan • 856 KB • March 8</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Doctor Consultation Notes</p>
                          <p className="text-xs text-gray-500">Medical Notes • 124 KB • March 5</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Meal Prep Guide</p>
                          <p className="text-xs text-gray-500">Nutrition Plan • 1.8 MB • March 3</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                </div>
              </div>
              
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Storage used</span>
                      <span className="font-medium text-gray-900">4.9 MB of 50 MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '10%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Document Library
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Store all your health documents
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Keep lab results, training plans, doctor's notes, and nutrition guides organized in one secure place. Easy upload, search, and share.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Lab results & medical reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Training plans & workout guides</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Secure cloud storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Example 3: Daily Journal */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Daily Check-in
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Track your daily progress
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Quick daily check-ins to log how you're feeling, energy levels, sleep quality, and notes about what's working.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Energy & mood tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Sleep quality & duration</span>
                  </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Personal notes & observations</span>
                </div>
              </div>
            </div>
            
            {/* Journal Dashboard Mockup */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Today's Check-in</h3>
                  <span className="text-sm text-gray-500">March 15, 2024</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`w-6 h-6 rounded-full ${i <= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">High (4/5)</span>
                    </div>
                  </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`w-6 h-6 rounded-full ${i <= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">Good (3/5)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        Great workout this morning! The new magnesium dose seems to be helping with sleep. 
                        Felt more focused during work today.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">7-day streak</span>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Save Check-in
                    </button>
                  </div>
                </div>
                  </div>
                </div>
              </div>
              
          {/* Example 4: Protocols */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              {/* Protocols Dashboard Mockup */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Health Protocols</h3>
                    <button className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      + Add Protocol
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Cold Therapy Protocol</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">2-3 minutes cold shower every morning for improved circulation and mental resilience</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Started: March 1, 2024</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">14 day streak</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Intermittent Fasting 16:8</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Eating window: 12pm - 8pm. Focus on nutrient-dense whole foods</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Started: February 15, 2024</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">28 day streak</span>
                  </div>
                </div>
              </div>
              
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Sleep Optimization</h4>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Blue light blocking 2hrs before bed, room temp 65-68°F, magnesium supplement</p>
                <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Started: March 5, 2024</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">10 day streak</span>
                        </div>
                      </div>
                    </div>
                </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Health Protocols
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Build consistent health protocols
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Create and track structured health protocols like cold therapy, intermittent fasting, or sleep optimization. Monitor your progress and build lasting habits.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom protocol templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Streak tracking & progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Detailed notes & observations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Example 5: Mindfulness */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Mindfulness & Recovery
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Track mindfulness and recovery practices
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Organize your meditation, breathwork, and recovery routines. Set reminders and track your mental wellness journey alongside your physical health.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Meditation & breathwork sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Recovery & stress management</span>
                  </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom reminders & scheduling</span>
                </div>
              </div>
            </div>
            
            {/* Mindfulness Dashboard Mockup */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Today's Mindfulness</h3>
                  <span className="text-sm text-gray-500">March 15, 2024</span>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked className="w-5 h-5 text-green-600 rounded border-gray-300" readOnly />
                        <h4 className="font-medium text-gray-900">Morning Meditation</h4>
                      </div>
                      <span className="text-xs text-green-600 font-medium">✓ Done</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">10 minutes • Headspace app • Focus on breathing</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300" readOnly />
                        <h4 className="font-medium text-gray-900">Wim Hof Breathing</h4>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Pending</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">15 minutes • 3 rounds • Before workout</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-5 h-5 text-purple-600 rounded border-gray-300" readOnly />
                        <h4 className="font-medium text-gray-900">Evening Gratitude</h4>
                      </div>
                      <span className="text-xs text-purple-600 font-medium">Tonight</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">5 minutes • Journal 3 things • Before bed</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mindfulness streak</span>
                    <span className="font-medium text-gray-900">12 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example 6: Journal */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              {/* Journal Dashboard Mockup */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Journal</h3>
                    <button className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      New Entry
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Today - March 15</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Public</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Amazing morning workout! The new magnesium routine is really helping with recovery. 
                        Feeling grateful for consistent progress this week.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Yesterday - March 14</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Public</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Cold shower protocol day 14! The mental clarity benefits are incredible. 
                        Sharing this journey with my followers has been so motivating.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">March 13</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Private</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Reflecting on sleep patterns and supplement timing. Need to experiment with 
                        taking magnesium earlier. Personal notes for optimization.
                      </p>
                </div>
              </div>
              
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Journal entries this month</span>
                      <span className="font-medium text-gray-900">15 entries</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
              
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
Journal
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Record and share your health journey
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Document your daily health insights, protocol results, and personal reflections. Share progress updates with your followers or keep entries private—your choice.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Workout results & recovery notes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Share updates with followers & friends</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Protocol insights & personal reflections</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="mt-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-20 right-16 w-1 h-1 bg-white rounded-full opacity-40"></div>
            <div className="absolute bottom-16 left-20 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
            <div className="absolute bottom-10 right-10 w-2 h-2 bg-white rounded-full opacity-30"></div>
            <div className="absolute top-32 left-1/3 w-1 h-1 bg-white rounded-full opacity-70"></div>
            <div className="absolute bottom-32 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-40"></div>
          </div>
          
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Ready to organize your<br />health journey?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Start building your personalized health stack today. Track supplements, protocols, and progress all in one beautiful interface.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth/signup" 
                className="group relative bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Create Your Stack
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              <Link 
                href="/" 
                className="text-white/90 hover:text-white px-6 py-3 text-lg font-medium hover:bg-white/10 rounded-xl transition-all duration-300 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-white/70 text-sm">
                ✨ Free to start • No credit card required • Setup in 2 minutes
              </p>
          </div>
        </div>

          {/* Floating elements for visual appeal */}
          <div className="absolute top-8 left-8 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-gray-400/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-4 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 right-12 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-1000"></div>
        </div>
      </div>
    </div>
  )
}