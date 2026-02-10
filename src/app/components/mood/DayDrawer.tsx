'use client';

import { useState, useEffect } from 'react';
import { saveDailyEntry, type SaveDailyEntryInput } from '@/lib/db/mood';

type DayDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 'YYYY-MM-DD'
  initialData?: {
    mood?: number | null;
    energy?: number | null;
    pain?: number | null;
    sleep_hours?: number | null;
    readiness?: number | null;
    feeling?: string | null;
    note?: string | null;
  } | null;
};

const FEELING_OPTIONS = [
  'Calm',
  'Focused', 
  'Energised',
  'Stressed',
  'Anxious',
  'Low / Down',
  'Fatigued',
  'In pain'
] as const;

export default function DayDrawer({ isOpen, onClose, date, initialData }: DayDrawerProps) {
  const [formData, setFormData] = useState<any>({
    localDate: date,
    mood: null,
    energy: null,
    pain: null,
    sleep_hours: null,
    readiness: null,
    feeling: null,
    note: null
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPain, setShowPain] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        localDate: date,
        mood: initialData.mood,
        energy: initialData.energy,
        pain: initialData.pain,
        sleep_hours: initialData.sleep_hours,
        readiness: initialData.readiness,
        feeling: initialData.feeling,
        note: initialData.note
      });
      setShowPain(initialData.pain !== null);
    } else {
      setFormData({
        localDate: date,
        mood: null,
        energy: null,
        pain: null,
        sleep_hours: null,
        readiness: null,
        feeling: null,
        note: null
      });
      setShowPain(false);
    }
    setSaveMessage('');
  }, [date, initialData]);

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
      const result = await saveDailyEntry(formData);
      
      if (result.ok) {
        setSaveMessage('✅ Check-in saved!');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setSaveMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      setSaveMessage('❌ Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
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
                  value={formData.mood || 0}
                  onChange={(e) => updateField('mood', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-500">10</span>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                  {formData.mood || 0}
                </span>
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy (0-10)
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">0</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.energy || 0}
                  onChange={(e) => updateField('energy', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-500">10</span>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                  {formData.energy || 0}
                </span>
              </div>
            </div>

            {/* Pain Toggle */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showPain}
                  onChange={(e) => {
                    setShowPain(e.target.checked);
                    if (!e.target.checked) {
                      updateField('pain', null);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Track pain level
                </span>
              </label>
            </div>

            {/* Pain */}
            {showPain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pain (0-10)
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.pain || 0}
                    onChange={(e) => updateField('pain', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm text-gray-500">10</span>
                  <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                    {formData.pain || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Sleep Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Hours
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.1"
                value={formData.sleep_hours || ''}
                onChange={(e) => updateField('sleep_hours', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="e.g., 7.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Readiness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Readiness (%)
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.readiness || 0}
                  onChange={(e) => updateField('readiness', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-500">100%</span>
                <span className="text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
                  {formData.readiness || 0}%
                </span>
              </div>
            </div>

            {/* Feeling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feeling
              </label>
              <select
                value={formData.feeling || ''}
                onChange={(e) => updateField('feeling', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select feeling...</option>
                {FEELING_OPTIONS.map(feeling => (
                  <option key={feeling} value={feeling}>
                    {feeling}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (optional)
              </label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => updateField('note', e.target.value || null)}
                placeholder="How are you feeling today?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
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
