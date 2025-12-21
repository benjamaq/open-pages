'use server'

import { createClient } from '../supabase/server'

interface LimitCheckResult {
  allowed: boolean
  reason?: string
  currentCount: number
  limit: number
  isInTrial: boolean
}

export async function checkItemLimit(itemType: 'supplements' | 'protocols' | 'library'): Promise<LimitCheckResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Get user's profile and tier info (tier may not exist in all deployments)
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileRow) {
      throw new Error('Profile not found')
    }

    // Get trial status
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('is_in_trial, trial_ended_at')
      .eq('user_id', user.id)
      .single()

    let insertedTrialDefault = false
    if (usageError) {
      // If no usage record exists, create one (user is likely new)
      const { error: insertError } = await supabase
        .from('user_usage')
        .insert({
          user_id: user.id,
          tier: 'free',
          is_in_trial: true,
          trial_started_at: new Date().toISOString(),
          trial_ended_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (insertError) {
        console.error('Failed to create usage record:', insertError)
      } else {
        insertedTrialDefault = true
      }
    }

    const isInTrial = (usage?.is_in_trial ?? (insertedTrialDefault ? true : false)) || false
    // If 'tier' column missing, treat as trial to avoid blocking adds in dev
    const tier = (profileRow as any).tier || 'free'

    // If user is Pro/Creator or in trial, allow unlimited
    if (tier === 'pro' || tier === 'creator' || isInTrial) {
      return {
        allowed: true,
        currentCount: 0,
        limit: 999999,
        isInTrial
      }
    }

    // Define limits for free tier
    const limits = {
      supplements: 12,
      protocols: 12,
      library: 3
    }

    const limit = limits[itemType]

    // Count current items
    let currentCount = 0
    
    if (itemType === 'supplements') {
      // Current schema uses profile_id + item_type
      const { count, error } = await supabase
        .from('stack_items')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileRow.id)
        .eq('item_type', 'supplements')
      if (!error) currentCount = count || 0
    } else if (itemType === 'protocols') {
      const { count, error } = await supabase
        .from('stack_items')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileRow.id)
        .eq('item_type', 'protocols')
      if (!error) currentCount = count || 0
    } else if (itemType === 'library') {
      const { count, error } = await supabase
        .from('library_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      if (!error) currentCount = count || 0
    }

    const allowed = currentCount < limit

    return {
      allowed,
      reason: allowed ? undefined : `You've reached the free tier limit of ${limit} ${itemType}. Upgrade to Pro for unlimited access.`,
      currentCount,
      limit,
      isInTrial
    }

  } catch (error) {
    console.error('Error checking item limit:', error)
    // Fail-open in dev: do not block add if limits service fails
    return {
      allowed: true,
      currentCount: 0,
      limit: 999999,
      isInTrial: true
    }
  }
}

export async function enforceTrialLimits() {
  try {
    const supabase = await createClient()
    
    // Get all users who have ended trials but are still on free tier
    const { data: expiredTrials, error } = await supabase
      .from('user_usage')
      .select(`
        user_id,
        trial_ended_at,
        profiles!inner(tier)
      `)
      .eq('is_in_trial', false)
      .eq('profiles.tier', 'free')
      .lt('trial_ended_at', new Date().toISOString())

    if (error) {
      console.error('Error fetching expired trials:', error)
      return
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return
    }

    console.log(`Found ${expiredTrials.length} users with expired trials`)

    // For each user, check if they exceed limits and send notification
    for (const user of expiredTrials) {
      const userId = user.user_id
      
      // Check supplements
      const { count: supplementCount } = await supabase
        .from('stack_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'supplement')

      // Check protocols
      const { count: protocolCount } = await supabase
        .from('stack_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'protocol')

      // Check library items
      const { count: libraryCount } = await supabase
        .from('library_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const exceedsLimits = (supplementCount || 0) > 12 || (protocolCount || 0) > 12 || (libraryCount || 0) > 3

      if (exceedsLimits) {
        // TODO: Send email notification or in-app notification
        console.log(`User ${userId} exceeds limits after trial: ${supplementCount} supplements, ${protocolCount} protocols, ${libraryCount} library items`)
      }
    }

  } catch (error) {
    console.error('Error enforcing trial limits:', error)
  }
}
