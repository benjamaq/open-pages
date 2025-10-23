import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return NextResponse.json({ 
      error: 'Server configuration error: Missing Supabase credentials. Please set up your .env.local file.' 
    }, { status: 500 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ 
      error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY.' 
    }, { status: 500 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const userIdFromForm = formData.get('userId') as string
    
    // Try to get user from auth first, fallback to form data
    let userId = userIdFromForm
    const supabaseAuth = await createClient()
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    
    if (user && !userError) {
      userId = user.id
    } else if (userIdFromForm) {
      // Use user ID from form data
    } else {
      console.error('User authentication failed:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role for storage operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    console.log('Supabase service client created')

    if (!file) {
      console.error('No file provided in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
    console.log('Upload request file meta:', { name: file?.name, type: file?.type, size: file?.size })
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please use JPG, PNG, WEBP, or GIF.' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Determine bucket and path based on type
    const bucket = type === 'avatar' ? 'avatars' : 'uploads'
    const fileName = file.name || 'unnamed'
    const fileExt = fileName.split('.').pop() || 'jpg'
    const fileNameWithExt = `${userId}/${Date.now()}.${fileExt}`

    try {
      // Check if bucket exists, create if needed
      console.log('Checking if bucket exists:', bucket)
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      if (listError) {
        console.error('Failed to list buckets:', listError)
        return NextResponse.json({ error: `Storage access failed: ${listError.message}` }, { status: 500 })
      }
      
      const bucketExists = buckets?.some(b => b.name === bucket)
      console.log('Bucket exists:', bucketExists, 'Available buckets:', buckets?.map(b => b.name))
      
      if (!bucketExists) {
        console.log('Creating bucket:', bucket)
        // Create bucket with public access and no RLS
        const { error: bucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: allowedTypes,
          fileSizeLimit: maxSize
        })
        
        if (bucketError && !bucketError.message.includes('already exists')) {
          console.error('Bucket creation error:', bucketError)
          // Try to continue anyway - bucket might exist but not be visible
          console.log('Attempting upload despite bucket creation error...')
        } else {
          console.log('Bucket created successfully')
        }
      }

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileNameWithExt, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        // If it's an RLS error, try to provide helpful guidance
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          return NextResponse.json({ 
            error: `Storage permissions error. Please ensure the '${bucket}' bucket exists and has proper RLS policies configured in Supabase.` 
          }, { status: 500 })
        }
        
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileNameWithExt)

      if (!urlData.publicUrl) {
        return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
      }

      // Profile update is handled by the client-side code
      // to ensure proper state management and UI updates

      return NextResponse.json({ 
        url: urlData.publicUrl,
        path: fileNameWithExt,
        success: true 
      })

    } catch (error) {
      console.error('Storage error:', error)
      return NextResponse.json({ error: 'Storage service unavailable. Please try again later.' }, { status: 503 })
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

// Simple test endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Upload API is working',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString()
  })
}
