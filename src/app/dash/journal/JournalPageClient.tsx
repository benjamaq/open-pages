'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry, updateProfileJournalSettings } from '../../../lib/actions/journal'

interface JournalEntry {
  id: string
  profile_id: string
  heading: string | null
  body: string
  public: boolean
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  slug: string
  display_name: string
  show_journal_public: boolean
}

interface JournalPageClientProps {
  profile: Profile
  journalEntries: JournalEntry[]
}

export default function JournalPageClient({ profile, journalEntries }: JournalPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [showJournalPublic, setShowJournalPublic] = useState(profile.show_journal_public)
  const [formData, setFormData] = useState({
    heading: '',
    body: '',
    public: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.body.trim()) {
      setError('Journal entry body is required.')
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
        await createJournalEntry({
          profile_id: profile.id,
          heading: formData.heading.trim() || null,
          body: formData.body.trim(),
          public: formData.public
        })
      }
      
      setFormData({ heading: '', body: '', public: true })
      setShowAddForm(false)
      setEditingEntry(null)
      router.refresh()
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

  const handleDelete = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await deleteJournalEntry(entryId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete entry:', error)
      }
    }
  }

  const handleTogglePublicVisibility = async (entry: JournalEntry) => {
    try {
      await updateJournalEntry(entry.id, { public: !entry.public })
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleJournalSettingsToggle = async (showPublic: boolean) => {
    try {
      await updateProfileJournalSettings(profile.id, showPublic)
      setShowJournalPublic(showPublic)
      router.refresh()
    } catch (error) {
      console.error('Failed to update journal settings:', error)
    }
  }

  const cancelEdit = () => {
    setEditingEntry(null)
    setFormData({ heading: '', body: '', public: true })
    setShowAddForm(false)
    setError(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Navigation */}
      <nav className="border-b border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/dash" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO.png" 
                  alt="Biostackr" 
                  className="h-16 w-auto"
                  style={{ width: '280px' }}
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dash" 
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </Link>
              
              <button 
                onClick={async () => {
                  const { createClient } = await import('../../../lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
                className="text-sm font-medium hover:text-gray-700 transition-colors"
                style={{ color: '#5C6370' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/dash" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <span className="text-gray-300">›</span>
            <span className="text-gray-900 font-medium">Journal</span>
          </nav>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">📝 Journal</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Journal Visibility Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Show on Public Profile</span>
              <button
                onClick={() => handleJournalSettingsToggle(!showJournalPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showJournalPublic ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showJournalPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Add Entry Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading (optional)
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Entry title..."
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal Entry
                </label>
                <textarea
                  rows={8}
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.public ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.public ? 'translate-x-6' : 'translate-x-1'
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
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Journal Entries */}
        {journalEntries.length > 0 ? (
          <div className="space-y-6">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(entry.created_at)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTogglePublicVisibility(entry)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title={entry.public ? 'Make Private' : 'Make Public'}
                    >
                      {entry.public ? (
                        <Eye className="w-4 h-4 text-gray-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {entry.heading && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{entry.heading}</h3>
                )}
                
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {entry.body}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Journal Entries yet</h3>
            <p className="text-gray-600 mb-6">Start documenting your health journey and thoughts.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              + Create First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
