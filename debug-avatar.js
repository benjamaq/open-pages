// Debug script to check avatar URL in database
// Run this in your browser console on the dashboard page

const checkAvatar = async () => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('Please log in first')
      return
    }

    // Get the user's profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('avatar_url, display_name, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      console.log('🔍 Profile data:')
      console.log('  Avatar URL:', profiles[0]?.avatar_url)
      console.log('  Display Name:', profiles[0]?.display_name)
      console.log('  Updated At:', profiles[0]?.updated_at)
      console.log('  Full profile:', profiles[0])
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

// Run the function
checkAvatar()
