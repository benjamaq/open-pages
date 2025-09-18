'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAvatar(avatarUrl: string) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Update the user's profile with the new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Profile avatar update error:', updateError)
    throw new Error(`Failed to update profile avatar: ${updateError.message}`)
  }

  console.log('Profile avatar updated successfully:', avatarUrl)
  
  // Revalidate the dashboard page to show new avatar
  revalidatePath('/dash')
}
