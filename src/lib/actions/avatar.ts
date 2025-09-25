import { createClient } from '../supabase/client'

export async function updateProfileAvatar(avatarUrl: string) {
  console.log('updateProfileAvatar called with URL:', avatarUrl)
  const supabase = createClient()
  
  // Get current user
  console.log('Getting current user...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('User authentication error:', userError)
    throw new Error('User not authenticated')
  }
  console.log('User authenticated:', user.id)

  // Update profile with new avatar URL
  console.log('Updating profile avatar_url for user:', user.id, 'with URL:', avatarUrl)
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Profile update error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to update avatar: ${error.message}`)
  }

  console.log('Profile update successful:', data)
  return { success: true, data }
}