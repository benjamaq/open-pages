'use client';

import { useState, useEffect, useMemo } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';
import { ChevronDown, Calendar } from 'lucide-react';
import FirstTimeTooltip from '../../../components/FirstTimeTooltip';
import MonthlyHeatmap from './MonthlyHeatmap';
import DayDetailView from './DayDetailView';
import SymptomAnalysisCard from '../../../components/elli/SymptomAnalysisCard';
import { getAllElliMessages } from '../../../lib/db/elliMessages';
import { createClient } from '@/lib/supabase/client';
import { InsightsSection } from '../../dash/components/InsightsSection';
import { getMonthData } from '../../../lib/db/mood';
import SupplementsTodayChecklist from './SupplementsTodayChecklist';

interface TodaySnapshotProps {
  userId?: string;
  todayEntry?: {
    mood?: number | null;
    sleep_quality?: number | null;
    pain?: number | null;
    tags?: string[] | null;
    journal?: string | null;
    symptoms?: string[] | null;
    pain_locations?: string[] | null;
    pain_types?: string[] | null;
    custom_symptoms?: string[] | null;
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
  userName?: string;
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
  userId,
  todayEntry,
  todayItems,
  onEditToday,
  onEditDay,
  onRefresh,
  streak = 0,
  userName = 'User'
}: TodaySnapshotProps) {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [quickStats, setQuickStats] = useState<{ avgMood: string; avgSleep: string; avgPain: string; readinessAvg?: string; readinessDelta?: string } | null>(null);

  async function loadHistory() {
    if (loadingHistory || history) return;
    setLoadingHistory(true);
    try {
      if (!userId) {
        setHistory([]);
      } else {
        const messages = await getAllElliMessages(userId, 10);
        setHistory(messages);
      }
    } catch (err) {
      console.error('Failed to load Elli history:', err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Compute lightweight quick stats (7-day averages) for a “lively” feel without AI
  useEffect(() => {
    const loadStats = async () => {
      try {
        const monthStr = new Date().toISOString().slice(0, 7);
        const res = await fetch('/api/mood/month?month=' + monthStr, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || [];
          const last7 = data.slice(-7);
          const prev7 = data.slice(-14, -7);
          const m = last7.map((d: any) => d.mood).filter((v: any) => v != null);
          const s = last7.map((d: any) => d.sleep_quality).filter((v: any) => v != null);
          const p = last7.map((d: any) => d.pain).filter((v: any) => v != null);
          const readiness = (rows: any[]) => rows.map((d: any) => {
            const mood = d.mood ?? 5; const sleep = d.sleep_quality ?? 5; const pain = d.pain ?? 0;
            return Math.round(((mood*0.2)+(sleep*0.4)+((10-pain)*0.4))*10);
          });
          const avg = (arr: number[]) => arr.length ? (Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10).toFixed(1) : '—';
          const avgPct = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length).toString() + '%' : '—';
          const rLast = readiness(last7); const rPrev = readiness(prev7);
          const readinessAvg = avgPct(rLast);
          const readinessDelta = (rLast.length && rPrev.length) ? (()=>{
            const avgLast = Math.round(rLast.reduce((a,b)=>a+b,0)/rLast.length);
            const avgPrev = Math.round(rPrev.reduce((a,b)=>a+b,0)/rPrev.length);
            const diff = avgLast - avgPrev; const sign = diff>0?'+':'';
            return `${sign}${diff}%`;
          })() : '—';
          setQuickStats({ avgMood: avg(m), avgSleep: avg(s), avgPain: avg(p), readinessAvg, readinessDelta });
        }
      } catch {}
    };
    loadStats();
  }, []);

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

  // 🎯 Calculate Readiness Score (Mood 20%, Sleep 40%, Pain 40%) → convert to %
  const readinessScore = useMemo(() => {
    const mood = todayEntry?.mood ?? 5;
    const sleep = todayEntry?.sleep_quality ?? 5;
    const pain = todayEntry?.pain ?? 0;
    
    // Pain is inverted (0 = best, 10 = worst)
    const painInverted = 10 - pain;
    
    // Calculate weighted score
    const score = (mood * 0.2) + (sleep * 0.4) + (painInverted * 0.4);
    
    // Convert to percentage (0–100) and round
    return Math.round(score * 10);
  }, [todayEntry?.mood, todayEntry?.sleep_quality, todayEntry?.pain]);

  // Get color and label for readiness score
  const getReadinessMeta = (pct: number) => {
    if (pct >= 80) return { color: 'text-[#22c55e]', emoji: '☀️', message: 'Optimal capacity. Great day to tackle what matters most.' };
    if (pct >= 50) return { color: 'text-[#f59e0b]', emoji: '⛵', message: 'Balanced energy. Listen to your body and move thoughtfully today.' };
    return { color: 'text-[#ef4444]', emoji: '🏖️', message: 'Recovery focus. Prioritize rest and essential tasks only.' };
  };

  // Memoize checkInData to prevent unnecessary re-renders in child components
  const checkInData = useMemo(() => {
    if (!todayEntry) return null;
    
    return {
      mood: todayEntry.mood || 5,
      sleep: todayEntry.sleep_quality || 5,
      pain: todayEntry.pain || 0,
      tags: todayEntry.tags || [],
      journal: todayEntry.journal || undefined,
      symptoms: todayEntry.symptoms || [],
      painLocations: todayEntry.pain_locations || [],
      painTypes: todayEntry.pain_types || [],
      customSymptoms: todayEntry.custom_symptoms || []
    };
  }, [
    todayEntry?.mood,
    todayEntry?.sleep_quality,
    todayEntry?.pain,
    todayEntry?.tags?.join(','),
    todayEntry?.journal,
    todayEntry?.symptoms?.join(','),
    todayEntry?.pain_locations?.join(','),
    todayEntry?.pain_types?.join(','),
    todayEntry?.custom_symptoms?.join(',')
  ]);

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
        
        {/* (Welcome moved to Elli section when no check-in today) */}


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
              <h2 className="text-xl font-bold text-gray-900">Mood Tracker</h2>
              <div className="flex items-center gap-2">
                <button onClick={onEditToday} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-xs rounded-md font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm">Check in</button>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2 py-1.5 text-xs rounded-md font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm ${showHeatmap ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-purple-50 text-purple-700 border-2 border-purple-300 hover:bg-purple-100'}`}
                >
                  {showHeatmap ? 'Hide' : 'Last 30 Days'}
                </button>
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

            {/* SECTION 1: METRICS */}
            {/* Sliders */}
            <div className="grid grid-cols-3 gap-4 mb-6">
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
            {/* Weekly Averages + Readiness + Wearables (3-column grid) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">This week's averages</div>
                <div className="text-sm text-gray-700">Mood {avgMood} • Sleep {avgSleep} • Pain {avgPain}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Daily Readiness Score</div>
                <div className="border-2 border-black rounded-lg p-3 bg-white">
                  <div className={`text-3xl font-bold leading-none ${getReadinessMeta(readinessScore).color}`}>{readinessScore}%</div>
                </div>
                <div className="mt-2 text-sm text-gray-900 text-center w-full px-2">
                  <span className="mr-1 text-base">{getReadinessMeta(readinessScore).emoji}</span>
                  {getReadinessMeta(readinessScore).message}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                {todayEntry?.wearables?.device ? `${todayEntry.wearables.device} connected` : 'No wearables data'}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* SECTION 2: ELLI */}
            {(() => {
              const hasCheckinToday = !!(todayEntry && (todayEntry.mood != null || todayEntry.sleep_quality != null || todayEntry.pain != null));
              return (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">💙</span>
                      <span className="text-base sm:text-lg font-semibold text-gray-800">Elli says...</span>
                    </div>
                    <button onClick={() => { setShowHistory(prev => !prev); if (!history) loadHistory(); }} className="text-xs text-purple-700 hover:text-purple-900">Daily Summaries</button>
                  </div>
                  {hasCheckinToday && checkInData ? (
                    <SymptomAnalysisCard checkInData={checkInData} userName={userName} />
                  ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💙</span>
                        <div className="flex-1">
                          <TypeAnimation
                            sequence={[(() => { const h=new Date().getHours(); const greet = h<12?`Good morning, ${userName}! Welcome back.`: h<18?`Good afternoon, ${userName}! Welcome back.`:`Good evening, ${userName}! Welcome back.`; return `${greet}\n\nReady to check in? Let's see how today's treating you—every check-in helps us spot what's working.`; })()]}
                            speed={35}
                            wrapper="p"
                            className="text-[15px] sm:text-base text-gray-800 leading-relaxed"
                            cursor={false}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {showHistory && (
                    <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">Recent messages</p>
                          {loadingHistory && <span className="text-xs text-gray-500">Loading…</span>}
                        </div>
                        {history && history.length === 0 && <p className="text-sm text-gray-500 mt-2">No history yet.</p>}
                        {history && history.length > 0 && (
                          <ul className="space-y-2 max-h-56 overflow-auto mt-2">
                            {history.map((msg: any) => (
                              <li key={msg.id} className="p-3 bg-white rounded-md border border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                                  <span className="text-[10px] uppercase tracking-wide text-gray-400">{msg.message_type}</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{msg.message_text}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* SECTION 3: PATTERNS */}
            <InsightsFetcher userId={userId} />

            {/* Patterns moved to separate card below per new hierarchy */}

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

function InsightsFetcher({ userId }: { userId?: string }) {
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      const supabase = createClient()
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data } = await supabase
        .from('elli_messages')
        .select('id, created_at, context, is_primary')
        .eq('user_id', userId)
        .eq('message_type', 'insight')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(25)
      setInsights(data || [])
    }
    load()
  }, [userId])

  return <InsightsSection insights={insights} />
}