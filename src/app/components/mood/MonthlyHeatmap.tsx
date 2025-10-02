'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyHeatmapProps {
  onDayClick: (date: string) => void;
}

interface DayData {
  date: string;
  mood: number | null;
  sleep_quality: number | null;
  pain: number | null;
  tags: string[] | null;
}

export default function MonthlyHeatmap({ onDayClick }: MonthlyHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleDateString('sv-SE').slice(0, 7)); // YYYY-MM in local timezone
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  // Load month data
  const loadMonthData = async (month: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mood/month?month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setMonthData(data.data || []);
      }
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when month changes
  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const current = new Date(currentMonth + '-01');
    const newDate = new Date(current.getFullYear(), current.getMonth() + (direction === 'next' ? 1 : -1), 1);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  };

  // Get color for mood value
  const getMoodColor = (mood: number | null) => {
    if (mood === null || mood === undefined) return '#f3f4f6'; // Gray for no data
    
    if (mood <= 2) return '#ef4444'; // Red
    if (mood <= 4) return '#f59e0b'; // Orange
    if (mood <= 6) return '#eab308'; // Yellow
    if (mood <= 8) return '#22c55e'; // Green
    return '#16a34a'; // Dark green
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const year = parseInt(currentMonth.split('-')[0]);
    const month = parseInt(currentMonth.split('-')[1]) - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure we cover the month
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = monthData.find(d => d.date === dateStr);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = dateStr === new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD format in local timezone
      
      days.push({
        date: dateStr,
        mood: dayData?.mood || null,
        isCurrentMonth,
        isToday,
        day: currentDate.getDate()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const monthOptions = generateMonthOptions();
  const calendarDays = generateCalendarGrid();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none"
            disabled={loading}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          {loading ? 'Loading...' : `${monthData.filter(d => d.mood !== null).length} days logged`}
        </div>
      </div>

      {/* Header and Description */}
      <div className="mb-4 px-1 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Heat map view</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Mood across the month. Click a day for the full snapshot—sleep, pain, meds/supps, activities.
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs text-gray-500 text-center py-1 font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => onDayClick(day.date)}
            className={`
              w-8 h-8 rounded text-xs font-medium transition-all hover:scale-110
              ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
              ${day.isToday ? 'ring-2 ring-blue-500' : ''}
            `}
            style={{
              backgroundColor: getMoodColor(day.mood)
            }}
            title={day.mood !== null ? `Mood: ${day.mood}/10` : 'No data'}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-gray-600">Low (0-2)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span className="text-gray-600">Med (3-4)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
          <span className="text-gray-600">Good (5-6)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
          <span className="text-gray-600">Great (7-8)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
          <span className="text-gray-600">Excellent (9-10)</span>
        </div>
      </div>
    </div>
  );
}
