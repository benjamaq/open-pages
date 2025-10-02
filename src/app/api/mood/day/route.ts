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
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get daily entry for the specific date
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', date)
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
      console.error('Error fetching day entry:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch day entry' },
        { status: 500 }
      );
    }
    
    console.log('Day API - Raw data from database:', data);
    return NextResponse.json({
      success: true,
      entry: data || null
    });
  } catch (error) {
    console.error('Error fetching day entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch day entry' },
      { status: 500 }
    );
  }
}
