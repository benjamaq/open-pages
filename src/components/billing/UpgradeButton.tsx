'use client'

import { useEffect, useState } from 'react'
import PaywallModal from './PaywallModal'
import { dedupedJson } from '@/lib/utils/dedupedJson'
import { getTrialDaysRemaining, isProActive, isProTrial } from '@/lib/entitlements/pro'

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
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    // If parent forces "not pro", don't fetch/override (used when we want an upgrade CTA even for trial users).
    if (typeof isProOverride === 'boolean' && isProOverride === false) {
      setIsPro(false)
      setIsTrial(false)
      setTrialDaysLeft(null)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        // Prefer billing endpoint; fallback to /api/me.
        const billing = await dedupedJson<any>('/api/billing/info', { cache: 'no-store' })
        const bj = billing.ok ? billing.data : {}
        const profileFromBilling = {
          tier: (bj as any)?.tier ?? null,
          pro_expires_at: (bj as any)?.pro_expires_at ?? null,
        }
        const paidByBilling = Boolean((bj as any)?.isPaid) ||
          Boolean((bj as any)?.subscription && (((bj as any).subscription.status === 'active') || ((bj as any).subscription.status === 'trialing')))
        const paidByProfile = isProActive(profileFromBilling)
        const paid = paidByBilling || paidByProfile

        if (mounted && paid) {
          // Trial status is determined ONLY by pro_expires_at (promo/manual trials),
          // not by Stripe subscription trialing.
          const trialActive = isProTrial(profileFromBilling)
          setIsPro(true)
          setIsTrial(trialActive)
          setTrialDaysLeft(trialActive ? getTrialDaysRemaining(profileFromBilling) : null)
          return
        }

        // Fallback: probe /api/me for tier + pro_expires_at.
        const me = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' }).then(res => res.ok ? res.data : {})
        if (mounted) {
          const prof = { tier: (me as any)?.tier ?? null, pro_expires_at: (me as any)?.pro_expires_at ?? null }
          const pro = isProActive(prof)
          const trialActive = isProTrial(prof)
          setIsPro(pro)
          setIsTrial(trialActive)
          setTrialDaysLeft(trialActive ? getTrialDaysRemaining(prof) : null)
        }
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
          {isTrial ? (
            <>
              Pro Trial <span aria-hidden="true">✓</span>
              {typeof trialDaysLeft === 'number' ? (
                <span className="ml-1 text-[12px] font-semibold opacity-80">
                  ({trialDaysLeft}d left)
                </span>
              ) : null}
            </>
          ) : (
            <>
              Pro <span aria-hidden="true">✓</span>
            </>
          )}
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


