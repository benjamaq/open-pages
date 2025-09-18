'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProfile(formData: {
  display_name: string
  bio?: string
  slug: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Create the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      slug: formData.slug,
      display_name: formData.display_name,
      bio: formData.bio || null,
      avatar_url: formData.avatar_url || null,
      public: true
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    throw new Error(`Failed to create profile: ${profileError.message}`)
  }

  // Revalidate the dashboard page
  revalidatePath('/dash')
  
  // Redirect to dashboard
  redirect('/dash')
}

export async function updateJournalVisibility(profileId: string, showJournalPublic: boolean) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ show_journal_public: showJournalPublic })
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating journal visibility:', error)
    throw new Error('Failed to update journal visibility')
  }

  revalidatePath('/dash')
  revalidatePath('/u/[slug]', 'page')
  
  return data
}
