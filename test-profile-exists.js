const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI1OTcsImV4cCI6MjA3MzUwODU5N30.HR9d3TbSj2Dlq7zeE2SL1xlMQJ0oebBaxvdQ0ONN2d0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProfileExists() {
  try {
    console.log('🔍 Testing if profile exists...')
    
    const userId = 'd1a71561-d0be-4444-8863-270f98fb13f9'
    
    // Check if profile exists
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`📊 Found ${profiles.length} profiles for user ${userId}`)
    
    if (profiles.length > 0) {
      console.log('✅ Profile exists!')
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`)
        console.log(`      Display Name: ${profile.display_name}`)
        console.log(`      Slug: ${profile.slug}`)
        console.log(`      Allow Follow: ${profile.allow_stack_follow}`)
      })
    } else {
      console.log('❌ No profile found!')
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

testProfileExists()
