'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

// Update eating style for current user
export async function updateEatingStyle(eatingStyle: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Store eating style in the nutrition_signature column for now
    const nutritionData = {
      eating_style: eatingStyle || null,
      enabled: !!eatingStyle
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nutrition_signature: nutritionData })
      .eq('id', profile.id)

    if (error) {
      console.error('Failed to update eating style:', error)
      throw new Error('Failed to update eating style')
    }

    // Revalidate public profile
    if (profile.slug) {
      revalidatePath(`/u/${profile.slug}`)
    }
  } catch (error) {
    console.error('Error updating eating style:', error)
    throw error
  }
}

// Get eating style for a profile
export async function getEatingStyle(profileId: string): Promise<string> {
  try {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nutrition_signature')
      .eq('id', profileId)
      .single()

    if (error || !profile || !profile.nutrition_signature) {
      return ''
    }

    const signature = profile.nutrition_signature as any
    return signature.eating_style || ''
  } catch (error) {
    console.error('Error getting eating style:', error)
    return ''
  }
}
