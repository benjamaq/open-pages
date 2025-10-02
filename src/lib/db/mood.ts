'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MoodEntry = {
  id: string;
  profile_id: string;
  entry_date: string;
  mood?: number | null;
  energy?: number | null;
  pain?: number | null;
  sleep_hours?: number | null;
  readiness?: number | null;
  feeling?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

export type SaveMoodEntryInput = {
  entryDate: string; // 'YYYY-MM-DD' from client in user's tz
  mood?: number | null;
  energy?: number | null;
  pain?: number | null;
  sleep_hours?: number | null;
  readiness?: number | null;
  feeling?: string | null;
  note?: string | null;
};

export async function saveMoodEntry(input: SaveMoodEntryInput): Promise<{ ok: true; data: MoodEntry } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, error: 'Authentication required' };
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { ok: false, error: 'Profile not found' };
    }

    // Prepare data for upsert
    const moodData = {
      profile_id: profile.id,
      entry_date: input.entryDate,
      mood: input.mood,
      energy: input.energy,
      pain: input.pain,
      sleep_hours: input.sleep_hours,
      readiness: input.readiness,
      feeling: input.feeling,
      note: input.note,
      updated_at: new Date().toISOString()
    };

    // Upsert mood entry
    const { data, error } = await supabase
      .from('mood_entries')
      .upsert(moodData, {
        onConflict: 'profile_id,entry_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving mood entry:', error);
      return { ok: false, error: error.message };
    }

    // Revalidate relevant paths
    revalidatePath('/dash');
    revalidatePath('/dash/mood');

    return { ok: true, data };
  } catch (error) {
    console.error('Error in saveMoodEntry:', error);
    return { ok: false, error: 'Failed to save mood entry' };
  }
}

export async function getTodayEntry(): Promise<MoodEntry | null> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Get today's date in user's timezone (for now, using UTC)
    const today = new Date().toISOString().split('T')[0];

    // Get today's mood entry
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('entry_date', today)
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
  pain?: number | null;
  energy?: number | null;
  sleep_hours?: number | null;
  readiness?: number | null;
  feeling?: string | null;
  note?: string | null;
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return [];
    }

    // Calculate month start/end
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    // Get mood entries for the month
    const { data: moodEntries, error: moodError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date');

    if (moodError) {
      console.error('Error fetching month data:', moodError);
      return [];
    }

    // Get active protocols for markers (simplified for now)
    const { data: protocols } = await supabase
      .from('protocols')
      .select('name, created_at, updated_at')
      .eq('profile_id', profile.id);

    // Transform data
    const dayData: DayDatum[] = [];
    const entriesMap = new Map(moodEntries?.map(entry => [entry.entry_date, entry]) || []);

    // Generate all days in the month
    const currentDate = new Date(year, monthNum - 1, 1);
    while (currentDate.getMonth() === monthNum - 1) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const entry = entriesMap.get(dateStr);
      
      if (entry) {
        dayData.push({
          date: dateStr,
          mood: entry.mood,
          pain: entry.pain,
          energy: entry.energy,
          sleep_hours: entry.sleep_hours,
          readiness: entry.readiness,
          feeling: entry.feeling,
          note: entry.note,
          hasJournal: !!entry.note,
          markers: [], // TODO: Add protocol markers
          sleepBadge: entry.sleep_hours && entry.sleep_hours < 6 ? 'low' : undefined,
          readinessBadge: entry.readiness 
            ? (entry.readiness < 40 ? 'low' : entry.readiness > 80 ? 'high' : undefined)
            : undefined
        });
      } else {
        dayData.push({
          date: dateStr,
          mood: null,
          pain: null,
          energy: null,
          sleep_hours: null,
          readiness: null,
          feeling: null,
          note: null,
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
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0])
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
      const weekKey = weekStart.toISOString().split('T')[0];
      
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
