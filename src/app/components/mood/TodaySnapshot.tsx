'use client';

import { useState, useEffect } from 'react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';

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
      // Pain: blue-grey→orange→red (bad = red)
      if (value <= 2) return 'from-[#A7F3D0] to-[#A7F3D0]';
      if (value <= 4) return 'from-[#A7F3D0] to-[#F59E0B]';
      if (value <= 6) return 'from-[#F59E0B] to-[#F59E0B]';
      if (value <= 8) return 'from-[#F59E0B] to-[#EF4444]';
      return 'from-[#EF4444] to-[#EF4444]';
    } else {
      // Mood/Sleep: red→amber→green (good = green)
      if (value <= 2) return 'from-[#E54D2E] to-[#E54D2E]';
      if (value <= 4) return 'from-[#E54D2E] to-[#F5A524]';
      if (value <= 6) return 'from-[#F5A524] to-[#F5A524]';
      if (value <= 8) return 'from-[#F5A524] to-[#22C55E]';
      return 'from-[#22C55E] to-[#22C55E]';
    }
  };

  const bg = value === 0 ? '#16A34A' : getPalette();

  return (
    <div className={`flex flex-col items-center ${className}`} onClick={onClick}>
      <div className="text-lg font-semibold text-gray-800 mb-3">{label}</div>
      <div className="flex items-center">
        <div
          className="h-4 w-40 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: bg }}
          aria-label={`${label} ${value} of 10`}
        />
        <div className="ml-4 text-xl font-bold text-gray-900">{value}/{max}</div>
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

  // Load monthly data for averages
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
  }, [todayEntry]); // Refresh when todayEntry changes


  // Get selected chips (max 4)
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  const displayChips = selectedChips.slice(0, 4);

  // Debug logging
  console.log('TodaySnapshot - todayEntry:', todayEntry);
  console.log('TodaySnapshot - selectedChips:', selectedChips);

  // Calculate 7-day averages
  const calculateAverages = () => {
    const last7Days = monthlyData.slice(-7);
    const moodValues = last7Days.map(day => day.mood).filter(val => val !== null && val !== undefined);
    const sleepValues = last7Days.map(day => day.sleep_quality).filter(val => val !== null && val !== undefined);
    const painValues = last7Days.map(day => day.pain).filter(val => val !== null && val !== undefined);

    const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : '—';
    const avgSleep = sleepValues.length > 0 ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : '—';
    const avgPain = painValues.length > 0 ? (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1) : '—';

    return { avgMood, avgSleep, avgPain };
  };

  const { avgMood, avgSleep, avgPain } = calculateAverages();

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200/60 p-4 mb-6">
      {/* Single Column Layout */}
      <div className="w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Mood Tracker</h3>
          <button 
            onClick={onEditToday}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-sm hover:shadow-md"
          >
            My Daily Check-in
          </button>
        </div>

        {/* Chips Row */}
        {displayChips.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
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

        {/* This Week's Average Row */}
        <div className="flex justify-around items-center mb-4">
          <MetricPill 
            label={`This Week's Average - Mood ${avgMood}`}
            value={todayEntry?.mood || 0} 
            max={10} 
            palette="mood" 
            onClick={onEditToday}
            className="flex-1 max-w-[200px]"
          />
          <MetricPill 
            label={`This Week's Average - Sleep ${avgSleep}`}
            value={todayEntry?.sleep_quality || 0} 
            max={10} 
            palette="sleep" 
            onClick={onEditToday}
            className="flex-1 max-w-[200px]"
          />
          <MetricPill 
            label={`This Week's Average - Pain ${avgPain}`}
            value={todayEntry?.pain || 0} 
            max={10} 
            palette="pain" 
            onClick={onEditToday}
            className="flex-1 max-w-[200px]"
          />
        </div>


        {/* Edit Button - Bottom Right */}
        <div className="flex justify-end">
          <button 
            onClick={onEditToday}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}