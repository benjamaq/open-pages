'use client'

import { useEffect, useState } from 'react'
import PaywallModal from './PaywallModal'

export default function UpgradeButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Prefer billing endpoint; fallback to profile tier if exposed
        const r = await fetch('/api/billing/info', { cache: 'no-store' })
        const j = r.ok ? await r.json() : {}
        const paid = Boolean(j?.isPaid) || Boolean(j?.subscription && (j.subscription.status === 'active' || j.subscription.status === 'trialing'))
        if (mounted && paid) { setIsPro(true); return }
        // Optional: probe profile tier if available
        try {
          const me = await fetch('/api/me', { cache: 'no-store' }).then(res => res.ok ? res.json() : {})
          if (mounted) setIsPro(String((me as any)?.tier || '').toLowerCase() === 'pro')
        } catch { if (mounted) setIsPro(false) }
      } catch { if (mounted) setIsPro(false) }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <>
      {isPro ? (
        <span className={compact ? 'px-2 h-8 inline-flex items-center text-sm text-gray-500' : 'px-2 inline-flex items-center text-gray-600'}>
          Pro ✓
        </span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={compact
            ? 'px-3 h-8 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50'
            : 'px-3 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50'}
        >
          Upgrade
        </button>
      )}
      <PaywallModal open={open} onClose={() => setOpen(false)} defaultPeriod="yearly" />
    </>
  )
}


