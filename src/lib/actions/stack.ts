'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStackItem(formData: {
  name: string
  dose?: string
  timing?: string
  brand?: string
  notes?: string
  public: boolean
  frequency?: string
  time_preference?: string
  schedule_days?: number[]
  category?: string
  itemType?: string
}) {
  console.log('addStackItem called with:', { 
    itemType: formData.itemType, 
    name: formData.name,
    public: formData.public 
  })
  
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('User authentication error:', userError)
    throw new Error('User not authenticated')
  }
  
  console.log('User authenticated:', user.id)

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    throw new Error('Profile not found')
  }
  
  console.log('Profile found:', profile.id)

  // Create the stack item
  const insertData = {
    profile_id: profile.id,
    item_type: formData.itemType || 'supplements',
    name: formData.name,
    dose: formData.dose || null,
    timing: formData.timing || null,
    brand: formData.brand || null,
    notes: formData.notes || null,
    public: formData.public,
    frequency: formData.frequency || 'daily',
    time_preference: formData.time_preference || 'anytime',
    schedule_days: formData.schedule_days || [0, 1, 2, 3, 4, 5, 6]
  }
  
  console.log('Inserting stack item:', insertData)
  
  const { error: stackItemError } = await supabase
    .from('stack_items')
    .insert(insertData)

  if (stackItemError) {
    console.error('Stack item creation error:', stackItemError)
    throw new Error(`Failed to create stack item: ${stackItemError.message}`)
  }

  // Revalidate relevant pages
  revalidatePath('/dash/stack')
  revalidatePath('/dash/mindfulness')
  revalidatePath('/dash/movement')
  revalidatePath('/dash/protocols')
  revalidatePath('/dash')
}

export async function updateStackItem(itemId: string, formData: {
  name: string
  dose?: string
  timing?: string
  brand?: string
  notes?: string
  public: boolean
  frequency?: string
  time_preference?: string
  schedule_days?: number[]
  category?: string
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this stack item
  const { data: stackItem, error: fetchError } = await supabase
    .from('stack_items')
    .select(`
      id,
      profiles!inner(user_id)
    `)
    .eq('id', itemId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !stackItem) {
    throw new Error('Stack item not found or access denied')
  }

  // Update the stack item
  const { error: updateError } = await supabase
    .from('stack_items')
    .update({
      name: formData.name,
      dose: formData.dose || null,
      timing: formData.timing || null,
      brand: formData.brand || null,
      notes: formData.notes || null,
      public: formData.public,
      frequency: formData.frequency || 'daily',
      time_preference: formData.time_preference || 'anytime',
      schedule_days: formData.schedule_days || [0, 1, 2, 3, 4, 5, 6]
    })
    .eq('id', itemId)

  if (updateError) {
    console.error('Stack item update error:', updateError)
    throw new Error(`Failed to update stack item: ${updateError.message}`)
  }

  // Revalidate the stack page
  revalidatePath('/dash/stack')
}

export async function deleteStackItem(itemId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this stack item
  const { data: stackItem, error: fetchError } = await supabase
    .from('stack_items')
    .select(`
      id,
      profiles!inner(user_id)
    `)
    .eq('id', itemId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !stackItem) {
    throw new Error('Stack item not found or access denied')
  }

  // Delete the stack item
  const { error: deleteError } = await supabase
    .from('stack_items')
    .delete()
    .eq('id', itemId)

  if (deleteError) {
    console.error('Stack item deletion error:', deleteError)
    throw new Error(`Failed to delete stack item: ${deleteError.message}`)
  }

  // Revalidate the stack page
  revalidatePath('/dash/stack')
}
