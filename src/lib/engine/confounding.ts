import { createClient } from '@/lib/supabase/server'

/**
 * Detect supplements that changed within ±7 days of target supplement
 * This creates confounding - we can't isolate which supplement caused the effect
 */
export async function detectConfounds(
  supplementId: string, 
  profileId: string
): Promise<string[]> {
  const supabase = await createClient()
  
  console.log('🔍 Checking confounds for supplement:', supplementId)
  
  // Get this supplement's most recent start date
  const { data: periods } = await supabase
    .from('intervention_periods')
    .select('start_date')
    .eq('intervention_id', supplementId)
    .order('start_date', { ascending: false })
    .limit(1)
  
  if (!periods || periods.length === 0) {
    console.log('  → No periods found')
    return []
  }
  
  const startDate = new Date(periods[0].start_date)
  const windowStart = new Date(startDate)
  windowStart.setDate(windowStart.getDate() - 7)
  const windowEnd = new Date(startDate)
  windowEnd.setDate(windowEnd.getDate() + 7)
  
  console.log('  → Checking window:', windowStart.toISOString().slice(0, 10), 'to', windowEnd.toISOString().slice(0, 10))
  
  // Find other supplements in the same profile that changed in this window
  const { data: items } = await supabase
    .from('stack_items')
    .select(`
      id,
      name,
      intervention_periods!inner(start_date)
    `)
    .eq('profile_id', profileId)
    .neq('id', supplementId)
  
  const confounded: string[] = []
  
  for (const item of items || []) {
    const periods = (item as any).intervention_periods || []
    
    for (const period of periods) {
      const pDate = new Date(period.start_date)
      
      if (pDate >= windowStart && pDate <= windowEnd) {
        console.log('  ⚠️  Confounded with:', item.name, 'started', period.start_date)
        confounded.push(item.name)
        break
      }
    }
  }
  
  if (confounded.length === 0) {
    console.log('  ✅ No confounds detected')
  }
  
  return confounded
}

/**
 * Check if enough time has passed since confounding supplement was added
 * Returns true if it's now safe to analyze (>21 days since confound)
 */
export async function isConfoundingResolved(
  supplementId: string,
  profileId: string
): Promise<boolean> {
  const confounds = await detectConfounds(supplementId, profileId)
  
  if (confounds.length === 0) return true
  
  // Check if confounding period was >21 days ago
  const supabase = await createClient()
  const { data: periods } = await supabase
    .from('intervention_periods')
    .select('start_date')
    .eq('intervention_id', supplementId)
    .order('start_date', { ascending: false })
    .limit(1)
  
  if (!periods || periods.length === 0) return false
  
  const startDate = new Date(periods[0].start_date)
  const daysSince = Math.floor((Date.now() - startDate.getTime()) / 86400000)
  
  return daysSince > 21
}


