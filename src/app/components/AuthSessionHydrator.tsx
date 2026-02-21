'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AuthSessionHydrator() {
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient()
        // If Supabase already has a session, nothing to do
        const { data: current } = await supabase.auth.getSession()
        if (!current?.session) {
          const raw = localStorage.getItem('supabase_session')
          if (raw) {
            const session = JSON.parse(raw)
            if (session?.access_token && session?.refresh_token) {
              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              })
            }
          }
        }

        // Attempt to redeem any stashed promo/beta code after auth is established.
        const pending = (() => {
          try { return String(localStorage.getItem('bs_pending_access_code') || '').trim().toUpperCase() } catch { return '' }
        })()
        if (!pending) return

        const clearPending = () => { try { localStorage.removeItem('bs_pending_access_code') } catch {} }

        // Try promo redemption first; if not found, fall back to beta code validation.
        try {
          try {
            const { data: u } = await supabase.auth.getUser()
            console.log('[PROMO] attempting redemption', { code: pending, userId: u?.user?.id || null })
          } catch {
            try { console.log('[PROMO] attempting redemption', { code: pending, userId: null }) } catch {}
          }
          const r = await fetch('/api/promo/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: pending })
          })
          const j = await r.json().catch(() => ({} as any))
          try { console.log('[PROMO] response', { status: r.status, body: j }) } catch {}
          if (r.status === 401) {
            // Not logged in yet; keep pending for later retry.
            return
          }
          if (r.ok) {
            clearPending()
            // IMPORTANT: only show success AFTER confirmed 200 from /api/promo/redeem.
            toast.success('Pro unlocked', { description: String(j?.message || '🎉 Pro unlocked!') } as any)
            return
          }
          const msg = String(j?.error || '').trim()
          if (msg === 'Code not found') {
            // Beta fallback
            const b = await fetch('/api/beta/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: pending })
            })
            if (b.ok) {
              clearPending()
              toast.success('Beta code activated', { description: 'You now have extended Pro access.' } as any)
              return
            }
            // Invalid beta code; clear and show message.
            clearPending()
            toast.error('Invalid code', { description: 'Code not found.' } as any)
            return
          }
          // Terminal promo errors: clear so we don't keep retrying forever.
          if (msg === 'Already redeemed' || msg === 'Code expired' || msg === 'No redemptions left') {
            clearPending()
          }
          if (msg) toast.error('Promo code', { description: msg } as any)
        } catch (error) {
          try { console.log('[PROMO] error', error) } catch {}
          // Keep pending code for later retry (offline/etc.)
        }
      } catch {}
    }
    run()
  }, [])
  return null
}


