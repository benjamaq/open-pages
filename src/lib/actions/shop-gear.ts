'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface ShopGearItem {
  id: string
  profile_id: string
  name: string
  description?: string
  brand?: string
  category?: string
  price?: string
  affiliate_url: string
  image_url?: string
  commission_rate?: string
  featured: boolean
  sort_order: number
  public: boolean
  created_at: string
  updated_at: string
}

export async function getShopGearItems(profileId: string): Promise<ShopGearItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shop_gear_items')
    .select('*')
    .eq('profile_id', profileId)
    .eq('public', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching shop gear items:', error)
    return []
  }

  return data || []
}

export async function getUserShopGearItems(userId: string): Promise<ShopGearItem[]> {
  const supabase = await createClient()
  
  // First get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    return []
  }

  // Then get their shop gear items
  const { data, error } = await supabase
    .from('shop_gear_items')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching user shop gear items:', error)
    return []
  }

  return data || []
}

export async function createShopGearItem(data: {
  profile_id: string
  name: string
  description?: string
  brand?: string
  category?: string
  price?: string
  affiliate_url: string
  image_url?: string
  commission_rate?: string
  featured?: boolean
  sort_order?: number
  public?: boolean
}): Promise<ShopGearItem | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Verify the user owns this profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, tier')
    .eq('id', data.profile_id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  if ((profile as any).user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Check if user has Creator tier
  if ((profile as any).tier !== 'creator') {
    throw new Error('Creator tier required')
  }

  const { data: newItem, error } = await (supabase
    .from('shop_gear_items') as any)
    .insert({
      ...data,
      featured: data.featured || false,
      sort_order: data.sort_order || 0,
      public: data.public ?? true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating shop gear item:', error)
    throw new Error('Failed to create shop gear item')
  }

  revalidatePath(`/u/${(profile as any).slug}`)
  revalidatePath('/dash')
  
  return newItem
}

export async function updateShopGearItem(
  id: string, 
  updates: Partial<ShopGearItem>
): Promise<ShopGearItem | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get the item to verify ownership
  const { data: item, error: itemError } = await supabase
    .from('shop_gear_items')
    .select(`
      *,
      profiles!inner(user_id, slug)
    `)
    .eq('id', id)
    .single()

  if (itemError || !item) {
    throw new Error('Shop gear item not found')
  }

  if ((item as any).profiles.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { data: updatedItem, error } = await (supabase
    .from('shop_gear_items') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shop gear item:', error)
    throw new Error('Failed to update shop gear item')
  }

  revalidatePath(`/u/${(item as any).profiles.slug}`)
  revalidatePath('/dash')
  
  return updatedItem
}

export async function deleteShopGearItem(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get the item to verify ownership
  const { data: item, error: itemError } = await supabase
    .from('shop_gear_items')
    .select(`
      *,
      profiles!inner(user_id, slug)
    `)
    .eq('id', id)
    .single()

  if (itemError || !item) {
    throw new Error('Shop gear item not found')
  }

  if ((item as any).profiles.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('shop_gear_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting shop gear item:', error)
    throw new Error('Failed to delete shop gear item')
  }

  revalidatePath(`/u/${(item as any).profiles.slug}`)
  revalidatePath('/dash')
}

export async function getUserTier(userId: string): Promise<'free' | 'pro' | 'creator'> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tier')
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    console.error('Error fetching user tier:', error)
    return 'free'
  }

  return (profile as any).tier as 'free' | 'pro' | 'creator'
}

export async function updateUserTier(
  userId: string, 
  tier: 'free' | 'pro' | 'creator'
): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  if (user.id !== userId) {
    throw new Error('Unauthorized')
  }

  const { error } = await (supabase
    .from('profiles') as any)
    .update({ tier })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user tier:', error)
    throw new Error('Failed to update user tier')
  }

  // Also update user_usage table
  const { error: usageError } = await (supabase
    .from('user_usage') as any)
    .update({ 
      tier,
      current_tier: tier,
      tier_upgraded_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (usageError) {
    console.error('Error updating user usage tier:', usageError)
  }

  revalidatePath('/dash')
  revalidatePath('/pricing')
}
