import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import FoodPageClient from './FoodPageClient'

export default async function FoodPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/signin')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/dash/create-profile')
  }

  // Get food items (using stack_items table, filtering for food-type items)
  const { data: foodItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('profile_id', (profile as any).id)
    .order('created_at', { ascending: false })

  return (
    <FoodPageClient 
      profile={profile}
      foodItems={foodItems || []}
    />
  )
}
