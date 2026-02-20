'use client'

import { useEffect, useState } from 'react'
import PaywallModal from './PaywallModal'
import { dedupedJson } from '@/lib/utils/dedupedJson'
import { isProActive } from '@/lib/entitlements/pro'

export default function UpgradeButton({
  compact = false,
  label = 'Upgrade',
  className,
  isPro: isProOverride,
}: {
  compact?: boolean
  label?: string
  className?: string
  isPro?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(typeof isProOverride === 'boolean' ? isProOverride : null)
  const [isTrial, setIsTrial] = useState<boolean>(false)

  useEffect(() => {
    // If parent provided a definitive membership flag (dashboard combined load), don't fetch.
    if (typeof isProOverride === 'boolean') {
      setIsPro(isProOverride)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        // Prefer billing endpoint; fallback to profile tier if exposed
        const r = await dedupedJson<any>('/api/billing/info', { cache: 'no-store' })
        const j = r.ok ? r.data : {}
        const paid = Boolean(j?.isPaid) || Boolean(j?.subscription && (j.subscription.status === 'active' || j.subscription.status === 'trialing'))
        if (mounted && paid) {
          setIsPro(true)
          // If Pro is granted via pro_expires_at, show "Pro Trial" instead of permanent Pro.
          const exp = j?.pro_expires_at ? String(j.pro_expires_at) : ''
          setIsTrial(Boolean(exp))
          return
        }
        // Optional: probe profile tier if available
        try {
          const me = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' }).then(res => res.ok ? res.data : {})
          if (mounted) {
            const pro = isProActive({ tier: (me as any)?.tier ?? null, pro_expires_at: (me as any)?.pro_expires_at ?? null })
            setIsPro(pro)
            setIsTrial(Boolean((me as any)?.pro_expires_at))
          }
        } catch { if (mounted) setIsPro(false) }
      } catch { if (mounted) setIsPro(false) }
    })()
    return () => { mounted = false }
  }, [isProOverride])

  return (
    <>
      {isPro ? (
        <span
          className={
            compact
              ? 'h-8 inline-flex items-center gap-1 rounded-md border px-2 text-[13px] font-semibold'
              : 'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[13px] font-semibold'
          }
          style={{
            borderColor: '#D4A574',
            backgroundColor: '#FDF8F3',
            color: '#8B6914',
            letterSpacing: '0.02em',
          }}
          aria-label="Pro plan active"
          title="Pro plan active"
        >
          {isTrial ? 'Pro Trial' : 'Pro'} <span aria-hidden="true">✓</span>
        </span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={className || (compact
            ? 'px-3 h-8 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50'
            : 'px-3 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50')}
        >
          {label}
        </button>
      )}
      <PaywallModal open={open} onClose={() => setOpen(false)} defaultPeriod="yearly" />
    </>
  )
}


