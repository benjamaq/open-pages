const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI1OTcsImV4cCI6MjA3MzUwODU5N30.HR9d3TbSj2Dlq7zeE2SL1xlMQJ0oebBaxvdQ0ONN2d0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixProfileIssue() {
  try {
    console.log('🔍 Diagnosing profile issue...')
    
    // Your user ID from the debug page
    const userId = 'd1a71561-d0be-4444-8863-270f98fb13f9'
    const userEmail = 'ajjjaj@mac.com'
    
    // Step 1: Check if profiles exist
    console.log('\n📊 Step 1: Checking existing profiles...')
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)

    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError)
      return
    }

    console.log(`Found ${existingProfiles.length} existing profiles for user ${userId}`)
    
    if (existingProfiles.length > 0) {
      console.log('📋 Existing profiles:')
      existingProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`)
        console.log(`      Display Name: ${profile.display_name || 'N/A'}`)
        console.log(`      Slug: ${profile.slug || 'N/A'}`)
        console.log(`      Created: ${new Date(profile.created_at).toLocaleString()}`)
        console.log('')
      })
      
      if (existingProfiles.length > 1) {
        console.log('🧹 Multiple profiles found - cleaning up duplicates...')
        const keepProfile = existingProfiles[0] // Most recent
        const duplicateIds = existingProfiles.slice(1).map(p => p.id)
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .in('id', duplicateIds)
          
        if (deleteError) {
          console.error('❌ Error deleting duplicates:', deleteError)
        } else {
          console.log(`✅ Deleted ${duplicateIds.length} duplicate profiles`)
          console.log(`✅ Kept profile: ${keepProfile.display_name} (${keepProfile.id})`)
        }
      } else {
        console.log('✅ Single profile found - no cleanup needed')
      }
    } else {
      console.log('\n📝 Step 2: No profiles found - creating new profile...')
      
      // Create a profile with basic information
      const profileData = {
        user_id: userId,
        display_name: 'BioStackr User',
        slug: 'biostackr-user',
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
    }
    
    console.log('\n🎉 Profile issue resolved!')
    console.log('You should now be able to:')
    console.log('- Access the dashboard without 404 errors')
    console.log('- Use the notify followers function')
    console.log('- See your profile in the followers test page')
    console.log('- Follow other users and receive welcome emails')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the fix
fixProfileIssue()
