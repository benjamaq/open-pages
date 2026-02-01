import { createClient } from './supabase/client'

/**
 * Direct upload avatar to Supabase Storage (bypasses bucket check)
 */
export async function uploadAvatarDirect(
  file: File, 
  userId: string,
  _onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()
  
  try {
    console.log('Starting direct avatar upload...')
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' }
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { url: null, error: 'File size must be less than 10MB' }
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    
    console.log('Uploading to path:', filePath)
    
    // Try to upload file directly
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Direct upload error:', uploadError)
      return { url: null, error: `Upload failed: ${uploadError.message}` }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    console.log('Upload successful, public URL:', publicUrl)
    return { url: publicUrl, error: null }
    
  } catch (error) {
    console.error('Avatar upload exception:', error)
    return { url: null, error: 'An unexpected error occurred during upload' }
  }
}

/**
 * Direct upload file to Supabase Storage (bypasses bucket check)
 */
export async function uploadFileDirect(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()
  
  try {
    console.log('Starting direct file upload...')
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Please upload a valid file (JPEG, PNG, GIF, WebP, or PDF)' }
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { url: null, error: 'File size must be less than 10MB' }
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${fileName}`
    
    console.log('Uploading to path:', filePath)
    
    // Try to upload file directly - first try uploads bucket, then fallback to avatars
    let uploadResult = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    let bucketName = 'uploads'
    
    // If uploads bucket doesn't exist, try avatars bucket
    if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
      console.log('Uploads bucket not found, trying avatars bucket...')
      uploadResult = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      bucketName = 'avatars'
    }
    
    if (uploadResult.error) {
      console.error('Direct upload error:', uploadResult.error)
      return { url: null, error: `Upload failed: ${uploadResult.error.message}` }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    console.log('Upload successful, public URL:', publicUrl)
    return { url: publicUrl, error: null }
    
  } catch (error) {
    console.error('File upload exception:', error)
    return { url: null, error: 'An unexpected error occurred during upload' }
  }
}
