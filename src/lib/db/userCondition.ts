'use server';

import { createClient } from '@/lib/supabase/server';

export interface UserCondition {
  primary: string | null;
  details: string | null;
}

/**
 * Save user's condition information to their profile
 */
export async function saveUserCondition(userId: string, condition: UserCondition) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      condition_primary: condition.primary,
      condition_details: condition.details || null,
      condition_provided_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving condition:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Get user's condition information from their profile
 */
export async function getUserCondition(userId: string): Promise<UserCondition | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('condition_primary, condition_details')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    primary: data.condition_primary,
    details: data.condition_details,
  };
}

/**
 * Get count of users with similar conditions for community stats
 */
export async function getUsersWithConditionCount(condition: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('condition_primary', condition)
    .not('condition_provided_at', 'is', null);

  if (error) {
    console.error('Error getting condition count:', error);
    return 0;
  }

  return count || 0;
}

