'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TodaySnapshotProps {
  todayEntry?: {
    mood?: number | null;
    energy?: number | null;
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
  variant?: 'default' | 'pain';
}

const MiniMeter = ({ label, value, variant = 'default' }: MiniMeterProps) => {
  const percentage = (value / 10) * 100;
  
  const getGradient = () => {
    if (variant === 'pain') {
      // Pain: red ramp
      if (value <= 2) return 'from-red-200 to-red-300';
      if (value <= 4) return 'from-red-300 to-red-400';
      if (value <= 6) return 'from-red-400 to-red-500';
      if (value <= 8) return 'from-red-500 to-red-600';
      return 'from-red-600 to-red-700';
    } else {
      // Mood/Energy/Sleep: red → amber → green
      if (value <= 2) return 'from-red-400 to-red-500';
      if (value <= 4) return 'from-red-500 to-amber-400';
      if (value <= 6) return 'from-amber-400 to-amber-500';
      if (value <= 8) return 'from-amber-500 to-green-400';
      return 'from-green-400 to-green-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-medium text-gray-700 min-w-[40px]">{label}</span>
      <div className="relative w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[12px] font-semibold text-gray-900 min-w-[24px]">{value}/10</span>
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
  primary: 'mood' | 'pain';
  onDayClick: (date: string) => void;
}

const MicroHeatmap = ({ data, primary, onDayClick }: MicroHeatmapProps) => {
  const getDayColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'bg-gray-100';
    
    const percentage = (value / 10) * 100;
    if (primary === 'pain') {
      // Pain: red ramp
      if (percentage <= 20) return 'bg-red-200';
      if (percentage <= 40) return 'bg-red-300';
      if (percentage <= 60) return 'bg-red-400';
      if (percentage <= 80) return 'bg-red-500';
      return 'bg-red-600';
    } else {
      // Mood: red → amber → green
      if (percentage <= 20) return 'bg-red-400';
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
          className={`w-2 h-2 rounded-sm ${getDayColor(day[primary])} hover:ring-1 hover:ring-indigo-400 transition-all`}
          title={`${new Date(day.date).toLocaleDateString()} - ${primary}: ${day[primary] || 'N/A'}`}
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
  const [heatmapPrimary, setHeatmapPrimary] = useState<'mood' | 'pain'>('mood');
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
      day: 'numeric', 
      month: 'short' 
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

  const getChips = () => {
    return todayEntry?.tags || [];
  };

  const hasData = todayEntry && (
    todayEntry.mood !== null || 
    todayEntry.energy !== null || 
    todayEntry.sleep_quality !== null || 
    todayEntry.pain !== null
  );

  return (
    <section className="rounded-xl border border-gray-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Today Snapshot</span>
          <span className="text-xs text-gray-500">
            {formatDate()} • Day {streak}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onEditToday}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit today
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 items-center gap-4 px-4 pb-3">
        {/* Left: meters + snapshot/chips */}
        <div className="col-span-12 lg:col-span-8 space-y-1.5">
          {/* Metrics Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <MiniMeter 
              label="Mood" 
              value={todayEntry?.mood || 0} 
            />
            <MiniMeter 
              label="Energy" 
              value={todayEntry?.energy || 0} 
            />
            <MiniMeter 
              label="SleepQ" 
              value={todayEntry?.sleep_quality || 0} 
            />
            <MiniMeter 
              label="Pain" 
              value={todayEntry?.pain || 0} 
              variant="pain"
            />
          </div>

          {/* Snapshot & Chips Row */}
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-gray-700">
              <strong className="font-medium">Snapshot:</strong> {getSnapshotText()}
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <div className="flex items-center gap-1">
              {getChips().slice(0, 2).map((chip, index) => (
                <span 
                  key={index}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                >
                  {chip}
                </span>
              ))}
              {getChips().length > 2 && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  +{getChips().length - 2} more
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: micro heatmap */}
        <div className="col-span-12 lg:col-span-4">
          <MicroHeatmap 
            data={fourteenDayData} 
            primary={heatmapPrimary} 
            onDayClick={onEditDay}
          />
          <div className="mt-1 flex items-center justify-between">
            <TogglePills 
              options={['Mood', 'Pain']} 
              selected={heatmapPrimary}
              onSelect={(option) => setHeatmapPrimary(option.toLowerCase() as 'mood' | 'pain')}
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
          {/* Larger Heatmap */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">14-Day Overview</h4>
            <div className="flex gap-1">
              {fourteenDayData.slice(-14).map((day, index) => (
                <button
                  key={index}
                  onClick={() => onEditDay(day.date)}
                  className={`w-6 h-6 rounded-md text-[10px] font-medium text-white ${
                    day[heatmapPrimary] !== null && day[heatmapPrimary] !== undefined
                      ? heatmapPrimary === 'pain'
                        ? day[heatmapPrimary] <= 2 ? 'bg-red-200' : day[heatmapPrimary] <= 4 ? 'bg-red-300' : day[heatmapPrimary] <= 6 ? 'bg-red-400' : day[heatmapPrimary] <= 8 ? 'bg-red-500' : 'bg-red-600'
                        : day[heatmapPrimary] <= 2 ? 'bg-red-400' : day[heatmapPrimary] <= 4 ? 'bg-red-500' : day[heatmapPrimary] <= 6 ? 'bg-amber-400' : day[heatmapPrimary] <= 8 ? 'bg-amber-500' : 'bg-green-500'
                      : 'bg-gray-100'
                  } hover:ring-2 hover:ring-indigo-400 transition-all`}
                  title={`${new Date(day.date).toLocaleDateString()} - ${heatmapPrimary}: ${day[heatmapPrimary] || 'N/A'}`}
                >
                  {new Date(day.date).getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Full Chips List */}
          {getChips().length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Happened Today</h4>
              <div className="flex flex-wrap gap-2">
                {getChips().map((chip, index) => (
                  <span 
                    key={index}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions Snapshot Details */}
          {todayEntry?.actions_snapshot && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Today's Actions Snapshot</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  {todayEntry.actions_snapshot.supplements_taken_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supplements:</span>
                      <span className="font-medium">{todayEntry.actions_snapshot.supplements_taken_count}</span>
                    </div>
                  )}
                  {todayEntry.actions_snapshot.meds_taken_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medications:</span>
                      <span className="font-medium">{todayEntry.actions_snapshot.meds_taken_count}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {todayEntry.actions_snapshot.movement_minutes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Movement:</span>
                      <span className="font-medium">{todayEntry.actions_snapshot.movement_minutes}m</span>
                    </div>
                  )}
                  {todayEntry.actions_snapshot.mindfulness_minutes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mindfulness:</span>
                      <span className="font-medium">{todayEntry.actions_snapshot.mindfulness_minutes}m</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Weekly Averages */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">This Week</h4>
            <div className="text-sm text-gray-600">
              Average Mood: 6.2 • Average Energy: 5.8 • Average Sleep: 7.2h
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
