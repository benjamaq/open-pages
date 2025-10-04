import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get today's daily entry
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      // If table doesn't exist, return null (empty state)
      if (error.code === 'PGRST205') {
        console.log('daily_entries table not found, returning empty state');
        return NextResponse.json({
          success: true,
          entry: null
        });
      }
      console.error('Error fetching today entry:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch today entry' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      entry: data || null
    });
  } catch (error) {
    console.error('Error fetching today entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch today entry' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { mood, sleep_quality, pain, tags, journal } = body;

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Use the upsert function to save mood data
    const { data, error } = await supabase.rpc('upsert_daily_entry_and_snapshot', {
      p_user_id: user.id,
      p_local_date: today,
      p_mood: mood || null,
      p_sleep_quality: sleep_quality || null,
      p_pain: pain || null,
      p_tags: tags || [],
      p_journal: journal || null
    });

    if (error) {
      console.error('Error saving mood data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save mood data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      entry: data
    });
  } catch (error) {
    console.error('Error saving mood data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save mood data' },
      { status: 500 }
    );
  }
}
