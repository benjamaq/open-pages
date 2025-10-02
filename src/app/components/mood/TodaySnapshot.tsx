'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

interface MeterProps {
  label: string;
  value: number;
  max: number;
  palette: 'mood' | 'sleep' | 'pain';
  onClick?: () => void;
  className?: string;
}

const Meter = ({ label, value, max, palette, onClick, className = '' }: MeterProps) => {
  const percentage = (value / max) * 100;
  
  const getPalette = () => {
    if (palette === 'pain') {
      // Pain: blue-grey→orange→red (bad = red)
      if (value <= 2) return 'from-[#B7C3D0] to-[#B7C3D0]';
      if (value <= 4) return 'from-[#B7C3D0] to-[#F59E0B]';
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

  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      <span className="text-sm font-medium text-gray-700 min-w-[50px]">{label}</span>
      <div className="flex-1 relative h-2 rounded-full bg-gray-100 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getPalette()} rounded-full transition-all duration-200`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 min-w-[28px] text-right">
        {value}/{max}
      </span>
    </div>
  );
};

interface ToggleGroupProps {
  options: string[];
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const ToggleGroup = ({ options, defaultValue, value, onValueChange }: ToggleGroupProps) => {
  const [selected, setSelected] = useState(value || defaultValue);
  
  const handleSelect = (option: string) => {
    setSelected(option);
    onValueChange?.(option);
  };

  return (
    <div className="flex gap-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => handleSelect(option)}
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
};

interface HeatmapCellProps {
  value: number | null | undefined;
  isToday: boolean;
  mode: 'mood' | 'pain';
  onClick: () => void;
}

const HeatmapCell = ({ value, isToday, mode, onClick }: HeatmapCellProps) => {
  const getCellColor = () => {
    if (value === null || value === undefined) {
      // Empty days: faint neutral with hint of green for mood, blue-grey for pain
      return mode === 'pain' ? 'bg-gray-200' : 'bg-green-100';
    }
    
    const percentage = (value / 10) * 100;
    if (mode === 'pain') {
      // Pain: blue-grey→orange→red
      if (percentage <= 20) return 'bg-[#B7C3D0]';
      if (percentage <= 40) return 'bg-[#B7C3D0]';
      if (percentage <= 60) return 'bg-[#F59E0B]';
      if (percentage <= 80) return 'bg-[#F59E0B]';
      return 'bg-[#EF4444]';
    } else {
      // Mood: red→amber→green
      if (percentage <= 20) return 'bg-[#E54D2E]';
      if (percentage <= 40) return 'bg-[#E54D2E]';
      if (percentage <= 60) return 'bg-[#F5A524]';
      if (percentage <= 80) return 'bg-[#F5A524]';
      return 'bg-[#22C55E]';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-3 h-3 rounded-sm ${getCellColor()} hover:ring-1 hover:ring-indigo-400 transition-all ${
        isToday ? 'ring-2 ring-indigo-500' : ''
      }`}
      title={`${new Date().toLocaleDateString()} - ${mode}: ${value || 'N/A'}`}
    />
  );
};

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

  // Generate 14 days of data
  const generate14Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingDay = fourteenDayData.find(d => d.date === dateStr);
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
    <div className="p-4 rounded-xl border border-gray-200/60 bg-white shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">
          Today — {formatDate(new Date())}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEditToday}
            className="text-sm text-gray-900 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Toggle snapshot"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Row 1 — Chips */}
      {displayChips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {displayChips.map((chip, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-50 text-gray-700"
            >
              {chip?.icon} {chip?.label}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-100 text-gray-600">
              +{remainingCount}
            </span>
          )}
        </div>
      )}

      {/* Row 2 — Meters */}
      <div className="mt-2 flex items-center gap-6">
        <Meter 
          label="Mood" 
          value={todayEntry?.mood || 0} 
          max={10} 
          palette="mood" 
          onClick={onEditToday}
          className="flex-1" 
        />
        <Meter 
          label="SleepQ" 
          value={todayEntry?.sleep_quality || 0} 
          max={10} 
          palette="sleep" 
          onClick={onEditToday}
          className="flex-1" 
        />
        <Meter 
          label="Pain" 
          value={todayEntry?.pain || 0} 
          max={10} 
          palette="pain" 
          onClick={onEditToday}
          className="flex-1" 
        />
      </div>

      {/* Row 3 — 14-day strip */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div /> {/* spacer */}
          <ToggleGroup 
            options={['Mood', 'Pain']} 
            defaultValue="Mood"
            value={heatmapMode === 'mood' ? 'Mood' : 'Pain'}
            onValueChange={(value) => setHeatmapMode(value.toLowerCase() as 'mood' | 'pain')}
          />
        </div>
        <div className="mt-2 grid grid-cols-14 gap-1.5">
          {fourteenDays.map((day, index) => (
            <HeatmapCell
              key={index}
              value={day[heatmapMode]}
              isToday={day.date === today}
              mode={heatmapMode}
              onClick={() => onEditDay(day.date)}
            />
          ))}
        </div>
      </div>

      {/* Row 4 — Caption */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Avg {heatmapMode} last 7 days: {average}</span>
        <button className="hover:underline">View month →</button>
      </div>
    </div>
  );
}