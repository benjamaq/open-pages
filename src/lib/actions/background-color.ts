'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBackgroundColor(color: string) {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User must be authenticated')
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, slug')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Check if user is a creator
  if (profile.tier !== 'creator') {
    throw new Error('Only creators can customize background colors')
  }

  // Validate color format (hex color)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
  if (!hexColorRegex.test(color)) {
    throw new Error('Invalid color format. Please use hex format (#RRGGBB)')
  }

  // Update background color
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      custom_background_color: color,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (updateError) {
    throw new Error('Failed to update background color')
  }

  // Revalidate pages that might show the updated color
  revalidatePath('/dash')
  revalidatePath('/dash/settings')
  if (profile.slug) {
    revalidatePath(`/u/${profile.slug}`)
  }

  return { success: true }
}

export async function getBackgroundColor() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return '#FFFFFF' // Default white
  }

  // Get user's background color
  const { data: profile } = await supabase
    .from('profiles')
    .select('custom_background_color')
    .eq('user_id', user.id)
    .single()

  return profile?.custom_background_color || '#FFFFFF'
}
