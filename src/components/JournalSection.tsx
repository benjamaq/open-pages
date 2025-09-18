'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Edit3 } from 'lucide-react'
import { createJournalEntry, updateJournalEntry } from '../lib/actions/journal'

interface JournalEntry {
  id: string
  profile_id: string
  heading: string | null
  body: string
  public: boolean
  created_at: string
  updated_at: string
}

interface JournalSectionProps {
  journalEntries: JournalEntry[]
  showJournalPublic: boolean
  onToggleVisibility?: (visible: boolean) => void
  isOwnProfile?: boolean
  profileId?: string
}

export default function JournalSection({ journalEntries, showJournalPublic, onToggleVisibility, isOwnProfile = false, profileId }: JournalSectionProps) {
  const [expandedJournal, setExpandedJournal] = useState(false)
  const [expandedJournalEntries, setExpandedJournalEntries] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [formData, setFormData] = useState({
    heading: '',
    body: '',
    public: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // For testing, create sample entries if none exist
  const sampleEntries = [
    {
      id: 'sample-1',
      profile_id: 'sample',
      heading: 'My Health Journey',
      body: 'Started my morning with a 20-minute meditation session followed by cold exposure therapy. The combination of breathwork and cold plunge has been transformative for my energy levels and mental clarity. Planning to track this consistently over the next 30 days to measure the impact on my overall well-being and cognitive performance.',
      public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sample-2',
      profile_id: 'sample',
      heading: 'Supplement Protocol Update',
      body: 'After 3 weeks of consistent magnesium supplementation, I\'ve noticed significant improvements in sleep quality and recovery. Switching from magnesium oxide to magnesium glycinate made a noticeable difference. Planning to add zinc and vitamin D3 to the evening routine.',
      public: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sample-3',
      profile_id: 'sample',
      heading: null,
      body: 'Quick reflection on today\'s workout: Felt strong during the deadlifts, but noticed some fatigue in the final set. Might need to adjust my pre-workout nutrition timing.',
      public: true,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    }
  ]

  const displayEntries = journalEntries.length > 0 ? journalEntries : sampleEntries
  
  // Always show journal module for demo purposes
  // if (journalEntries.length === 0 || !showJournalPublic) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.body.trim()) {
      setError('Journal entry is required.')
      setIsLoading(false)
      return
    }

    try {
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, {
          heading: formData.heading.trim() || null,
          body: formData.body.trim(),
          public: formData.public
        })
      } else {
        if (!profileId) {
          throw new Error('Profile ID is required to create journal entry')
        }
        await createJournalEntry({
          profile_id: profileId,
          heading: formData.heading.trim() || null,
          body: formData.body.trim(),
          public: formData.public
        })
      }
      
      setFormData({ heading: '', body: '', public: true })
      setShowAddForm(false)
      setEditingEntry(null)
      // Refresh would happen here in real implementation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setFormData({
      heading: entry.heading || '',
      body: entry.body,
      public: entry.public
    })
    setShowAddForm(true)
  }

  const cancelEdit = () => {
    setEditingEntry(null)
    setFormData({ heading: '', body: '', public: true })
    setShowAddForm(false)
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return (lastSpace > maxLength * 0.8 ? truncated.slice(0, lastSpace) : truncated).trim() + '...'
  }

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedJournalEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

    const mostRecentEntry = displayEntries[0]
    const olderEntries = displayEntries.slice(1, 5) // Show up to 4 older entries

  return (
    <section className="mb-8">
      <div 
        className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
        style={{ 
          borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>📝 Journal</h2>
          <div className="flex items-center space-x-2">
            {/* Add Entry Button - Only show for profile owner */}
            {isOwnProfile && (
              <button
                onClick={() => setShowAddForm(true)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Add journal entry"
                title="Add new journal entry"
              >
                <Plus className="w-4 h-4" style={{ color: '#5C6370' }} />
              </button>
            )}

            {/* Visibility Toggle - Only show for profile owner */}
            {isOwnProfile && onToggleVisibility && (
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-xs text-gray-500">Public</span>
                <button
                  onClick={() => onToggleVisibility(!showJournalPublic)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showJournalPublic ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      showJournalPublic ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
            
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setExpandedJournal(!expandedJournal)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={expandedJournal ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedJournal ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!expandedJournal ? (
          /* Collapsed State - Show preview of most recent entry */
          mostRecentEntry && (
            <div className="px-6 pb-6">
              <div className="text-xs text-gray-500 mb-2">
                {formatDate(mostRecentEntry.created_at)}
              </div>
              {mostRecentEntry.heading && (
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{mostRecentEntry.heading}</h3>
              )}
              <div className="relative">
                <div className="text-gray-700 text-sm leading-relaxed">
                  {truncateText(mostRecentEntry.body, 180)}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>
            </div>
          )
        ) : (
          /* Expanded State - Show all entries */
          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {displayEntries.map((entry, index) => (
                <div key={entry.id} className={`${index > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.created_at)}
                    </div>
                    {isOwnProfile && !entry.id.startsWith('sample') && (
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {entry.heading && (
                    <h3 className="font-semibold text-gray-900 mb-2">{entry.heading}</h3>
                  )}
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.body}
                  </div>
                </div>
              ))}
              
              {displayEntries.length > 10 && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <button className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors">
                    Load more entries →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Journal Entry Form */}
        {showAddForm && isOwnProfile && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading (optional)
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Entry title..."
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal Entry
                </label>
                <textarea
                  rows={6}
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="What's on your mind today..."
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Visibility</span>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${!formData.public ? 'text-gray-900' : 'text-gray-400'}`}>
                      Private
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, public: !prev.public }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        formData.public ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          formData.public ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${formData.public ? 'text-gray-900' : 'text-gray-400'}`}>
                      Public
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
