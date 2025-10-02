'use client';

import { useState, useEffect } from 'react';
import { saveDailyEntry, type SaveDailyEntryInput } from '@/lib/db/mood';
import { CHIP_CATALOG, getChipsByCategory } from '@/lib/constants/chip-catalog';

type EnhancedDayDrawerV2Props = {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 'YYYY-MM-DD'
  userId: string;
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

export default function EnhancedDayDrawerV2({ isOpen, onClose, date, userId, initialData }: EnhancedDayDrawerV2Props) {
  const [formData, setFormData] = useState<SaveDailyEntryInput>({
    localDate: date,
    mood: null,
    sleep_quality: null,
    pain: null,
    tags: null,
    journal: null
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [wearables, setWearables] = useState({
    recovery_score: null as number | null,
    sleep_score: null as number | null
  });

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      const newFormData = {
        localDate: date,
        mood: initialData.mood,
        sleep_quality: initialData.sleep_quality,
        pain: initialData.pain,
        tags: initialData.tags,
        journal: initialData.journal
      };
      setFormData(newFormData);
      setSelectedTags(initialData.tags || []);
      setShowAdvanced(false);
      setSnapshotData(initialData.actions_snapshot);
    } else {
      const newFormData = {
        localDate: date,
        mood: null,
        sleep_quality: null,
        pain: null,
        tags: null,
        journal: null
      };
      setFormData(newFormData);
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
      // Get completed items from localStorage
      const today = new Date().toLocaleDateString('sv-SE'); // Match dashboard format
      const storageKey = `completedItems-${userId}-${today}`;
      
      let completedItems = [];
      try {
        const saved = localStorage.getItem(storageKey);
        completedItems = saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.warn('localStorage error:', error);
      }


      const result = await saveDailyEntry({
        ...formData,
        tags: selectedTags.length > 0 ? selectedTags : null,
        completedItems: completedItems.length > 0 ? completedItems : null,
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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        // Remove tag if already selected
        return prev.filter(t => t !== tag);
      } else if (prev.length < 4) {
        // Add tag if under limit
        return [...prev, tag];
      } else {
        // Already at limit, don't add
        return prev;
      }
    });
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
    // Always allow saving - don't check for changes
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Daily Check-in
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
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
                {/* Core Metrics - 0-10 scales - Stacked */}
                <div>
                  <div className="space-y-6">
                    {/* Mood */}
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                        Mood
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={formData.mood || 5}
                          onChange={(e) => {
                            updateField('mood', parseInt(e.target.value));
                          }}
                          className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                          }}
                        />
                        <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                          {formData.mood || 5} out of 10
                        </span>
                      </div>
                    </div>

                    {/* Sleep Quality */}
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                        Sleep Quality
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={formData.sleep_quality || 5}
                          onChange={(e) => {
                            updateField('sleep_quality', parseInt(e.target.value));
                          }}
                          className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                          }}
                        />
                        <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                          {formData.sleep_quality || 5} out of 10
                        </span>
                      </div>
                    </div>

                    {/* Pain */}
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                        Pain / Soreness
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={formData.pain || 0}
                          onChange={(e) => {
                            updateField('pain', parseInt(e.target.value));
                          }}
                          className="flex-1 h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                          }}
                        />
                        <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                          {formData.pain || 0} out of 10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

            {/* Context Tags - All Chips in Scrollable Box */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900">Today's Elements</h3>
                <span className="text-xs text-gray-500">
                  {selectedTags.length}/4 selected
                </span>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-3">
                  {/* All chips organized by category */}
                  {Object.entries(CHIP_CATALOG.reduce((acc, chip) => {
                    if (!acc[chip.category]) acc[chip.category] = [];
                    acc[chip.category].push(chip);
                    return acc;
                  }, {} as Record<string, any[]>)).map(([category, chips]) => (
                    <div key={category}>
                      <p className="text-sm text-gray-500 mb-2 capitalize">{category}:</p>
                      <div className="flex flex-wrap gap-2">
                        {chips.map(chip => {
                          const isSelected = selectedTags.includes(chip.slug);
                          const isDisabled = !isSelected && selectedTags.length >= 4;
                          return (
                            <button
                              key={chip.slug}
                              onClick={() => toggleTag(chip.slug)}
                              disabled={isDisabled}
                              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                                  : isDisabled
                                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {chip.icon} {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wearables */}
            <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <summary 
                className="cursor-pointer text-base text-gray-700 flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Wearables</span>
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
                  {/* Recovery Score */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Recovery Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={wearables.recovery_score || ''}
                      onChange={(e) => setWearables(prev => ({ ...prev, recovery_score: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="e.g., 85"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Sleep Score */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Sleep Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={wearables.sleep_score || ''}
                      onChange={(e) => setWearables(prev => ({ ...prev, sleep_score: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="e.g., 78"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </details>

            {/* Notes */}
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Notes</h3>
              <textarea
                value={formData.journal || ''}
                onChange={(e) => updateField('journal', e.target.value || null)}
                placeholder="Any additional notes about your day?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
              />
            </div>

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

            {/* Daily Log Summary - Collapsible */}
            <div>
              <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                <summary className="cursor-pointer text-base text-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">Daily Log Summary</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Auto-saves what you did (supps, meds, training, mindfulness) so future-you can compare with mood/pain.
                    </p>
                  </div>
                  <svg 
                    className="w-4 h-4 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="mt-4 space-y-3">
                  {snapshotData ? (
                    <div className="space-y-3">
                      {/* Supplements */}
                      {snapshotData.supplements_taken_count > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Supplements ({snapshotData.supplements_taken_count})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.supplements && snapshotData.supplements.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.supplements.map((supp: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{supp.name}</span>
                                    <span className="text-gray-500">{supp.dose} {supp.unit}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.supplements_taken_count} supplements taken today`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Medications */}
                      {snapshotData.meds_taken_count > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Medications ({snapshotData.meds_taken_count})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.meds && snapshotData.meds.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.meds.map((med: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{med.name}</span>
                                    <span className="text-gray-500">{med.dose} {med.unit}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.meds_taken_count} medications taken today`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Movement */}
                      {snapshotData.movement_minutes > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Movement</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.activity && snapshotData.activity.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.activity.map((act: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{act.name}</span>
                                    <span className="text-gray-500">{act.duration_min} min</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.movement_minutes} minutes of movement`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Mindfulness */}
                      {snapshotData.mindfulness_minutes > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Mindfulness</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.mindfulness && snapshotData.mindfulness.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.mindfulness.map((mind: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{mind.name}</span>
                                    <span className="text-gray-500">{mind.duration_min} min</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.mindfulness_minutes} minutes of mindfulness`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Protocols */}
                      {snapshotData.protocols_active > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Active Protocols ({snapshotData.protocols_active})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.protocols && snapshotData.protocols.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.protocols.map((protocol: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{protocol.name}</span>
                                    <span className="text-gray-500">{protocol.frequency}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.protocols_active} protocols active today`
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No activity logged yet for today
                    </div>
                  )}
                </div>
              </details>
            </div>

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
                disabled={isSaving}
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
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              border: 2px solid #374151;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .slider::-moz-range-thumb {
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              border: 2px solid #374151;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          `}</style>
    </div>
  );
}
