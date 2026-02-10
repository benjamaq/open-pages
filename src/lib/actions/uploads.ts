'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function addUpload(formData: {
  name: string
  description?: string
  file_type: string
  file_url: string
  file_size: number
  public: boolean
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

  // Create the upload record
  const { error: uploadError } = await (supabase
    .from('uploads') as any)
    .insert({
      profile_id: (profile as any).id,
      name: formData.name,
      description: formData.description || null,
      file_type: formData.file_type,
      file_url: formData.file_url,
      file_size: formData.file_size,
      public: formData.public
    })

  if (uploadError) {
    console.error('Upload creation error:', uploadError)
    throw new Error(`Failed to create upload: ${uploadError.message}`)
  }

  // Revalidate the uploads page
  revalidatePath('/dash/uploads')
}

export async function updateUpload(uploadId: string, formData: {
  name: string
  description?: string
  public: boolean
}) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this upload
  const { data: upload, error: fetchError } = await supabase
    .from('uploads')
    .select(`
      id,
      profiles!inner(user_id)
    `)
    .eq('id', uploadId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !upload) {
    throw new Error('Upload not found or access denied')
  }

  // Update the upload
  const { error: updateError } = await (supabase
    .from('uploads') as any)
    .update({
      name: formData.name,
      description: formData.description || null,
      public: formData.public
    })
    .eq('id', uploadId)

  if (updateError) {
    console.error('Upload update error:', updateError)
    throw new Error(`Failed to update upload: ${updateError.message}`)
  }

  // Revalidate the uploads page
  revalidatePath('/dash/uploads')
}

export async function deleteUpload(uploadId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify the user owns this upload
  const { data: upload, error: fetchError } = await supabase
    .from('uploads')
    .select(`
      id,
      file_url,
      profiles!inner(user_id)
    `)
    .eq('id', uploadId)
    .eq('profiles.user_id', user.id)
    .single()

  if (fetchError || !upload) {
    throw new Error('Upload not found or access denied')
  }

  // Delete the file from storage if it exists
  if ((upload as any).file_url) {
    try {
      const filePath = (upload as any).file_url.split('/').pop()
      if (filePath) {
        await supabase.storage.from('uploads').remove([filePath])
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error)
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete the upload record
  const { error: deleteError } = await supabase
    .from('uploads')
    .delete()
    .eq('id', uploadId)

  if (deleteError) {
    console.error('Upload deletion error:', deleteError)
    throw new Error(`Failed to delete upload: ${deleteError.message}`)
  }

  // Revalidate the uploads page
  revalidatePath('/dash/uploads')
}
