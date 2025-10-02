'use client';

import { useState, useEffect } from 'react';
import EnhancedDayDrawer from '@/app/components/mood/EnhancedDayDrawer';

export default function TestMoodEnhancedPage() {
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch today's entry
        const todayResponse = await fetch('/api/mood/today');
        const todayData = await todayResponse.json();
        setTodayEntry(todayData.entry);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAdd = () => {
    setIsDrawerOpen(true);
  };

  const handleEdit = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Refresh data after closing
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Mood Tracking Test</h1>
          <div className="text-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Mood Tracking Test</h1>
        
        {/* Today Strip */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today Strip</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            {!todayEntry ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-600">No check-in yet.</span>
                </div>
                <button
                  onClick={handleAdd}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Add today
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {todayEntry.mood && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                      <strong className="font-semibold text-gray-800">Mood:</strong> {todayEntry.mood}/5
                    </span>
                  )}
                  {todayEntry.energy && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                      <strong className="font-semibold text-gray-800">Energy:</strong> {todayEntry.energy}/5
                    </span>
                  )}
                  {todayEntry.sleep_quality && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                      <strong className="font-semibold text-gray-800">Sleep:</strong> {todayEntry.sleep_quality}/5
                    </span>
                  )}
                  {todayEntry.pain && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                      <strong className="font-semibold text-gray-800">Pain:</strong> {todayEntry.pain}/10
                    </span>
                  )}
                  {todayEntry.tags && todayEntry.tags.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                      <strong className="font-semibold text-blue-800">Tags:</strong> {todayEntry.tags.join(', ')}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleEdit}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Demo */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ <strong>Sleep Quality</strong> - 1-5 scale for sleep assessment</li>
              <li>✅ <strong>Context Tags</strong> - Smart suggestions based on scores</li>
              <li>✅ <strong>Enhanced Design</strong> - Clean, clinical aesthetic</li>
              <li>✅ <strong>Advanced Options</strong> - Pain, sleep hours, night wakes</li>
              <li>✅ <strong>Smart Suggestions</strong> - Tags appear based on low scores</li>
              <li>✅ <strong>Snapshot Data</strong> - Captures supplements/protocols</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Tags</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-gray-700">Sleep:</strong> Slept really bad, Woke up all night, Late to bed, Short sleep
              </div>
              <div>
                <strong className="text-gray-700">Energy:</strong> Exhausted, Tired, Wired, Low motivation
              </div>
              <div>
                <strong className="text-gray-700">Stress:</strong> High stress, Sick, Infection suspected
              </div>
              <div>
                <strong className="text-gray-700">Lifestyle:</strong> Alcohol last night, Late caffeine, Travel/jet lag
              </div>
              <div>
                <strong className="text-gray-700">Pain:</strong> Pain was really bad, Migraine, GI upset
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Today Entry:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(todayEntry, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Enhanced Day Drawer */}
        <EnhancedDayDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          date={new Date().toISOString().split('T')[0]}
          initialData={todayEntry}
        />
      </div>
    </div>
  );
}
