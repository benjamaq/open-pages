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
  streak?: number;
}

interface MetricPillProps {
  label: string;
  value: number;
  palette: 'mood' | 'sleep' | 'pain';
}

const MetricPill = ({ label, value, palette }: MetricPillProps) => {
  const pct = Math.max(0, Math.min(10, value)) / 10; // 0..1
  
  const getGradient = (palette: string, percentage: number) => {
    if (palette === 'mood') {
      if (percentage <= 0.2) return 'linear-gradient(to right, #E54D2E, #E54D2E)';
      if (percentage <= 0.4) return 'linear-gradient(to right, #E54D2E, #F5A524)';
      if (percentage <= 0.6) return 'linear-gradient(to right, #F5A524, #F5A524)';
      if (percentage <= 0.8) return 'linear-gradient(to right, #F5A524, #22C55E)';
      return 'linear-gradient(to right, #22C55E, #22C55E)';
    } else if (palette === 'sleep') {
      if (percentage <= 0.2) return 'linear-gradient(to right, #E54D2E, #E54D2E)';
      if (percentage <= 0.4) return 'linear-gradient(to right, #E54D2E, #F59E0B)';
      if (percentage <= 0.6) return 'linear-gradient(to right, #F59E0B, #F59E0B)';
      if (percentage <= 0.8) return 'linear-gradient(to right, #F59E0B, #10B981)';
      return 'linear-gradient(to right, #10B981, #10B981)';
    } else { // pain
      if (percentage <= 0.2) return 'linear-gradient(to right, #A7F3D0, #A7F3D0)';
      if (percentage <= 0.4) return 'linear-gradient(to right, #A7F3D0, #F59E0B)';
      if (percentage <= 0.6) return 'linear-gradient(to right, #F59E0B, #F59E0B)';
      if (percentage <= 0.8) return 'linear-gradient(to right, #F59E0B, #EF4444)';
      return 'linear-gradient(to right, #EF4444, #EF4444)';
    }
  };

  const bg = value === 0 ? '#F3F4F6' : getGradient(palette, pct);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className="flex items-center">
        <div
          className="h-2.5 w-28 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: bg }}
          aria-label={`${label} ${value} of 10`}
        />
        <div className="ml-3 text-sm font-medium text-gray-900">{value}/10</div>
      </div>
    </div>
  );
};

export default function TodaySnapshot({ 
  todayEntry, 
  onEditToday, 
  onEditDay, 
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
  }, []);

  // Get selected chips
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

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
    <div className="rounded-xl border border-gray-200/60 bg-white shadow-sm p-4 md:p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-6">
        
        {/* Left Column — Metric Pills */}
        <div className="space-y-3">
          <MetricPill 
            label="Mood" 
            value={todayEntry?.mood || 0} 
            palette="mood" 
          />
          <MetricPill 
            label="SleepQ" 
            value={todayEntry?.sleep_quality || 0} 
            palette="sleep" 
          />
          <MetricPill 
            label="Pain / Soreness" 
            value={todayEntry?.pain || 0} 
            palette="pain" 
          />
        </div>

        {/* Right Column — Actions & Context */}
        <div className="flex flex-col">
          {/* Top Row — Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={onEditToday}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
            <button 
              onClick={onEditToday}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-sm"
            >
              My daily check-in
            </button>
          </div>

          {/* Chips Row */}
          {selectedChips.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedChips.slice(0, 8).map((chip, index) => (
                  <button
                    key={index}
                    onClick={onEditToday}
                    className="rounded-full px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    aria-label={`Context: ${chip?.label}`}
                  >
                    {chip?.icon} {chip?.label}
                  </button>
                ))}
                {selectedChips.length > 8 && (
                  <span className="rounded-full px-3 py-1 text-sm bg-gray-200 text-gray-600">
                    +{selectedChips.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Averages Line */}
          <div className="mt-2 text-xs text-gray-500">
            Avg mood (7d): {avgMood} • Avg sleep (7d): {avgSleep} • Avg pain (7d): {avgPain}
          </div>
        </div>
      </div>
    </div>
  );
}