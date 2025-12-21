/**
 * API Route: Generate Elli Message
 * Handles generation and storage of Elli messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateElliMessage } from '@/lib/message-service';
import { getRecentCheckIns } from '@/lib/db/elliMessages';
import { saveElliMessage } from '@/lib/db/elliMessages';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    try {
      console.log('🔵 API ROUTE CALLED with:', {
        messageType: (body as any)?.messageType,
        hasContext: !!(body as any)?.context,
        contextKeys: (body as any)?.context ? Object.keys((body as any)?.context) : []
      })
    } catch {}
    const { messageType, context } = body as any
    try {
      const { ELLI_PROMPTS } = require('@/lib/prompts');
      const pv = (ELLI_PROMPTS?.FIRST_CHECKIN || '').slice(0, 50);
      console.log('[ELLI] Generating message', {
        type: messageType,
        user: user.id,
        promptVersion: pv,
        timestamp: new Date().toISOString()
      });
    } catch {}
    
    // Validate required fields
    if (!messageType || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: messageType, context' },
        { status: 400 }
      );
    }
    
    // Map context → params for the new service
    const toEntry = (r: any) => ({
      local_date: r?.local_date,
      pain: typeof r?.pain === 'number' ? r.pain : 0,
      mood: typeof r?.mood === 'number' ? r.mood : 5,
      sleep_quality: typeof r?.sleep_quality === 'number' ? r.sleep_quality : 5,
      tags: Array.isArray(r?.tags) ? r.tags as string[] : undefined,
    })
    const recentRaw = await getRecentCheckIns(user.id, 7)
    let recentEntries = Array.isArray(recentRaw) ? recentRaw.map(toEntry) : []
    const todayEntry = {
      pain: typeof context?.checkIn?.pain === 'number' ? context.checkIn.pain : 0,
      mood: typeof context?.checkIn?.mood === 'number' ? context.checkIn.mood : 5,
      sleep_quality: typeof context?.checkIn?.sleep === 'number' ? context.checkIn.sleep : 5,
      tags: undefined as string[] | undefined,
    }

    // Day 1 server guard: if 0 or 1 entries, force Day 1 path and disable humanizer
    const isDay1 = !Array.isArray(recentEntries) || recentEntries.length <= 1
    if (isDay1) {
      recentEntries = []
      try { console.log('🔴 [api/elli/generate] Forcing Day 1 path: clearing recentEntries and disabling humanizer') } catch {}
    }

    const message = await generateElliMessage({
      userId: user.id,
      userName: context?.userName || 'there',
      todayEntry,
      recentEntries,
      useHumanizer: !isDay1,
      condition: (context?.condition as any) || undefined,
    })
    try { console.log('🔵 API ROUTE RETURNING:', typeof message === 'string' ? (message.substring(0, 100) + '...') : message) } catch {}
    try {
      const hasName = !!context?.userName && typeof message === 'string' && message.includes(context.userName);
      const painStr = String(context?.checkIn?.pain ?? '');
      const hasPain = painStr && message.includes(painStr);
      console.log('[ELLI] Message generated', {
        length: typeof message === 'string' ? message.length : 0,
        hasName,
        hasPain
      });
    } catch {}
    
    // Store message in database
    await saveElliMessage(user.id, messageType, message, context);
    
    return NextResponse.json({ 
      success: true,
      message 
    });
    
  } catch (error) {
    console.error('Error in Elli generate API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch latest message (alternative to using DB directly)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('elli_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .eq('message_type', 'post_checkin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ message: data });
    
  } catch (error) {
    console.error('Error fetching Elli message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

