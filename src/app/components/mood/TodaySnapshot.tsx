'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';

interface TodaySnapshotProps {
  todayEntry?: {
    mood?: number | null;
    sleep_quality?: number | null;
    pain?: number | null;
    sleep_hours?: number | null;
    night_wakes?: number | null;
    tags?: string[] | null;
    journal?: string | null;
    actions_snapshot?: any;
  } | null;
  onEditToday: () => void;
  onEditDay: (date: string) => void;
  streak?: number;
}

interface MiniMeterProps {
  label: string;
  value: number;
  variant?: 'mood' | 'pain';
  onClick?: () => void;
}

const MiniMeter = ({ label, value, variant = 'mood', onClick }: MiniMeterProps) => {
  const percentage = (value / 10) * 100;
  
  const getGradient = () => {
    if (variant === 'pain') {
      // Pain: blue-grey→orange→red (inverse feel)
      if (value <= 2) return 'from-slate-300 to-slate-400';
      if (value <= 4) return 'from-slate-400 to-orange-300';
      if (value <= 6) return 'from-orange-300 to-orange-400';
      if (value <= 8) return 'from-orange-400 to-red-400';
      return 'from-red-400 to-red-500';
    } else {
      // Mood/Sleep: red→amber→green
      if (value <= 2) return 'from-red-400 to-red-500';
      if (value <= 4) return 'from-red-500 to-amber-400';
      if (value <= 6) return 'from-amber-400 to-amber-500';
      if (value <= 8) return 'from-amber-500 to-green-400';
      return 'from-green-400 to-green-500';
    }
  };

  return (
    <div className="flex items-center gap-2" onClick={onClick}>
      <span className="text-sm font-medium text-gray-700 min-w-[50px]">{label}</span>
      <div className="relative w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-200`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 min-w-[28px] text-right">{value}/10</span>
    </div>
  );
};

interface HeatmapProps {
  data: Array<{
    date: string;
    mood?: number | null;
    pain?: number | null;
    hasJournal?: boolean;
  }>;
  mode: 'mood' | 'pain';
  onDayClick: (date: string) => void;
}

const Heatmap = ({ data, mode, onDayClick }: HeatmapProps) => {
  const getDayColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'bg-gray-200'; // Faint neutral for empty days
    
    const percentage = (value / 10) * 100;
    if (mode === 'pain') {
      // Pain: blue-grey→orange→red (inverse feel)
      if (percentage <= 20) return 'bg-slate-300';
      if (percentage <= 40) return 'bg-slate-400';
      if (percentage <= 60) return 'bg-orange-300';
      if (percentage <= 80) return 'bg-orange-400';
      return 'bg-red-400';
    } else {
      // Mood: red→amber→green
      if (percentage <= 20) return 'bg-red-500';
      if (percentage <= 40) return 'bg-red-500';
      if (percentage <= 60) return 'bg-amber-400';
      if (percentage <= 80) return 'bg-amber-500';
      return 'bg-green-500';
    }
  };

  // Generate 14 days of data, filling missing days with neutral colors
  const generate14Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingDay = data.find(d => d.date === dateStr);
      days.push({
        date: dateStr,
        mood: existingDay?.mood || null,
        pain: existingDay?.pain || null,
        hasJournal: existingDay?.hasJournal || false
      });
    }
    
    return days;
  };

  const fourteenDays = generate14Days();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-14 gap-1.5">
      {fourteenDays.map((day, index) => {
        const isToday = day.date === today;
        return (
          <button
            key={index}
            onClick={() => onDayClick(day.date)}
            className={`w-3 h-3 rounded-sm ${getDayColor(day[mode])} hover:ring-1 hover:ring-indigo-400 transition-all ${
              isToday ? 'ring-2 ring-indigo-500' : ''
            }`}
            title={`${new Date(day.date).toLocaleDateString()} - ${mode}: ${day[mode] || 'N/A'}`}
          />
        );
      })}
    </div>
  );
};

const TogglePills = ({ options, selected, onSelect }: { 
  options: string[]; 
  selected: string; 
  onSelect: (option: string) => void; 
}) => (
  <div className="flex gap-1">
    {options.map(option => (
      <button
        key={option}
        onClick={() => onSelect(option)}
        className={`px-2 py-1 text-xs rounded-full transition-colors ${
          selected === option 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
);

export default function TodaySnapshot({ 
  todayEntry, 
  onEditToday, 
  onEditDay, 
  streak = 0 
}: TodaySnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<'mood' | 'pain'>('mood');
  const [fourteenDayData, setFourteenDayData] = useState<any[]>([]);

  // Load 14-day data for heatmap
  useEffect(() => {
    const loadFourteenDayData = async () => {
      try {
        const response = await fetch('/api/mood/month?month=' + new Date().toISOString().slice(0, 7));
        if (response.ok) {
          const data = await response.json();
          setFourteenDayData(data.data || []);
        }
      } catch (error) {
        console.error('Error loading 14-day data:', error);
      }
    };

    loadFourteenDayData();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get selected chips (max 4, then +N)
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  const displayChips = selectedChips.slice(0, 4);
  const remainingCount = selectedChips.length - 4;

  // Calculate 7-day average
  const sevenDayAverage = () => {
    const last7Days = fourteenDayData.slice(-7);
    const values = last7Days.map(day => day[heatmapMode]).filter(val => val !== null && val !== undefined);
    
    if (values.length === 0) return 'N/A';
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg.toFixed(1);
  };

  const average = sevenDayAverage();

  return (
    <div className="rounded-xl border border-gray-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Today — {formatDate(new Date())}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEditToday}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit today ▸
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            {isExpanded ? 'Collapse ▲' : 'Expand ▾'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-2">
        {/* Meters + Chips Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Meters */}
          <div className="flex items-center gap-4">
            <MiniMeter 
              label="Mood" 
              value={todayEntry?.mood || 5} 
              variant="mood"
              onClick={onEditToday}
            />
            <MiniMeter 
              label="SleepQ" 
              value={todayEntry?.sleep_quality || 5} 
              variant="mood"
              onClick={onEditToday}
            />
            <MiniMeter 
              label="Pain" 
              value={todayEntry?.pain || 0} 
              variant="pain"
              onClick={onEditToday}
            />
          </div>

          {/* Chips */}
          {displayChips.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-auto">
              {displayChips.map((chip, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-50 text-gray-700 h-7 flex items-center"
                >
                  {chip?.icon} {chip?.label}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-100 text-gray-600 h-7 flex items-center">
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 14-day Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <TogglePills 
              options={['Mood', 'Pain']} 
              selected={heatmapMode === 'mood' ? 'Mood' : 'Pain'}
              onSelect={(option) => setHeatmapMode(option.toLowerCase() as 'mood' | 'pain')}
            />
            <button className="text-xs text-indigo-600 hover:text-indigo-700">
              View month →
            </button>
          </div>
          <Heatmap 
            data={fourteenDayData} 
            mode={heatmapMode} 
            onDayClick={onEditDay} 
          />
        </div>

        {/* Caption Line */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Avg {heatmapMode} last 7 days: {average}
          </div>
        </div>
      </div>
    </div>
  );
}