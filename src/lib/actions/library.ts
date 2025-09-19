'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

// Type definitions
export interface LibraryItem {
  id: string
  profile_id: string
  title: string
  category: 'lab' | 'assessment' | 'training_plan' | 'nutrition' | 'wearable_report' | 'mindfulness' | 'recovery' | 'other'
  date: string
  provider?: string | null
  summary_public?: string | null
  notes_private?: string | null
  tags?: string[] | null
  file_url: string
  file_type: string
  file_size?: number | null
  thumbnail_url?: string | null
  is_public: boolean
  allow_download: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface LibraryItemFormData {
  title: string
  category: LibraryItem['category']
  date: string
  provider?: string
  summary_public?: string
  notes_private?: string
  tags?: string[]
  file_url: string
  file_type: string
  file_size?: number
  thumbnail_url?: string
  is_public?: boolean
  allow_download?: boolean
  is_featured?: boolean
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
    .select('id, slug')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  return profile
}

// Create a new library item
export async function createLibraryItem(data: LibraryItemFormData): Promise<LibraryItem> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  // If this is a featured training plan, unfeatured any existing ones
  if (data.category === 'training_plan' && data.is_featured) {
    await supabase
      .from('library_items')
      .update({ is_featured: false })
      .eq('profile_id', profile.id)
      .eq('category', 'training_plan')
      .eq('is_featured', true)
  }

  const { data: item, error } = await supabase
    .from('library_items')
    .insert([{
      profile_id: profile.id,
      title: data.title.trim(),
      category: data.category,
      date: data.date,
      provider: data.provider?.trim() || null,
      summary_public: data.summary_public?.trim() || null,
      notes_private: data.notes_private?.trim() || null,
      tags: data.tags || null,
      file_url: data.file_url,
      file_type: data.file_type,
      file_size: data.file_size || null,
      thumbnail_url: data.thumbnail_url || null,
      is_public: data.is_public || false,
      allow_download: data.allow_download || false,
      is_featured: data.is_featured || false
    }])
    .select()
    .single()

  if (error) {
    console.error('Failed to create library item:', error)
    throw new Error('Failed to create library item')
  }

  // Revalidate relevant paths
  revalidatePath('/dash/library')
  revalidatePath('/dash')
  if (profile.slug) {
    revalidatePath(`/u/${profile.slug}`)
  }

  return item as LibraryItem
}

// Get user's library items
export async function getUserLibraryItems(): Promise<LibraryItem[]> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const { data: items, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch library items:', error)
    throw new Error('Failed to fetch library items')
  }

  return items as LibraryItem[]
}

// Get public library items for a profile
export async function getPublicLibraryItems(profileId: string): Promise<LibraryItem[]> {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false }) // Featured items first
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch public library items:', error)
    return []
  }

  return items as LibraryItem[]
}

// Get a single library item (public or owned)
export async function getLibraryItem(id: string): Promise<LibraryItem | null> {
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  // Check if user owns this item or if it's public
  const { data: { user } } = await supabase.auth.getUser()
  
  if (item.is_public) {
    return item as LibraryItem
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profile && profile.id === item.profile_id) {
      return item as LibraryItem
    }
  }

  return null
}

// Update a library item
export async function updateLibraryItem(id: string, data: Partial<LibraryItemFormData>): Promise<LibraryItem> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  // If this is being set as featured training plan, unfeatured any existing ones
  if (data.category === 'training_plan' && data.is_featured) {
    await supabase
      .from('library_items')
      .update({ is_featured: false })
      .eq('profile_id', profile.id)
      .eq('category', 'training_plan')
      .eq('is_featured', true)
      .neq('id', id) // Don't unfeatured the item we're updating
  }

  const updateData: any = {}
  
  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.category !== undefined) updateData.category = data.category
  if (data.date !== undefined) updateData.date = data.date
  if (data.provider !== undefined) updateData.provider = data.provider?.trim() || null
  if (data.summary_public !== undefined) updateData.summary_public = data.summary_public?.trim() || null
  if (data.notes_private !== undefined) updateData.notes_private = data.notes_private?.trim() || null
  if (data.tags !== undefined) updateData.tags = data.tags || null
  if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url || null
  if (data.is_public !== undefined) updateData.is_public = data.is_public
  if (data.allow_download !== undefined) updateData.allow_download = data.allow_download
  if (data.is_featured !== undefined) updateData.is_featured = data.is_featured

  const { data: item, error } = await supabase
    .from('library_items')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profile.id) // Ensure user owns this item
    .select()
    .single()

  if (error) {
    console.error('Failed to update library item:', error)
    throw new Error('Failed to update library item')
  }

  // Revalidate relevant paths
  revalidatePath('/dash/library')
  revalidatePath('/dash')
  if (profile.slug) {
    revalidatePath(`/u/${profile.slug}`)
  }

  return item as LibraryItem
}

// Delete a library item
export async function deleteLibraryItem(id: string): Promise<void> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  // Get the item to delete the file from storage
  const { data: item } = await supabase
    .from('library_items')
    .select('file_url, thumbnail_url')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (item) {
    // Delete files from storage
    if (item.file_url) {
      await supabase.storage.from('library').remove([item.file_url])
    }
    if (item.thumbnail_url) {
      await supabase.storage.from('library').remove([item.thumbnail_url])
    }
  }

  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id) // Ensure user owns this item

  if (error) {
    console.error('Failed to delete library item:', error)
    throw new Error('Failed to delete library item')
  }

  // Revalidate relevant paths
  revalidatePath('/dash/library')
  revalidatePath('/dash')
  if (profile.slug) {
    revalidatePath(`/u/${profile.slug}`)
  }
}

// Get category counts for a profile
export async function getLibraryCategoryCounts(profileId: string): Promise<Record<string, number>> {
  const supabase = await createClient()

  const { data: counts, error } = await supabase
    .from('library_items')
    .select('category')
    .eq('profile_id', profileId)
    .eq('is_public', true)

  if (error) {
    return {}
  }

  const categoryCounts: Record<string, number> = {}
  counts.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })

  return categoryCounts
}
