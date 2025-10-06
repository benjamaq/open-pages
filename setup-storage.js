// Setup Supabase Storage Buckets
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkzMjU5NywiZXhwIjoyMDczNTA4NTk3fQ.6P6JzCN598JXq6HHiP5cKWExljsfsj5sUGCJlDfezcY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  console.log('Setting up Supabase Storage...')
  
  // Create avatars bucket
  console.log('Creating avatars bucket...')
  const { data: avatarBucket, error: avatarError } = await supabase.storage.createBucket('avatars', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880 // 5MB
  })
  console.log('Avatars bucket:', { avatarBucket, avatarError })
  
  // Create uploads bucket
  console.log('Creating uploads bucket...')
  const { data: uploadsBucket, error: uploadsError } = await supabase.storage.createBucket('uploads', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880 // 5MB
  })
  console.log('Uploads bucket:', { uploadsBucket, uploadsError })
  
  // List buckets to verify
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  console.log('All buckets:', { buckets, bucketError })
}

setupStorage().catch(console.error)
