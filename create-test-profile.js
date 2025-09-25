// Simple script to create a test profile
// Run this in your browser console on the dashboard page

const createTestProfile = async () => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('Please log in first')
      return
    }

    // Create a test profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        slug: 'test-profile-' + Date.now(),
        display_name: 'Test User',
        bio: 'This is a test profile for testing the FollowButton',
        public: true,
        allow_stack_follow: true,
        show_public_followers: true
      })
      .select()

    if (error) {
      console.error('Error creating profile:', error)
    } else {
      console.log('✅ Test profile created:', data[0])
      console.log('🔗 Profile URL:', `${window.location.origin}/u/${data[0].slug}`)
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

// Run the function
createTestProfile()
