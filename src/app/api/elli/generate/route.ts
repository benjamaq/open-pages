/**
 * API Route: Generate Elli Message
 * Handles generation and storage of Elli messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateElliMessage, type ElliContext } from '@/lib/elli/generateElliMessage';
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
    const { messageType, context } = body as {
      messageType: 'post_checkin' | 'post_supplement' | 'dashboard' | 'milestone';
      context: ElliContext;
    };
    
    // Validate required fields
    if (!messageType || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: messageType, context' },
        { status: 400 }
      );
    }
    
    // Generate Elli message (with OpenAI or templates)
    const message = await generateElliMessage(messageType, context);
    
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

