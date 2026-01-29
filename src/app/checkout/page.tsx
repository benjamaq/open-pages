import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string; period?: string }
}) {
  const plan = searchParams.plan || 'premium'
  const period = searchParams.period || 'monthly'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // NOT logged in - send to signup, then back here
    const next = `/checkout?plan=${plan}&period=${period}`
    redirect(`/auth/signup?next=${encodeURIComponent(next)}`)
  }
  
  // Logged in - send to Stripe
  redirect(`/api/billing/start?plan=${plan}&period=${period}`)
}
