/**
 * TIER 2 - FULL CONTEXT RETRIEVAL
 * 
 * Deep queries for milestone analysis and pattern detection
 * Retrieves ALL historical data for comprehensive insights
 * Target: Used only at milestones (Day 3, 7, 14, 30) to manage costs
 */

import { createClient } from '@/lib/supabase/server';
import { getQuickContext, type QuickContext } from './getQuickContext';

export interface FullContextCheckIn {
  date: string;
  mood: number;
  sleep_quality: number;
  pain: number;
  tags?: string[];
  journal?: string;
  energy?: number;
}

export interface SupplementLog {
  date: string;
  supplement_id: string;
  supplement_name: string;
  taken: boolean;
}

export interface ExerciseLog {
  date: string;
  type: string;
  duration?: number;
  intensity?: string;
  notes?: string;
}

export interface TreatmentLog {
  date: string;
  type: string;
  provider?: string;
  notes?: string;
}

export interface MindfulnessLog {
  date: string;
  type: string;
  duration?: number;
  notes?: string;
}

export interface ProtocolLog {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  completed_dates: string[];
}

export interface GearUsageLog {
  date: string;
  gear_name: string;
  duration?: number;
  effectiveness?: number;
}

export interface WearableData {
  date: string;
  sleep_total?: number;
  sleep_deep?: number;
  sleep_rem?: number;
  hrv?: number;
  recovery_score?: number;
  resting_heart_rate?: number;
  steps?: number;
}

export interface FullContext extends QuickContext {
  allCheckIns: FullContextCheckIn[];
  supplementLogs: SupplementLog[];
  exercises: ExerciseLog[];
  treatments: TreatmentLog[];
  mindfulness: MindfulnessLog[];
  protocols: ProtocolLog[];
  gearUsage: GearUsageLog[];
  wearableData: WearableData[];
}

/**
 * Get full context for deep analysis at milestones
 * Expensive query - use sparingly (only at milestones)
 */
export async function getFullContext(userId: string): Promise<FullContext> {
  const supabase = await createClient();
  
  try {
    // Start with quick context (already optimized)
    const quickContext = await getQuickContext(userId);
    
    // Calculate date range for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // 1. Get ALL check-ins (for comprehensive pattern analysis)
    const { data: allCheckIns } = await supabase
      .from('daily_entries')
      .select('local_date, mood, sleep_quality, pain, tags, journal')
      .eq('user_id', userId)
      .order('local_date', { ascending: true });

    const allCheckInsData: FullContextCheckIn[] = (allCheckIns || []).map(c => ({
      date: c.local_date,
      mood: c.mood,
      sleep_quality: c.sleep_quality,
      pain: c.pain,
      tags: c.tags,
      journal: c.journal,
      energy: c.mood, // Using mood as proxy for energy if not separate
    }));

    // 2. Get supplement logs (which supplements taken on which days)
    // Note: This requires a supplement_logs table - for now, we'll use stack items
    const supplementLogs: SupplementLog[] = [];
    // TODO: Implement when supplement_logs table exists

    // 3. Get exercise logs (last 30 days)
    // Note: Using movement_items as proxy for exercise
    const { data: movementItems } = await supabase
      .from('movement_items')
      .select('id, name, notes, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const exercises: ExerciseLog[] = (movementItems || []).map(m => ({
      date: new Date(m.created_at).toISOString().split('T')[0],
      type: m.name,
      notes: m.notes,
    }));

    // 4. Get treatment/rehab logs (last 30 days)
    // Note: This would require a treatments table - placeholder for now
    const treatments: TreatmentLog[] = [];
    // TODO: Implement when treatments table exists

    // 5. Get mindfulness logs (last 30 days)
    // Note: Using mindfulness_items as proxy
    const { data: mindfulnessItems } = await supabase
      .from('mindfulness_items')
      .select('id, name, notes, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const mindfulness: MindfulnessLog[] = (mindfulnessItems || []).map(m => ({
      date: new Date(m.created_at).toISOString().split('T')[0],
      type: m.name,
      notes: m.notes,
    }));

    // 6. Get protocols (active ones)
    const { data: protocolItems } = await supabase
      .from('protocols')
      .select('id, name, description, frequency')
      .eq('user_id', userId)
      .eq('is_archived', false);

    const protocols: ProtocolLog[] = (protocolItems || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      frequency: p.frequency,
      completed_dates: [], // TODO: Get from protocol_logs when available
    }));

    // 7. Gear usage logs (last 30 days)
    // Note: This would require a gear_usage table - placeholder for now
    const gearUsage: GearUsageLog[] = [];
    // TODO: Implement when gear_usage table exists

    // 8. Wearable data (last 30 days)
    // Note: This would require wearable integration - placeholder for now
    const wearableData: WearableData[] = [];
    // TODO: Implement when wearable sync is available

    return {
      ...quickContext,
      allCheckIns: allCheckInsData,
      supplementLogs,
      exercises,
      treatments,
      mindfulness,
      protocols,
      gearUsage,
      wearableData,
    };

  } catch (error) {
    console.error('Error getting full context:', error);
    
    // Fallback to quick context only
    const quickContext = await getQuickContext(userId);
    return {
      ...quickContext,
      allCheckIns: quickContext.recentCheckIns,
      supplementLogs: [],
      exercises: [],
      treatments: [],
      mindfulness: [],
      protocols: [],
      gearUsage: [],
      wearableData: [],
    };
  }
}

/**
 * Get check-in count for a user (for milestone detection)
 */
export async function getCheckInCount(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count } = await supabase
    .from('daily_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count || 0;
}

/**
 * Check if today is a milestone
 */
export function isMilestone(checkInCount: number): boolean {
  const milestones = [1, 3, 7, 14, 30, 60, 90];
  return milestones.includes(checkInCount);
}

/**
 * Get milestone type
 */
export function getMilestoneType(checkInCount: number): string | null {
  if (checkInCount === 1) return 'first_checkin';
  if (checkInCount === 3) return 'three_days';
  if (checkInCount === 7) return 'one_week';
  if (checkInCount === 14) return 'two_weeks';
  if (checkInCount === 30) return 'one_month';
  if (checkInCount === 60) return 'two_months';
  if (checkInCount === 90) return 'three_months';
  return null;
}

