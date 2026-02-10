'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Edit3, Trash2 } from 'lucide-react'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../lib/actions/journal'

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
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [formData, setFormData] = useState({
    heading: '',
    body: '',
    public: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use actual journal entries only
  const displayEntries = journalEntries
  
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
          heading: formData.heading.trim() || undefined,
          body: formData.body.trim(),
          public: formData.public
        })
      } else {
        if (!profileId) {
          throw new Error('Profile ID is required to create journal entry')
        }
        await createJournalEntry({
          profile_id: profileId,
          heading: formData.heading.trim() || undefined,
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

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await deleteJournalEntry(entryId)
      // The page will revalidate automatically due to revalidatePath in the action
    } catch (err) {
      console.error('Error deleting journal entry:', err)
      setError('Failed to delete journal entry. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  // Set the first entry as selected by default when expanded
  const mostRecentEntry = displayEntries[0]
  const selectedEntry = selectedEntryId ? displayEntries.find(entry => entry.id === selectedEntryId) : mostRecentEntry

  // Auto-select first entry when expanding
  const handleExpand = () => {
    setExpandedJournal(true)
    if (displayEntries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(displayEntries[0].id)
    }
  }

  return (
    <section className="mb-8">
      <div 
        className="bg-white border shadow-sm transition-all duration-200"
        style={{ 
          borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          borderColor: '#800020'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Journal & Notes</h2>
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
              onClick={expandedJournal ? () => setExpandedJournal(false) : handleExpand}
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
          /* Expanded State - Show tabbed interface */
          <div className="px-6 pb-6">
            {displayEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Put your first journal entry here. Talk about your health journey, supplement experiences, workout reflections, or any insights you want to share.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Entry List/Tabs */}
                <div className="border-b border-gray-200">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Journal Entries</h4>
                    <p className="text-xs text-gray-500">Click on an entry to view its full content</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {displayEntries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          selectedEntryId === entry.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium">
                            {entry.heading || 'Untitled Entry'}
                          </div>
                          <div className="text-xs opacity-75">
                            {formatDate(entry.created_at)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Entry Content */}
                {selectedEntry && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-500">
                        {formatDate(selectedEntry.created_at)}
                      </div>
                      {isOwnProfile && !selectedEntry.id.startsWith('sample') && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(selectedEntry)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Edit entry"
                          >
                            <Edit3 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(selectedEntry.id)}
                            disabled={isLoading}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {selectedEntry.heading && (
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                        {selectedEntry.heading}
                      </h3>
                    )}
                    
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.body}
                    </div>
                  </div>
                )}
              </div>
            )}
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

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save'}
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
