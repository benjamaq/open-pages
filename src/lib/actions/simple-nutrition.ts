'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface SimpleNutritionData {
  diet_style?: string
  fasting_schedule?: string  
  food_rule?: string
  enabled: boolean
}

// Get current user's profile
async function getCurrentProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, slug, nutrition_signature')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  return profile
}

// Get simple nutrition data from signature
export async function getSimpleNutritionData(profileId?: string): Promise<SimpleNutritionData> {
  try {
    const supabase = await createClient()
    
    let targetProfileId = profileId
    
    if (!targetProfileId) {
      const profile = await getCurrentProfile()
      targetProfileId = profile.id
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nutrition_signature')
      .eq('id', targetProfileId)
      .single()

    if (error || !profile || !profile.nutrition_signature) {
      return { enabled: false }
    }

    const signature = profile.nutrition_signature as any
    
    // Extract simple fields from complex signature
    return {
      diet_style: signature.style?.label || signature.diet_style,
      fasting_schedule: signature.fasting?.window || signature.fasting_schedule,
      food_rule: signature.rule?.label || signature.food_rule,
      enabled: signature.enabled || false
    }
  } catch (error) {
    console.error('Error getting simple nutrition data:', error)
    return { enabled: false }
  }
}

// Update simple nutrition data
export async function updateSimpleNutritionData(data: SimpleNutritionData): Promise<void> {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile()

    // Store in simple format for now
    const nutritionData = {
      diet_style: data.diet_style,
      fasting_schedule: data.fasting_schedule,
      food_rule: data.food_rule,
      enabled: data.enabled
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nutrition_signature: nutritionData })
      .eq('id', profile.id)

    if (error) {
      console.error('Failed to update nutrition data:', error)
      throw new Error('Failed to update nutrition data')
    }

    // Revalidate public profile
    if (profile.slug) {
      revalidatePath(`/u/${profile.slug}`)
    }
  } catch (error) {
    console.error('Error updating simple nutrition data:', error)
    throw error
  }
}
