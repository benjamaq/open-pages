'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyHeatmapProps {
  onDayClick: (date: string) => void;
  data?: DayData[]; // Optional prop for pre-loaded data
}

type MetricType = 'mood' | 'sleep_quality' | 'pain';

interface DayData {
  date: string;
  mood: number | null;
  sleep_quality: number | null;
  pain: number | null;
  tags: string[] | null;
}

export default function MonthlyHeatmap({ onDayClick, data }: MonthlyHeatmapProps) {
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString('sv-SE').slice(0, 7); // Format: YYYY-MM
  };
  
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('mood');

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toLocaleDateString('sv-SE').slice(0, 7);
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

  // Load data when month changes or when data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      // Use passed data instead of fetching
      setMonthData(data);
    } else {
      // Fallback to API fetch
      loadMonthData(currentMonth);
    }
  }, [currentMonth, data]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const current = new Date(currentMonth + '-01');
    const newDate = new Date(current.getFullYear(), current.getMonth() + (direction === 'next' ? 1 : -1), 1);
    setCurrentMonth(newDate.toLocaleDateString('sv-SE').slice(0, 7));
  };

  // Get color for metric value
  const getMetricColor = (value: number | null, metric: MetricType) => {
    if (value === null || value === undefined) return '#f3f4f6'; // Gray for no data
    
    if (metric === 'mood') {
      if (value <= 2) return '#ef4444'; // Red
      if (value <= 4) return '#f59e0b'; // Orange
      if (value <= 6) return '#eab308'; // Yellow
      if (value <= 8) return '#22c55e'; // Green
      return '#16a34a'; // Dark green
    }
    
    if (metric === 'sleep_quality') {
      if (value <= 2) return '#1e40af'; // Dark blue
      if (value <= 4) return '#3b82f6'; // Blue
      if (value <= 6) return '#60a5fa'; // Light blue
      if (value <= 8) return '#93c5fd'; // Lighter blue
      return '#dbeafe'; // Very light blue
    }
    
    if (metric === 'pain') {
      // Pain is inverted - lower is better
      if (value >= 8) return '#ef4444'; // Red
      if (value >= 6) return '#f59e0b'; // Orange
      if (value >= 4) return '#eab308'; // Yellow
      if (value >= 2) return '#22c55e'; // Green
      return '#16a34a'; // Dark green
    }
    
    return '#f3f4f6'; // Default gray
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
      const dateStr = currentDate.toLocaleDateString('sv-SE');
      const dayData = monthData.find(d => d.date === dateStr);
      const isCurrentMonth = currentDate.getMonth() === month;
      const todayStr = new Date().toLocaleDateString('sv-SE');
      const isToday = dateStr === todayStr; // YYYY-MM-DD format in local timezone
      const isFuture = currentDate > new Date();
      
      days.push({
        date: dateStr,
        mood: dayData?.[selectedMetric] || null,
        isCurrentMonth,
        isToday,
        isFuture,
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Heat map view</h3>
          <div className="flex gap-1">
            {(['mood', 'pain', 'sleep_quality'] as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedMetric === metric
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {metric === 'sleep_quality' ? 'Sleep' : metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {selectedMetric === 'mood' && 'Mood across the month. Click a day for the full snapshot—sleep, pain, meds/supps, activities.'}
          {selectedMetric === 'pain' && 'Pain levels across the month. Click a day for the full snapshot—sleep, pain, meds/supps, activities.'}
          {selectedMetric === 'sleep_quality' && 'Sleep quality across the month. Click a day for the full snapshot—sleep, pain, meds/supps, activities.'}
        </p>
      </div>

      {/* Instruction Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 text-lg">💡</span>
          <p className="text-sm text-blue-800 leading-relaxed">
            Click any day to see pain, mood, sleep, supplements, and notes from that day
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs text-gray-500 text-center py-1 font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const hasData = day.mood !== null && day.mood !== undefined
          const bg = day.isFuture ? '#ffffff' : getMetricColor(day.mood, selectedMetric)
          const baseClasses = `w-6 h-6 sm:w-8 sm:h-8 rounded text-xs font-medium transition-all ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'} ${day.isToday ? 'ring-2 ring-blue-500' : ''}`
          return (
            <button
              key={index}
              onClick={() => onDayClick(day.date)}
              className={`${baseClasses} ${hasData ? 'hover:scale-110' : 'hover:opacity-90'}`}
              style={{
                backgroundColor: bg,
                border: hasData ? '1px solid rgba(0,0,0,0.06)' : (day.isFuture ? '1px solid #e5e7eb' : '1px solid #e5e7eb')
              }}
              title={hasData ? `${selectedMetric === 'sleep_quality' ? 'Sleep' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}: ${day.mood}/10` : (day.isFuture ? 'Future date' : 'No check-in')}
            >
              {day.day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-4 mt-4 text-xs flex-wrap gap-1 sm:gap-2">
        {selectedMetric === 'mood' && (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Low (0-2)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Med (3-4)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Good (5-6)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Great (7-8)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Excellent (9-10)</span>
            </div>
          </>
        )}
        {selectedMetric === 'sleep_quality' && (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#1e40af' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Poor (0-2)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Fair (3-4)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Good (5-6)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#93c5fd' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Great (7-8)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#dbeafe' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Excellent (9-10)</span>
            </div>
          </>
        )}
        {selectedMetric === 'pain' && (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">None (0-1)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Mild (2-3)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Moderate (4-5)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Severe (6-7)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-gray-600 text-[10px] sm:text-xs">Intense (8-10)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
