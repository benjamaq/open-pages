'use server';

import { createClient } from '@/lib/supabase/server';

export interface ElliMessage {
  id: string;
  user_id: string;
  message_type: 'welcome' | 'post_checkin' | 'dashboard' | 'milestone' | 'post_supplement';
  message_text: string;
  context: any;
  created_at: string;
  dismissed: boolean;
}

/**
 * Save a new Elli message to the database
 */
export async function saveElliMessage(
  userId: string,
  messageType: ElliMessage['message_type'],
  messageText: string,
  context: any
): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('elli_messages')
      .insert({
        user_id: userId,
        message_type: messageType,
        message_text: messageText,
        context: context,
      });
    
    if (error) {
      // Graceful fallback: log but do not throw to avoid breaking UX
      console.warn('Elli message not persisted (will still show in UI):', error.message);
      console.log('Elli message generated:', { userId, messageType, messageText, context });
    }
  } catch (err) {
    console.warn('Elli message save error (fallback to console):', err);
    console.log('Elli message generated:', { userId, messageType, messageText, context });
  }
}

/**
 * Get the latest non-dismissed Elli message for a user
 */
export async function getLatestElliMessage(userId: string): Promise<ElliMessage | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('elli_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest Elli message:', error);
    return null;
  }

  return data;
}

/**
 * Get all Elli messages for a user (for history/context)
 */
export async function getAllElliMessages(userId: string, limit: number = 10): Promise<ElliMessage[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('elli_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching Elli messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark an Elli message as dismissed
 */
export async function dismissElliMessage(messageId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('elli_messages')
    .update({ dismissed: true })
    .eq('id', messageId);

  if (error) {
    console.error('Error dismissing Elli message:', error);
    throw error;
  }
}

/**
 * Get count of user's check-ins (for determining milestones)
 */
export async function getUserCheckInCount(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('daily_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting check-in count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get user's recent check-ins for pattern analysis
 */
export async function getRecentCheckIns(userId: string, days: number = 7) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('daily_entries')
    .select('local_date, mood, sleep_quality, pain, tags')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(days);

  if (error) {
    console.error('Error fetching recent check-ins:', error);
    return [];
  }

  return data || [];
}

