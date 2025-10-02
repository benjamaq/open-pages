'use client';

import { useState, useEffect, useMemo } from 'react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';
import { Heart, Moon, Zap, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
// Import MonthlyHeatmap conditionally to prevent build failures
let MonthlyHeatmap: any = null
try {
  MonthlyHeatmap = require('@/app/components/mood/MonthlyHeatmap').default
} catch (error) {
  console.warn('MonthlyHeatmap not available:', error)
}

interface PublicMoodSectionProps {
  moodData: any[];
  profileName: string;
}

interface MetricPillProps {
  label: string;
  value: number;
  max: number;
  palette: 'mood' | 'sleep' | 'pain';
  className?: string;
}

const MetricPill = ({ label, value, max, palette, className = '' }: MetricPillProps) => {
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

  const bg = getPalette();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="text-sm font-medium text-gray-700 min-w-[60px]">{label}</div>
      <div className="flex items-center space-x-2">
        <div
          className="h-4 w-32 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: bg }}
          aria-label={`${label} ${value} of 10`}
        />
        <div className="text-lg font-bold text-gray-900">{value}/{max}</div>
      </div>
    </div>
  );
};

export default function PublicMoodSection({ moodData, profileName }: PublicMoodSectionProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Get today's entry (most recent)
  const todayEntry = moodData.length > 0 ? moodData[moodData.length - 1] : null;

  // Get selected chips (max 4)
  const selectedChips = todayEntry?.tags?.map((tag: string) => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  const displayChips = selectedChips.slice(0, 4);

  // Calculate 7-day averages (memoized for performance)
  const { avgMood, avgSleep, avgPain } = useMemo(() => {
    const last7Days = moodData.slice(-7);
    
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
  }, [moodData, todayEntry]);

  // Generate heatmap data (last 14 days)
  const heatmapData = useMemo(() => {
    const last14Days = moodData.slice(-14);
    return last14Days.map(day => ({
      date: day.date,
      mood: day.mood,
      pain: day.pain,
      hasData: day.mood !== null || day.pain !== null
    }));
  }, [moodData]);

  if (!todayEntry || (!todayEntry.mood && !todayEntry.sleep_quality && !todayEntry.pain)) {
    return null; // Don't show section if no mood data
  }

  // Debug logging
  console.log('PublicMoodSection rendering with:', { todayEntry, moodData: moodData.length });

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200/60 px-4 pt-4 pb-6 mb-6" style={{ backgroundColor: '#f3f4f6' }}>
      {/* Updated layout v4 - horizontal mood/sleep/pain layout matches dashboard */}
      {/* Single Column Layout */}
      <div className="w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-3">
          <h3 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>Mood Tracker</h3>
          <div className="flex items-center space-x-2">
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
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!collapsed && (
          <div className="px-6 pb-4">
            {/* Top Row: Chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {displayChips.map((chip, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full"
                >
                  {chip?.icon} {chip?.label}
                </span>
              ))}
            </div>

            {/* Mood, Sleep, Pain Row - Horizontal Layout */}
            <div className="flex justify-around items-center mb-5">
              {todayEntry.mood !== null && (
                <MetricPill
                  label="Mood"
                  value={todayEntry.mood}
                  max={10}
                  palette="mood"
                  className="flex-1 max-w-[200px]"
                />
              )}
              {todayEntry.sleep_quality !== null && (
                <MetricPill
                  label="Sleep Quality"
                  value={todayEntry.sleep_quality}
                  max={10}
                  palette="sleep"
                  className="flex-1 max-w-[200px]"
                />
              )}
              {todayEntry.pain !== null && (
                <MetricPill
                  label="Pain"
                  value={todayEntry.pain}
                  max={10}
                  palette="pain"
                  className="flex-1 max-w-[200px]"
                />
              )}
            </div>

            {/* Weekly Averages */}
            <div className="text-center text-sm text-gray-600">
              <span className="font-medium">This week's average:</span>{' '}
              {avgMood !== '—' && <span>Mood {avgMood}</span>}
              {avgMood !== '—' && avgSleep !== '—' && <span> • </span>}
              {avgSleep !== '—' && <span>Sleep {avgSleep}</span>}
              {avgSleep !== '—' && avgPain !== '—' && <span> • </span>}
              {avgPain !== '—' && <span>Pain {avgPain}</span>}
            </div>
          </div>
        )}

        {/* Heatmap */}
        {showHeatmap && (
          <div className="px-6 pb-4">
            {MonthlyHeatmap && (
              <MonthlyHeatmap 
                monthlyData={moodData}
                onDayClick={() => {}} // No day detail for public profiles
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
