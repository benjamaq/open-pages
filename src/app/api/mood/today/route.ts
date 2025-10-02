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
