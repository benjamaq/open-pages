'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCustomBranding(data: {
  custom_logo_url?: string
  custom_branding_enabled?: boolean
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get user's profile to check tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, tier, slug')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Check if user has Creator tier
  if ((profile as any).tier !== 'creator') {
    throw new Error('Creator tier required for custom branding')
  }

  const { error } = await (supabase
    .from('profiles') as any)
    .update(data)
    .eq('id', (profile as any).id)

  if (error) {
    console.error('Error updating custom branding:', error)
    throw new Error('Failed to update custom branding')
  }

  revalidatePath(`/u/${(profile as any).slug}`)
  revalidatePath('/dash')
}

export async function uploadCustomLogo(file: File): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get user's profile to check tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, tier, slug')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Check if user has Creator tier
  if ((profile as any).tier !== 'creator') {
    throw new Error('Creator tier required for custom branding')
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File size must be less than 5MB')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/custom-logo-${Date.now()}.${fileExt}`
  
  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars') // Reuse existing avatars bucket
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    console.error('Error uploading custom logo:', uploadError)
    throw new Error('Failed to upload logo')
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(uploadData.path)

  // Update profile with new logo URL
  const { error: updateError } = await (supabase
    .from('profiles') as any)
    .update({ 
      custom_logo_url: urlData.publicUrl,
      custom_branding_enabled: true 
    })
    .eq('id', (profile as any).id)

  if (updateError) {
    console.error('Error updating profile with logo URL:', updateError)
    throw new Error('Failed to update profile')
  }

  revalidatePath(`/u/${(profile as any).slug}`)
  revalidatePath('/dash')

  return urlData.publicUrl
}

export async function getCustomBranding(): Promise<{
  custom_logo_url?: string
  custom_branding_enabled: boolean
  tier: 'free' | 'pro' | 'creator'
}> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('custom_logo_url, custom_branding_enabled, tier')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  return {
    custom_logo_url: (profile as any).custom_logo_url,
    custom_branding_enabled: (profile as any).custom_branding_enabled || false,
    tier: (profile as any).tier as 'free' | 'pro' | 'creator'
  }
}

export async function deleteCustomLogo(): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, custom_logo_url, slug')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Delete the file from storage if it exists
  if ((profile as any).custom_logo_url) {
    // Extract the file path from the URL
    const urlParts = (profile as any).custom_logo_url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${user.id}/custom-logo-${fileName.split('-').slice(2).join('-')}`

    await supabase.storage
      .from('avatars')
      .remove([filePath])
  }

  // Update profile to remove logo URL
  const { error: updateError } = await (supabase
    .from('profiles') as any)
    .update({ 
      custom_logo_url: null,
      custom_branding_enabled: false 
    })
    .eq('id', (profile as any).id)

  if (updateError) {
    console.error('Error removing custom logo:', updateError)
    throw new Error('Failed to remove custom logo')
  }

  revalidatePath(`/u/${(profile as any).slug}`)
  revalidatePath('/dash')
}
