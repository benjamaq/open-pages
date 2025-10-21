'use client'

import { Eye, Download } from 'lucide-react'

interface OverviewSectionProps {
  profile: any
  publicSupplements: any[]
  publicProtocols: any[]
  publicMovement: any[]
  publicMindfulness: any[]
  publicLibraryItems: any[]
  publicGear: any[]
  dailyCheckIn?: {
    energy: number
    mood: string
  }
  latestReadiness?: number | null
}

export default function OverviewSection({
  profile,
  publicSupplements,
  publicProtocols,
  publicMovement,
  publicMindfulness,
  publicLibraryItems,
  publicGear,
  dailyCheckIn,
  latestReadiness
}: OverviewSectionProps) {
  
  // Get current training plan
  const currentPlan = publicLibraryItems.find(item => 
    item.category === 'training_plan' && item.is_featured
  )

  // Get nutrition info
  const nutritionSignature = profile.nutrition_signature as any
  const eatingStyle = nutritionSignature?.eating_style

  return (
    <section id="overview" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Overview</h2>
        <p className="text-sm text-gray-600">Highlights & quick links</p>
      </div>

      <div className="space-y-6">
        {/* Today at a Glance */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Today at a Glance</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {typeof latestReadiness === 'number' && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                Readiness {latestReadiness}%
              </span>
            )}
          </div>
        </div>

        {/* Nutrition Summary */}
        {eatingStyle && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Nutrition Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Eating style: {eatingStyle}</p>
              <p>• Intermittent fasting 16:8</p>
              <p>• Never eat: seed oils, late meals</p>
            </div>
          </div>
        )}

        {/* Stack Snapshot */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Stack Snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Supplements</span>
              <span className="font-medium text-gray-900">{publicSupplements.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Protocols</span>
              <span className="font-medium text-gray-900">{publicProtocols.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Movement</span>
              <span className="font-medium text-gray-900">{publicMovement.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Mindfulness</span>
              <span className="font-medium text-gray-900">{publicMindfulness.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Library</span>
              <span className="font-medium text-gray-900">{publicLibraryItems.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Gear</span>
              <span className="font-medium text-gray-900">{publicGear.length}</span>
            </div>
          </div>
        </div>

        {/* Featured Current Plan */}
        {currentPlan && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Featured</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏋️</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-green-900">Current Training Plan</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ⭐ Featured
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{currentPlan.title}</p>
                    <p className="text-xs text-green-600">
                      {new Date(currentPlan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {currentPlan.provider && ` • ${currentPlan.provider}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`/api/library/${currentPlan.id}/preview`, '_blank')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Open Plan
                  </button>
                  {currentPlan.allow_download && (
                    <button
                      onClick={() => window.open(`/api/library/${currentPlan.id}/download`, '_blank')}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Updates */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Updates (7d)</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Added Magnesium Threonate</p>
            <p>• Pinned Training Plan</p>
            <p>• Updated morning routine</p>
          </div>
        </div>
      </div>
    </section>
  )
}
