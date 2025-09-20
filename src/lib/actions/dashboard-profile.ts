'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDashboardProfile(updates: {
  name?: string
  mission?: string
  avatarUrl?: string | null
}) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Prepare updates object
    const profileUpdates: any = {}
    
    if (updates.name !== undefined) {
      profileUpdates.display_name = updates.name
    }
    
    if (updates.mission !== undefined) {
      profileUpdates.bio = updates.mission
    }
    
    if (updates.avatarUrl !== undefined) {
      profileUpdates.avatar_url = updates.avatarUrl
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', profile.id)

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    // Revalidate the dashboard page
    revalidatePath('/dash')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating dashboard profile:', error)
    throw error
  }
}
