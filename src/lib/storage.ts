import { createClient } from './supabase/client'

/**
 * Check if the avatars storage bucket exists
 */
export async function checkAvatarsBucket(): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .listBuckets()
  
  if (error) {
    console.error('Error checking buckets:', error)
    return false
  }
  
  return data.some(bucket => bucket.name === 'avatars')
}

/**
 * Create the avatars storage bucket
 */
export async function createAvatarsBucket(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      })
    
    if (error) {
      // Check if bucket already exists (this is actually success)
      if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
        console.log('Avatars bucket already exists')
        return true
      }
      console.error('Error creating avatars bucket:', error)
      return false
    }
    
    console.log('Avatars bucket created successfully')
    return true
  } catch (error) {
    console.error('Exception creating avatars bucket:', error)
    return false
  }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
  file: File, 
  userId: string,
  _onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()
  
  try {
    // Check if avatars bucket exists with detailed logging
    console.log('Checking for avatars bucket...')
    const bucketExists = await checkAvatarsBucket()
    console.log('Bucket check result:', bucketExists)
    
    if (!bucketExists) {
      // Try to list all buckets for debugging
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      console.log('Available buckets:', buckets, 'Error:', listError)
      
      return { 
        url: null, 
        error: `Storage not set up. Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}. Please create the "avatars" bucket in Supabase Dashboard.` 
      }
    }
    
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
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: null, error: `Upload failed: ${uploadError.message}` }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    return { url: publicUrl, error: null }
    
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { url: null, error: 'An unexpected error occurred during upload' }
  }
}

/**
 * Delete avatar from Supabase Storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Extract file path from URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'avatars')
    
    if (bucketIndex === -1) {
      return false
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/')
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])
    
    if (error) {
      console.error('Delete error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Avatar delete error:', error)
    return false
  }
}

/**
 * Get avatar URL from file path
 */
export function getAvatarUrl(filePath: string): string {
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  
  return publicUrl
}

/**
 * Check if the uploads storage bucket exists
 */
export async function checkUploadsBucket(): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .listBuckets()
  
  if (error) {
    console.error('Error checking buckets:', error)
    return false
  }
  
  return data.some(bucket => bucket.name === 'uploads')
}

/**
 * Create the uploads storage bucket
 */
export async function createUploadsBucket(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .createBucket('uploads', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      })
    
    if (error) {
      // Check if bucket already exists (this is actually success)
      if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
        console.log('Uploads bucket already exists')
        return true
      }
      console.error('Error creating uploads bucket:', error)
      return false
    }
    
    console.log('Uploads bucket created successfully')
    return true
  } catch (error) {
    console.error('Exception creating uploads bucket:', error)
    return false
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()
  
  try {
    // Check if uploads bucket exists with detailed logging
    console.log('Checking for uploads bucket...')
    const bucketExists = await checkUploadsBucket()
    console.log('Uploads bucket check result:', bucketExists)
    
    if (!bucketExists) {
      // Try to list all buckets for debugging
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      console.log('Available buckets:', buckets, 'Error:', listError)
      
      return { 
        url: null, 
        error: `Storage not set up. Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}. Please create the "uploads" bucket in Supabase Dashboard.` 
      }
    }
    
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
    
    // We need to get user ID for better file organization
    // For now, use timestamp and random string
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${fileName}`
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: null, error: `Upload failed: ${uploadError.message}` }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)
    
    return { url: publicUrl, error: null }
    
  } catch (error) {
    console.error('File upload error:', error)
    return { url: null, error: 'An unexpected error occurred during upload' }
  }
}
