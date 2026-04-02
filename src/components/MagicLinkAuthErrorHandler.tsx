'use client'

import { useLayoutEffect, useState } from 'react'
import MagicLinkExpiredScreen from '@/components/MagicLinkExpiredScreen'
import { magicLinkAuthErrorFromWindow, stripMagicLinkAuthParamsFromUrl } from '@/lib/magicLinkAuthError'

/**
 * Handles magic-link errors on non-dashboard routes (redirectTo home, login, etc.).
 * `/dashboard` is handled by DashboardUnauthGate so we do not strip the hash twice or race redirects.
 */
export default function MagicLinkAuthErrorHandler() {
  const [show, setShow] = useState(false)

  useLayoutEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname || '' : ''
    if (path === '/dashboard' || path.startsWith('/dashboard/')) return
    if (!magicLinkAuthErrorFromWindow()) return
    stripMagicLinkAuthParamsFromUrl()
    setShow(true)
  }, [])

  if (!show) return null
  return <MagicLinkExpiredScreen variant="overlay" />
}
