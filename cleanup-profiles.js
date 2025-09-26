const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://qvwvpxkflvhokmxutapi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3ZweGtmbHZob2tteHV0YXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI1OTcsImV4cCI6MjA3MzUwODU5N30.HR9d3TbSj2Dlq7zeE2SL1xlMQJ0oebBaxvdQ0ONN2d0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupProfiles() {
  try {
    console.log('🔍 Starting profile cleanup...')
    
    // Your user ID from the database check
    const userId = 'd1a71561-d0be-4444-8863-270f98fb13f9'
    
    // Get all profiles for this user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`📊 Found ${profiles.length} profiles for user ${userId}`)
    
    if (profiles.length <= 1) {
      console.log('✅ No duplicate profiles found. Nothing to clean up.')
      return
    }

    // Show all profiles
    profiles.forEach((profile, index) => {
      console.log(`\n${index === 0 ? '✅ KEEP' : '❌ DELETE'} Profile ${index + 1}:`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   Display Name: ${profile.display_name || 'N/A'}`)
      console.log(`   Slug: ${profile.slug || 'N/A'}`)
      console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`)
    })

    // Keep the most recent profile (first in the ordered list)
    const keepProfile = profiles[0]
    const duplicateProfiles = profiles.slice(1)

    console.log(`\n🧹 Cleaning up ${duplicateProfiles.length} duplicate profiles...`)
    console.log(`✅ Keeping profile: ${keepProfile.id} (${keepProfile.display_name})`)

    // Delete duplicate profiles
    const duplicateIds = duplicateProfiles.map(p => p.id)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('id', duplicateIds)

    if (deleteError) {
      console.error('❌ Error deleting duplicate profiles:', deleteError)
    } else {
      console.log(`✅ Successfully deleted ${duplicateIds.length} duplicate profiles!`)
      console.log(`✅ Kept profile: ${keepProfile.display_name} (${keepProfile.id})`)
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the cleanup
cleanupProfiles()
