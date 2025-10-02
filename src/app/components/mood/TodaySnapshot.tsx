'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-medium text-gray-700 min-w-[50px]">{label}</span>
      <div className="relative w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[12px] font-semibold text-gray-900 min-w-[28px] text-right">{value}/10</span>
    </div>
  );
};

interface MicroHeatmapProps {
  data: Array<{
    date: string;
    mood?: number | null;
    pain?: number | null;
    hasJournal?: boolean;
  }>;
  mode: 'mood' | 'pain';
  onDayClick: (date: string) => void;
}

const MicroHeatmap = ({ data, mode, onDayClick }: MicroHeatmapProps) => {
  const getDayColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'bg-gray-100';
    
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

  return (
    <div className="flex gap-0.5">
      {data.slice(-14).map((day, index) => (
        <button
          key={index}
          onClick={() => onDayClick(day.date)}
          className={`w-3 h-3 rounded-md ${getDayColor(day[mode])} hover:ring-1 hover:ring-indigo-400 transition-all`}
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
        className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
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

  // Load 14-day data for micro heatmap
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

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSnapshotText = () => {
    if (!todayEntry?.actions_snapshot) {
      return "No actions logged yet.";
    }
    
    const snap = todayEntry.actions_snapshot;
    const parts = [];
    
    if (snap.supplements_taken_count) parts.push(`${snap.supplements_taken_count} supps`);
    if (snap.meds_taken_count) parts.push(`${snap.meds_taken_count} med`);
    if (snap.movement_minutes) parts.push(`${snap.movement_minutes}m move`);
    if (snap.mindfulness_minutes) parts.push(`${snap.mindfulness_minutes}m mind`);
    
    return parts.length > 0 ? parts.join(' • ') : "No actions logged yet.";
  };

  return (
    <section className="rounded-xl border border-gray-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div>
          <span className="text-sm font-semibold text-gray-900">Today Snapshot</span>
          <span className="ml-2 text-xs text-gray-500">
            {formatDate()} • Day {streak}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onEditToday}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Edit today
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 items-center gap-4 px-4 pb-3">
        <div className="col-span-12 lg:col-span-8">
          {/* Three Mini Meters */}
          <div className="flex flex-wrap items-center gap-6">
            <MiniMeter 
              label="Mood" 
              value={todayEntry?.mood || 5} 
              variant="mood"
            />
            <MiniMeter 
              label="SleepQ" 
              value={todayEntry?.sleep_quality || 5} 
              variant="mood"
            />
            <MiniMeter 
              label="Pain" 
              value={todayEntry?.pain || 0} 
              variant="pain"
            />
          </div>
          
          {/* Snapshot Line */}
          <div className="mt-2 text-[13px] text-gray-700">
            <span className="font-medium">Snapshot:</span> {getSnapshotText()}
          </div>
        </div>

        {/* Right: micro heatmap */}
        <div className="col-span-12 lg:col-span-4">
          <MicroHeatmap 
            data={fourteenDayData} 
            mode={heatmapMode} 
            onDayClick={onEditDay}
          />
          <div className="mt-1 flex items-center justify-between">
            <TogglePills 
              options={['Mood', 'Pain']} 
              selected={heatmapMode === 'mood' ? 'Mood' : 'Pain'}
              onSelect={(option) => setHeatmapMode(option.toLowerCase() as 'mood' | 'pain')}
            />
            <a 
              href="#" 
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View month →
            </a>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-4">
          {/* Last 14 days strip */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Last 14 days</h4>
            <div className="flex gap-1">
              {fourteenDayData.slice(-14).map((day, index) => (
                <button
                  key={index}
                  onClick={() => onEditDay(day.date)}
                  className={`w-7 h-7 rounded-md text-[10px] font-medium text-white ${
                    day[heatmapMode] !== null && day[heatmapMode] !== undefined
                      ? heatmapMode === 'pain'
                        ? day[heatmapMode] <= 2 ? 'bg-red-200' : day[heatmapMode] <= 5 ? 'bg-red-300' : day[heatmapMode] <= 8 ? 'bg-red-500' : 'bg-red-700'
                        : day[heatmapMode] <= 2 ? 'bg-red-500' : day[heatmapMode] <= 4 ? 'bg-red-500' : day[heatmapMode] <= 6 ? 'bg-amber-400' : day[heatmapMode] <= 8 ? 'bg-amber-500' : 'bg-green-500'
                      : 'bg-gray-100'
                  } hover:ring-2 hover:ring-indigo-400 transition-all`}
                  title={`${new Date(day.date).toLocaleDateString()} - ${heatmapMode}: ${day[heatmapMode] || 'N/A'}`}
                >
                  {new Date(day.date).getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* This Week averages */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">This Week</h4>
            <div className="text-sm text-gray-600">
              Avg Mood 6.2 · Avg SleepQ 6.9 · Avg Pain 2.1
            </div>
          </div>
        </div>
      )}
    </section>
  );
}