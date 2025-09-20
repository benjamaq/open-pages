'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface UnifiedHeaderData {
  displayName: string
  mission: string | null
  eatingStyle: string
}

// Update unified header data for current user
export async function updateUnifiedHeader(data: UnifiedHeaderData): Promise<void> {
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

    // Prepare nutrition signature
    const nutritionData = {
      eating_style: data.eatingStyle || null,
      enabled: !!data.eatingStyle
    }

    // Update profile with all header data
    const { error } = await supabase
      .from('profiles')
      .update({ 
        display_name: data.displayName,
        bio: data.mission,
        nutrition_signature: nutritionData
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Failed to update header data:', error)
      throw new Error('Failed to update header data')
    }

    // Revalidate public profile
    if (profile.slug) {
      revalidatePath(`/u/${profile.slug}`)
    }
    
    // Also revalidate dashboard
    revalidatePath('/dash')
  } catch (error) {
    console.error('Error updating header data:', error)
    throw error
  }
}
