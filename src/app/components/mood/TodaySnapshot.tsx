'use client';

import { useState, useEffect, useMemo } from 'react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';
import { ChevronDown, Calendar } from 'lucide-react';
import FirstTimeTooltip from '../../../components/FirstTimeTooltip';
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
      if (value <= 1) return 'linear-gradient(to right, #22C55E, #22C55E)'; // Dark green
      if (value <= 3) return 'linear-gradient(to right, #22C55E, #16A34A)'; // Green to darker green
      if (value <= 5) return 'linear-gradient(to right, #16A34A, #F59E0B)'; // Green to orange
      if (value <= 7) return 'linear-gradient(to right, #F59E0B, #F59E0B)'; // Orange
      if (value <= 9) return 'linear-gradient(to right, #F59E0B, #EF4444)'; // Orange to red
      return 'linear-gradient(to right, #EF4444, #DC2626)'; // Red to dark red
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


  // Get selected chips (max 4) - tags are now in slug format
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  const displayChips = selectedChips.slice(0, 4);
  
  // Debug logging to see what's happening
  console.log('🔍 TodaySnapshot - todayEntry.tags:', todayEntry?.tags);
  console.log('🔍 TodaySnapshot - selectedChips:', selectedChips);
  console.log('🔍 TodaySnapshot - displayChips:', displayChips);

  // 🎯 Calculate Readiness Score (Mood 20%, Sleep 40%, Pain 40%)
  const readinessScore = useMemo(() => {
    const mood = todayEntry?.mood ?? 5;
    const sleep = todayEntry?.sleep_quality ?? 5;
    const pain = todayEntry?.pain ?? 0;
    
    // Pain is inverted (0 = best, 10 = worst)
    const painInverted = 10 - pain;
    
    // Calculate weighted score
    const score = (mood * 0.2) + (sleep * 0.4) + (painInverted * 0.4);
    
    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
  }, [todayEntry?.mood, todayEntry?.sleep_quality, todayEntry?.pain]);

  // Get color and label for readiness score
  const getReadinessDisplay = (score: number) => {
    if (score >= 8) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Excellent', emoji: '🚀' };
    if (score >= 6.5) return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Good', emoji: '✨' };
    if (score >= 5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Moderate', emoji: '😐' };
    if (score >= 3.5) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Low', emoji: '⚠️' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Rest Day', emoji: '🛌' };
  };

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
        

        {/* Collapsible Content */}
        {!collapsed && (
          <>
            {/* Monthly Heatmap */}
            {showHeatmap && (
              <div className="mb-4" data-tour="heatmap">
                <MonthlyHeatmap onDayClick={handleDayClick} />
              </div>
            )}

            {/* Header Row: Title + Buttons */}
            <div className="flex items-center justify-between mb-4">
              {/* Mood Tracker Title - Left */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mood Tracker</h2>
              
              {/* Buttons - Right Side */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={onEditToday}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Daily Check-in
                </button>
                
                <FirstTimeTooltip
                  id="heatmap-hover"
                  message="Click any day to see what you were taking and how you felt"
                  trigger="hover"
                  position="bottom"
                >
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowHeatmap(!showHeatmap)
                        // Mark heatmap as explored for WhatsNextCard
                        if (!showHeatmap) {
                          localStorage.setItem('heatmapExplored', 'true')
                        }
                      }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
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
                      {showHeatmap ? 'Hide' : 'Heatmap'}
                    </span>
                  </div>
                </FirstTimeTooltip>
              </div>
            </div>

            {/* Mood Chips Row - Centered */}
            {displayChips.length > 0 && (
              <div className="mb-4 flex justify-center">
                <div className="flex flex-wrap gap-2 justify-center">
                  {displayChips.map((chip, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      {chip?.icon} {chip?.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mood, Sleep, Pain Row - Mobile compact, Desktop spaced */}
            <div className="flex justify-between items-center mb-3 px-2 sm:max-w-6xl sm:mx-auto sm:px-16">
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
            
            {/* Description under sliders - Hidden on mobile */}
            <div className="hidden sm:block text-xs text-gray-500 text-center mb-5">
              These metrics and your contextual factors will appear in your daily summary when you click on your heatmap as a record of what was happening that day.
            </div>

            {/* Bottom Row: Today's Averages + Readiness Score + Wearables */}
            <div className="mt-6">
              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between">
                {/* Today's Averages - Left (small grey text) */}
                <div className="text-xs text-gray-500">
                  <div>Today's average: Mood {todayEntry?.mood || '—'} • Sleep {todayEntry?.sleep_quality || '—'} • Pain {todayEntry?.pain || '—'}</div>
                </div>
                
                {/* Readiness Score - Center (compact with black outline) */}
                <div className="flex items-center space-x-3" onClick={onEditToday}>
                  <div className="border-2 border-black rounded-lg p-3 bg-white cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getReadinessDisplay(readinessScore).color}`}>
                        {readinessScore}
                      </span>
                      <span className="text-lg text-gray-400">/10</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Daily Readiness Score
                  </div>
                </div>
                
                {/* Wearables - Right (small grey text) */}
                <div className="text-xs text-gray-500 text-right">
                  {todayEntry?.wearables?.device && avgRecovery !== '—' && (
                    <div>
                      <div>{todayEntry.wearables.device} Recovery: {avgRecovery}</div>
                      {avgWearableSleep !== '—' && <div>Sleep: {avgWearableSleep}</div>}
                    </div>
                  )}
                  {!todayEntry?.wearables?.device && avgRecovery !== '—' && (
                    <div>
                      <div>Recovery: {avgRecovery}</div>
                      {avgWearableSleep !== '—' && <div>Sleep: {avgWearableSleep}</div>}
                    </div>
                  )}
                  {!todayEntry?.wearables?.device && avgRecovery === '—' && (
                    <div>No wearables data</div>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden space-y-3">
                {/* Readiness Score - Top on mobile */}
                <div className="flex items-center justify-center space-x-2" onClick={onEditToday}>
                  <div className="border-2 border-black rounded-lg p-2 bg-white cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center space-x-1">
                      <span className={`text-xl font-bold ${getReadinessDisplay(readinessScore).color}`}>
                        {readinessScore}
                      </span>
                      <span className="text-sm text-gray-400">/10</span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    Daily Readiness
                  </div>
                </div>
                
                {/* Today's Averages - Center on mobile */}
                <div className="text-xs text-gray-500 text-center">
                  <div>Today: Mood {todayEntry?.mood || '—'} • Sleep {todayEntry?.sleep_quality || '—'} • Pain {todayEntry?.pain || '—'}</div>
                </div>
                
                {/* Wearables - Bottom on mobile */}
                <div className="text-xs text-gray-500 text-center">
                  {todayEntry?.wearables?.device && avgRecovery !== '—' && (
                    <div>
                      <div>{todayEntry.wearables.device} Recovery: {avgRecovery}</div>
                      {avgWearableSleep !== '—' && <div>Sleep: {avgWearableSleep}</div>}
                    </div>
                  )}
                  {!todayEntry?.wearables?.device && avgRecovery !== '—' && (
                    <div>
                      <div>Recovery: {avgRecovery}</div>
                      {avgWearableSleep !== '—' && <div>Sleep: {avgWearableSleep}</div>}
                    </div>
                  )}
                  {!todayEntry?.wearables?.device && avgRecovery === '—' && (
                    <div>No wearables data</div>
                  )}
                </div>
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