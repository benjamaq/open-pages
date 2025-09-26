const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI1OTcsImV4cCI6MjA3MzUwODU5N30.HR9d3TbSj2Dlq7zeE2SL1xlMQJ0oebBaxvdQ0ONN2d0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createProfile() {
  try {
    console.log('🔍 Creating profile for user...')
    
    // Your user ID from the debug page
    const userId = 'd1a71561-d0be-4444-8863-270f98fb13f9'
    const userEmail = 'ajjjaj@mac.com'
    
    // Create a profile with basic information
    const profileData = {
      user_id: userId,
      display_name: 'BioStackr User', // You can change this later
      slug: 'biostackr-user', // You can change this later
      allow_stack_follow: true,
      show_public_followers: true,
      created_at: new Date().toISOString()
    }
    
    console.log('📝 Creating profile with data:', profileData)
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return
    }

    console.log('✅ Profile created successfully!')
    console.log('📊 New profile details:')
    console.log(`   ID: ${newProfile.id}`)
    console.log(`   Display Name: ${newProfile.display_name}`)
    console.log(`   Slug: ${newProfile.slug}`)
    console.log(`   User ID: ${newProfile.user_id}`)
    console.log(`   Allow Follow: ${newProfile.allow_stack_follow}`)
    console.log(`   Show Followers: ${newProfile.show_public_followers}`)
    
    console.log('\n🎉 Profile creation complete!')
    console.log('You should now be able to:')
    console.log('- Access the dashboard')
    console.log('- Use notify followers')
    console.log('- See your profile in the followers test page')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the profile creation
createProfile()
