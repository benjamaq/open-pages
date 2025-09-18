import { createClient } from '../../lib/supabase/server'
import { HeaderBrandFirst } from '../../components/layout/HeaderBrandFirst'

export default async function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated (optional for public pages)
  const { data: { user } } = await supabase.auth.getUser()
  
  let userSlug = null
  if (user) {
    // Get user profile for slug
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug')
      .eq('user_id', user.id)
      .single()
    
    userSlug = profile?.slug
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderBrandFirst userSlug={userSlug} />
      
      {/* Page container below header */}
      <main className="mx-auto max-w-screen-2xl px-6 pt-4 sm:pt-6">
        {children}
      </main>
    </div>
  )
}
