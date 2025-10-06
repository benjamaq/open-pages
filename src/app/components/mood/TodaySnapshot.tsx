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
  todayItems?: {
    supplements: any[];
    protocols: any[];
    movement: any[];
    mindfulness: any[];
    food: any[];
    gear: any[];
  };
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
  const hasData = value > 0;
  
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

  // Show green for empty state (no data recorded)
  const bg = hasData ? getPalette() : 'linear-gradient(to right, #22C55E, #22C55E)';

  return (
    <div className={`flex flex-col items-center ${className}`} onClick={onClick}>
      <div className="text-xs sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2 text-center w-full">
        {label}
      </div>
      <div className="flex items-center justify-center w-full">
        <div
          className="h-3 w-12 sm:h-5 sm:w-40 md:w-48 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: bg }}
          aria-label={`${label} ${hasData ? value : 'not recorded'} of 10`}
        />
        <div className="ml-1 sm:ml-2 text-xs sm:text-base font-bold text-gray-900">
          {hasData ? `${value}/${max}` : '—'}
        </div>
      </div>
    </div>
  );
};

export default function TodaySnapshot({
  todayEntry,
  todayItems,
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
  const { avgMood, avgSleep, avgPain, avgRecovery, avgWearableSleep } = useMemo(() => {
    const last7Days = monthlyData.slice(-7);
    
    const moodValues = last7Days.map(day => day.mood).filter(val => val !== null && val !== undefined);
    const sleepValues = last7Days.map(day => day.sleep_quality).filter(val => val !== null && val !== undefined);
    const painValues = last7Days.map(day => day.pain).filter(val => val !== null && val !== undefined);
    const recoveryValues = last7Days.map(day => day.wearables?.recovery_score).filter(val => val !== null && val !== undefined);
    const wearableSleepValues = last7Days.map(day => day.wearables?.sleep_score).filter(val => val !== null && val !== undefined);

    // If no historical data, use today's values as fallback
    let avgMood, avgSleep, avgPain, avgRecovery, avgWearableSleep;
    
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

    if (recoveryValues.length > 0) {
      avgRecovery = (recoveryValues.reduce((a, b) => a + b, 0) / recoveryValues.length).toFixed(0);
    } else if (todayEntry?.wearables?.recovery_score !== null && todayEntry?.wearables?.recovery_score !== undefined) {
      avgRecovery = todayEntry.wearables.recovery_score.toString();
    } else {
      avgRecovery = '—';
    }

    if (wearableSleepValues.length > 0) {
      avgWearableSleep = (wearableSleepValues.reduce((a, b) => a + b, 0) / wearableSleepValues.length).toFixed(0);
    } else if (todayEntry?.wearables?.sleep_score !== null && todayEntry?.wearables?.sleep_score !== undefined) {
      avgWearableSleep = todayEntry.wearables.sleep_score.toString();
    } else {
      avgWearableSleep = '—';
    }

    return { avgMood, avgSleep, avgPain, avgRecovery, avgWearableSleep };
  }, [monthlyData, todayEntry]);

  // Handle day click from heatmap
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayDetail(true);
  };



  // Debug logging for props and data
  useEffect(() => {
    console.log('🔍 TodaySnapshot mounted');
    console.log('🔍 TodaySnapshot props:', { 
      todayEntry, 
      onEditToday: !!onEditToday, 
      onEditDay: !!onEditDay, 
      onRefresh: !!onRefresh 
    });
    return () => console.log('🔍 TodaySnapshot unmounted');
  }, [todayEntry]);

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200/60 px-4 pt-4 pb-6 mb-6">
      {/* Single Column Layout */}
      <div className="w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 pt-2 pb-6">
          <h3 className="font-bold text-lg sm:text-xl whitespace-nowrap" style={{ color: '#0F1115' }}>Mood Tracker</h3>
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-0">
            <button 
              onClick={onEditToday}
              className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium rounded-lg hover:brightness-110 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Daily Check-in
            </button>
            <div className="relative">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg transition-all shadow-sm hover:shadow-md ${
                  showHeatmap 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110'
                }`}
                aria-label={showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
                title="Monthly heatmap"
              >
                <Calendar 
                  className="w-3 h-3 sm:w-4 sm:h-4"
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
              <ChevronDown className={`w-5 h-5 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
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

            {/* Chips Row - Mobile 2x2 grid, Desktop side-by-side */}
            {displayChips.length > 0 && (
              <div className="grid grid-cols-2 gap-1 mb-6 justify-center mt-4 sm:flex sm:flex-wrap sm:gap-3">
                {displayChips.map((chip, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 text-[10px] sm:px-4 sm:py-2 sm:text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm text-center leading-tight truncate"
                  >
                    {chip?.icon} {chip?.label}
                  </span>
                ))}
              </div>
            )}

            {/* Mood, Sleep, Pain Row - Mobile compact, Desktop spaced */}
            <div className="flex justify-between items-center mb-5 px-2 sm:max-w-6xl sm:mx-auto sm:px-16">
              <MetricPill 
                label="Mood" 
                value={todayEntry?.mood ?? 0} 
                max={10} 
                palette="mood" 
                onClick={onEditToday}
                className="w-full"
              />
              <MetricPill 
                label="Sleep" 
                value={todayEntry?.sleep_quality ?? 0} 
                max={10} 
                palette="sleep" 
                onClick={onEditToday}
                className="w-full"
              />
              <MetricPill 
                label="Pain" 
                value={todayEntry?.pain ?? 0} 
                max={10} 
                palette="pain" 
                onClick={onEditToday}
                className="w-full"
              />
            </div>

            {/* Weekly Averages and Wearables */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-16">
              <div className="text-xs sm:text-base text-gray-500 text-center">
                <div>This week's average: Mood {avgMood} • Sleep {avgSleep} • Pain {avgPain}</div>
              </div>
              
              <div className="text-xs sm:text-base text-gray-500 text-center">
                {todayEntry?.wearables?.device && avgRecovery !== '—' && `${todayEntry.wearables.device} Recovery ${avgRecovery}`}
                {todayEntry?.wearables?.device && avgRecovery !== '—' && avgWearableSleep !== '—' && ' • '}
                {todayEntry?.wearables?.device && avgWearableSleep !== '—' && `Sleep ${avgWearableSleep}`}
                {!todayEntry?.wearables?.device && avgRecovery !== '—' && `Recovery ${avgRecovery}`}
                {!todayEntry?.wearables?.device && avgRecovery !== '—' && avgWearableSleep !== '—' && ' • '}
                {!todayEntry?.wearables?.device && avgWearableSleep !== '—' && `Sleep Score ${avgWearableSleep}`}
              </div>
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
          todayItems={todayItems}
        />
      )}
    </div>
  );
}