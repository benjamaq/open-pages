'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { NutritionSignature, validateNutritionSignature } from '../nutrition/signature'

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

  return profile as any
}

// Get nutrition signature for a profile
export async function getNutritionSignature(profileId?: string): Promise<NutritionSignature> {
  const supabase = await createClient()
  
  let targetProfileId = profileId
  
  if (!targetProfileId) {
    // Get current user's profile
    const profile = await getCurrentProfile()
    targetProfileId = profile.id
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('nutrition_signature')
    .eq('id', targetProfileId as any)
    .single()

  if (error || !profile) {
    return { enabled: false, header_badges: [] }
  }

  return (profile as any).nutrition_signature as NutritionSignature || { enabled: false, header_badges: [] }
}

// Update nutrition signature
export async function updateNutritionSignature(signature: Partial<NutritionSignature>): Promise<NutritionSignature> {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile()

    // Validate the signature
    const validatedSignature = validateNutritionSignature(signature)

    // Update the profile
    const { data: updatedProfile, error } = await (supabase
      .from('profiles') as any)
      .update({ nutrition_signature: validatedSignature })
      .eq('id', profile.id)
      .select('nutrition_signature')
      .single()

    if (error) {
      console.error('Failed to update nutrition signature:', error)
      throw new Error('Failed to update nutrition signature')
    }

    // Revalidate relevant paths
    revalidatePath('/dash/settings')
    if (profile.slug) {
      revalidatePath(`/u/${profile.slug}`)
    }

    return (updatedProfile as any).nutrition_signature as NutritionSignature
  } catch (error) {
    console.error('Error in updateNutritionSignature:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update nutrition signature')
  }
}

// Get public nutrition signature (for public profiles)
export async function getPublicNutritionSignature(profileId: string): Promise<NutritionSignature> {
  try {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nutrition_signature')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      return { enabled: false, header_badges: [] }
    }

    const signature = (profile as any).nutrition_signature as NutritionSignature
    
    // Only return if enabled
    if (!signature?.enabled && (!signature?.header_badges || signature.header_badges.length === 0)) {
      return { enabled: false, header_badges: [] }
    }

    return signature
  } catch (error) {
    console.error('Error in getPublicNutritionSignature:', error)
    return { enabled: false, header_badges: [] }
  }
}
