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
}

const MiniMeter = ({ label, value, variant = 'mood' }: MiniMeterProps) => {
  const percentage = (value / 10) * 100;
  
  const getGradient = () => {
    if (variant === 'pain') {
      // Pain: red ramp (0-2: #FEE2E2, 3-5: #FCA5A5, 6-8: #EF4444, 9-10: #B91C1C)
      if (value <= 2) return 'from-red-200 to-red-300';
      if (value <= 5) return 'from-red-300 to-red-400';
      if (value <= 8) return 'from-red-400 to-red-500';
      return 'from-red-600 to-red-700';
    } else {
      // Mood/Sleep: BioStackr gradient (red → amber → green)
      if (value <= 2) return 'from-red-400 to-red-500';
      if (value <= 4) return 'from-red-500 to-amber-400';
      if (value <= 6) return 'from-amber-400 to-amber-500';
      if (value <= 8) return 'from-amber-500 to-green-400';
      return 'from-green-400 to-green-500';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="relative w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900">{value}/10</span>
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
    if (value === null || value === undefined) return 'bg-gray-200'; // Neutral color for no data
    
    const percentage = (value / 10) * 100;
    if (mode === 'pain') {
      // Pain: red ramp (0-2: #FEE2E2, 3-5: #FCA5A5, 6-8: #EF4444, 9-10: #B91C1C)
      if (percentage <= 20) return 'bg-red-200';
      if (percentage <= 50) return 'bg-red-300';
      if (percentage <= 80) return 'bg-red-500';
      return 'bg-red-700';
    } else {
      // Mood: BioStackr gradient (red → amber → green)
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

  return (
    <div className="flex gap-1">
      {fourteenDays.map((day, index) => (
        <button
          key={index}
          onClick={() => onEditDay(day.date)}
          className={`w-4 h-4 rounded-sm ${getDayColor(day[mode])} hover:ring-1 hover:ring-indigo-400 transition-all`}
          title={`${new Date(day.date).toLocaleDateString()} - ${mode}: ${day[mode] || 'N/A'}`}
        />
      ))}
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

  const getSnapshotText = () => {
    if (!todayEntry?.actions_snapshot) return 'No actions logged yet.';
    
    const { actions_snapshot } = todayEntry;
    const parts = [];
    
    if (actions_snapshot.supplements_taken_count) {
      parts.push(`${actions_snapshot.supplements_taken_count} supps`);
    }
    if (actions_snapshot.meds_taken_count) {
      parts.push(`${actions_snapshot.meds_taken_count} med`);
    }
    if (actions_snapshot.movement_minutes) {
      parts.push(`${actions_snapshot.movement_minutes}m move`);
    }
    if (actions_snapshot.mindfulness_minutes) {
      parts.push(`${actions_snapshot.mindfulness_minutes}m mind`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No actions logged yet.';
  };

  // Get selected chips
  const selectedChips = todayEntry?.tags?.map(tag => 
    CHIP_CATALOG.find(chip => chip.slug === tag)
  ).filter(Boolean) || [];

  // Calculate weekly averages
  const weeklyAverages = () => {
    const last7Days = fourteenDayData.slice(-7);
    const moodValues = last7Days.map(day => day.mood).filter(val => val !== null && val !== undefined);
    const sleepValues = last7Days.map(day => day.sleep_quality).filter(val => val !== null && val !== undefined);
    const painValues = last7Days.map(day => day.pain).filter(val => val !== null && val !== undefined);
    
    const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : 'N/A';
    const avgSleep = sleepValues.length > 0 ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : 'N/A';
    const avgPain = painValues.length > 0 ? (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1) : 'N/A';
    
    return { avgMood, avgSleep, avgPain };
  };

  const averages = weeklyAverages();

  return (
    <div className="rounded-xl border border-gray-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Today</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEditToday}
            className="text-base text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit today
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-base text-gray-600 hover:text-gray-800 font-medium"
          >
            {isExpanded ? 'Collapse ▴' : 'Expand ▾'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4 space-y-4">
        {/* Selected Chips - Full Width */}
        {selectedChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedChips.map((chip, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm rounded-full border border-gray-200 bg-gray-50 text-gray-700"
              >
                {chip?.icon} {chip?.label}
              </span>
            ))}
          </div>
        )}

        {/* Meters - Horizontal Layout */}
        <div className="flex justify-between items-center py-2">
          <MiniMeter 
            label="Mood" 
            value={todayEntry?.mood || 5} 
            variant="mood" 
          />
          <MiniMeter 
            label="Sleep" 
            value={todayEntry?.sleep_quality || 5} 
            variant="mood" 
          />
          <MiniMeter 
            label="Pain" 
            value={todayEntry?.pain || 0} 
            variant="pain" 
          />
        </div>

        {/* Heatmap - Full Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <TogglePills 
              options={['Mood', 'Pain']} 
              selected={heatmapMode === 'mood' ? 'Mood' : 'Pain'}
              onSelect={(option) => setHeatmapMode(option.toLowerCase() as 'mood' | 'pain')}
            />
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View month →
            </button>
          </div>
          <Heatmap 
            data={fourteenDayData} 
            mode={heatmapMode} 
            onDayClick={onEditDay} 
          />
        </div>

        {/* Weekly Averages and Snapshot - Horizontal */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <span className="font-medium">This Week:</span>{' '}
            Avg Mood {averages.avgMood} • Avg Sleep {averages.avgSleep} • Avg Pain {averages.avgPain}
          </div>
          <div className="text-gray-700">
            <span className="font-medium">Snapshot:</span> {getSnapshotText()}
          </div>
        </div>
      </div>
    </div>
  );
}