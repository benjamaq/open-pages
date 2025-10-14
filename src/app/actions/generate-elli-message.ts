'use server';

import { createClient } from '@/lib/supabase/server';
import { generateElliMessage, type ElliContext } from '@/lib/elli/generateElliMessage';
import { saveElliMessage, getUserCheckInCount, getRecentCheckIns } from '@/lib/db/elliMessages';
import { getUserCondition } from '@/lib/db/userCondition';

/**
 * Generate and save an Elli message for a user
 * Called after check-ins, at milestones, etc.
 */
export async function generateAndSaveElliMessage(
  userId: string,
  messageType: 'post_checkin' | 'dashboard' | 'milestone',
  checkInData: {
    pain: number;
    mood: number;
    sleep: number;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get user's display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, condition_primary, condition_details')
      .eq('user_id', userId)
      .single();
    
    const userName = profile?.display_name || 'User';
    
    // Get user's condition
    const condition = profile?.condition_primary ? {
      primary: profile.condition_primary,
      details: profile.condition_details || undefined
    } : undefined;
    
    // Get check-in count for milestone detection
    const checkInCount = await getUserCheckInCount(userId);
    
    // Get recent check-ins for pattern detection
    const recentCheckIns = await getRecentCheckIns(userId, 7);
    
    // Build context for Elli
    const context: ElliContext = {
      userName,
      condition,
      checkIn: checkInData,
      daysOfTracking: checkInCount,
      previousCheckIns: recentCheckIns,
    };
    
    // Generate the message (with OpenAI or templates)
    const message = await generateElliMessage(messageType, context);
    
    // Save to database
    await saveElliMessage(userId, messageType, message, {
      checkIn: checkInData,
      daysOfTracking: checkInCount,
      condition: condition?.primary,
    });
    
    return {
      success: true,
      message,
      daysOfTracking: checkInCount,
    };
    
  } catch (error) {
    console.error('Error generating Elli message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

