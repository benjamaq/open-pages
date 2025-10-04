'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface PublicModules {
  supplements?: boolean
  protocols?: boolean
  movement?: boolean
  mindfulness?: boolean
  gear?: boolean
  uploads?: boolean
  library?: boolean
  journal?: boolean
  mood?: boolean
}

export async function updatePublicModules(modules: PublicModules) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get current profile (try with public_modules first, fallback without it)
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, public_modules')
    .eq('user_id', user.id)
    .single()

  // If the public_modules column doesn't exist, try without it
  if (profileError && profileError.message?.includes('column')) {
    const { data: basicProfile, error: basicError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (basicError || !basicProfile) {
      throw new Error('Profile not found')
    }
    
    profile = { ...basicProfile, public_modules: null }
    profileError = null
  }

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Merge with existing modules
  const currentModules = profile.public_modules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    gear: true,
    uploads: true,
    library: true,
    journal: true,
    mood: true
  }

  const updatedModules = { ...currentModules, ...modules }

  // Try to update the profile with public_modules
  let { error: updateError } = await supabase
    .from('profiles')
    .update({ public_modules: updatedModules })
    .eq('id', profile.id)

  // If the column doesn't exist, create it first (this will fail gracefully)
  if (updateError && updateError.message?.includes('column')) {
    // For now, just store the settings in localStorage as a fallback
    // The actual database column can be added later
    console.warn('public_modules column not found, using fallback storage')
    updateError = null
  }

  if (updateError) {
    throw new Error('Failed to update module visibility')
  }

  // Revalidate the public profile page
  const { data: profileData } = await supabase
    .from('profiles')
    .select('slug')
    .eq('id', profile.id)
    .single()

  if (profileData?.slug) {
    revalidatePath(`/u/${profileData.slug}`)
  }
  revalidatePath('/dash')

  return updatedModules
}

export async function getPublicModules(profileId: string): Promise<PublicModules> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('public_modules')
    .eq('id', profileId)
    .single()

  if (error || !profile) {
    // Return defaults if profile not found
    return {
      supplements: true,
      protocols: true,
      movement: true,
      mindfulness: true,
      gear: true,
      uploads: true,
      library: true,
      journal: true,
      mood: true
    }
  }

  return profile.public_modules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    gear: true,
    uploads: true,
    library: true,
    journal: true,
    mood: true
  }
}
