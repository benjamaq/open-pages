'use client';

import { useState, useEffect } from 'react';
import { saveDailyEntry, type SaveDailyEntryInput } from '@/lib/db/mood';
import { CHIP_CATALOG, getChipsByCategory } from '@/lib/constants/chip-catalog';

type EnhancedDayDrawerV2Props = {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 'YYYY-MM-DD'
  initialData?: {
    mood?: number | null;
    energy?: number | null;
    sleep_quality?: number | null;
    pain?: number | null;
    sleep_hours?: number | null;
    night_wakes?: number | null;
    tags?: string[] | null;
    journal?: string | null;
    actions_snapshot?: any;
  } | null;
};

export default function EnhancedDayDrawerV2({ isOpen, onClose, date, initialData }: EnhancedDayDrawerV2Props) {
  const [formData, setFormData] = useState<SaveDailyEntryInput>({
    localDate: date,
    mood: null,
    sleep_quality: null,
    pain: null,
    sleep_hours: null,
    night_wakes: null,
    tags: null,
    journal: null
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [snapshotData, setSnapshotData] = useState<any>(null);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        localDate: date,
        mood: initialData.mood,
        sleep_quality: initialData.sleep_quality,
        pain: initialData.pain,
        sleep_hours: initialData.sleep_hours,
        night_wakes: initialData.night_wakes,
        tags: initialData.tags,
        journal: initialData.journal
      });
      setSelectedTags(initialData.tags || []);
      setShowAdvanced(!!(initialData.pain || initialData.sleep_hours || initialData.night_wakes));
      setSnapshotData(initialData.actions_snapshot);
    } else {
      setFormData({
        localDate: date,
        mood: null,
        sleep_quality: null,
        pain: null,
        sleep_hours: null,
        night_wakes: null,
        tags: null,
        journal: null
      });
      setSelectedTags([]);
      setShowAdvanced(false);
      setSnapshotData(null);
    }
    setSaveMessage('');
  }, [date, initialData]);

  // Load snapshot data
  useEffect(() => {
    if (isOpen && includeSnapshot) {
      loadSnapshotData();
    }
  }, [isOpen, includeSnapshot, date]);

  const loadSnapshotData = async () => {
    try {
      // This would call an API to get today's actions snapshot
      // For now, we'll simulate the data structure
      setSnapshotData({
        supplements_taken_count: 12,
        meds_taken_count: 1,
        movement_minutes: 30,
        mindfulness_minutes: 10,
        protocols_active: 2
      });
    } catch (error) {
      console.error('Error loading snapshot data:', error);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const result = await saveDailyEntry({
        ...formData,
        tags: selectedTags.length > 0 ? selectedTags : null,
        // Include snapshot data if enabled
        ...(includeSnapshot && snapshotData && {
          actions_snapshot: snapshotData
        })
      });
      
      if (result.ok) {
        setSaveMessage('✅ Check-in saved!');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setSaveMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving daily entry:', error);
      setSaveMessage('❌ Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof SaveDailyEntryInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Smart tag suggestions based on current values
  const getSuggestedTags = () => {
    const suggestions: any[] = [];
    
    if (formData.sleep_quality && formData.sleep_quality <= 3) {
      suggestions.push(...getChipsByCategory('sleep'));
    }
    
    if (formData.mood && formData.mood <= 3) {
      suggestions.push(...getChipsByCategory('stress'));
    }
    
    if (formData.pain && formData.pain >= 7) {
      suggestions.push(...getChipsByCategory('pain'));
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  };

  const suggestedTags = getSuggestedTags();
  const otherTags = CHIP_CATALOG.filter(chip => !suggestedTags.some(s => s.slug === chip.slug));

  const hasChanges = () => {
    if (!initialData) return true;
    
    return (
      formData.mood !== initialData.mood ||
      formData.sleep_quality !== initialData.sleep_quality ||
      formData.pain !== initialData.pain ||
      formData.sleep_hours !== initialData.sleep_hours ||
      formData.night_wakes !== initialData.night_wakes ||
      JSON.stringify(selectedTags) !== JSON.stringify(initialData.tags || []) ||
      formData.journal !== initialData.journal
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Daily Check-in
                </h2>
                <p className="text-sm text-gray-600">
                  {formatDate(date)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Core Metrics - 0-10 scales */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Today's Feel</h3>
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood (0-10)
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.mood || 5}
                      onChange={(e) => updateField('mood', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-500">10</span>
                    <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                      {formData.mood || 5}
                    </span>
                  </div>
                </div>

                {/* Sleep Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sleep Quality (0-10)
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.sleep_quality || 5}
                      onChange={(e) => updateField('sleep_quality', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-500">10</span>
                    <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                      {formData.sleep_quality || 5}
                    </span>
                  </div>
                </div>

                {/* Pain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain / Soreness (0-10)
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.pain || 0}
                      onChange={(e) => updateField('pain', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-red-200 via-red-400 to-red-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-500">10</span>
                    <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                      {formData.pain || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Tags */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Happened Today</h3>
              <div className="space-y-3">
                {/* Suggested tags */}
                {suggestedTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Suggested:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.slice(0, 6).map(chip => (
                        <button
                          key={chip.slug}
                          onClick={() => toggleTag(chip.slug)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedTags.includes(chip.slug)
                              ? 'bg-blue-100 border-blue-300 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip.icon} {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other tags */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">All options:</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {otherTags.slice(0, 20).map(chip => (
                      <button
                        key={chip.slug}
                        onClick={() => toggleTag(chip.slug)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedTags.includes(chip.slug)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {chip.icon} {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Snapshot */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Today's Actions Snapshot</h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSnapshot"
                    checked={includeSnapshot}
                    onChange={(e) => setIncludeSnapshot(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="includeSnapshot" className="text-sm text-gray-700">
                    Include snapshot
                  </label>
                </div>
                {includeSnapshot && snapshotData && (
                  <div className="text-sm text-gray-600">
                    {snapshotData.supplements_taken_count && `${snapshotData.supplements_taken_count} supps`}
                    {snapshotData.meds_taken_count && ` • ${snapshotData.meds_taken_count} med`}
                    {snapshotData.movement_minutes && ` • ${snapshotData.movement_minutes}m move`}
                    {snapshotData.mindfulness_minutes && ` • ${snapshotData.mindfulness_minutes}m mind`}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <summary 
                className="cursor-pointer text-sm text-gray-700 flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>More Details</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  {/* Sleep Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sleep Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.sleep_hours || ''}
                      onChange={(e) => updateField('sleep_hours', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 7.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Night Wakes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Night Wakes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.night_wakes || ''}
                      onChange={(e) => updateField('night_wakes', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Feeling */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feeling
                    </label>
                    <select
                      value={formData.journal || ''}
                      onChange={(e) => updateField('journal', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a feeling</option>
                      <option value="Calm">Calm</option>
                      <option value="Focused">Focused</option>
                      <option value="Energised">Energised</option>
                      <option value="Stressed">Stressed</option>
                      <option value="Anxious">Anxious</option>
                      <option value="Low / Down">Low / Down</option>
                      <option value="Fatigued">Fatigued</option>
                      <option value="In pain">In pain</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.journal || ''}
                      onChange={(e) => updateField('journal', e.target.value || null)}
                      placeholder="Any additional notes?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </details>

            {/* Save Message */}
            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {saveMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
