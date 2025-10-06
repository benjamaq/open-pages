// Test authentication
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI1OTcsImV4cCI6MjA3MzUwODU5N30.HR9d3TbSj2Dlq7zeE2SL1xlMQJ0oebBaxvdQ0ONN2d0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('Testing Supabase connection...')
  
  // Test basic connection
  const { data, error } = await supabase.from('profiles').select('count').limit(1)
  console.log('Connection test:', { data, error })
  
  // Test storage buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  console.log('Storage buckets:', { buckets, bucketError })
}

testAuth().catch(console.error)
