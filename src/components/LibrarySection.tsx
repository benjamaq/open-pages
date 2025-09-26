'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Plus, Upload, BookOpen, Eye, Download } from 'lucide-react'
import { LibraryItem, getUserLibraryItems } from '../lib/actions/library'
import LibraryUploadForm from './LibraryUploadForm'

interface LibrarySectionProps {
  onAdd?: () => void
  onManage?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function LibrarySection({ 
  onAdd,
  onManage, 
  collapsed = false, 
  onToggleCollapse 
}: LibrarySectionProps) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLibraryItems()
  }, [])

  const loadLibraryItems = async () => {
    try {
      setLoading(true)
      const libraryItems = await getUserLibraryItems()
      setItems(libraryItems)
      setError(null)
    } catch (err) {
      console.error('Failed to load library items:', err)
      setError('Failed to load library items')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = (newItem: LibraryItem) => {
    setItems(prev => [newItem, ...prev])
    setShowUploadForm(false)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'lab': '🧪',
      'assessment': '📊',
      'training_plan': '🏋️',
      'nutrition': '🥗',
      'wearable_report': '⌚',
      'mindfulness': '🧘',
      'recovery': '🛌',
      'other': '📄'
    }
    return icons[category] || '📄'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'lab': 'Lab Results',
      'assessment': 'Assessment',
      'training_plan': 'Training Plan',
      'nutrition': 'Nutrition',
      'wearable_report': 'Wearable Data',
      'mindfulness': 'Mindfulness',
      'recovery': 'Recovery',
      'other': 'Other'
    }
    return labels[category] || 'Other'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const recentItems = items
  const categoryStats = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const featuredTrainingPlan = items.find(item => 
    item.category === 'training_plan' && item.is_featured
  )

  return (
    <>
      <div 
        className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
        style={{ 
          borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          maxHeight: collapsed ? '80px' : '600px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Library</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {loading ? '...' : items.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAdd && (
              <button
                onClick={onAdd}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Add to library"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            )}
            
            {onManage && (
              <button
                onClick={onManage}
                className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Manage
              </button>
            )}

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={collapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading library...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">{error}</p>
                {error.includes('Library feature not available') ? (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">
                      The Library module requires database setup. Please run the migration script:
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      database/library-schema.sql
                    </code>
                  </div>
                ) : (
                  <button
                    onClick={loadLibraryItems}
                    className="text-sm text-gray-600 hover:text-gray-900 mt-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-6">
                {/* Featured Training Plan */}
                {featuredTrainingPlan && (
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
                          <p className="text-sm text-green-700">{featuredTrainingPlan.title}</p>
                          <p className="text-xs text-green-600">
                            {formatDate(featuredTrainingPlan.date)}
                            {featuredTrainingPlan.provider && ` • ${featuredTrainingPlan.provider}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`/api/library/${featuredTrainingPlan.id}/preview`, '_blank')}
                          className="text-green-600 hover:text-green-700 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {featuredTrainingPlan.allow_download && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = `/api/library/${featuredTrainingPlan.id}/download`
                              link.download = featuredTrainingPlan.title || 'download'
                              link.target = '_blank'
                              link.rel = 'noopener noreferrer'
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="text-green-600 hover:text-green-700 p-1"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Overview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(categoryStats).map(([category, count]) => (
                      <div key={category} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">{getCategoryIcon(category)}</span>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{getCategoryLabel(category)}</p>
                          <p className="text-xs text-gray-500">{count} {count === 1 ? 'item' : 'items'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Items</h4>
                  <div className="space-y-2">
                    {recentItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm">{getCategoryIcon(item.category)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{getCategoryLabel(item.category)}</span>
                              <span>•</span>
                              <span>{formatDate(item.date)}</span>
                              {item.provider && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-20">{item.provider}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => window.open(`/api/library/${item.id}/preview`, '_blank')}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {item.allow_download && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = `/api/library/${item.id}/download`
                                link.download = item.title || 'download'
                                link.target = '_blank'
                                link.rel = 'noopener noreferrer'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                              className="text-gray-600 hover:text-gray-900 p-1"
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex flex-col items-center justify-center h-24">
                  <button
                    onClick={() => setShowUploadForm(true)}
                    className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                  >
                    Add Library Item
                  </button>
                  <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Lab results, training plans, doctor's notes—keep all your health records organized.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <LibraryUploadForm
          onClose={() => setShowUploadForm(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  )
}
