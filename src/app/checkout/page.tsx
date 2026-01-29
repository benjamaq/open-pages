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
        // Use getUser() to force a roundtrip and avoid stale session in incognito
        const { data, error } = await supabase.auth.getUser()
        // Debug logs to trace branch behavior
        try {
          // eslint-disable-next-line no-console
          console.log('[checkout] getUser:', { hasUser: !!data?.user, error: error?.message })
        } catch {}
        if (cancelled) return
        if (data?.user) {
          try { console.log('[checkout] Auth present → redirecting to Stripe start') } catch {}
          // Auth confirmed → safe to hit server route which requires auth
          window.location.replace(`/api/billing/start?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`)
        } else {
          try { console.log('[checkout] No auth → redirecting to signup') } catch {}
          // Not logged in → bounce to signup, and come back here as next
          window.location.replace(`/auth/signup?next=${encodeURIComponent(`/checkout?plan=${plan}&period=${period}`)}`)
        }
      } catch (e) {
        try { console.log('[checkout] getUser error, fallback to signup:', (e as any)?.message) } catch {}
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
