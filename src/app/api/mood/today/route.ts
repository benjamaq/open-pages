import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAndSaveElliMessage } from '@/app/actions/generate-elli-message';
import { computeAndPersistInsights } from '@/app/actions/insights';

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
    const { mood, sleep_quality, pain, tags, journal, symptoms, pain_locations, pain_types, custom_symptoms, lifestyle_factors, exercise_type, exercise_intensity, protocols } = body;
    
    console.log('🔍 API - Received tags:', tags);
    console.log('🔍 API - Full body:', body);

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
      p_journal: journal || null,
      p_symptoms: symptoms || [],
      p_pain_locations: pain_locations || [],
      p_pain_types: pain_types || [],
      p_custom_symptoms: custom_symptoms || []
    });

    if (error) {
      console.error('Error saving mood data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save mood data' },
        { status: 500 }
      );
    }

    // Fallback: if RPC doesn't handle new columns yet, ensure they're set via direct update
    if ((Array.isArray(lifestyle_factors) && lifestyle_factors.length >= 0) || exercise_type !== undefined || exercise_intensity !== undefined || Array.isArray(protocols)) {
      try {
        await supabase
          .from('daily_entries')
          .update({ 
            lifestyle_factors: Array.isArray(lifestyle_factors) ? lifestyle_factors : undefined,
            exercise_type: typeof exercise_type === 'string' ? exercise_type : undefined,
            exercise_intensity: typeof exercise_intensity === 'string' ? exercise_intensity : undefined,
            protocols: Array.isArray(protocols) ? protocols : undefined,
          })
          .eq('user_id', user.id)
          .eq('local_date', today);
      } catch (e) {
        console.warn('Could not persist additional fields via fallback:', e);
      }
    }

    // ───────────────────────────────────────────────────────────────
    // Generate Elli post_checkin message immediately (bulletproof flow)
    // ───────────────────────────────────────────────────────────────
    try {
      console.log('🔵 Check-in saved:', { userId: user.id, date: today });

      const safeNum = (n: any, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback);
      const todayData = {
        mood: safeNum(mood, 5),
        sleep: safeNum(sleep_quality, 5),
        pain: safeNum(pain, 5),
      };

      console.log('🔵 Generating Elli message for user:', user.id, 'with todayData:', todayData);
      // Pass client timezone offset if sent by client (optional)
      let tzOffsetMinutes: number | undefined = undefined;
      try {
        const hdr = (request as any).headers?.get?.('x-client-tz-offset');
        if (hdr) tzOffsetMinutes = parseInt(hdr, 10);
      } catch {}
      const result = await generateAndSaveElliMessage(user.id, 'post_checkin', todayData, tzOffsetMinutes != null ? { tzOffsetMinutes } : undefined);
      if (!result || !(result as any).message) {
        console.error('❌ Check-in message generation failed');
      } else {
        const msg: string = (result as any).message as string;
        if (typeof msg === 'string') {
          console.log('🔵 OpenAI/template response received:', msg.length, 'chars');
          console.log('🔵 Message saved for user:', user.id);
        }
      }
    } catch (e) {
      console.error('❌ Failed to generate/save Elli message after check-in:', e);
    }

    // ───────────────────────────────────────────────────────────────
    // Compute insights separately and asynchronously (no coupling in UI)
    // ───────────────────────────────────────────────────────────────
    try {
      const res = await computeAndPersistInsights(user.id);
      console.log('🔵 Insights recomputed after check-in:', res);
    } catch (e) {
      console.warn('Insights recompute failed (continuing):', e);
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (error) {
    console.error('Error saving mood data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save mood data' },
      { status: 500 }
    );
  }
}
