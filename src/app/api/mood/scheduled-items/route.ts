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

    // Get the day of week for the given date
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch all scheduled items for this date
    const [stackItemsResult, protocolsResult] = await Promise.all([
      // Get stack items scheduled for this day
      supabase
        .from('stack_items')
        .select('id')
        .eq('profile_id', (profile as any).id)
        .contains('schedule_days', [dayOfWeek]),
      
      // Get protocols scheduled for this day
      supabase
        .from('protocols')
        .select('id')
        .eq('profile_id', (profile as any).id)
        .contains('schedule_days', [dayOfWeek])
    ]);

    // Combine all scheduled item IDs
    const allScheduledItems = [
      ...((stackItemsResult.data as any[] | null) || []).map((item: any) => item.id),
      ...((protocolsResult.data as any[] | null) || []).map((item: any) => item.id)
    ];

    console.log('Scheduled items for date:', date, 'dayOfWeek:', dayOfWeek, 'items:', allScheduledItems);

    return NextResponse.json({
      success: true,
      items: allScheduledItems,
      date,
      dayOfWeek
    });
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled items' },
      { status: 500 }
    );
  }
}
