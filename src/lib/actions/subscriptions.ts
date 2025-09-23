'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface UserSubscription {
  id: string
  user_id: string
  plan_type: 'free' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end?: string
}

export interface PlanLimit {
  feature_name: string
  limit_value: number
}

export interface UsageInfo {
  feature_name: string
  current_count: number
  limit_value: number
  is_unlimited: boolean
  can_add_more: boolean
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', error)
      return null
    }

    return data || { 
      id: '', 
      user_id: user.id, 
      plan_type: 'free', 
      status: 'active' 
    }
  } catch (error) {
    console.error('Error in getUserSubscription:', error)
    return null
  }
}

// Get user's tier from profiles table
export async function getUserTier(): Promise<'free' | 'pro' | 'creator'> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    if (error || !profile) {
      console.error('Error fetching user tier:', error)
      return 'free'
    }

    return profile.tier as 'free' | 'pro' | 'creator' || 'free'
  } catch (error) {
    console.error('Error in getUserTier:', error)
    return 'free'
  }
}

export async function getUserUsage(): Promise<UsageInfo[]> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user's plan
    const subscription = await getUserSubscription()
    const planType = subscription?.plan_type || 'free'

    // Get plan limits
    const { data: limits, error: limitsError } = await supabase
      .from('plan_limits')
      .select('feature_name, limit_value')
      .eq('plan_type', planType)

    if (limitsError) {
      console.error('Error fetching plan limits:', limitsError)
      return []
    }

    // Get current usage
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('feature_name, current_count')
      .eq('user_id', user.id)

    if (usageError) {
      console.error('Error fetching usage:', usageError)
      return []
    }

    // Combine limits and usage
    const usageMap = new Map(usage?.map(u => [u.feature_name, u.current_count]) || [])
    
    return limits?.map(limit => ({
      feature_name: limit.feature_name,
      current_count: usageMap.get(limit.feature_name) || 0,
      limit_value: limit.limit_value,
      is_unlimited: limit.limit_value === -1,
      can_add_more: limit.limit_value === -1 || (usageMap.get(limit.feature_name) || 0) < limit.limit_value
    })) || []
  } catch (error) {
    console.error('Error in getUserUsage:', error)
    return []
  }
}

export async function checkCanAddItem(itemType: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> {
  // Temporarily disable limit checking since database tables don't exist yet
  // This allows all users to add items without restrictions
  return { canAdd: true, currentCount: 0, limit: -1 }
}

export async function getPricingConfig() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching pricing:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPricingConfig:', error)
    return []
  }
}

export async function upgradeToProPlan() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // For now, just update the plan type
    // In production, this would integrate with Stripe
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: 'pro',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error upgrading plan:', error)
      throw error
    }

    revalidatePath('/dash')
    return { success: true }
  } catch (error) {
    console.error('Error in upgradeToProPlan:', error)
    throw error
  }
}
