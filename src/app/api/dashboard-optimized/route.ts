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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get today's date (use UTC to avoid timezone issues)
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    // Fetch all data in parallel
    const [
      todayMoodEntry,
      monthlyMoodData,
      dailyUpdateData,
      betaStatus
    ] = await Promise.all([
      // Today's mood entry
      supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('local_date', today)
        .single()
        .then(({ data, error }) => ({ data, error: error?.code === 'PGRST116' ? null : error })),

      // Monthly mood data for averages
      supabase
        .from('daily_entries')
        .select('mood, sleep_quality, pain, local_date')
        .eq('user_id', user.id)
        .gte('local_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('local_date', today)
        .order('local_date'),

      // Daily update data
      supabase
        .from('daily_updates')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
        .then(({ data, error }) => ({ data, error: error?.code === 'PGRST116' ? null : error })),

      // Beta status
      supabase
        .from('beta_users')
        .select('expires_at')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') return { data: null, error };
          if (!data) return { data: null, error: null };
          
          const expiresAt = new Date((data as any).expires_at);
          const now = new Date();
          const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            data: {
              isBetaUser: true,
              expiresAt: (data as any).expires_at,
              daysUntilExpiration,
              isExpired: daysUntilExpiration <= 0
            },
            error: null
          };
        })
    ]);

    // Calculate 7-day averages
    const last7Days: any[] = ((monthlyMoodData.data as any[] | undefined)?.slice(-7)) || [];
    const moodValues = last7Days.map((day: any) => day.mood).filter((val: any) => val !== null && val !== undefined);
    const sleepValues = last7Days.map((day: any) => day.sleep_quality).filter((val: any) => val !== null && val !== undefined);
    const painValues = last7Days.map((day: any) => day.pain).filter((val: any) => val !== null && val !== undefined);

    const averages = {
      mood: moodValues.length > 0 
        ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1)
        : '—',
      sleep: sleepValues.length > 0 
        ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1)
        : '—',
      pain: painValues.length > 0 
        ? (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1)
        : '—'
    };

    return NextResponse.json({
      success: true,
      data: {
        todayMoodEntry: todayMoodEntry.data,
        monthlyMoodData: monthlyMoodData.data || [],
        dailyUpdateData: dailyUpdateData.data,
        betaStatus: betaStatus.data,
        averages
      }
    });

  } catch (error) {
    console.error('Error in optimized dashboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
