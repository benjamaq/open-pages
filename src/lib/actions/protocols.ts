'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProtocol(formData: {
  name: string
  description?: string
  frequency?: string
  public: boolean
  time_preference?: string
  schedule_days?: number[]
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Create the protocol
  const { error: protocolError } = await supabase
    .from('protocols')
    .insert({
      profile_id: profile.id,
      name: formData.name,
      description: formData.description || null,
      frequency: formData.frequency || 'weekly',
      public: formData.public,
      time_preference: formData.time_preference || 'anytime',
      schedule_days: formData.schedule_days || [0, 1, 2, 3, 4, 5, 6]
    })

  if (protocolError) {
    console.error('Protocol creation error:', protocolError)
    throw new Error(`Failed to create protocol: ${protocolError.message}`)
  }

  // Revalidate the protocols page
  revalidatePath('/dash/protocols')
}

export async function updateProtocol(protocolId: string, formData: {
  name: string
  description?: string
  frequency?: string
  public: boolean
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this protocol
  const { data: protocol, error: fetchError } = await supabase
    .from('protocols')
    .select(`
      id,
      profiles!inner(user_id)
    `)
    .eq('id', protocolId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !protocol) {
    throw new Error('Protocol not found or access denied')
  }

  // Update the protocol
  const { error: updateError } = await supabase
    .from('protocols')
    .update({
      name: formData.name,
      description: formData.description || null,
      frequency: formData.frequency || null,
      public: formData.public
    })
    .eq('id', protocolId)

  if (updateError) {
    console.error('Protocol update error:', updateError)
    throw new Error(`Failed to update protocol: ${updateError.message}`)
  }

  // Revalidate the protocols page
  revalidatePath('/dash/protocols')
}

export async function deleteProtocol(protocolId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this protocol
  const { data: protocol, error: fetchError } = await supabase
    .from('protocols')
    .select(`
      id,
      profiles!inner(user_id)
    `)
    .eq('id', protocolId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !protocol) {
    throw new Error('Protocol not found or access denied')
  }

  // Delete the protocol
  const { error: deleteError } = await supabase
    .from('protocols')
    .delete()
    .eq('id', protocolId)

  if (deleteError) {
    console.error('Protocol deletion error:', deleteError)
    throw new Error(`Failed to delete protocol: ${deleteError.message}`)
  }

  // Revalidate the protocols page
  revalidatePath('/dash/protocols')
}
