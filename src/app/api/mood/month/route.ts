import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter is required' },
        { status: 400 }
      );
    }

    // Calculate month start/end
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

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
      return NextResponse.json(
        { success: false, error: 'Failed to fetch month data' },
        { status: 500 }
      );
    }

    // Transform data
    const dayData = [];
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
          markers: [],
          sleepBadge: entry.sleep_hours && entry.sleep_hours < 6 ? 'low' : undefined,
          readinessBadge: undefined
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
    
    return NextResponse.json({
      success: true,
      data: dayData
    });
  } catch (error) {
    console.error('Error fetching month data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch month data' },
      { status: 500 }
    );
  }
}
