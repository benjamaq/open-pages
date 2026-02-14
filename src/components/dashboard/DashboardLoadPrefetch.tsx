'use client'

import { useEffect } from 'react'
import { primeDedupedJson } from '@/lib/utils/dedupedJson'

type LoadPayload = {
  me?: any
  billingInfo?: any
  paymentsStatus?: any
  supplements?: any
  progressLoop?: any
  hasDaily?: any
  dailySkip?: any
  effectSummary?: any
  wearableStatus?: any
  settings?: any
  elliContext?: any
}

export function DashboardLoadPrefetch() {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/load', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const j = (await res.json().catch(() => null)) as LoadPayload | null
        if (cancelled || !j) return

        // Prime the existing dedupedJson caches so current components can keep their fetch patterns.
        // Important: init objects must match the call sites (cache mode + credentials).
        if (j.me !== undefined) primeDedupedJson('/api/me', { cache: 'no-store', credentials: 'include' }, { ok: true, status: 200, data: j.me })
        if (j.billingInfo !== undefined) primeDedupedJson('/api/billing/info', { cache: 'no-store' }, { ok: true, status: 200, data: j.billingInfo })
        if (j.paymentsStatus !== undefined) primeDedupedJson('/api/payments/status', { cache: 'no-store' }, { ok: true, status: 200, data: j.paymentsStatus })
        if (j.supplements !== undefined) primeDedupedJson('/api/supplements', { cache: 'no-store' }, { ok: true, status: 200, data: j.supplements })
        if (j.progressLoop !== undefined) primeDedupedJson('/api/progress/loop', { cache: 'no-store' }, { ok: true, status: 200, data: j.progressLoop })
        if (j.hasDaily !== undefined) primeDedupedJson('/api/data/has-daily', { cache: 'no-store' }, { ok: true, status: 200, data: j.hasDaily })
        if (j.dailySkip !== undefined) primeDedupedJson('/api/suggestions/dailySkip', { cache: 'no-store' }, { ok: true, status: 200, data: j.dailySkip })
        if (j.effectSummary !== undefined) primeDedupedJson('/api/effect/summary', { cache: 'no-store' }, { ok: true, status: 200, data: j.effectSummary })
        if (j.wearableStatus !== undefined) primeDedupedJson('/api/user/wearable-status?since=all', { cache: 'no-store' }, { ok: true, status: 200, data: j.wearableStatus })
        if (j.settings !== undefined) primeDedupedJson('/api/settings', { cache: 'no-store' }, { ok: true, status: 200, data: j.settings })
        if (j.elliContext !== undefined) primeDedupedJson('/api/elli/context', { cache: 'no-store' }, { ok: true, status: 200, data: j.elliContext })
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  return null
}


