'use client';

import { useState, useEffect, useMemo } from 'react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';
import { Heart, Moon, Zap, Calendar } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mood Tracker</h2>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-sm hover:shadow-md"
        >
          <Calendar 
            className="w-4 h-4 inline mr-2"
            style={{ 
              color: 'white',
              fill: 'none',
              stroke: 'white',
              strokeWidth: '2'
            }} 
          />
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {/* Today's Metrics */}
      <div className="space-y-4 mb-6">
        {/* Chips */}
        {displayChips.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {displayChips.map((chip, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {chip?.icon} {chip?.label}
              </span>
            ))}
          </div>
        )}

        {/* Mood, Sleep, Pain Pills */}
        <div className="flex flex-col space-y-3">
          {todayEntry.mood !== null && (
            <MetricPill
              label="Mood"
              value={todayEntry.mood}
              max={10}
              palette="mood"
            />
          )}
          {todayEntry.sleep_quality !== null && (
            <MetricPill
              label="Sleep"
              value={todayEntry.sleep_quality}
              max={10}
              palette="sleep"
            />
          )}
          {todayEntry.pain !== null && (
            <MetricPill
              label="Pain"
              value={todayEntry.pain}
              max={10}
              palette="pain"
            />
          )}
        </div>

        {/* Weekly Averages */}
        <div className="text-center text-sm text-gray-600 pt-2">
          <span className="font-medium">This week's average:</span>{' '}
          {avgMood !== '—' && <span>Mood {avgMood}</span>}
          {avgMood !== '—' && avgSleep !== '—' && <span> • </span>}
          {avgSleep !== '—' && <span>Sleep {avgSleep}</span>}
          {avgSleep !== '—' && avgPain !== '—' && <span> • </span>}
          {avgPain !== '—' && <span>Pain {avgPain}</span>}
        </div>
      </div>

      {/* Heatmap */}
      {showHeatmap && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">14-Day Trend</h3>
          <div className="grid grid-cols-14 gap-1">
            {heatmapData.map((day, index) => {
              const hasMood = day.mood !== null;
              const hasPain = day.pain !== null;
              const intensity = hasMood ? (day.mood! / 10) : (hasPain ? (day.pain! / 10) : 0);
              
              return (
                <div
                  key={index}
                  className={`h-6 w-6 rounded-sm ${
                    hasMood || hasPain
                      ? intensity < 0.3
                        ? 'bg-red-200'
                        : intensity < 0.6
                        ? 'bg-yellow-200'
                        : 'bg-green-200'
                      : 'bg-gray-100'
                  }`}
                  title={`${day.date}: ${hasMood ? `Mood ${day.mood}` : ''}${hasMood && hasPain ? ', ' : ''}${hasPain ? `Pain ${day.pain}` : ''}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Click on a day to see details
          </p>
        </div>
      )}
    </div>
  );
}
