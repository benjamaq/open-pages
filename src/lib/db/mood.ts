'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type DailyEntry = {
  id: string;
  user_id: string;
  local_date: string;
  mood?: number | null;
  energy?: number | null;
  sleep_quality?: number | null;
  pain?: number | null;
  sleep_hours?: number | null;
  night_wakes?: number | null;
  tags?: string[] | null;
  journal?: string | null;
  meds?: any[] | null;
  protocols?: any[] | null;
  activity?: any[] | null;
  devices?: any[] | null;
  wearables?: any | null;
  created_at: string;
  updated_at: string;
};

export type SaveDailyEntryInput = {
  localDate: string; // 'YYYY-MM-DD' from client in user's tz
  mood?: number | null;
  sleep_quality?: number | null;
  pain?: number | null;
  sleep_hours?: number | null;
  night_wakes?: number | null;
  tags?: string[] | null;
  journal?: string | null;
  completedItems?: string[] | null; // Array of completed item keys from localStorage
  wearables?: any | null; // Wearables data (recovery_score, sleep_score, etc.)
};

// Context tag options - moved to separate file to avoid server action issues

export async function saveDailyEntry(input: SaveDailyEntryInput): Promise<{ ok: true; data: DailyEntry } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, error: 'Authentication required' };
    }

    // Call the RPC function to upsert with snapshot
    console.log('🔍 saveDailyEntry - Calling RPC with:', {
      p_user_id: user.id,
      p_local_date: input.localDate,
      p_mood: input.mood,
      p_sleep_quality: input.sleep_quality,
      p_pain: input.pain,
      p_night_wakes: input.night_wakes,
      p_tags: input.tags,
      p_journal: input.journal,
      p_completed_items: input.completedItems,
      p_wearables: input.wearables
    });
    
    const { data, error } = await supabase.rpc('upsert_daily_entry_and_snapshot', {
      p_user_id: user.id,
      p_local_date: input.localDate,
      p_mood: input.mood,
      p_sleep_quality: input.sleep_quality,
      p_pain: input.pain,
      p_night_wakes: input.night_wakes,
      p_tags: input.tags,
      p_journal: input.journal,
      p_completed_items: input.completedItems,
      p_wearables: input.wearables
    })

    // Handle function not found error gracefully
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.warn('upsert_daily_entry_and_snapshot function not found, falling back to basic insert')
      // Fallback to basic insert without snapshot
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('daily_entries')
        .upsert({
          user_id: user.id,
          local_date: input.localDate,
          mood: input.mood,
          sleep_quality: input.sleep_quality,
          pain: input.pain,
          sleep_hours: input.sleep_hours,
          night_wakes: input.night_wakes,
          tags: input.tags,
          journal: input.journal,
          wearables: input.wearables
        }, { onConflict: 'user_id,local_date' })
        .select()
        .single()
      
      if (fallbackError) {
        console.error('Fallback insert failed:', fallbackError)
        return { ok: false, error: 'Failed to save daily entry' }
      }
      
      return { ok: true, data: fallbackData }
    };

    if (error) {
      console.error('Error saving daily entry:', error);
      return { ok: false, error: error.message };
    }

    // Revalidate relevant paths
    revalidatePath('/dash');
    revalidatePath('/dash/mood');

    return { ok: true, data };
  } catch (error) {
    console.error('Error in saveDailyEntry:', error);
    return { ok: false, error: 'Failed to save daily entry' };
  }
}

export async function getTodayEntry(): Promise<DailyEntry | null> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // Get today's date in user's timezone
    const today = new Date().toLocaleDateString('sv-SE');

    // Get today's daily entry
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching today entry:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getTodayEntry:', error);
    return null;
  }
}

export type DayDatum = {
  date: string;
  mood?: number | null;
  energy?: number | null;
  sleep_quality?: number | null;
  pain?: number | null;
  sleep_hours?: number | null;
  night_wakes?: number | null;
  tags?: string[] | null;
  journal?: string | null;
  hasJournal?: boolean;
  markers?: Array<{ color: string; position: 'top' | 'bottom' }>;
  sleepBadge?: 'low' | undefined;
  readinessBadge?: 'low' | 'high' | undefined;
};

export async function getMonthData(month: string): Promise<DayDatum[]> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return [];
    }

    // Calculate month start/end
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const startDate = new Date(year, monthNum - 1, 1).toLocaleDateString('sv-SE');
    const endDate = new Date(year, monthNum, 0).toLocaleDateString('sv-SE');

    // Get daily entries for the month
    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('local_date', startDate)
      .lte('local_date', endDate)
      .order('local_date');

    if (entriesError) {
      console.error('Error fetching month data:', entriesError);
      return [];
    }

    // Transform data
    const dayData: DayDatum[] = [];
    const entriesMap = new Map(dailyEntries?.map(entry => [entry.local_date, entry]) || []);

    // Generate all days in the month
    const currentDate = new Date(year, monthNum - 1, 1);
    while (currentDate.getMonth() === monthNum - 1) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const entry = entriesMap.get(dateStr);
      
      if (entry) {
        dayData.push({
          date: dateStr,
          mood: entry.mood,
          energy: entry.energy,
          sleep_quality: entry.sleep_quality,
          pain: entry.pain,
          sleep_hours: entry.sleep_hours,
          night_wakes: entry.night_wakes,
          tags: entry.tags,
          journal: entry.journal,
          hasJournal: !!entry.journal,
          markers: [], // TODO: Add protocol markers
          sleepBadge: entry.sleep_hours && entry.sleep_hours < 6 ? 'low' : undefined,
          readinessBadge: undefined // Not used in new schema
        });
      } else {
        dayData.push({
          date: dateStr,
          mood: null,
          energy: null,
          sleep_quality: null,
          pain: null,
          sleep_hours: null,
          night_wakes: null,
          tags: null,
          journal: null,
          hasJournal: false,
          markers: [],
          sleepBadge: undefined,
          readinessBadge: undefined
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dayData;
  } catch (error) {
    console.error('Error in getMonthData:', error);
    return [];
  }
}

export type TrendsData = {
  series: Array<{ 
    date: string; 
    mood?: number; 
    pain?: number; 
    energy?: number;
    sleep?: number; 
    readiness?: number; 
  }>;
  weekly: Array<{ 
    weekStart: string; 
    avgMood?: number; 
    avgPain?: number;
    avgEnergy?: number;
  }>;
  markers: Array<{ 
    date: string; 
    label: string; 
    kind: 'program' | 'med'; 
  }>;
};

// Public mood data for profiles (no auth required)
export async function getPublicMoodData(profileId: string, days: number = 30): Promise<DayDatum[]> {
  try {
    const supabase = await createClient();
    
    // Calculate date range (use UTC to avoid timezone issues)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get daily entries for the profile
    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', (await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()
      ).data?.user_id)
      .gte('local_date', startDate)
      .lte('local_date', endDate)
      .order('local_date');

    // Handle table not found error gracefully
    if (entriesError && entriesError.code === 'PGRST205') {
      console.warn('daily_entries table not found, returning empty data');
      return [];
    }

    if (entriesError) {
      console.error('Error fetching public mood data:', entriesError);
      return [];
    }

    // Transform data
    const dayData: DayDatum[] = [];
    const entriesMap = new Map(dailyEntries?.map(entry => [entry.local_date, entry]) || []);

    // Generate all days in the range
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const entry = entriesMap.get(dateStr);
      
      if (entry) {
        dayData.push({
          date: dateStr,
          mood: entry.mood,
          energy: entry.energy,
          sleep_quality: entry.sleep_quality,
          pain: entry.pain,
          sleep_hours: entry.sleep_hours,
          night_wakes: entry.night_wakes,
          tags: entry.tags,
          journal: entry.journal,
          meds: entry.meds,
          protocols: entry.protocols,
          activity: entry.activity,
          devices: entry.devices,
          wearables: entry.wearables
        });
      } else {
        dayData.push({
          date: dateStr,
          mood: null,
          energy: null,
          sleep_quality: null,
          pain: null,
          sleep_hours: null,
          night_wakes: null,
          tags: null,
          journal: null,
          meds: null,
          protocols: null,
          activity: null,
          devices: null,
          wearables: null
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dayData;
  } catch (error) {
    console.error('Error in getPublicMoodData:', error);
    return [];
  }
}

export async function getTrends(days: 30 | 90): Promise<TrendsData> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { series: [], weekly: [], markers: [] };
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { series: [], weekly: [], markers: [] };
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get mood entries for the period
    const { data: moodEntries, error: moodError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date');

    if (moodError) {
      console.error('Error fetching trends data:', moodError);
      return { series: [], weekly: [], markers: [] };
    }

    // Transform to series format
    const series = (moodEntries || []).map(entry => ({
      date: entry.entry_date,
      mood: entry.mood,
      pain: entry.pain,
      energy: entry.energy,
      sleep: entry.sleep_hours,
      readiness: entry.readiness
    }));

    // Calculate weekly averages
    const weekly: Array<{ weekStart: string; avgMood?: number; avgPain?: number; avgEnergy?: number }> = [];
    const entriesByWeek = new Map<string, typeof moodEntries>();

    (moodEntries || []).forEach(entry => {
      const date = new Date(entry.entry_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString('sv-SE');
      
      if (!entriesByWeek.has(weekKey)) {
        entriesByWeek.set(weekKey, []);
      }
      entriesByWeek.get(weekKey)!.push(entry);
    });

    entriesByWeek.forEach((weekEntries, weekStart) => {
      const moodValues = weekEntries.filter(e => e.mood !== null).map(e => e.mood!);
      const painValues = weekEntries.filter(e => e.pain !== null).map(e => e.pain!);
      const energyValues = weekEntries.filter(e => e.energy !== null).map(e => e.energy!);

      weekly.push({
        weekStart,
        avgMood: moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : undefined,
        avgPain: painValues.length > 0 ? painValues.reduce((a, b) => a + b, 0) / painValues.length : undefined,
        avgEnergy: energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : undefined
      });
    });

    // TODO: Add protocol markers
    const markers: Array<{ date: string; label: string; kind: 'program' | 'med' }> = [];

    return { series, weekly, markers };
  } catch (error) {
    console.error('Error in getTrends:', error);
    return { series: [], weekly: [], markers: [] };
  }
}
