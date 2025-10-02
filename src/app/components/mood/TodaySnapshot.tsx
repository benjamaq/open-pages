'use client';

import { useState, useEffect, useMemo } from 'react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';
import { ChevronDown, Calendar } from 'lucide-react';
import MonthlyHeatmap from './MonthlyHeatmap';
import DayDetailView from './DayDetailView';

interface TodaySnapshotProps {
  todayEntry?: {
    mood?: number | null;
    sleep_quality?: number | null;
    pain?: number | null;
    tags?: string[] | null;
    journal?: string | null;
    actions_snapshot?: any;
  } | null;
  onEditToday: () => void;
  onEditDay: (date: string) => void;
  onRefresh?: () => void;
  streak?: number;
}

interface MetricPillProps {
  label: string;
  value: number;
  max: number;
  palette: 'mood' | 'sleep' | 'pain';
  onClick?: () => void;
  className?: string;
}

const MetricPill = ({ label, value, max, palette, onClick, className = '' }: MetricPillProps) => {
  const pct = (value / max) * 100;
  
  const getPalette = () => {
    if (palette === 'pain') {
      // Pain: green→orange→red (0=good/green, 10=bad/red) - REVERSED SCALE
      if (value <= 2) return 'linear-gradient(to right, #22C55E, #22C55E)';
      if (value <= 4) return 'linear-gradient(to right, #22C55E, #F59E0B)';
      if (value <= 6) return 'linear-gradient(to right, #F59E0B, #F59E0B)';
      if (value <= 8) return 'linear-gradient(to right, #F59E0B, #EF4444)';
      return 'linear-gradient(to right, #EF4444, #EF4444)';
    } else {
      // Mood/Sleep: red→amber→green (0=bad/red, 10=good/green) - NORMAL SCALE
      if (value <= 2) return 'linear-gradient(to right, #E54D2E, #E54D2E)';
      if (value <= 4) return 'linear-gradient(to right, #E54D2E, #F5A524)';
      if (value <= 6) return 'linear-gradient(to right, #F5A524, #F5A524)';
      if (value <= 8) return 'linear-gradient(to right, #F5A524, #22C55E)';
      return 'linear-gradient(to right, #22C55E, #22C55E)';
    }
  };

  const bg = value === 0 ? '#15803D' : getPalette();

  return (
    <div className={`flex flex-col items-center ${className}`} onClick={onClick}>
      <div className="text-sm sm:text-base font-semibold text-gray-800 mb-2">{label}</div>
      <div className="flex items-center">
        <div
          className="h-3 sm:h-4 w-24 sm:w-32 md:w-40 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: bg }}
          aria-label={`${label} ${value} of 10`}
        />
        <div className="ml-2 sm:ml-4 text-sm sm:text-lg font-bold text-gray-900">{value}/{max}</div>
      </div>
    </div>
  );
};

export default function TodaySnapshot({ 
  todayEntry, 
  onEditToday, 
  onEditDay, 
  onRefresh,
  streak = 0 
}: TodaySnapshotProps) {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // Load monthly data for averages (only once on mount)
  useEffect(() => {
    const loadMonthlyData = async () => {
      try {
        const response = await fetch('/api/mood/month?month=' + new Date().toISOString().slice(0, 7));
        if (response.ok) {
          const data = await response.json();
          setMonthlyData(data.data || []);
        }
      } catch (error) {
        console.error('Error loading monthly data:', error);
      }
    };

    loadMonthlyData();
  }, []); // Only load once on mount


  // Get selected chips (max 4)
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  const displayChips = selectedChips.slice(0, 4);

  // Calculate 7-day averages (memoized for performance)
  const { avgMood, avgSleep, avgPain } = useMemo(() => {
    const last7Days = monthlyData.slice(-7);
    
    const moodValues = last7Days.map(day => day.mood).filter(val => val !== null && val !== undefined);
    const sleepValues = last7Days.map(day => day.sleep_quality).filter(val => val !== null && val !== undefined);
    const painValues = last7Days.map(day => day.pain).filter(val => val !== null && val !== undefined);

    // If no historical data, use today's values as fallback
    let avgMood, avgSleep, avgPain;
    
    if (moodValues.length > 0) {
      avgMood = (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1);
    } else if (todayEntry?.mood !== null && todayEntry?.mood !== undefined) {
      avgMood = todayEntry.mood.toString();
    } else {
      avgMood = '—';
    }
    
    if (sleepValues.length > 0) {
      avgSleep = (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1);
    } else if (todayEntry?.sleep_quality !== null && todayEntry?.sleep_quality !== undefined) {
      avgSleep = todayEntry.sleep_quality.toString();
    } else {
      avgSleep = '—';
    }
    
    if (painValues.length > 0) {
      avgPain = (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1);
    } else if (todayEntry?.pain !== null && todayEntry?.pain !== undefined) {
      avgPain = todayEntry.pain.toString();
    } else {
      avgPain = '—';
    }

    return { avgMood, avgSleep, avgPain };
  }, [monthlyData, todayEntry]);

  // Handle day click from heatmap
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayDetail(true);
  };

  // Debug logging
  console.log('TodaySnapshot - todayEntry:', todayEntry);
  console.log('TodaySnapshot - selectedChips:', selectedChips);
  console.log('TodaySnapshot - monthlyData:', monthlyData);
  console.log('TodaySnapshot - averages:', { avgMood, avgSleep, avgPain });
  console.log('TodaySnapshot - collapsed:', collapsed);
  console.log('TodaySnapshot - showHeatmap:', showHeatmap);

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200/60 px-4 pt-4 pb-6 mb-6">
      {/* Single Column Layout */}
      <div className="w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-3">
          <h3 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>Mood Tracker</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onEditToday}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-sm hover:shadow-md"
            >
              My Daily Check-in
            </button>
            <div className="relative">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
                  showHeatmap 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110'
                }`}
                aria-label={showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
                title="Monthly heatmap"
              >
                <Calendar 
                  className="w-4 h-4"
                  style={{ 
                    color: 'white',
                    fill: 'none',
                    stroke: 'white',
                    strokeWidth: '2'
                  }} 
                />
              </button>
              <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium whitespace-nowrap">
                {showHeatmap ? 'Hide Heatmap' : 'Heatmap'}
              </span>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!collapsed && (
          <>
            {/* Monthly Heatmap */}
            {showHeatmap && (
              <div className="mb-4">
                <MonthlyHeatmap onDayClick={handleDayClick} />
              </div>
            )}

            {/* Chips Row */}
            {displayChips.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {displayChips.map((chip, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                  >
                    {chip?.icon} {chip?.label}
                  </span>
                ))}
              </div>
            )}

            {/* Mood, Sleep, Pain Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2 mb-5">
              <MetricPill 
                label="Mood" 
                value={todayEntry?.mood || 0} 
                max={10} 
                palette="mood" 
                onClick={onEditToday}
                className="w-full"
              />
              <MetricPill 
                label="Sleep Quality" 
                value={todayEntry?.sleep_quality || 0} 
                max={10} 
                palette="sleep" 
                onClick={onEditToday}
                className="w-full"
              />
              <MetricPill 
                label="Pain" 
                value={todayEntry?.pain || 0} 
                max={10} 
                palette="pain" 
                onClick={onEditToday}
                className="w-full"
              />
            </div>

            {/* Weekly Averages and Edit Button */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-sm text-gray-500">
                  This week's average: Mood {avgMood} • Sleep {avgSleep} • Pain {avgPain}
                </div>
              </div>
              <button 
                onClick={onEditToday}
                className="text-sm text-gray-500 hover:text-gray-700 ml-4"
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailView
          date={selectedDate}
          isOpen={showDayDetail}
          onClose={() => {
            setShowDayDetail(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}