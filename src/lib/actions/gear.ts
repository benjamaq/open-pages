import { createClient } from '../supabase/client'

interface GearData {
  name: string
  brand?: string
  model?: string
  category: string
  description?: string
  buy_link?: string
  status?: string
  public: boolean
}

export async function addGear(data: GearData) {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Insert gear item
  const { data: gear, error } = await supabase
    .from('gear')
    .insert([{
      profile_id: profile.id,
      name: data.name.trim(),
      brand: data.brand?.trim() || null,
      model: data.model?.trim() || null,
      category: data.category,
      description: data.description?.trim() || null,
      buy_link: data.buy_link?.trim() || null,
      status: data.status || 'current',
      public: data.public
    }])
    .select()
    .single()

  if (error) {
    console.error('Failed to create gear item:', error)
    throw new Error('Failed to create gear item')
  }

  return gear
}

export async function updateGear(id: string, data: Partial<GearData>) {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const updateData: any = {}
  
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.brand !== undefined) updateData.brand = data.brand?.trim() || null
  if (data.model !== undefined) updateData.model = data.model?.trim() || null
  if (data.category !== undefined) updateData.category = data.category
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.buy_link !== undefined) updateData.buy_link = data.buy_link?.trim() || null
  if (data.public !== undefined) updateData.public = data.public
  
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('gear')
    .update(updateData)
    .eq('id', id)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Failed to update gear:', error)
    throw new Error('Failed to update gear')
  }
}

export async function deleteGear(id: string) {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const { error } = await supabase
    .from('gear')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Failed to delete gear:', error)
    throw new Error('Failed to delete gear')
  }
}

export async function getUserGear(profileId: string) {
  const supabase = createClient()
  
  const { data: gear, error } = await supabase
    .from('gear')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch gear:', error)
    throw new Error('Failed to fetch gear')
  }

  return gear || []
}

export async function getPublicGear(profileId: string) {
  const supabase = createClient()
  
  const { data: gear, error } = await supabase
    .from('gear')
    .select('*')
    .eq('profile_id', profileId)
    .eq('public', true)
    .order('category', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch public gear:', error)
    return []
  }

  return gear || []
}
