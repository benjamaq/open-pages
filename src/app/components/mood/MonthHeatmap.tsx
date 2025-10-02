'use client';

import { useState } from 'react';

type DayDatum = {
  date: string;
  mood?: number | null;
  pain?: number | null;
  energy?: number | null;
  sleep_hours?: number | null;
  readiness?: number | null;
  feeling?: string | null;
  note?: string | null;
  hasJournal?: boolean;
  markers?: Array<{ color: string; position: 'top' | 'bottom' }>;
  sleepBadge?: 'low' | undefined;
  readinessBadge?: 'low' | 'high' | undefined;
};

type MonthHeatmapProps = {
  month: string; // 'YYYY-MM'
  data: DayDatum[];
  primary: 'mood' | 'pain';
  onSelectDay: (date: string) => void;
  viewport: 'desktop' | 'mobile';
};

export default function MonthHeatmap({ 
  month, 
  data, 
  primary, 
  onSelectDay, 
  viewport 
}: MonthHeatmapProps) {
  const [showMobileMonth, setShowMobileMonth] = useState(false);

  // Parse month
  const [year, monthNum] = month.split('-').map(Number);
  const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Get color for mood (0-10 scale)
  const getMoodColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '#f3f4f6'; // gray-100
    
    // Viridis-like colors
    const colors = [
      '#3B0F70', // dark purple
      '#482777', 
      '#5A3B7A',
      '#6C4F7C',
      '#7E637E',
      '#907680',
      '#A28982',
      '#B49C84',
      '#C6AF86',
      '#D8C288',
      '#EAD58A', // light yellow
    ];
    
    return colors[Math.round(value)] || colors[0];
  };

  // Get color for pain (0-10 scale)
  const getPainColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '#f3f4f6'; // gray-100
    
    // Brewer Reds
    const colors = [
      '#FEE5D9', // very light red
      '#FDD0A2',
      '#FDAE6B',
      '#FD8D3C',
      '#F16913',
      '#D94801',
      '#A63603',
      '#7F2704',
      '#8C2D04',
      '#A63603',
      '#CB181D', // dark red
    ];
    
    return colors[Math.round(value)] || colors[0];
  };

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const getDayOfWeek = (dateStr: string) => {
    return new Date(dateStr).getDay();
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const startDate = new Date(firstDay);
    
    // Adjust to start from Sunday
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to cover the month
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateStr);
        
        weekDays.push({
          date: dateStr,
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === monthNum - 1,
          data: dayData
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  const calendarGrid = generateCalendarGrid();

  // For mobile, show only 2 weeks by default
  const displayWeeks = viewport === 'mobile' && !showMobileMonth 
    ? calendarGrid.slice(0, 2) 
    : calendarGrid;

  const handleDayClick = (date: string) => {
    onSelectDay(date);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        
        {/* Toggle for mobile */}
        {viewport === 'mobile' && (
          <button
            onClick={() => setShowMobileMonth(!showMobileMonth)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showMobileMonth ? 'Hide month' : 'View month'}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 mb-4 text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Less</span>
          <div className="flex space-x-1">
            {[0, 2, 4, 6, 8, 10].map(value => (
              <div
                key={value}
                className="w-3 h-3 rounded-sm"
                style={{ 
                  backgroundColor: primary === 'mood' 
                    ? getMoodColor(value) 
                    : getPainColor(value) 
                }}
              />
            ))}
          </div>
          <span className="text-gray-600">More</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Toggle:</span>
          <button
            onClick={() => {/* TODO: Switch between mood and pain */}}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {primary === 'mood' ? 'Pain' : 'Mood'}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs text-gray-500 text-center py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {displayWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map(({ date, day, isCurrentMonth, data }) => {
              const value = primary === 'mood' ? data?.mood : data?.pain;
              const color = primary === 'mood' ? getMoodColor(value) : getPainColor(value);
              
              return (
                <button
                  key={date}
                  onClick={() => handleDayClick(date)}
                  className={`
                    relative w-8 h-8 text-xs rounded-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${data ? 'border border-gray-300' : ''}
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`${date} - ${primary} ${value || 'no data'}`}
                >
                  <span className="relative z-10">{day}</span>
                  
                  {/* Markers */}
                  {data?.markers && data.markers.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                      {data.markers.map((marker, index) => (
                        <div
                          key={index}
                          className="flex-1"
                          style={{ backgroundColor: marker.color }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Badges */}
                  {data?.sleepBadge === 'low' && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full transform translate-x-1 -translate-y-1" />
                  )}
                  
                  {data?.readinessBadge === 'low' && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full transform translate-x-1 translate-y-1" />
                  )}
                  
                  {data?.readinessBadge === 'high' && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full transform translate-x-1 translate-y-1" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View trends →
        </button>
      </div>
    </div>
  );
}
