'use client'

import { useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MagicLinkExpiredScreen from '@/components/MagicLinkExpiredScreen'
import { magicLinkAuthErrorFromWindow, stripMagicLinkAuthParamsFromUrl } from '@/lib/magicLinkAuthError'

/**
 * When there is no session, the server must not redirect before the client can read
 * `location.hash` (Supabase puts magic-link errors there; fragments are not sent to the server).
 */
export default function DashboardUnauthGate() {
  const router = useRouter()
  const [phase, setPhase] = useState<'pending' | 'expired' | 'gone'>('pending')

  useLayoutEffect(() => {
    if (magicLinkAuthErrorFromWindow()) {
      stripMagicLinkAuthParamsFromUrl()
      setPhase('expired')
      return
    }
    setPhase('gone')
    router.replace('/login')
  }, [router])

  if (phase === 'expired') {
    return <MagicLinkExpiredScreen variant="page" />
  }

  return (
    <div className="min-h-screen grid place-items-center text-slate-600 text-sm bg-white">
      Redirecting…
    </div>
  )
}
