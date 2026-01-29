'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const params = useSearchParams()
  const plan = (params.get('plan') || 'premium').toLowerCase()
  const period = (params.get('period') || 'monthly').toLowerCase()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const checkAuthAndRedirect = async () => {
      try {
        // Ensure latest session state (getSession is preferred for immediate read)
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data?.session) {
          // Session confirmed → safe to hit server route which requires auth
          window.location.replace(`/api/billing/start?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`)
        } else {
          // Not logged in → bounce to signup, and come back here as next
          window.location.replace(`/auth/signup?next=${encodeURIComponent(`/checkout?plan=${plan}&period=${period}`)}`)
        }
      } catch {
        // If anything goes wrong, default back to signup flow
        window.location.replace(`/auth/signup?next=${encodeURIComponent(`/checkout?plan=${plan}&period=${period}`)}`)
      }
    }

    checkAuthAndRedirect()
    return () => { cancelled = true }
  }, [plan, period])

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
      Preparing checkout…
    </div>
  )
}
