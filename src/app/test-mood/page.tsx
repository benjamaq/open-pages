'use client';

import { useState, useEffect } from 'react';
import TodayStrip from '@/app/components/mood/TodayStrip';
import MonthHeatmap from '@/app/components/mood/MonthHeatmap';

export default function TestMoodPage() {
  const [todayEntry, setTodayEntry] = useState(null);
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch today's entry
        const todayResponse = await fetch('/api/mood/today');
        const todayData = await todayResponse.json();
        setTodayEntry(todayData.entry);

        // Fetch month data
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthResponse = await fetch(`/api/mood/month?month=${currentMonth}`);
        const monthData = await monthResponse.json();
        setMonthData(monthData.data);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAdd = () => {
    console.log('Add clicked');
  };

  const handleEdit = () => {
    console.log('Edit clicked');
  };

  const handleSelectDay = (date: string) => {
    console.log('Day selected:', date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mood Tracking Test</h1>
          <div className="text-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mood Tracking Test</h1>
        
        {/* Today Strip */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today Strip</h2>
          <TodayStrip
            entry={todayEntry}
            onAdd={handleAdd}
            onEdit={handleEdit}
          />
        </div>

        {/* Month Heatmap */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Month Heatmap</h2>
          <MonthHeatmap
            month={currentMonth}
            data={monthData}
            primary="mood"
            onSelectDay={handleSelectDay}
            viewport="desktop"
          />
        </div>

        {/* Debug Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Today Entry:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(todayEntry, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Month Data (first 5 days):</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(monthData.slice(0, 5), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
