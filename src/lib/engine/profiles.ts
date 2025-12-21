import { createClient } from '@/lib/supabase/server'
import { SupplementProfile } from './types'

/**
 * Fetch supplement profile from database by name
 * Supports fuzzy matching (e.g. "magnesium" matches "Magnesium Glycinate")
 */
export async function getSupplementProfile(supplementName: string): Promise<SupplementProfile | null> {
  const supabase = await createClient()
  
  // Try exact match first
  let { data } = await supabase
    .from('supplement_profiles')
    .select('*')
    .eq('name', supplementName)
    .maybeSingle()
  
  if (data) return data as SupplementProfile
  
  // Try case-insensitive partial match
  const { data: fuzzyMatch } = await supabase
    .from('supplement_profiles')
    .select('*')
    .ilike('name', `%${supplementName}%`)
    .limit(1)
    .maybeSingle()
  
  return fuzzyMatch as SupplementProfile | null
}

/**
 * Get profile or create default for unknown supplements
 */
export async function getOrCreateProfile(
  supplementId: string, 
  supplementName: string
): Promise<SupplementProfile> {
  const profile = await getSupplementProfile(supplementName)
  
  if (profile) {
    console.log('📋 Found profile for:', supplementName, '→', profile.category)
    return profile
  }
  
  // Default profile for unknown supplements
  console.log('⚠️  No profile found for:', supplementName, '→ using defaults')
  return {
    name: supplementName,
    category: 'performance',
    expected_window_days: 30,
    builds_tolerance: false,
    primary_metrics: ['mood', 'energy'],
    literature_effect: 'positive',
    literature_confidence: 0.5,
    notes: 'User-added supplement - no profile data yet'
  }
}

/**
 * Get optimal window based on supplement category
 */
export function getOptimalWindow(profile: SupplementProfile): '30d' | '90d' {
  if (profile.category === 'protective') return '90d'
  if (profile.expected_window_days >= 60) return '90d'
  return '30d'
}


